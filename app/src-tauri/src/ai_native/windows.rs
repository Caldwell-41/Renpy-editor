//! Windows-only native entry and exact owned Credential Manager targets.
//! No enumeration, shell, renderer secret, or temporary plaintext file.
use super::NativeSecrets;
use loomlight_core::{
    ai_credentials::{valid_key, Result, SaveOutcome, Secret, Secrets},
    ai_profiles::OwnedCredential,
};
use sha2::{Digest, Sha256};
use std::ptr::{null, null_mut};
use windows_sys::Win32::{
    Foundation::{GetLastError, ERROR_NOT_FOUND, HWND},
    Security::Credentials::*,
    System::{
        LibraryLoader::GetModuleHandleW,
        Threading::{GetCurrentProcessId, GetCurrentThreadId},
    },
    UI::{Controls::EM_LIMITTEXT, WindowsAndMessaging::*},
};
use zeroize::{Zeroize, Zeroizing};

const UNAVAILABLE: &str = "Windows credential storage unavailable; saved references are retained.";
const OWNERSHIP: &str = "Windows credential ownership mismatch; existing entry retained.";
const OWNER: &str = "app.loomlight.desktop/Studio/v1";
fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(Some(0)).collect()
}
fn identity(profile: &str, c: &OwnedCredential) -> Result<(String, String)> {
    let canonical_uuid = |s: &str| {
        uuid::Uuid::parse_str(s).is_ok_and(|u| u.get_version_num() == 4 && u.to_string() == s)
    };
    if !canonical_uuid(profile) || !canonical_uuid(&c.credential_id) || c.revision == 0 {
        return Err(OWNERSHIP);
    }
    if !c.storage.is_native() {
        return Err("Mac development-file credentials are unsupported on Windows; references retained. Enter a new Windows credential explicitly.");
    }
    if !loomlight_core::ai_profiles::canonical_endpoint(&c.origin, true)
        .is_ok_and(|(_, origin)| origin == c.origin)
    {
        return Err(OWNERSHIP);
    }
    // The comment binds the OS item to the complete nonsecret reference, including
    // origin/revision/service. Both legacy and current fixed services stay addressable.
    let bytes = serde_json::to_vec(&(profile, c)).map_err(|_| OWNERSHIP)?;
    Ok((
        format!(
            "{}/provider/{profile}/{}",
            c.service.name(),
            c.credential_id
        ),
        format!("Loomlight Studio v1:{:x}", Sha256::digest(bytes)),
    ))
}
unsafe fn same_wide(pointer: *const u16, expected: &str) -> bool {
    if pointer.is_null() {
        return false;
    }
    let expected = wide(expected);
    // OS-owned strings are NUL-terminated. Stop at the first mismatch/NUL.
    for (index, value) in expected.iter().enumerate() {
        if *pointer.add(index) != *value {
            return false;
        }
    }
    true
}
unsafe fn owned(item: &CREDENTIALW, target: &str, comment: &str) -> bool {
    item.Type == CRED_TYPE_GENERIC
        && item.Persist == CRED_PERSIST_LOCAL_MACHINE
        && item.Flags == 0
        && item.AttributeCount == 0
        && same_wide(item.TargetName, target)
        && same_wide(item.UserName, OWNER)
        && same_wide(item.Comment, comment)
}
struct Item(*mut CREDENTIALW);
impl Drop for Item {
    fn drop(&mut self) {
        unsafe {
            let item = &mut *self.0;
            if !item.CredentialBlob.is_null()
                && item.CredentialBlobSize <= CRED_MAX_CREDENTIAL_BLOB_SIZE
            {
                std::slice::from_raw_parts_mut(
                    item.CredentialBlob,
                    item.CredentialBlobSize as usize,
                )
                .zeroize();
            }
            CredFree(self.0.cast());
        }
    }
}
fn get(target: &str) -> Result<Option<Item>> {
    let target = wide(target);
    let mut pointer = null_mut();
    unsafe {
        if CredReadW(target.as_ptr(), CRED_TYPE_GENERIC, 0, &mut pointer) == 0 {
            return if GetLastError() == ERROR_NOT_FOUND {
                Ok(None)
            } else {
                Err(UNAVAILABLE)
            };
        }
    }
    if pointer.is_null() {
        return Err(UNAVAILABLE);
    }
    Ok(Some(Item(pointer)))
}
impl Secrets for NativeSecrets {
    fn read(&self, profile: &str, c: &OwnedCredential) -> Result<Option<Secret>> {
        let (target, comment) = identity(profile, c)?;
        let Some(item) = get(&target)? else {
            return Ok(None);
        };
        unsafe {
            let item = &*item.0;
            if !owned(item, &target, &comment)
                || item.CredentialBlobSize == 0
                || item.CredentialBlobSize > CRED_MAX_CREDENTIAL_BLOB_SIZE
                || item.CredentialBlob.is_null()
            {
                return Err(OWNERSHIP);
            }
            let bytes =
                std::slice::from_raw_parts(item.CredentialBlob, item.CredentialBlobSize as usize);
            let value = std::str::from_utf8(bytes).map_err(|_| OWNERSHIP)?;
            if !valid_key(value) {
                return Err(OWNERSHIP);
            }
            Ok(Some(Secret::new(value.to_owned())))
        }
    }
    fn add(&self, profile: &str, c: &OwnedCredential, key: &str) -> Result<()> {
        let (target, comment) = identity(profile, c)?;
        if !valid_key(key) || key.len() > CRED_MAX_CREDENTIAL_BLOB_SIZE as usize {
            return Err("Windows Credential Manager supports 1–2560 printable non-space ASCII characters. Input retained; shorten the key or cancel.");
        }
        // A generated identity must be fresh. Never overwrite a pre-existing item,
        // even if its marker matches; transaction cleanup owns staged identities.
        if get(&target)?.is_some() {
            return Err(OWNERSHIP);
        }
        let mut target = wide(&target);
        let mut comment = wide(&comment);
        let mut owner = wide(OWNER);
        let mut blob = Zeroizing::new(key.as_bytes().to_vec());
        let item = CREDENTIALW {
            Type: CRED_TYPE_GENERIC,
            TargetName: target.as_mut_ptr(),
            Comment: comment.as_mut_ptr(),
            UserName: owner.as_mut_ptr(),
            Persist: CRED_PERSIST_LOCAL_MACHINE,
            CredentialBlobSize: blob.len() as u32,
            CredentialBlob: blob.as_mut_ptr(),
            ..Default::default()
        };
        if unsafe { CredWriteW(&item, 0) } == 0 {
            Err(UNAVAILABLE)
        } else {
            Ok(())
        }
    }
    fn delete(&self, profile: &str, c: &OwnedCredential) -> Result<()> {
        let (target, comment) = identity(profile, c)?;
        let Some(item) = get(&target)? else {
            return Ok(());
        };
        if !unsafe { owned(&*item.0, &target, &comment) } {
            return Err(OWNERSHIP);
        }
        let target = wide(&target);
        if unsafe { CredDeleteW(target.as_ptr(), CRED_TYPE_GENERIC, 0) } == 0 {
            if unsafe { GetLastError() } != ERROR_NOT_FOUND {
                return Err(UNAVAILABLE);
            }
        }
        Ok(())
    }
}

