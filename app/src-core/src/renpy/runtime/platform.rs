use super::*;

#[cfg(windows)]
mod windows;

pub(super) struct OwnedChild {
    child: Child,
    stdout: ChildStdout,
    stderr: ChildStderr,
    reaped: bool,
    #[cfg(windows)]
    job: windows::Job,
}
impl OwnedChild {
    pub(super) fn spawn(
        command: &mut Command,
        anchor: Option<&DirectoryAnchor>,
    ) -> io::Result<Self> {
        command
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        #[cfg(unix)]
        {
            use std::os::{fd::AsRawFd, unix::process::CommandExt};
            let held = anchor
                .map(DirectoryAnchor::runtime_handle)
                .transpose()
                .map_err(|_| io::Error::other("root"))?;
            unsafe {
                command.pre_exec(move || {
                    if libc::setpgid(0, 0) != 0 {
                        return Err(io::Error::last_os_error());
                    }
                    if let Some(file) = &held {
                        if libc::fchdir(file.as_raw_fd()) != 0 {
                            return Err(io::Error::last_os_error());
                        }
                    }
                    Ok(())
                });
            }
        }
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            let _ = anchor;
            command.creation_flags(0x4 | 0x200); // suspended + new process group
        }
        let mut child = command.spawn()?;
        #[cfg(windows)]
        let job = match windows::Job::attach_suspended(&child) {
            Ok(job) => job,
            Err(error) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(error);
            }
        };
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| io::Error::other("stdout"))?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| io::Error::other("stderr"))?;
        #[cfg(unix)]
        {
            use std::os::fd::AsRawFd;
            for fd in [stdout.as_raw_fd(), stderr.as_raw_fd()] {
                if unsafe { libc::fcntl(fd, libc::F_SETFL, libc::O_NONBLOCK) } == -1 {
                    unsafe {
                        libc::kill(-(child.id() as i32), libc::SIGKILL);
                    }
                    let _ = child.wait();
                    return Err(io::Error::last_os_error());
                }
            }
        }
        Ok(Self {
            child,
            stdout,
            stderr,
            reaped: false,
            #[cfg(windows)]
            job,
        })
    }
    pub(super) fn exited(&mut self) -> io::Result<bool> {
        #[cfg(unix)]
        {
            let mut info: libc::siginfo_t = unsafe { std::mem::zeroed() };
            // WNOWAIT keeps the leader's PID reserved until group cleanup, avoiding
            // a recycled PID/process-group being killed after parent exit.
            if unsafe {
                libc::waitid(
                    libc::P_PID,
                    self.child.id(),
                    &mut info,
                    libc::WEXITED | libc::WNOHANG | libc::WNOWAIT,
                )
            } != 0
            {
                return Err(io::Error::last_os_error());
            }
            Ok(unsafe { info.si_pid() } != 0)
        }
        #[cfg(windows)]
        {
            windows::exited(&self.child)
        }
    }
    pub(super) fn graceful(&self) {
        #[cfg(unix)]
        unsafe {
            libc::kill(-(self.child.id() as i32), libc::SIGTERM);
        }
        #[cfg(windows)]
        windows::graceful(self.child.id());
    }
    fn force(&self) {
        #[cfg(unix)]
        unsafe {
            libc::kill(-(self.child.id() as i32), libc::SIGKILL);
        }
        #[cfg(windows)]
        self.job.terminate();
    }
    pub(super) fn drain(&mut self, observation: &Mutex<Observation>) -> io::Result<bool> {
        let stdout_eof = drain_pipe(&mut self.stdout, observation)?;
        let stderr_eof = drain_pipe(&mut self.stderr, observation)?;
        Ok(stdout_eof && stderr_eof)
    }
    pub(super) fn cleanup(
        &mut self,
        deadline: Duration,
        observation: &Mutex<Observation>,
    ) -> io::Result<Option<i32>> {
        self.force(); // Also kill descendants after natural leader exit.
        let started = Instant::now();
        while !self.exited()? {
            self.drain(observation)?;
            if started.elapsed() >= deadline {
                return Err(io::Error::other("cleanup timeout"));
            }
            thread::sleep(Duration::from_millis(10));
        }
        let status = self.child.wait()?;
        self.reaped = true;
        #[cfg(unix)]
        while unsafe { libc::kill(-(self.child.id() as i32), 0) } == 0 {
            if started.elapsed() >= deadline {
                return Err(io::Error::other("process group cleanup timeout"));
            }
            thread::sleep(Duration::from_millis(10));
        }
        let readers = Instant::now();
        while !self.drain(observation)? {
            if readers.elapsed() >= Duration::from_secs(1) {
                return Err(io::Error::other("reader cleanup timeout"));
            }
            thread::sleep(Duration::from_millis(10));
        }
        #[cfg(windows)]
        self.job
            .wait_empty(deadline.saturating_sub(started.elapsed()))?;
        Ok(status.code())
    }
}
impl Drop for OwnedChild {
    fn drop(&mut self) {
        if !self.reaped {
            self.force();
            let _ = self.child.kill();
            let _ = self.child.try_wait();
        }
    }
}

#[cfg(unix)]
fn drain_pipe(pipe: &mut impl Read, observation: &Mutex<Observation>) -> io::Result<bool> {
    let mut bytes = [0; 8192];
    for _ in 0..8 {
        match pipe.read(&mut bytes) {
            Ok(0) => return Ok(true),
            Ok(n) => retain(observation, &bytes[..n])?,
            Err(error) if error.kind() == io::ErrorKind::WouldBlock => break,
            Err(error) if error.kind() == io::ErrorKind::Interrupted => continue,
            Err(error) => return Err(error),
        }
    }
    Ok(false)
}
#[cfg(windows)]
fn drain_pipe(
    pipe: &mut (impl Read + std::os::windows::io::AsRawHandle),
    observation: &Mutex<Observation>,
) -> io::Result<bool> {
    use windows_sys::Win32::{Foundation::ERROR_BROKEN_PIPE, System::Pipes::PeekNamedPipe};
    let mut bytes = [0; 8192];
    for _ in 0..8 {
        let mut available = 0;
        let ok = unsafe {
            PeekNamedPipe(
                pipe.as_raw_handle(),
                std::ptr::null_mut(),
                0,
                std::ptr::null_mut(),
                &mut available,
                std::ptr::null_mut(),
            )
        };
        if ok == 0 {
            let error = io::Error::last_os_error();
            if error.raw_os_error() == Some(ERROR_BROKEN_PIPE as i32) {
                return Ok(true);
            }
            return Err(error);
        }
        if available == 0 {
            break;
        }
        let count = (available as usize).min(bytes.len());
        let n = pipe.read(&mut bytes[..count])?;
        if n == 0 {
            return Ok(true);
        }
        retain(observation, &bytes[..n])?;
    }
    Ok(false)
}
