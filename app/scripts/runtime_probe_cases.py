"""Cases required by the ordinary packaged runtime gate and evidence manifest."""
RUNTIME_CASES = ("compile", "lint", "route-a", "route-b", "runtime-error", "ui-refresh")
OPTIONAL_CASES = ("branches-performance", "source-foundation", "help-screen")

# Terminal production-probe observations required by each ordinary scenario.
RUNTIME_STAGES = {
    'help-screen': ('screen-inventory-passed', 'source-roundtrip-passed', 'validation-passed', 'preview-geometry-passed', 'stale-stop-passed', 'disk-reopen-passed'),
    'compile': ('diagnostics-real-ipc-passed',),
    'lint': ('diagnostics-real-ipc-passed',),
    'runtime-error': ('controlled-play-install', 'normal-run', 'runtime-failure-passed'),
    'route-a': ('route-running-observed', 'long-run-duration-passed', 'long-run-save-stop-passed', 'disk-reopen-passed'),
    'route-b': ('draft-cancel-save-refusal-passed', 'route-running-observed', 'long-run-duration-passed', 'long-run-save-stop-passed', 'disk-reopen-passed'),
    'ui-refresh': ('branches-destination-reopen-passed', 'branches-real-edit-restored', 'route-running-observed', 'long-run-duration-passed', 'long-run-save-stop-passed', 'disk-reopen-passed'),
}


def runtime_report_ok(case, report):
    if (not isinstance(report, dict) or report.get('evidence') != 'runtime-ui-packaged'
            or report.get('case') != case or report.get('passed') is not True
            or report.get('cleanupComplete') is not True):
        return False
    if case not in RUNTIME_STAGES:
        return case in OPTIONAL_CASES
    details = report.get('details')
    if not isinstance(details, dict) or details.get('scenario') != case or details.get('stage') != 'complete':
        return False
    stages = details.get('stages')
    if not isinstance(stages, list) or any(not isinstance(row, dict) for row in stages):
        return False
    names = [row.get('stage') for row in stages]
    if not names or names[-1] != 'complete' or names.count('complete') != 1:
        return False
    if any(names.count(name) != 1 for name in RUNTIME_STAGES[case]):
        return False
    if case == 'help-screen':
        if details.get('previewLaunches') != 1 or details.get('nativeWebView') is not True or details.get('error'):
            return False
        terminals = details.get('terminals')
        if not isinstance(terminals, list) or [t.get('kind') for t in terminals] != ['validate', 'run']:
            return False
        for terminal in terminals:
            status = terminal.get('status', {})
            if status.get('cleanupComplete') is not True or status.get('outputTruncated') is not False:
                return False
            if any(marker in status.get('output', '') for marker in ('Traceback (most recent call last):', 'While running game code:', 'Error:', 'Exception:')):
                return False
            diagnostics = terminal.get('diagnostics')
            if not isinstance(diagnostics, list) or any(d.get('severity') == 'error' for d in diagnostics):
                return False
            if terminal['kind'] == 'validate':
                if status.get('phase') != 'exited' or status.get('exitCode') != 0:
                    return False
            elif status.get('phase') != 'cancelled' or status.get('exitCode') not in (None, 0):
                return False
    if 'long-run-duration-passed' in RUNTIME_STAGES[case]:
        duration = next(row.get('runningObservedMs') for row in stages if row.get('stage') == 'long-run-duration-passed')
        if type(duration) not in (int, float) or not 9500 <= duration < float('inf'):
            return False
    return True
