"""Cheap result checks for the bounded Q1 preparation gates."""
import argparse
import json
from pathlib import Path
import re
import sys
import tempfile


SUMMARY = re.compile(
    r"^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; "
    r"(\d+) ignored; (\d+) measured; (\d+) filtered out;",
    re.MULTILINE,
)
TEST_LINE = re.compile(r"^test\s+(\S+)\s+\.\.\.\s+(ok|ignored|FAILED)$", re.MULTILINE)
RUNTIME_CASES = ("compile", "lint", "route-a", "route-b", "runtime-error")


def cargo_log_ok(text, required_tests):
    summaries = SUMMARY.findall(text)
    if not summaries:
        return False, "missing or malformed Cargo test summary"
    if any(status != "ok" or int(failed) for status, _passed, failed, *_ in summaries):
        return False, "Cargo test summary reports a failure"
    if sum(int(passed) for _status, passed, _failed, *_ in summaries) < 1:
        return False, "Cargo selected zero passing tests"
    results = dict(TEST_LINE.findall(text))
    for name in required_tests:
        if results.get(name) != "ok":
            return False, f"required test did not pass: {name} ({results.get(name, 'missing')})"
    return True, "required Cargo tests passed"


def runtime_case_ok(case, record):
    if not isinstance(record, dict) or record.get("case") != case:
        return False
    if record.get("passed") is not True or record.get("exitCode") != 0 or record.get("timedOut") is not False:
        return False
    reports = record.get("reports")
    if not isinstance(reports, list) or len(reports) != 1:
        return False
    report = reports[0]
    return (
        isinstance(report, dict)
        and report.get("evidence") == "runtime-ui-packaged"
        and report.get("passed") is True
        and report.get("cleanupComplete") is True
    )


def runtime_cases_ok(directory):
    for case in RUNTIME_CASES:
        path = directory / f"runtime-ui-{case}.json"
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            return False, f"missing or malformed case report: {path.name}"
        if not runtime_case_ok(case, record):
            return False, f"failed case or cleanup evidence: {path.name}"
    return True, "all five packaged Runtime case reports and cleanup results passed"


def package_state(package_outcome, executable_present):
    if executable_present:
        return "available" if package_outcome == "success" else "produced-during-package-failure"
    return "built-but-missing" if package_outcome == "success" else "not-built"


def browser_outcomes_ok(runtime, branches):
    return runtime == "success" and branches == "success"


def join_shell_continuations(text):
    return re.sub(r"[ \t]*\\\r?\n[ \t]*", " ", text)


def workflow_python_ok(workflow):
    selection = "Q1_PYTHON: ${{ runner.os == 'Windows' && 'python' || 'python3' }}"
    helper_calls = re.findall(
        r'^\s*(?:run: )?(.*?)\s+scripts/(?:check-q1-prep-gates|retain-q1-package)\.py\b',
        workflow, re.MULTILINE,
    )
    return selection in workflow and bool(helper_calls) and all(
        command == '"$Q1_PYTHON"' for command in helper_calls
    )


