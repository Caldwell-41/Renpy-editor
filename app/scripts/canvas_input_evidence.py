"""Admit functional renderer readback. OS delivery needs an independent native audit."""
STAGES = ('draft-width-760', 'escape-cancel', 'enter-apply-752', 'keyboard-undo',
          'resize-arrow-right', 'move-arrow-right', 'drag-frame', 'drag-resize')


def admit(details, target):
    if (target not in ('macos', 'windows') or not isinstance(details, dict)
            or details.get('passed') is not True or details.get('scenario') != 'canvas-input'
            or details.get('stage') != 'complete' or details.get('targetOs') != target
            or details.get('inputKind') != 'trusted-events'
            or details.get('warmPresentationProof') is not False
            or details.get('perceivedSmoothnessProof') is not False
            or details.get('nativeInputQualified') is not False
            or not isinstance(details.get('rows'), list)
            or [r.get('stage') for r in details['rows']] != list(STAGES)
            or any(r.get('passed') is not True for r in details['rows'])):
        return False
    shutdown = details.get('canvasShutdown', {})
    if (shutdown.get('cleanupComplete') is not True or shutdown.get('cooperative') is not True
            or shutdown.get('exitCode') != 0):
        return False
    events = details.get('events')
    if not isinstance(events, list) or len(events) > 200:
        return False
    def has(stage, kind, key=None):
        return any(isinstance(e, dict) and e.get('stage') == stage and e.get('type') == kind
                   and e.get('trusted') is True and (key is None or e.get('key') == key) for e in events)
    keys = (('escape-cancel', 'Escape'), ('enter-apply-752', 'Enter'),
            ('keyboard-undo', 'Enter'), ('resize-arrow-right', 'ArrowRight'), ('move-arrow-right', 'ArrowRight'))
    return (has('draft-width-760', 'keydown') and has('draft-width-760', 'input')
            and all(has(s, 'keydown', k) for s, k in keys)
            and all(has(s, kind) for s in STAGES[-2:] for kind in ('pointerdown', 'pointerup'))
            and type(details.get('pointerMoves')) is int and details['pointerMoves'] >= 6)
