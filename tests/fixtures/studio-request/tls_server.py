"""Ephemeral synthetic localhost Studio fixture; no stored TLS key or provider call.
The Rust test owns the temporary root and removes it after killing/waiting for us.
"""
import base64
import json
import os
import pathlib
import shutil
import socket
import ssl
import subprocess
import sys

mode, address, directory = sys.argv[1:]
root = pathlib.Path(directory)
# Existing host capability only: fail closed if unavailable; never install tools.
if sys.platform == "darwin":
    openssl = pathlib.Path("/usr/bin/openssl")
else:
    found = shutil.which("openssl")
    openssl = pathlib.Path(found) if found else pathlib.Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Git/usr/bin/openssl.exe"
if not openssl.is_file():
    raise RuntimeError("TLS fixture requires the existing host OpenSSL executable")
name = "wrong-host.invalid" if mode == "wrong_host" else "localhost"
san = "DNS:wrong-host.invalid" if mode == "wrong_host" else "DNS:localhost,IP:127.0.0.1"
configuration = root / "openssl.cnf"
configuration.write_text(f"""[req]
distinguished_name = dn
prompt = no
x509_extensions = ca
[dn]
CN = {name}
[ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
[server]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = {san}
""")
certificate, key = root / "certificate", root / "key"
ca_certificate, ca_key, request = root / "ca-certificate", root / "ca-key", root / "request"
def generate(arguments):
    subprocess.run([str(openssl), *map(str, arguments)], check=True, timeout=15, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
generate(["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2", "-config", configuration, "-extensions", "ca", "-keyout", ca_key, "-out", ca_certificate])
generate(["req", "-new", "-newkey", "rsa:2048", "-nodes", "-config", configuration, "-keyout", key, "-out", request])
generate(["x509", "-req", "-in", request, "-CA", ca_certificate, "-CAkey", ca_key, "-CAcreateserial", "-days", "2", "-extfile", configuration, "-extensions", "server", "-out", certificate])
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certificate, key)
if mode == "wrong_host":
    mode = "ok"
with socket.socket() as listener:
    listener.bind((address, 0))
    listener.listen(1)
    listener.settimeout(5)
    print(listener.getsockname()[1], flush=True)
    # Public certificate only; the generated key remains inside the owned root.
    print(base64.b64encode(ca_certificate.read_bytes()).decode("ascii"), flush=True)
    raw, _ = listener.accept()
    with raw:
        raw.settimeout(5)
        print("connected", flush=True)
        if mode == "handshake_stall":
            # Read ClientHello then wait for cancellation of the exact transport.
            raw.recv(65536)
            while raw.recv(65536):
                pass
            print("closed", flush=True)
            sys.exit(0)
        try:
            connection = context.wrap_socket(raw, server_side=True)
        except (ssl.SSLError, OSError):
            print("tls_refused", flush=True)
            sys.exit(0)
        with connection:
            data = b""
            while b"\r\n\r\n" not in data:
                part = connection.recv(65536)
                if not part:
                    raise RuntimeError("request missing")
                data += part
            headers, body = data.split(b"\r\n\r\n", 1)
            length = next(int(line.split(b":", 1)[1]) for line in headers.split(b"\r\n") if line.lower().startswith(b"content-length:"))
            while len(body) < length:
                body += connection.recv(65536)
            assert headers.split(b"\r\n")[0] == b"POST /v1/chat/completions HTTP/1.1"
            assert b"authorization: Bearer public-fixture" in headers
            print("request:" + body.decode(), flush=True)
            if mode == "body_stall":
                connection.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 10000\r\n\r\n{")
                print("receiving", flush=True)
                try:
                    while connection.recv(65536):
                        pass
                except (ssl.SSLError, OSError):
                    pass
                print("closed", flush=True)
            else:
                value = {"model": "synthetic-model", "choices": [{"index": 0, "finish_reason": "stop", "message": {"role": "assistant", "content": "Loomlight synthetic response."}}]}
                body = json.dumps(value).encode()
                status = {"ok": "200 OK", "auth": "401 Unauthorized", "redirect": "302 Found"}[mode]
                location = "Location: https://localhost:1/should-never-send\r\n" if mode == "redirect" else ""
                header = f"HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {len(body)}\r\nConnection: close\r\n{location}\r\n"
                connection.sendall(header.encode() + body)
