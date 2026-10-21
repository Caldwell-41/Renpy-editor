# New project comparison

Two unapproved browser drafts share one fictional setup and creation model.
Open [Paced wizard](http://127.0.0.1:5174/?screen=new-project&variant=paced&state=populated&theme=light&viewport=wide)
or [Setup sheet](http://127.0.0.1:5174/?screen=new-project&variant=sheet&state=populated&theme=light&viewport=wide).
The lab offers light/dark themes, wide/compact sizes and details, empty, long, review
and retained-error samples. Reset starts again with fresh fictional data.

## What differs

Paced wizard presents four short steps. Its step rail makes progress explicit, Back
preserves entered values and the details step has a small live project summary.
Compact screens place the steps above the form. The primary action stays in the
same footer while the content scrolls.

Setup sheet puts project details, SDK and game configuration in one scrolling form.
Numbered sections divide the decisions. A sticky summary lets a writer compare the
current title, destination and configuration while editing at wide sizes. Review
opens a separate check before creation. At compact sizes the form uses one column;
the same full facts remain on Review.

Both preserve the same content and capabilities. Sheet replaces sequential Continue
steps with Review project; its Edit controls return to the relevant form section.
No product capability is removed. SDK cancellation and sample outcome controls are
prototype review tools, not a promise of new native cancellation support.

## Capability and control map

| Control | Purpose and observable sample behaviour |
| --- | --- |
| Game title | Sets the visible game name and generates the folder name until the folder is edited independently. Empty/control-character/over-160-byte titles are refused. |
| Folder name | Keeps manual naming separate from the game title. Applies the current portable ASCII naming rules, 80-character limit and reserved Windows names. `existing-story` demonstrates an occupied destination. |
| Choose sample folder | Opens an explicit fictional location list. Cancel retains the previous choice. The final destination wraps and updates with folder edits. No actual path authority is granted. |
| SDK radio choices | Select a compatible 8.5.3 SDK. A single compatible default starts selected in populated samples. Incompatible sample versions remain visible and disabled. |
| Browse sample SDKs | Opens a fictional compatible/incompatible SDK list. Cancel retains selection. Selecting 8.4.1 explains incompatibility and clears the active SDK. |
| Install sample 8.5.3 | Simulates download bytes, checksum verification, extraction and ready states. Cancel stops the browser timer and keeps the form and earlier SDK selection. A checksum failure stops before extraction. |
| Resolution preset | Preserves Full HD 1920 × 1080, HD 1280 × 720, QHD 2560 × 1440 and Custom. Full HD is the default. The readable selector is 48 pixels high. |
| Custom Width/Height | Accepts even dimensions within 640 × 360 to 7680 × 4320. Invalid/incomplete inputs hide the ratio rectangle and show local errors. Valid inputs draw a proportionally correct bounded preview and reduced aspect ratio. |
| Advanced / Git checkbox | Preserves the checked default and the writer's choice. Review always shows whether initialization is selected. No Git operation occurs. |
| Back, step rail, Edit | Preserve all setup values. Earlier wizard steps can be revisited; Review has explicit edit links. The sheet's links focus the relevant form section. |
| Review / Create sample project | Validate first, then show the same title, exact fictional destination, SDK, resolution and Git choice. Creation has indeterminate stages rather than a made-up overall percentage. Duplicate creation is disabled while busy. |
| Back to review after failure | Restores the complete retained form after a simulated validation failure. The separate created-but-not-opened result offers Open sample workspace and never offers another Create action. |
| Back to home / Open sample workspace | Navigate only to browser mockups. Leaving edited setup asks whether to keep editing. |
| Try a sample outcome | Secondary lab-only control chooses successful creation, SDK checksum mismatch, creation failure or created-but-not-opened. It makes error review repeatable without adding product settings. |

## Boundary and design authority

All names, locations, SDKs, byte counts and results are fictional browser data.
The preview performs no directory selection, filesystem validation, SDK discovery,
download, checksum calculation, installation, Git initialization, project creation,
Ren'Py execution, provider/model request or native operation. Success offers an
explicit browser navigation so reviewers can inspect the result before leaving.
Progress timings and download bytes are labelled illustrations.

The source contract comes from `resetWizard`, `renderDetails`, `renderSdk`,
`renderConfiguration`, `renderReview` and `createProject` in the existing renderer,
plus title/folder/destination rules in the lifecycle service. Earlier
[four-step](../ui-refresh/new-project-four-steps.png),
[resolution](../ui-refresh/game-configuration-resolution-picker.png) and
[progress](../ui-refresh/new-project-progress.png) references and their written
corrections remain intact. These drafts import the production palette, fonts and
icon family. They do not promote or replace an approved reference.

## Verification

The chosen evidence host is the local Mac with the pinned repository toolchain.
Run `node design-lab/check-screen.mjs new-project` from `app/` after sourcing
`../.toolchains/enter-macos.sh`. The focused module exercises both layouts through
independent folder edits, naming errors, fictional location cancellation, SDK
incompatibility/cancellation/checksum failure/retry, portrait and 4:3 previews,
invalid/empty dimensions, retained review edits, the Git default, leaving-draft
guard, creation failure, created-but-not-opened and success. The runner covers
40 rendering cases across both themes and sizes. Reports and temporary captures
belong under ignored `.toolchains/design-lab/pages/new-project/`.

Initial typing passes. The sandbox launch failed at Chromium's macOS Mach-port
registration, before browser cases ran; the authorised local retry reached all
40 rendering cases. Its focused journey then failed because SDK choice buttons
included their detail text in the accessible name. Each button now has a precise
accessible action name. The initial failure and sandbox refusal remain in separate
ignored reports. Focused repair cycle 1 passed all 40 cases and both journeys.
Visual inspection then found a resolved dimension error still shown in the footer
and a duplicate Review heading in the sheet. The second focused repair clears the
old error when setup changes and removes the repeated heading. Source review also
matched Unicode control-character validation to the lifecycle title contract;
the focused check now covers that rule and the UTF-8 byte limit. Repair cycle 2
passes typing, all 40 rendered cases and both interaction journeys on Node 24.19.0
and Chromium 155.0.8059.85. The earlier passing report remains saved separately.

Visual review covered each layout in light/dark at 1100 × 720 and 560 × 640,
plus the long destination/title, custom ratio, checksum failure, Review and retained
creation-error states. Fixed footer actions remain reachable while content scrolls.
The final sheet Review captures omit the duplicate heading. Temporary captures and
reports remain ignored; no approved capture or approval entry was changed.

Cumulative use is one initial browser cycle and two focused repair cycles, plus the
sandbox-blocked launch and supplementary visual captures. The final page-owned
allowance is complete. Combined registry/approval/source/build checks belong to the
parent's full-app integration pass. Both drafts remain local, uncommitted and
unapproved. No native window, real project, package, CI, commit or push operation
occurred.
