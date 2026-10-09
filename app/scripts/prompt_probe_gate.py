"""Required-result gate for the bounded prompt/context native outcome."""
PHASE_CHECKS = {
 1: {
  'Physical Save persists exact project prompt',
  'Restore shows current and installed baseline before confirmation',
  'Cancel restore preserves override',
  'Confirmed restore removes override',
  'Undo restore retains exact custom text',
  'Redo restore reinstates baseline',
  'Close guard retains unsaved prompt',
  'Settings reopen displays persisted baseline',
  'Exact approved card and lore revisions available',
  'Complete payload includes exact approved card/lore and baseline',
  'Repeated preview is deterministic',
  'Budget refusal retains all author inputs without truncation',
  'Stale selection is retained for explicit correction',
  'External prompt edit refuses stale Save and retains draft',
  'Explicit reload retains externally extended baseline',
  'Project close/reopen retains baseline override removal',
  'Prompt and context operations preserve every game source',
 },
 2: {
  'Process reopen preserves confirmed baseline restore',
  'Process reopen displays actual installed baseline',
  'Reopened preview includes effective baseline',
  'Prompt and context operations preserve every game source',
 },
}
def validate_report(report, phase):
 if not isinstance(report,dict) or report.get('case')!='prompt-context' or report.get('passed') is not True or report.get('cleanupComplete') is not True:
  raise ValueError('Missing successful cleaned prompt/context report')
 details=report.get('details',{})
 checks=details.get('checks')
 if details.get('stage')!='complete' or details.get('passed') is not True or not isinstance(checks,list) or not PHASE_CHECKS[phase].issubset(set(checks)):
  raise ValueError('Missing required prompt/context results; zero or partial cases cannot pass')
