"""Reject missing, failed, zero, partial or unclean first-rewrite native evidence."""
PHASE_CHECKS={1:{
 'Exact approved references available','Preparation writes nothing',
 'Complete reviewed body contains selected revisions custom prompt and strict schema',
 'Destination locality and conservative size disclosed',
 'Native light send layout observed','Native dark send layout observed','Native compact send layout observed',
 'Physical Generate produces inert review with no writes',
 'Semantic and exact source diff are inert and disclose protected tokens',
 'Physical acceptance saves once and blocks duplicate click',
 'Accepted source encodes generated expressions and action tags literally',
 'Unrelated and custom source preserved','One Undo restores exact prior source','Redo restores exact accepted source',
 'Malformed response writes nothing and retains task','Unsafe token response writes nothing',
 'Cancelled response writes nothing and retains task','Fresh valid proposal available after refusal and cancellation',
 'Stale external source refuses acceptance with zero writes','Project reopen retains accepted source',
},2:{'Process reopen retains accepted literal source and protected tokens','Process reopen retains custom prompt','Process reopen retains native credential readability'}}
CONTINUE_CHECKS={phase:set(checks) for phase,checks in PHASE_CHECKS.items()}
CONTINUE_CHECKS[1].remove('Semantic and exact source diff are inert and disclose protected tokens')
CONTINUE_CHECKS[1].remove('Unsafe token response writes nothing')
CONTINUE_CHECKS[1].update({'Whole group and exact source diff are inert and disclose anchor and terminal','Unsafe group response writes nothing','Surrounding source is byte exact across group insertion','Core group IDs are new and all existing Beats terminal and payloads survive'})
CONTINUE_CHECKS[2].remove('Process reopen retains accepted literal source and protected tokens')
CONTINUE_CHECKS[2].add('Process reopen retains accepted group and existing terminal')
DRAFT_CHECKS={phase:set(checks) for phase,checks in CONTINUE_CHECKS.items()}
DRAFT_CHECKS[1]-={'Whole group and exact source diff are inert and disclose anchor and terminal','Surrounding source is byte exact across group insertion','Core group IDs are new and all existing Beats terminal and payloads survive'}
DRAFT_CHECKS[1]|={'Whole Scene and exact source metadata diff are inert and disclose Chapter title and Return','All existing source is byte exact across Scene creation','Core Scene Beat IDs path and explicit Return survive'}
DRAFT_CHECKS[2].remove('Process reopen retains accepted group and existing terminal')
DRAFT_CHECKS[2].add('Process reopen retains accepted Scene and explicit Return')
CARD_CHECKS={1:{
 'Exact approved references available','Preparation writes nothing',
 'Complete reviewed body contains selected revisions custom prompt and strict schema',
 'Destination locality and conservative size disclosed','Native light send layout observed',
 'Native dark send layout observed','Native compact send layout observed',
 'Physical Generate produces inert review with no writes','Card fields provenance and exact metadata review are passive',
 'Physical acceptance saves once and blocks duplicate click','Core card revision and exact prepared metadata survive',
 'Acceptance saves proposed text and preserves approved revision','All runnable source is byte exact',
 'One Undo restores exact prior library','Redo restores exact proposed metadata',
 'Proposed form requires separate explicit approval','Physical approval explicitly replaces prior approved revision',
 'Approval Undo restores prior approved text','Approval Redo restores exact approved revision',
 'Malformed response writes nothing and retains task','Model approval response writes nothing',
 'Cancelled response writes nothing and retains task','Fresh valid proposal available after refusal and cancellation',
 'Stale external source refuses acceptance with zero writes','Project reopen retains exact approved card',
},2:{'Process reopen retains approved card and exact revision','Process reopen retains custom prompt','Process reopen retains native credential readability'}}
LORE_CHECKS={phase:{name.replace('Card fields','Lore fields').replace('Core card','Core lore').replace('approved card','approved lore entry') for name in checks} for phase,checks in CARD_CHECKS.items()}
LORE_CHECKS[1].add('Physical Close after successful save dismisses retained review without changing saved metadata')
def validate_report(report,phase,continuing=False,drafting=False,card=False,lore=False):
 if not isinstance(report,dict) or report.get('case')!='dialogue-rewrite' or report.get('passed') is not True or report.get('cleanupComplete') is not True:raise ValueError('Missing successful cleaned rewrite report')
 d=report.get('details',{})
 if lore and d.get('action')!='generateLore':raise ValueError('Generated lore action evidence required')
 if card and d.get('action')!='generateCard':raise ValueError('Generated card action evidence required')
 if drafting and d.get('action')!='draftScene':raise ValueError('Draft Scene action evidence required')
 if continuing and d.get('action')!='continueScene':raise ValueError('Continue Scene action evidence required')
 if d.get('stage')!='complete' or d.get('passed') is not True or not isinstance(d.get('checks'),list) or not (LORE_CHECKS if lore else CARD_CHECKS if card else DRAFT_CHECKS if drafting else CONTINUE_CHECKS if continuing else PHASE_CHECKS)[phase].issubset(set(d['checks'])):raise ValueError('Required rewrite results missing; partial/zero cannot pass')
 if phase==1:
  hashes=d.get('reviewedBodyDigests')
  if not isinstance(hashes,list) or len(hashes)!=5 or any(not isinstance(v,str) or len(v)!=64 for v in hashes):raise ValueError('Five exact reviewed body digests required')
