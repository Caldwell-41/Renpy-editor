#!/usr/bin/env python3
"""Submit and collect exact Loomlight CI candidates without automatic Codex wake-up."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

from ci_lib import CiError, GitHubTransport, OperationStore, collect, doctor, preflight, submit
from codex_local import LocalConfigError

ROOT = Path(__file__).resolve().parents[1]


def parser() -> argparse.ArgumentParser:
    top = argparse.ArgumentParser(description=__doc__)
    commands = top.add_subparsers(dest="command", required=True)
    commands.add_parser("doctor")
    commands.add_parser("preflight")
    send = commands.add_parser("submit")
    send.add_argument("--ref", required=True)
    send.add_argument("--sha", required=True)
    send.add_argument("--upload-packages", action="store_true")
    send.add_argument("--force-full", action="store_true")
    read = commands.add_parser("collect")
    read.add_argument("--run", required=True, type=int)
    read.add_argument("--attempt", required=True, type=int)
    read.add_argument("--operation")
    return top


def main() -> int:
    args = parser().parse_args()
    try:
        if args.command == "doctor":
            result = doctor(ROOT)
        elif args.command == "preflight":
            result = preflight(ROOT)
        elif args.command == "submit":
            result = submit(
                ROOT, OperationStore(ROOT), GitHubTransport.from_local_credentials(ROOT), ref=args.ref, sha=args.sha,
                upload_packages=args.upload_packages, force_full=args.force_full,
            )
        else:
            store = OperationStore(ROOT) if args.operation else None
            operation = store.get(args.operation) if store else None
            if operation and (operation["run_id"] != args.run or operation["attempt"] != args.attempt):
                raise CiError("Requested run/attempt does not match the selected operation.")
            result = collect(
                GitHubTransport(), run_id=args.run, attempt=args.attempt,
                expected_sha=operation["candidate_sha"] if operation else None,
                expected_ref=operation["ref"] if operation else None,
            )
            if operation and store:
                target = "completed" if result["provider_status"] == "completed" else "running"
                store.transition(
                    operation["operation_id"], {"attached", "running"}, target,
                    result_json=json.dumps(result, sort_keys=True), next_action=result["next_action"],
                )
        print(json.dumps(result, indent=2, sort_keys=True))
        if args.command == "preflight" and not result["passed"]:
            return 2
        if args.command == "collect" and not result["accepted"]:
            return 3
        return 0
    except (CiError, LocalConfigError):
        print("CI operation blocked; inspect the local operation record and documented recovery. No private values were printed.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
