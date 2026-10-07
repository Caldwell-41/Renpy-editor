use super::*;
use std::cell::{Cell, RefCell};
struct Fixture {
    records: RefCell<ProfileStore>,
    keys: RefCell<std::collections::HashMap<String, String>>,
    writes: Cell<usize>,
    fail_write: Cell<usize>,
    after_publish: Cell<bool>,
    read_unavailable: Cell<bool>,
    fail_reconcile: Cell<bool>,
    native_unavailable: Cell<bool>,
    deletion_unavailable: Cell<bool>,
    deleted: RefCell<Vec<String>>,
}
impl Fixture {
    fn read(&self) -> Result<ProfileStore> {
        Records::read(self)
    }
    fn new() -> Self {
        Self {
            records: RefCell::new(ProfileStore::default()),
            keys: RefCell::new(Default::default()),
            writes: Cell::new(0),
            fail_write: Cell::new(0),
            after_publish: Cell::new(false),
            read_unavailable: Cell::new(false),
            fail_reconcile: Cell::new(false),
            native_unavailable: Cell::new(false),
            deletion_unavailable: Cell::new(false),
            deleted: RefCell::new(vec![]),
        }
    }
    fn init(&self) -> String {
        save(
            self,
            &token(&self.read().unwrap()),
            None,
            StudioSettings {
                label: "Studio".into(),
                endpoint: "http://127.0.0.1:8888".into(),
                model: "fixture".into(),
                private_http: false,
                context_ceiling: 8192,
                context_budget: 4096,
                maximum_response: 1024,
            },
        )
        .unwrap();
        self.records.borrow().profiles[0].profile_id.clone()
    }
    fn replace(&self, id: &str, key: &str) -> Result<()> {
        replace(self, self, &token(&self.read()?), id, key)
    }
}
impl Records for Fixture {
    fn read(&self) -> Result<ProfileStore> {
        if self.read_unavailable.get() {
            Err("read unavailable")
        } else {
            Ok(self.records.borrow().clone())
        }
    }
    fn write(&self, next: &ProfileStore, old: &ProfileStore) -> Result<()> {
        assert_eq!(&*self.records.borrow(), old);
        assert!(next.valid());
        self.writes.set(self.writes.get() + 1);
        let fail = self.writes.get() == self.fail_write.get();
        if !fail || self.after_publish.get() {
            *self.records.borrow_mut() = next.clone();
        }
        if fail {
            if self.fail_reconcile.get() {
                self.read_unavailable.set(true);
            }
            Err("save unavailable")
        } else {
            Ok(())
        }
    }
}
impl Secrets for Fixture {
    fn read(&self, _: &str, c: &OwnedCredential) -> Result<Option<String>> {
        if self.native_unavailable.get() {
            Err("native unavailable")
        } else {
            Ok(self.keys.borrow().get(&c.credential_id).cloned())
        }
    }
    fn add(&self, id: &str, c: &OwnedCredential, key: &str) -> Result<()> {
        assert!(
            self.records
                .borrow()
                .cleanup
                .iter()
                .any(|e| e.profile_id == id && e.credential == *c),
            "ownership must be durable before addition"
        );
        if self.native_unavailable.get() {
            return Err("native unavailable");
        }
        self.keys
            .borrow_mut()
            .insert(c.credential_id.clone(), key.into());
        Ok(())
    }
    fn delete(&self, _: &str, c: &OwnedCredential) -> Result<()> {
        assert!(
            !self.records.borrow().profiles.iter().any(|p| p
                .credential
                .as_ref()
                .is_some_and(|active| active.credential_id == c.credential_id)),
            "active reference must be unpublished before deletion"
        );
        if self.deletion_unavailable.get() {
            return Err("delete unavailable");
        }
        self.keys.borrow_mut().remove(&c.credential_id);
        self.deleted.borrow_mut().push(c.credential_id.clone());
        Ok(())
    }
}
#[test]
fn actual_replace_remove_ordering_and_no_serialized_key() {
    let f = Fixture::new();
    let id = f.init();
    f.replace(&id, "synthetic-secret-alpha").unwrap();
    let old = f.records.borrow().profiles[0].credential.clone().unwrap();
    f.replace(&id, "synthetic-secret-beta").unwrap();
    assert!(f.deleted.borrow().contains(&old.credential_id));
    assert_eq!(f.keys.borrow().len(), 1);
    assert!(!serde_json::to_string(&f.read().unwrap())
        .unwrap()
        .contains("synthetic-secret"));
    remove(&f, &f, &token(&f.read().unwrap()), &id, false).unwrap();
    assert!(f.keys.borrow().is_empty());
    assert!(f.records.borrow().profiles[0].disabled);
    assert!(!f.records.borrow().profiles[0].credential_bound());
}
#[test]
fn staging_failure_never_adds_or_retires_key() {
    let f = Fixture::new();
    let id = f.init();
    f.replace(&id, "old-key").unwrap();
    let old = f.read().unwrap();
    f.fail_write.set(f.writes.get() + 1);
    assert!(f.replace(&id, "new-key").is_err());
    assert_eq!(f.read().unwrap(), old);
    assert_eq!(f.keys.borrow().len(), 1);
    assert!(f.deleted.borrow().is_empty());
}
#[test]
fn failed_switch_preserves_previous_reference_and_cleans_staged_key() {
    let f = Fixture::new();
    let id = f.init();
    f.replace(&id, "old-key").unwrap();
    let old = f.records.borrow().profiles[0].clone();
    f.fail_write.set(f.writes.get() + 2);
    assert!(f.replace(&id, "new-key").is_err());
    assert_eq!(f.records.borrow().profiles[0], old);
    assert_eq!(f.keys.borrow().len(), 1);
    assert!(f.records.borrow().cleanup.is_empty());
}
#[test]
fn postrename_error_reconciles_published_key_before_retirement() {
    let f = Fixture::new();
    let id = f.init();
    f.replace(&id, "old-key").unwrap();
    let old = f.records.borrow().profiles[0].credential.clone().unwrap();
    f.fail_write.set(f.writes.get() + 2);
    f.after_publish.set(true);
    f.replace(&id, "new-key").unwrap();
    let active = f.records.borrow().profiles[0].credential.clone().unwrap();
    assert_ne!(active, old);
    assert_eq!(
        Secrets::read(&f, &id, &active).unwrap().as_deref(),
        Some("new-key")
    );
    assert_eq!(f.keys.borrow().len(), 1);
}
#[test]
fn cleanup_failure_is_retained_and_owned_retry_is_explicit() {
    let f = Fixture::new();
    let id = f.init();
    f.replace(&id, "old-key").unwrap();
    f.deletion_unavailable.set(true);
    assert!(f.replace(&id, "new-key").is_err());
    assert_eq!(f.records.borrow().cleanup.len(), 1);
    assert_eq!(f.keys.borrow().len(), 2);
    f.deletion_unavailable.set(false);
    cleanup_profile(&f, &f, &id).unwrap();
    assert!(f.records.borrow().cleanup.is_empty());
    assert_eq!(f.keys.borrow().len(), 1);
    f.deletion_unavailable.set(true);
    assert!(remove(&f, &f, &token(&Records::read(&f).unwrap()), &id, true).is_err());
    assert!(f.records.borrow().profiles.is_empty());
    assert_eq!(f.records.borrow().cleanup.len(), 1);
}
#[test]
fn unavailable_store_does_not_replace_and_external_same_revision_is_stale() {
    let f = Fixture::new();
    let id = f.init();
    f.replace(&id, "old-key").unwrap();
    let old = f.records.borrow().profiles[0].clone();
    f.native_unavailable.set(true);
    assert!(f.replace(&id, "new-key").is_err());
    assert_eq!(f.records.borrow().profiles[0], old);
    assert_eq!(f.keys.borrow().len(), 1);
    let expected = token(&Records::read(&f).unwrap());
    f.records.borrow_mut().profiles[0].settings.label = "external edit".into();
    assert!(checked(&f, &expected).is_err());
}

#[test]
fn unavailable_reconciliation_never_deletes_possibly_active_entry() {
    let f = Fixture::new();
    let id = f.init();
    f.replace(&id, "old-key").unwrap();
    f.fail_write.set(f.writes.get() + 2);
    f.after_publish.set(true);
    f.fail_reconcile.set(true);
    assert!(f.replace(&id, "new-key").is_err());
    assert!(f.deleted.borrow().is_empty());
    assert_eq!(f.keys.borrow().len(), 2);
    let state = f.records.borrow();
    let active = state.profiles[0].credential.as_ref().unwrap();
    assert_eq!(
        f.keys
            .borrow()
            .get(&active.credential_id)
            .map(String::as_str),
        Some("new-key")
    );
    assert_eq!(
        state.cleanup.len(),
        1,
        "old entry retained for reconciliation/explicit cleanup"
    );
}
