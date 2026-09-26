//! Cancellation belongs to one request, never a global or later session.
use std::{
    cell::RefCell,
    sync::{
        atomic::{AtomicU8, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};
/// 0: cancellable work, 1: cancelled before spawn, 2: spawn committed,
/// 3: cancellation after spawn commitment (the process must be stopped/reaped).
#[derive(Default)]
pub(crate) struct Cancellation(AtomicU8, #[cfg(test)] std::sync::atomic::AtomicUsize);
impl Cancellation {
    #[cfg(test)]
    pub(crate) fn record_spawn(&self) {
        self.1.fetch_add(1, Ordering::AcqRel);
    }
    #[cfg(test)]
    pub(crate) fn spawn_count(&self) -> usize {
        self.1.load(Ordering::Acquire)
    }
    pub(crate) fn cancel(&self) {
        let _ = self
            .0
            .fetch_update(Ordering::AcqRel, Ordering::Acquire, |s| {
                Some(if s == 0 || s == 1 { 1 } else { 3 })
            });
    }
    pub(crate) fn cancelled(&self) -> bool {
        matches!(self.0.load(Ordering::Acquire), 1 | 3)
    }
    pub(crate) fn commit_spawn(&self) -> bool {
        matches!(
            self.0
                .compare_exchange(0, 2, Ordering::AcqRel, Ordering::Acquire),
            Ok(_) | Err(2)
        )
    }
}
pub(crate) fn current() -> Option<Arc<Cancellation>> {
    WORK.with(|w| w.borrow().as_ref().map(|(c, _)| c.clone()))
}
thread_local! { static WORK: RefCell<Option<(Arc<Cancellation>, Instant)>> = const { RefCell::new(None) }; }
// Capture on the request thread, then install on a scoped I/O worker. Carry the
// exact deadline; creating a worker must never restart the request's 180 s budget.
pub(crate) fn inherited<T>(task: impl FnOnce() -> T) -> impl FnOnce() -> T {
    let context = WORK.with(|work| work.borrow().clone());
    move || {
        struct Restore(Option<(Arc<Cancellation>, Instant)>);
        impl Drop for Restore {
            fn drop(&mut self) {
                WORK.with(|work| *work.borrow_mut() = self.0.take());
            }
        }
        let previous = WORK.with(|work| work.replace(context));
        let _restore = Restore(previous);
        task()
    }
}
pub(crate) fn scoped<T>(cancel: Arc<Cancellation>, task: impl FnOnce() -> T) -> T {
    struct Reset;
    impl Drop for Reset {
        fn drop(&mut self) {
            WORK.with(|w| *w.borrow_mut() = None);
        }
    }
    WORK.with(|w| *w.borrow_mut() = Some((cancel, Instant::now() + Duration::from_secs(180))));
    let _reset = Reset;
    task()
}
pub(crate) fn check() -> Result<(), crate::transaction::ErrorCode> {
    WORK.with(|w| match &*w.borrow() {
        Some((cancel, deadline)) if cancel.cancelled() || Instant::now() >= *deadline => {
            Err(crate::transaction::ErrorCode::RuntimeBusy)
        }
        _ => Ok(()),
    })
}

#[cfg(test)]
thread_local! { static INVENTORY_HOOK: RefCell<Option<Arc<dyn Fn() + Send + Sync>>> = const { RefCell::new(None) }; }
#[cfg(test)]
pub(crate) fn set_inventory_hook(hook: Option<Arc<dyn Fn() + Send + Sync>>) {
    INVENTORY_HOOK.with(|h| *h.borrow_mut() = hook);
}
#[cfg(test)]
pub(crate) fn inventory_hook() {
    INVENTORY_HOOK.with(|h| {
        if let Some(hook) = h.borrow().as_ref() {
            hook();
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inherited_worker_keeps_original_deadline_and_cancellation() {
        let cancel = Arc::new(Cancellation::default());
        scoped(cancel.clone(), || {
            let expired = Instant::now() - Duration::from_secs(1);
            WORK.with(|work| work.borrow_mut().as_mut().unwrap().1 = expired);
            std::thread::scope(|scope| {
                let work = inherited(|| {
                    assert_eq!(WORK.with(|work| work.borrow().as_ref().unwrap().1), expired);
                    assert!(check().is_err());
                });
                scope
                    .spawn(move || {
                        assert!(check().is_ok());
                        work();
                        assert!(check().is_ok());
                    })
                    .join()
                    .unwrap();
            });
        });
        scoped(cancel.clone(), || {
            let work = inherited(|| assert!(check().is_err()));
            cancel.cancel();
            std::thread::scope(|scope| scope.spawn(work).join().unwrap());
        });
        assert!(check().is_ok());
    }
}