const FIELD: i32 = 100;
const STATUS: i32 = 102;
struct Entry<'a> {
    save: &'a mut dyn FnMut(&str) -> Result<SaveOutcome>,
    outcome: Option<SaveOutcome>,
}
unsafe fn text(dialog: HWND, control: i32, value: &str) {
    SetDlgItemTextW(dialog, control, wide(value).as_ptr());
}
unsafe extern "system" fn dialog_proc(dialog: HWND, message: u32, w: usize, l: isize) -> isize {
    if message == WM_INITDIALOG {
        SetWindowLongPtrW(dialog, GWLP_USERDATA, l);
        SendMessageW(GetDlgItem(dialog, FIELD), EM_LIMITTEXT, 4096, 0);
        return 1;
    }
    if message == WM_CLOSE || (message == WM_COMMAND && w as u16 == IDCANCEL as u16) {
        text(dialog, FIELD, "");
        EndDialog(dialog, 2);
        return 1;
    }
    if message != WM_COMMAND || w as u16 != IDOK as u16 {
        return 0;
    }
    let context = GetWindowLongPtrW(dialog, GWLP_USERDATA) as *mut Entry<'_>;
    if context.is_null() {
        return 0;
    }
    // Catch panics before the Win32 callback boundary. Neither an error nor a
    // panic closes/recreates the secure field; Retry uses its retained input.
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        if GetWindowTextLengthW(GetDlgItem(dialog, FIELD)) > 4096 {
            return Err("Credential exceeds the input limit; input retained.");
        }
        let mut value = Zeroizing::new(vec![0u16; 4097]);
        let count = GetDlgItemTextW(dialog, FIELD, value.as_mut_ptr(), value.len() as i32) as usize;
        let key = Secret::new(
            String::from_utf16(&value[..count])
                .map_err(|_| "Credential contains invalid text; input retained.")?,
        );
        ((*context).save)(&key)
    }))
    .unwrap_or(Err(
        "Secure save unavailable; input retained for retry or cancel.",
    ));
    match result {
        Ok(outcome) => {
            (*context).outcome = Some(outcome);
            text(dialog, FIELD, "");
            EndDialog(dialog, 1);
        }
        Err(message) => {
            text(
                dialog,
                STATUS,
                &format!("{message}\r\nInput remains here for Retry save or Cancel."),
            );
            text(dialog, IDOK, "Retry save");
        }
    }
    1
}

