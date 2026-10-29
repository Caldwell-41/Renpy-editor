"""Cases required by the ordinary packaged runtime gate and evidence manifest."""
RUNTIME_CASES = ("compile", "lint", "route-a", "route-b", "runtime-error", "ui-refresh")
OPTIONAL_CASES = ("branches-performance", "source-foundation", "help-screen", "owned-screen", "screen-composition", "nested-layout", "ui-image", "project-font", "canvas-helper", "canvas-input")

# Terminal production-probe observations required by each ordinary scenario.
RUNTIME_STAGES = {
    "project-font": ("font-picker-passed", "font-draft-passed", "font-history-passed", "font-source-passed", "font-reopen-passed"),
    "ui-image": ("image-picker-passed", "image-draft-passed", "image-history-passed", "image-source-passed", "image-reopen-passed"),
    'nested-layout': ('nested-composition-passed','grid-layout-passed','viewport-source-passed','nested-history-passed','nested-reopen-passed'),
    'canvas-helper': ('project-frame-passed','draft-cancel-focus-passed','source-history-passed','second-aspect-passed','logical-pixels-passed','project-close-passed'),
    'owned-screen': ('cancel-passed', 'creation-passed', 'exact-source-passed', 'history-passed', 'reopen-passed'),
    'screen-composition': ('composition-passed', 'text-validation-passed', 'literal-history-passed', 'reorder-passed', 'confirmed-removal-passed', 'protected-source-passed', 'reopen-passed'),
    'help-screen': ('screen-inventory-passed', 'source-roundtrip-passed', 'validation-passed', 'preview-geometry-passed', 'stale-stop-passed', 'disk-reopen-passed'),
    'compile': ('diagnostics-real-ipc-passed',),
    'lint': ('diagnostics-real-ipc-passed',),
    'runtime-error': ('controlled-play-install', 'normal-run', 'runtime-failure-passed'),
    'route-a': ('route-running-observed', 'long-run-duration-passed', 'long-run-save-stop-passed', 'disk-reopen-passed'),
    'route-b': ('draft-cancel-save-refusal-passed', 'route-running-observed', 'long-run-duration-passed', 'long-run-save-stop-passed', 'disk-reopen-passed'),
    'ui-refresh': ('branches-destination-reopen-passed', 'branches-real-edit-restored', 'route-running-observed', 'long-run-duration-passed', 'long-run-save-stop-passed', 'disk-reopen-passed'),
}