def source_audit(repo):
    transaction = (repo / "app/src-core/src/transaction/tests.rs").read_text(encoding="utf-8")
    lifecycle = (repo / "app/src-core/src/lifecycle.rs").read_text(encoding="utf-8")
    production = (repo / ".github/workflows/production-scaffold.yml").read_text(encoding="utf-8")
    quality = (repo / ".github/workflows/quality.yml").read_text(encoding="utf-8")
    prepared = (repo / "app/scripts/run-runtime-ui-probes.py").read_text(encoding="utf-8")
    retainer = (repo / "app/scripts/retain-q1-package.py").read_text(encoding="utf-8")
    required_ignored = (
        "process_termination_at_each_persistent_boundary_is_recoverable",
        "streaming_process_termination_at_each_persistent_boundary_is_recoverable",
        "prepared_process_termination_can_be_safely_abandoned",
    )
    for name in required_ignored:
        if not re.search(r"#\[ignore[^\]]*\]\s*fn " + re.escape(name) + r"\b", transaction):
            return False, f"specialist parent is not explicitly ignored: {name}"
    required_ignored = ("recent_crash_checkpoints_restart_from_a_complete_store",)
    for name in required_ignored:
        if not re.search(r"#\[ignore[^\]]*\]\s*fn " + re.escape(name) + r"\b", lifecycle):
            return False, f"specialist parent is not explicitly ignored: {name}"
    ordinary_start = lifecycle.index("fn official_sdk_phase_1c_target_gate()")
    ordinary_end = lifecycle.index('phase-1c-target-gate: passed', ordinary_start)
    ordinary = lifecycle[ordinary_start:ordinary_end]
    if "crash_managed_sdk_install(" in ordinary or "requested_stage_parent" in ordinary:
        return False, "ordinary SDK gate still contains a specialist block"
    for name in ("official_sdk_managed_install_crash_recovery_specialist", "official_sdk_stage_namespace_specialist"):
        if not re.search(r"#\[ignore[^\]]*\]\s*fn " + re.escape(name) + r"\b", lifecycle):
            return False, f"SDK specialist test is not explicitly ignored: {name}"
    if "fn prepared_fault_state_can_be_safely_abandoned()" not in transaction:
        return False, "non-crashing Prepared abandonment regression is missing"

    exclusions = (
        "scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges",
        "lifecycle::tests::official_sdk_phase_1c_target_gate",
        "renpy::reconciliation_tests::official_sdk_download_handoff_target_gate",
    )
    for workflow_name, workflow in (("production", production), ("quality", quality)):
        if not workflow_python_ok(workflow):
            return False, f"{workflow_name} Q1 helpers must use the target's Python command"
        for selector in exclusions:
            if workflow.count("--skip " + selector) != 1:
                return False, f"{workflow_name} selector mismatch: {selector}"
        flow_command = "cargo test -p loomlight-core --release --locked scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges"
        if workflow.count(flow_command) != 1:
            return False, f"{workflow_name} must select G1-U2 exactly once"
    production_commands = join_shell_continuations(production)
    for selector in (
        "lifecycle::tests::official_sdk_phase_1c_target_gate -- --exact",
        "renpy::reconciliation_tests::official_sdk_download_handoff_target_gate -- --exact",
        "lifecycle::runtime_tests::runtime_official_sdk_service_gate -- --ignored --exact",
        "lifecycle::runtime_tests::runtime_diagnostics_sdk_gate -- --ignored --exact",
    ):
        if production_commands.count("cargo test -p loomlight-core --release --locked " + selector) != 1:
            return False, f"production SDK gate selector mismatch: {selector}"
    if "  push:" in production or "workflow_dispatch:" not in production:
        return False, "production workflow is not manual-dispatch-only"
    retention_step = re.search(
        r"(?ms)^      - name: Retain and identify the produced package on failure\n(.*?)(?=^      - name:|\Z)",
        production,
    )
    if not retention_step or not re.search(
        r"^        shell: bash$", retention_step.group(1), re.MULTILINE
    ):
        return False, "package retention step must explicitly use Bash"
    if "github.event_name == 'workflow_dispatch' && inputs.upload_packages" not in production:
        return False, "success-only installer selection is missing"
    if "if: always()" not in production or "retention-days: 7" not in production:
        return False, "failure-time evidence retention is not bounded and unconditional"
    if "RUNTIME_BROWSER_OUTCOME" not in production or "BRANCHES_BROWSER_OUTCOME" not in production:
        return False, "independent browser result gate is missing"
    if "check-q1-prep-gates.py browser-outcomes" not in production or "set -o pipefail" not in production:
        return False, "browser result rejection is not connected to the production gate"
    for state in ("not-built", "built-but-missing", "available", "withheld-by-scan"):
        if state not in retainer:
            return False, f"package evidence state is not recorded: {state}"
    if "sha256" not in retainer or "tarfile.open" not in retainer or "package-evidence.json" not in retainer:
        return False, "package hash/retention manifest is incomplete"
    allowed_match = re.search(r"allowed\s*=\s*\[([^]]*)\]", prepared)
    allowed_cases = re.findall(r"\"([^\"]+)\"", allowed_match.group(1)) if allowed_match else []
    if tuple(allowed_cases[:5]) != RUNTIME_CASES:
        return False, "the five ordinary packaged cases changed"
    return True, "source selectors, specialist split, runtime cases and workflow outcomes aligned"


