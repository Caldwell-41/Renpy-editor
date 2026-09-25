use super::*;
use std::os::windows::io::{AsRawHandle, FromRawHandle, OwnedHandle};
use windows_sys::Win32::{
    Foundation::*,
    System::{Console::*, Diagnostics::ToolHelp::*, JobObjects::*, Threading::*},
};

pub(super) struct Job(OwnedHandle);
impl Job {
    pub(super) fn attach_suspended(child: &Child) -> io::Result<Self> {
        let handle = unsafe { CreateJobObjectW(std::ptr::null(), std::ptr::null()) };
        if handle.is_null() {
            return Err(io::Error::last_os_error());
        }
        let job = Self(unsafe { OwnedHandle::from_raw_handle(handle) });
        let mut limits: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = unsafe { std::mem::zeroed() };
        limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        if unsafe {
            SetInformationJobObject(
                handle,
                JobObjectExtendedLimitInformation,
                &limits as *const _ as _,
                std::mem::size_of_val(&limits) as u32,
            )
        } == 0
            || unsafe { AssignProcessToJobObject(handle, child.as_raw_handle()) } == 0
        {
            return Err(io::Error::last_os_error());
        }
        // Rust 1.90 Child exposes the process handle, not its primary thread. Find
        // the sole initial thread while CREATE_SUSPENDED prevents project execution.
        let snapshot = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0) };
        if snapshot == INVALID_HANDLE_VALUE {
            return Err(io::Error::last_os_error());
        }
        let snapshot = unsafe { OwnedHandle::from_raw_handle(snapshot) };
        let mut entry: THREADENTRY32 = unsafe { std::mem::zeroed() };
        entry.dwSize = std::mem::size_of_val(&entry) as u32;
        let mut ok = unsafe { Thread32First(snapshot.as_raw_handle(), &mut entry) };
        let mut candidate = None;
        let mut count = 0;
        while ok != 0 {
            count += 1;
            if count > 100_000 {
                return Err(io::Error::other("thread inventory limit"));
            }
            if entry.th32OwnerProcessID == child.id() {
                if candidate.is_some() {
                    return Err(io::Error::other("ambiguous suspended thread"));
                }
                candidate = Some(entry.th32ThreadID);
            }
            ok = unsafe { Thread32Next(snapshot.as_raw_handle(), &mut entry) };
        }
        let id = candidate.ok_or_else(|| io::Error::other("missing suspended thread"))?;
        let thread = unsafe {
            OpenThread(
                THREAD_SUSPEND_RESUME | THREAD_QUERY_LIMITED_INFORMATION,
                0,
                id,
            )
        };
        if thread.is_null() {
            return Err(io::Error::last_os_error());
        }
        let thread = unsafe { OwnedHandle::from_raw_handle(thread) };
        if unsafe { GetProcessIdOfThread(thread.as_raw_handle()) } != child.id() {
            return Err(io::Error::other("thread owner changed"));
        }
        if unsafe { ResumeThread(thread.as_raw_handle()) } != 1 {
            return Err(io::Error::other("resume failed"));
        }
        Ok(job)
    }
    pub(super) fn terminate(&self) {
        unsafe {
            TerminateJobObject(self.0.as_raw_handle(), 1);
        }
    }
    pub(super) fn wait_empty(&self, deadline: Duration) -> io::Result<()> {
        let start = Instant::now();
        loop {
            let mut info: JOBOBJECT_BASIC_ACCOUNTING_INFORMATION = unsafe { std::mem::zeroed() };
            if unsafe {
                QueryInformationJobObject(
                    self.0.as_raw_handle(),
                    JobObjectBasicAccountingInformation,
                    &mut info as *mut _ as _,
                    std::mem::size_of_val(&info) as u32,
                    std::ptr::null_mut(),
                )
            } == 0
            {
                return Err(io::Error::last_os_error());
            }
            if info.ActiveProcesses == 0 {
                return Ok(());
            }
            if start.elapsed() >= deadline {
                return Err(io::Error::other("job cleanup timeout"));
            }
            thread::sleep(Duration::from_millis(10));
        }
    }
}
pub(super) fn exited(child: &Child) -> io::Result<bool> {
    match unsafe { WaitForSingleObject(child.as_raw_handle(), 0) } {
        WAIT_OBJECT_0 => Ok(true),
        WAIT_TIMEOUT => Ok(false),
        _ => Err(io::Error::last_os_error()),
    }
}
pub(super) fn graceful(pid: u32) {
    unsafe {
        GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT, pid);
    }
}
