# Variables comparison

Both versions are unapproved drafts. They use the same fictional definitions for
The Last Tram, the production fonts, colours and icons, and the same browser-only
editing model.

- [Definition ledger](http://127.0.0.1:5174/?screen=variables&variant=ledger&state=populated&theme=light&viewport=wide)
  keeps a compact list beside the selected default and known assignments. It suits
  checking several definitions while editing. At compact widths the editor fills
  the workspace; Close editor returns to the list without losing a draft.
- [Definition notebook](http://127.0.0.1:5174/?screen=variables&variant=notebook&state=populated&theme=light&viewport=wide)
  groups cards into Boolean, Integer and Text columns. Selecting a card opens a full-width
  editor with assignments beside it. It gives long text more space, with an extra
  return to the collection when switching variables.

Search and the type filter narrow the collection. New variable opens a definition
form. Existing name and type stay fixed; editing changes only the default. Each
variable keeps its unsaved draft when the editor closes or another variable opens.
Cancel editing asks before discarding changed input. Leaving the page asks before
resetting unsaved sample changes. Save reports progress, success or a retained
failure. The error scenario fails the next save once, then permits retry.

Boolean uses explicit True/False options. Integer validates canonical signed 64-bit
decimal text without converting through JavaScript Number. Text allows empty and
long content. Creation normalises technical names to lowercase, checks the naming
format and rejects duplicate fictional variable names.

The assignment list supports finding the story context. It states that only known
Set Variable beats appear and excludes custom code. Declaration source stays in a
closed disclosure because most edits need only the default. There is no runtime
value tracker, deletion, renaming or type conversion.

All changes stay in this mounted preview and reset on reload. Story links open the
Story mockup; they do not locate or edit a real beat. Declaration paths and lines
are fictional. There is no source write, project access, native operation or model
request. Validation models the inspected frontend contract, not every backend
project-wide namespace rule.

## Verification

Local TypeScript checking and the focused browser runner pass on the pinned Mac
toolchain with Chromium 155.0.8059.85. The runner covers all 32 combinations of two
layouts, four states, two themes and two viewports, with no browser errors or
horizontal document overflow. Both layouts pass the same interaction journey for
search/filtering, retained independent drafts, discard/cancel, Boolean and text
defaults, exact signed 64-bit boundaries, invalid integers, naming/duplicate checks,
all three creation types, save failure/retry, the dirty Story navigation guard,
empty creation cancellation and compact long content.

Visual inspection covers both layouts in light/dark at 1100 × 720 and 560 × 640,
plus the notebook's wide long-text editor and compact retained failure, the
ledger's compact long-text editor and both empty states. Temporary captures and the
report are under ignored `.toolchains/design-lab/pages/variables/`.

The initial browser launch hit the sandbox's Chromium Mach port restriction;
the authorised local run continued outside that restriction. Its initial rendering
matrix passed, then the interaction check stopped because it asked for a textbox
instead of the search input's searchbox role. Repair 1 corrected the check and
passed the matrix and interactions. Visual review arranged the notebook into type
columns, allowed its empty message to span those columns and corrected the error
border to use the production error token. Repair 2 passes all 32 rendering cases
and both interaction journeys against those final presentation changes. Cumulative
use is one initial cycle and two focused repairs, with one environment-blocked
launch, one check failure and two passing browser runs. No approval or app
integration is part of this comparison.
