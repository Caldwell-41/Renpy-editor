This fixture generates a fresh synthetic TLS CA, leaf certificate and keys inside
an owned temporary directory for each test. No TLS keys or certificates are tracked.
Only the public CA certificate is returned to Rust and trusted by a test-only transport
configuration; production retains the pinned ureq WebPKI roots and verification.

The standard certificate has SANs for `localhost` and `127.0.0.1`; the wrong-host case
has `wrong-host.invalid`, which proves hostname verification despite trusting its
issuer. The untrusted case uses the unchanged production trust roots. `tls_server.py`
accepts one local connection, requires a public fixture Bearer value, and returns
controlled Studio JSON or a stalled response. It never calls an inference provider or
discovers or installs models.

Rust owns the `tempfile::TempDir`, kills and waits for the Python child, then removes
the certificates, generated keys and OpenSSL configuration even after cancellation or a
test panic. The fixture requires existing Python 3 (`python` on Windows, `python3`
elsewhere) and host OpenSSL: `/usr/bin/openssl` on macOS, an executable on PATH or
existing Git OpenSSL on Windows. Missing capability fails the test; nothing is
installed, and no third-party Python dependency or signing policy is changed.
