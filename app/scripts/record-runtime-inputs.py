"""Record exact candidate inputs and executable digest without absolute host paths."""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
paths = subprocess.check_output(["git", "ls-files", "app", ".github/workflows/production-scaffold.yml"], cwd=root, text=True).splitlines()
inputs = {path: hashlib.sha256((root/path).read_bytes()).hexdigest() for path in paths}
report = {
    "candidate": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip(),
    "tree": subprocess.check_output(["git", "rev-parse", "HEAD^{tree}"], cwd=root, text=True).strip(),
    "runId": os.environ.get("GITHUB_RUN_ID"), "attempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
    "os": platform.system(), "release": platform.release(), "architecture": platform.machine(),
    "toolchains": {tool: subprocess.check_output([tool,"--version"],cwd=root/"app",text=True).strip() for tool in ["node","cargo","rustc"]},
    "python": platform.python_version(),
    "inputs": inputs,
    "executableSha256": hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest(),
    "layer": "packaged WebView with real IPC/service/SDK; synthetic DOM events, not native keyboard or human acceptance",
}
Path(sys.argv[2]).write_text(json.dumps(report, indent=2)+"\n")
