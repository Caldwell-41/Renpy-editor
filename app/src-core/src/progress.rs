//! Invocation-local, best-effort progress; terminal CoreResponse owns the outcome.
use serde::Serialize;
use std::cell::RefCell;
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub sequence: u64,
    pub stage: &'static str,
    pub bytes: Option<u64>,
    pub total: Option<u64>,
}
struct Observer {
    sequence: u64,
    send: Box<dyn Fn(Progress)>,
}
thread_local! { static OBSERVER: RefCell<Option<Observer>> = const { RefCell::new(None) }; }
pub fn scoped<T>(send: impl Fn(Progress) + 'static, task: impl FnOnce() -> T) -> T {
    struct Restore(Option<Observer>);
    impl Drop for Restore {
        fn drop(&mut self) {
            OBSERVER.with(|s| *s.borrow_mut() = self.0.take());
        }
    }
    let previous = OBSERVER.with(|s| {
        s.replace(Some(Observer {
            sequence: 0,
            send: Box::new(send),
        }))
    });
    let _restore = Restore(previous);
    task()
}
pub fn report(stage: &'static str, bytes: Option<u64>, total: Option<u64>) {
    OBSERVER.with(|slot| {
        if let Some(observer) = slot.borrow_mut().as_mut() {
            observer.sequence += 1;
            (observer.send)(Progress {
                sequence: observer.sequence,
                stage,
                bytes,
                total,
            });
        }
    });
}
pub fn stage(stage: &'static str) {
    report(stage, None, None);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::rc::Rc;
    #[test]
    fn progress_is_scoped_ordered_and_restored_after_failure() {
        let captured = Rc::new(RefCell::new(Vec::new()));
        let output = Rc::clone(&captured);
        scoped(
            move |p| output.borrow_mut().push(p),
            || {
                stage("prepare");
                let _ = std::panic::catch_unwind(|| scoped(|_| {}, || panic!("operation failed")));
                report("download", Some(1024), Some(2048));
            },
        );
        stage("outside");
        let events = captured.borrow();
        assert_eq!(events.len(), 2);
        assert_eq!(events[0].sequence, 1);
        assert_eq!(events[1].sequence, 2);
        assert_eq!(events[1].bytes, Some(1024));
        assert_eq!(events[1].total, Some(2048));
    }
}