def self_test():
    portable = (
        "Q1_PYTHON: ${{ runner.os == 'Windows' && 'python' || 'python3' }}\n"
        '          "$Q1_PYTHON" scripts/check-q1-prep-gates.py cargo-log log test\n'
    )
    assert workflow_python_ok(portable)
    assert not workflow_python_ok(portable.replace('"$Q1_PYTHON"', 'python'))
    assert not workflow_python_ok(portable.split('\n', 1)[1])
    selector = "lifecycle::tests::official_sdk_phase_1c_target_gate -- --exact"
    multiline = (
        "cargo test -p loomlight-core --release --locked "
        + chr(92)
        + "\n            "
        + selector
    )
    assert join_shell_continuations(multiline) == (
        "cargo test -p loomlight-core --release --locked " + selector
    )
    good = "test transaction::tests::prepared_fault_state_can_be_safely_abandoned ... ok\ntest result: ok. 2 passed; 0 failed; 1 ignored; 0 measured; 3 filtered out; finished in 0.1s\n"
    assert cargo_log_ok(good, ["transaction::tests::prepared_fault_state_can_be_safely_abandoned"])[0]
    for invalid in (
        "test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0s\n",
        "test transaction::tests::prepared_fault_state_can_be_safely_abandoned ... ignored\ntest result: ok. 0 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0s\n",
        "test other::test ... ok\ntest result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0s\n",
        "test transaction::tests::prepared_fault_state_can_be_safely_abandoned ... FAILED\ntest result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0s\n",
        "test transaction::tests::prepared_fault_state_can_be_safely_abandoned ... ok\n",
    ):
        assert not cargo_log_ok(invalid, ["transaction::tests::prepared_fault_state_can_be_safely_abandoned"])[0]

    case = "route-a"
    valid = {"case": case, "passed": True, "exitCode": 0, "timedOut": False,
             "reports": [{"evidence": "runtime-ui-packaged", "passed": True, "cleanupComplete": True}]}
    assert runtime_case_ok(case, valid)
    for invalid in (
        None,
        {**valid, "reports": []},
        {**valid, "reports": [{"evidence": "runtime-ui-packaged", "passed": True, "cleanupComplete": False}]},
        {**valid, "passed": False},
    ):
        assert not runtime_case_ok(case, invalid)
    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)
        records = {
            name: {"case": name, "passed": True, "exitCode": 0, "timedOut": False,
                   "reports": [{"evidence": "runtime-ui-packaged", "passed": True, "cleanupComplete": True}]}
            for name in RUNTIME_CASES
        }
        for name, record in records.items():
            (directory / f"runtime-ui-{name}.json").write_text(json.dumps(record), encoding="utf-8")
        assert runtime_cases_ok(directory)[0]
        (directory / "runtime-ui-route-b.json").unlink()
        assert not runtime_cases_ok(directory)[0]
        (directory / "runtime-ui-route-b.json").write_text("{malformed", encoding="utf-8")
        assert not runtime_cases_ok(directory)[0]
        records["route-b"]["reports"][0]["cleanupComplete"] = False
        (directory / "runtime-ui-route-b.json").write_text(json.dumps(records["route-b"]), encoding="utf-8")
        assert not runtime_cases_ok(directory)[0]
    assert package_state("failure", False) == "not-built"
    assert package_state("success", False) == "built-but-missing"
    assert package_state("success", True) == "available"
    assert package_state("failure", True) == "produced-during-package-failure"
    assert browser_outcomes_ok("success", "success")
    for runtime in ("failure", "cancelled", "skipped", "missing"):
        assert not browser_outcomes_ok(runtime, "success")
    for branches in ("failure", "cancelled", "skipped", "missing"):
        assert not browser_outcomes_ok("success", branches)
    print("Q1 preparation gate controls passed (selectors, reports, cleanup, retention states).")


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("self-test")
    audit = commands.add_parser("source-audit")
    audit.add_argument("repository", type=Path)
    cargo = commands.add_parser("cargo-log")
    cargo.add_argument("log", type=Path)
    cargo.add_argument("required_tests", nargs="+")
    cases = commands.add_parser("runtime-cases")
    cases.add_argument("directory", type=Path)
    browser = commands.add_parser("browser-outcomes")
    browser.add_argument("runtime")
    browser.add_argument("branches")
    args = parser.parse_args()

    if args.command == "self-test":
        self_test()
        return 0
    if args.command == "source-audit":
        ok, message = source_audit(args.repository)
        print(message, file=sys.stderr if not ok else sys.stdout)
        return 0 if ok else 1
    if args.command == "browser-outcomes":
        if browser_outcomes_ok(args.runtime, args.branches):
            print("both browser functional/evidence outcomes passed")
            return 0
        print("Runtime or Branches browser outcome is missing or unsuccessful", file=sys.stderr)
        return 1
    if args.command == "cargo-log":
        try:
            text = args.log.read_text(encoding="utf-8", errors="replace")
        except OSError as error:
            print(f"cannot read required test log: {error}", file=sys.stderr)
            return 1
        ok, message = cargo_log_ok(text, args.required_tests)
    else:
        ok, message = runtime_cases_ok(args.directory)
    print(message, file=sys.stderr if not ok else sys.stdout)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
