use super::*;
use base64::Engine as _;
use std::{
    io::{BufRead, BufReader},
    process::{Child, Command, Stdio},
    thread,
    time::Instant,
};

struct Fixture {
    child: Child,
    port: u16,
    events: mpsc::Receiver<String>,
    certificate: Vec<u8>,
    _root: tempfile::TempDir,
}
impl Fixture {
    fn start(mode: &str, address: &str) -> Self {
        let script = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../tests/fixtures/studio-request/tls_server.py");
        let root = tempfile::Builder::new()
            .prefix("loomlight-studio-tls-test-")
            .tempdir()
            .unwrap();
        let child = Command::new(if cfg!(windows) { "python" } else { "python3" })
            .arg("-u")
            .arg(script)
            .arg(mode)
            .arg(address)
            .arg(root.path())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .unwrap();
        let (send, events) = mpsc::channel();
        // Own the child and temp root before reading startup output, so a setup
        // failure/panic also kills the child and removes generated key material.
        let mut fixture = Self {
            child,
            port: 0,
            events,
            certificate: Vec::new(),
            _root: root,
        };
        let mut output = BufReader::new(fixture.child.stdout.take().unwrap());
        let mut line = String::new();
        output.read_line(&mut line).unwrap();
        fixture.port = line
            .trim()
            .parse()
            .expect("TLS fixture should bind localhost using existing OpenSSL");
        line.clear();
        output.read_line(&mut line).unwrap();
        fixture.certificate = base64::engine::general_purpose::STANDARD
            .decode(line.trim())
            .unwrap();
        thread::spawn(move || {
            for line in output.lines() {
                if send.send(line.unwrap()).is_err() {
                    break;
                }
            }
        });
        fixture
    }
    fn trusted(&self) -> ureq::tls::TlsConfig {
        let certificate = ureq::tls::Certificate::from_pem(&self.certificate).unwrap();
        ureq::tls::TlsConfig::builder()
            .root_certs(ureq::tls::RootCerts::new_with_certs(&[certificate]))
            .build()
    }
    fn until(&self, prefix: &str) -> String {
        let deadline = Instant::now() + Duration::from_secs(5);
        loop {
            let line = self
                .events
                .recv_timeout(deadline.saturating_duration_since(Instant::now()))
                .unwrap();
            if line.starts_with(prefix) {
                return line;
            }
        }
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
fn settings(port: u16, host: &str) -> StudioProfile {
    let mut p = super::tests::profile(port);
    p.settings.endpoint = format!("https://{host}:{port}/v1");
    p.credential.as_mut().unwrap().origin = format!("https://{host}:{port}");
    p
}
fn prepared(port: u16, host: &str) -> Prepared {
    prepare(
        settings(port, host),
        Secret::new("public-fixture".into()),
        30,
    )
    .unwrap()
}
#[test]
fn https_real_production_path_trusted_ip_and_hostname_exact_body() {
    // Serialize hostname test to the global one-worker DNS resolver gate.
    for host in ["127.0.0.1", "localhost"] {
        let fixture = Fixture::start("ok", "127.0.0.1");
        let p = prepared(fixture.port, host);
        let expected = p.body.clone();
        let result = execute_with_tls(p, &Cancel::default(), |_| {}, &mut None, fixture.trusted());
        assert_eq!(result.unwrap().text, "Loomlight synthetic response.");
        assert_eq!(
            fixture
                .until("request:")
                .strip_prefix("request:")
                .unwrap()
                .as_bytes(),
            expected
        );
    }
}
#[test]
fn https_untrusted_and_wrong_hostname_refuse_before_bearer_and_json() {
    for mode in ["ok", "wrong_host"] {
        let fixture = Fixture::start(mode, "127.0.0.1");
        let tls = if mode == "wrong_host" {
            fixture.trusted()
        } else {
            ureq::tls::TlsConfig::default()
        };
        let mut status = None;
        assert_eq!(
            execute_with_tls(
                prepared(fixture.port, "127.0.0.1"),
                &Cancel::default(),
                |_| {},
                &mut status,
                tls
            ),
            Err(Failure::Connection)
        );
        assert_eq!(status, None);
        assert_eq!(fixture.until("tls_refused"), "tls_refused");
    }
}
#[test]
fn https_redirect_and_authentication_do_not_retry() {
    for (mode, failure, code) in [
        ("redirect", Failure::Redirect, 302),
        ("auth", Failure::Authentication, 401),
    ] {
        let fixture = Fixture::start(mode, "127.0.0.1");
        let mut status = None;
        assert_eq!(
            execute_with_tls(
                prepared(fixture.port, "127.0.0.1"),
                &Cancel::default(),
                |_| {},
                &mut status,
                fixture.trusted()
            ),
            Err(failure)
        );
        assert_eq!(status, Some(code));
        fixture.until("request:");
        assert!(fixture.events.recv_timeout(Duration::from_secs(1)).is_err());
    }
}
#[test]
fn https_cancellation_closes_handshake_and_body_owned_socket() {
    for mode in ["handshake_stall", "body_stall"] {
        let fixture = Fixture::start(mode, "127.0.0.1");
        let p = prepared(fixture.port, "127.0.0.1");
        let cancel = Cancel::default();
        let worker_cancel = cancel.clone();
        let tls = fixture.trusted();
        let handle =
            thread::spawn(move || execute_with_tls(p, &worker_cancel, |_| {}, &mut None, tls));
        fixture.until(if mode == "handshake_stall" {
            "connected"
        } else {
            "receiving"
        });
        let started = Instant::now();
        cancel.cancel();
        assert_eq!(handle.join().unwrap(), Err(Failure::Cancelled));
        assert!(started.elapsed() < Duration::from_secs(2));
        assert!(matches!(
            *cancel.0.shutdown_observation.lock().unwrap(),
            Some(Ok(()))
        ));
        fixture.until("closed");
    }
}
#[test]
fn https_all_dns_answers_are_admitted_and_changed_sets_refuse_before_connect() {
    let p = settings(8888, "localhost");
    let good = "127.0.0.1:8888".parse().unwrap();
    for bad in [
        "0.0.0.0:8888",
        "169.254.1.1:8888",
        "224.0.0.1:8888",
        "[::ffff:169.254.1.1]:8888",
        "[fe80::1]:8888",
        "[::]:8888",
    ] {
        assert_eq!(
            admitted_destination(&p.settings, vec![good, bad.parse().unwrap()]),
            Err(Failure::UnsupportedDestination)
        );
    }
    assert!(admitted_destination(&p.settings, vec![good, good]).is_ok());
    let mut bound = prepared(8888, "127.0.0.1");
    // A core-owned token with a changed endpoint/address set is never sent.
    bound.destination.addresses[0] = "127.0.0.2:8888".parse().unwrap();
    assert_eq!(
        execute(bound, &Cancel::default(), |_| {}, &mut None),
        Err(Failure::DestinationChanged)
    );
}

#[test]
fn https_literal_ipv6_limitation_is_explicit_and_http_ipv6_is_preserved() {
    let mut p = settings(8888, "[::1]");
    assert_eq!(destination(&p.settings), Err(Failure::UnsupportedTlsIpv6));
    assert_eq!(
        resolve_destination(&p.settings),
        Err(Failure::UnsupportedTlsIpv6)
    );
    p.settings.endpoint = "https://[::ffff:127.0.0.1]:8888/v1".into();
    assert_eq!(destination(&p.settings), Err(Failure::UnsupportedTlsIpv6));
    for endpoint in ["http://[::1]:8888/v1", "http://[fd00::1]:8888/v1"] {
        p.settings.endpoint = endpoint.into();
        p.settings.private_http = true;
        assert!(destination(&p.settings).is_ok());
        assert_eq!(resolve_destination(&p.settings).unwrap().addresses.len(), 1);
    }
    p.settings.endpoint = "https://localhost:8888/v1".into();
    assert!(admitted_destination(&p.settings, vec!["[::1]:8888".parse().unwrap()]).is_ok());
}

#[test]
fn dns_wait_uses_remaining_generation_deadline_and_zero_never_extends_io() {
    let (_send, receive) = mpsc::sync_channel(1);
    let start = Instant::now();
    assert_eq!(
        receive_resolved(receive, start + Duration::from_millis(25)),
        Err(Failure::Timeout)
    );
    assert!(start.elapsed() < Duration::from_millis(250));
    let p = settings(8888, "localhost");
    assert_eq!(
        resolve_destination_until(&p.settings, Instant::now()),
        Err(Failure::Timeout)
    );
    let expired = NextTimeout {
        after: ureq::unversioned::transport::time::Duration::from_secs(0),
        reason: ureq::Timeout::Global,
    };
    assert!(matches!(
        io_budget(Instant::now() + Duration::from_secs(1), expired),
        Err(ureq::Error::Timeout(ureq::Timeout::Global))
    ));
}