// Build a standard UTF-16 dialog resource. DWORD-aligned backing and each control
// follow the documented DLGTEMPLATE layout; Segoe UI uses dialog-unit geometry.
fn template() -> Vec<u32> {
    fn dword(words: &mut Vec<u16>, value: u32) {
        words.extend([value as u16, (value >> 16) as u16]);
    }
    fn string(words: &mut Vec<u16>, value: &str) {
        words.extend(wide(value));
    }
    fn control(words: &mut Vec<u16>, id: u16, class: u16, style: u32, rect: [u16; 4], label: &str) {
        if words.len() % 2 != 0 {
            words.push(0)
        }
        dword(words, WS_CHILD | WS_VISIBLE | style);
        dword(words, 0);
        words.extend(rect);
        words.extend([id, 0xffff, class]);
        string(words, label);
        words.push(0);
    }
    let mut words = vec![];
    dword(
        &mut words,
        WS_POPUP | WS_CAPTION | WS_SYSMENU | DS_MODALFRAME as u32 | DS_SETFONT as u32,
    );
    dword(&mut words, 0);
    words.extend([5, 0, 0, 350, 172, 0, 0]); // count, x/y/cx/cy, menu, class
    string(&mut words, "Remember Studio API key on this computer");
    words.push(9);
    string(&mut words, "Segoe UI");
    control(&mut words, 101, 0x82, 0, [12, 10, 326, 42], "Windows Credential Manager saves the key for this Windows login. The web view never receives it. Local removal does not revoke it at Studio.");
    control(
        &mut words,
        FIELD as u16,
        0x81,
        WS_TABSTOP | WS_BORDER | ES_PASSWORD as u32 | ES_AUTOHSCROLL as u32,
        [12, 58, 326, 16],
        "",
    );
    control(
        &mut words,
        STATUS as u16,
        0x82,
        0,
        [12, 82, 326, 54],
        "Enter 1–2560 printable non-space ASCII characters.",
    );
    control(
        &mut words,
        IDOK as u16,
        0x80,
        WS_TABSTOP | BS_DEFPUSHBUTTON as u32,
        [194, 144, 70, 18],
        "Remember",
    );
    control(
        &mut words,
        IDCANCEL as u16,
        0x80,
        WS_TABSTOP,
        [272, 144, 66, 18],
        "Cancel",
    );
    if words.len() % 2 != 0 {
        words.push(0)
    }
    words
        .chunks_exact(2)
        .map(|p| p[0] as u32 | (p[1] as u32) << 16)
        .collect()
}
pub fn enter_owned(
    owner: usize,
    mut save: impl FnMut(&str) -> Result<SaveOutcome>,
) -> Result<Option<SaveOutcome>> {
    let owner = owner as HWND;
    if owner.is_null() || unsafe { IsWindow(owner) } == 0 {
        return Err("Secure entry owner unavailable.");
    }
    let mut process = 0;
    if unsafe { GetWindowThreadProcessId(owner, &mut process) } != unsafe { GetCurrentThreadId() }
        || process != unsafe { GetCurrentProcessId() }
    {
        return Err("Secure entry requires the owning application window thread.");
    }
    let mut context = Entry {
        save: &mut save,
        outcome: None,
    };
    let template = template();
    let result = unsafe {
        DialogBoxIndirectParamW(
            GetModuleHandleW(null()),
            template.as_ptr().cast(),
            owner,
            Some(dialog_proc),
            &mut context as *mut Entry<'_> as isize,
        )
    };
    match result {
        1 => context.outcome.map(Some).ok_or("Secure entry unavailable."),
        2 => Ok(None),
        _ => Err("Secure native entry unavailable; saved state retained."),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn reference() -> OwnedCredential {
        serde_json::from_value(serde_json::json!({
            "credentialId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "revision":1,
            "origin":"http://127.0.0.1:46081"
        }))
        .unwrap()
    }
    const PROFILE: &str = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    #[test]
    fn identity_refuses_unowned_and_foreign_file_references_without_os_access() {
        let c = reference();
        let (target, marker) = identity(PROFILE, &c).unwrap();
        assert_eq!(
            target,
            format!(
                "app.loomlight.desktop.ai.v1/provider/{PROFILE}/{}",
                c.credential_id
            )
        );
        assert!(identity("not-owned", &c).is_err());
        let mut other = c.clone();
        other.origin = "http://127.0.0.1:46082".into();
        assert_ne!(marker, identity(PROFILE, &other).unwrap().1);
        other = c.clone();
        other.revision += 1;
        assert_ne!(marker, identity(PROFILE, &other).unwrap().1);
        other = c.clone();
        other.service = loomlight_core::ai_profiles::CredentialService::Loomlight;
        assert_ne!(target, identity(PROFILE, &other).unwrap().0);
        other.storage = loomlight_core::ai_profiles::CredentialStorage::DevelopmentFile {
            generation_id: PROFILE.into(),
        };
        assert!(identity(PROFILE, &other)
            .unwrap_err()
            .contains("unsupported"));
    }
    #[test]
    fn native_item_gate_rejects_changed_owner_origin_type_and_persistence() {
        let (target, comment) = identity(PROFILE, &reference()).unwrap();
        let mut target_w = wide(&target);
        let mut comment_w = wide(&comment);
        let mut owner_w = wide(OWNER);
        let mut item = CREDENTIALW {
            Type: CRED_TYPE_GENERIC,
            Persist: CRED_PERSIST_LOCAL_MACHINE,
            TargetName: target_w.as_mut_ptr(),
            Comment: comment_w.as_mut_ptr(),
            UserName: owner_w.as_mut_ptr(),
            ..Default::default()
        };
        assert!(unsafe { owned(&item, &target, &comment) });
        item.Persist = CRED_PERSIST_ENTERPRISE;
        assert!(!unsafe { owned(&item, &target, &comment) });
        item.Persist = CRED_PERSIST_LOCAL_MACHINE;
        item.Type = CRED_TYPE_DOMAIN_PASSWORD;
        assert!(!unsafe { owned(&item, &target, &comment) });
        item.Type = CRED_TYPE_GENERIC;
        owner_w[0] = 'x' as u16;
        assert!(!unsafe { owned(&item, &target, &comment) });
        owner_w[0] = 'a' as u16;
        comment_w[0] = 'x' as u16;
        assert!(!unsafe { owned(&item, &target, &comment) });
    }
    #[test]
    fn oversized_invalid_keys_and_foreign_storage_refuse_before_any_native_access() {
        let c = reference();
        for input in [String::new(), "x".repeat(2561), "space refused".into()] {
            assert!(NativeSecrets
                .add(PROFILE, &c, &input)
                .unwrap_err()
                .contains("2560"));
        }
        let mut foreign = c;
        foreign.storage = loomlight_core::ai_profiles::CredentialStorage::DevelopmentFile {
            generation_id: PROFILE.into(),
        };
        assert!(NativeSecrets.read(PROFILE, &foreign).is_err());
        assert!(NativeSecrets.delete(PROFILE, &foreign).is_err());
    }
}
