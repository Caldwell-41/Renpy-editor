"""Admission for the selected native lifecycle sequence; OS observations are separate."""
def admit(rows, exits, target):
    if target not in ('macos', 'windows'):
        return False
    if not isinstance(rows,list) or len(rows)!=4 or exits != [True,True]:
        return False
    for row,stage in zip(rows,('refusal','restart-change','quit','app-restart')):
        refusal=stage=='refusal'
        if (not isinstance(row,dict) or row.get('stage')!=stage or row.get('domFocusRetained') is not True
                or row.get('shutdown')!=dict(cleanupComplete=True,cooperative=not refusal,exitCode=72 if refusal else 0)
                or row.get('renderPhase') != ('unavailable' if refusal else 'ready')
                or row.get('renderer') != (None if refusal else 'angle2' if target == 'windows' else 'gl2')
                or row.get('refusal')!=(dict(refused=True,stage='selected-refusal') if refusal else None)):
            return False
    return True