def runtime_report_ok(case, report, target_os=None):
    if (not isinstance(report, dict) or report.get('evidence') != 'runtime-ui-packaged'
            or report.get('case') != case or report.get('passed') is not True
            or report.get('cleanupComplete') is not True):
        return False
    if case == "canvas-input":
        from canvas_input_evidence import admit
        return admit(report.get("details", {}), target_os)
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
    if case=='canvas-helper':
        from canvas_evidence import canvas_details_ok
        return canvas_details_ok(details, target_os)
    if case in ('owned-screen', 'screen-composition', 'nested-layout'):
        identity = details.get('identity')
        if (details.get('nativeWebView') is not True or details.get('sdkExecuted') is not False
                or details.get('error') or not isinstance(identity, dict)
                or identity.get('name') != 'travel_notes' or identity.get('path') != 'game/ui/travel_notes.rpy'
                or identity.get('resolved') is not True or not isinstance(identity.get('id'), str)
                or not isinstance(identity.get('rootId'), str) or identity['id'] == identity['rootId']):
            return False
        if case in ('screen-composition', 'nested-layout'):
            from uuid import UUID
            ids, source = details.get('identities'), details.get('acceptedSource')
            count = 8 if case == 'nested-layout' else 7
            if (not isinstance(ids, list) or len(ids) != count or not all(isinstance(value, str) for value in ids)
                    or len(set(ids)) != count or ids[0] != identity['rootId']
                    or not isinstance(source, str) or len(source.encode()) > 65536):
                return False
            try:
                if any(str(UUID(value)) != value for value in ids):
                    return False
            except ValueError:
                return False
            if (source.count(f'# loomlight-screen: {identity["id"]}\n') != 1
                    or source.count('screen travel_notes():\n') != 1
                    or any(source.count(f'# loomlight-element: {value}\n') != 1 for value in ids[1:])
                    or 'use source_only_footer()\n' not in source or 'text "Protected neighbor"\n' not in source):
                return False
    if case == 'nested-layout' and any(token not in details['acceptedSource'] for token in ['window:', 'hbox:', 'viewport:', 'grid 4 1:', 'allow_underfull True']):
        return False
    if case == 'ui-image':
        identity = details.get('identity')
        source = details.get('acceptedSource')
        from uuid import UUID
        try:
            ids = details['identities']
            valid_ids = len(ids) == 2 and len(set(ids)) == 2 and all(str(UUID(value)) == value for value in ids)
        except (ValueError, TypeError, KeyError):
            valid_ids = False
        if (not valid_ids or not isinstance(identity, dict) or identity.get('name') != 'travel_notes'
                or identity.get('path') != 'game/ui/travel_notes.rpy' or identity.get('resolved') is not True
                or ids[0] != identity.get('rootId') or details.get('nativeWebView') is not True
                or details.get('sdkExecuted') is not False or details.get('imageDecoded') is not True
                or details.get('imageFormats') != ['png','jpeg','webp-lossless','webp-lossy','webp-alpha']
                or details.get('error') or not isinstance(source, str)
                or any(token not in source for token in ['add "images/ui station_seal.png":', 'xsize 200', 'ysize 70', 'use source_only_footer()', 'text "Protected neighbor"'])
                or source.count(f'# loomlight-screen: {identity.get("id")}\n') != 1
                or source.count(f'# loomlight-element: {ids[1]}\n') != 1):
            return False
    if case == 'project-font':
        identity, source = details.get('identity'), details.get('acceptedSource')
        from uuid import UUID
        try:
            ids = details['identities']
            valid_ids = len(ids) == 2 and len(set(ids)) == 2 and all(str(UUID(value)) == value for value in ids)
        except (ValueError, TypeError, KeyError, AttributeError):
            valid_ids = False
        if (not valid_ids or not isinstance(identity, dict) or identity.get('name') != 'travel_notes'
                or identity.get('path') != 'game/ui/travel_notes.rpy' or identity.get('resolved') is not True
                or ids[0] != identity.get('rootId') or details.get('nativeWebView') is not True
                or details.get('sdkExecuted') is not False or details.get('fontDecoded') is not True
                or details.get('fontFormats') != ['ttf', 'otf'] or details.get('error')
                or not isinstance(source, str) or len(source.encode()) > 65536
                or any(token not in source for token in ['font "fonts/help_otf.otf"', 'size 38', 'color "#f1e9d6"', 'text_align 0.5', 'bold True', 'italic True', 'use source_only_footer()', 'text "Protected neighbor"'])
                or source.count(f'# loomlight-screen: {identity.get("id")}\n') != 1
                or source.count('screen travel_notes():\n') != 1
                or source.count(f'# loomlight-element: {ids[1]}\n') != 1):
            return False
    if case == 'help-screen':
        if target_os is not None and target_os not in ('windows', 'macos'):
            return False
        recorded_os = details.get('targetOs')
        if recorded_os is not None and recorded_os not in ('windows', 'macos'):
            return False
        if target_os is not None and recorded_os is not None and target_os != recorded_os:
            return False
        target_os = target_os or recorded_os
        if details.get('previewLaunches') != 1 or details.get('nativeWebView') is not True or details.get('error'):
            return False
        terminals = details.get('terminals')
        if not isinstance(terminals, list) or [t.get('kind') for t in terminals] != ['validate', 'run']:
            return False
        for terminal in terminals:
            status = terminal.get('status', {})
            if status.get('cleanupComplete') is not True or status.get('outputTruncated') is not False:
                return False
            if not isinstance(status.get('output'), str) or 'exitCode' not in status:
                return False
            if any(marker in status['output'] for marker in ('Traceback (most recent call last):', 'While running game code:', 'Error:', 'Exception:')):
                return False
            diagnostics = terminal.get('diagnostics')
            if not isinstance(diagnostics, list) or any(d.get('severity') == 'error' for d in diagnostics):
                return False
            if terminal['kind'] == 'validate':
                if status.get('phase') != 'exited' or type(status.get('exitCode')) is not int or status['exitCode'] != 0:
                    return False
            else:
                code = status['exitCode']
                expected_exit = (type(code) is int and code == 0
                                 or code is None and target_os != 'windows'
                                 or type(code) is int and code == -1073741510 and target_os == 'windows' and terminal.get('stopRequested') is True)
                if status.get('phase') != 'cancelled' or not expected_exit:
                    return False
    if 'long-run-duration-passed' in RUNTIME_STAGES[case]:
        duration = next(row.get('runningObservedMs') for row in stages if row.get('stage') == 'long-run-duration-passed')
        if type(duration) not in (int, float) or not 9500 <= duration < float('inf'):
            return False
    return True
