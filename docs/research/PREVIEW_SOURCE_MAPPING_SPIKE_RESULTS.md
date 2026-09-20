# Preview and source-mapping spike results

**Status:** Complete bounded fidelity checkpoint<br>
**Runtime baseline:** Ren'Py 8.5.3<br>
**Scope:** Stack-neutral disposable evidence; no production preview architecture

## Question

Can a five-beat editor staging model keep exact navigation to authoritative `.rpy`
bytes while clearly distinguishing faithful static representation, approximate visual
staging, and behavior that only the official Ren'Py runtime can establish?

## Success criteria

- Five deterministic beats cover plain dialogue, a scene transition, ATL/transformed
  display, Python-dependent screen state, and media/runtime behavior using only the
  synthetic Crossroads at Sundown corpus.
- Every beat retains a relative file, exact byte range, physical line range, and source
  revision. Re-resolving against changed bytes must reject the stale mapping.
- Visual-list, embedded-preview, and timeline claims are classified independently as
  `faithful`, `approximate`, or `runtime-only`, each with an explicit limitation.
- Source selection maps to the narrowest known beat. Overlapping candidates are
  returned as ambiguous rather than guessed.
- Relative runtime diagnostics map back to exact physical source ranges. Absolute,
  escaping, missing-file, out-of-range, translated, and generated locations are
  rejected or marked runtime-only without exposing an absolute project path.
- Static mapping never imports or executes project Python and returns the original
  source bytes unchanged.
- The existing explicitly trusted Ren'Py 8.5.3 integration remains the runtime
  authority. Static unit evidence must not be reported as a Windows or macOS runtime
  result; target runtime comparison stays open for the later SDK integration gate.

## Planned experiment boundary

The smallest useful probe is a dependency-free Python module beside the disposable
lossless-source spike. It will resolve declarative beat anchors against exact fixture
bytes, exercise selection and diagnostic navigation, and emit a bounded JSON evidence
record. It will not render Ren'Py, interpret Python expressions, synthesize runnable
source, or add a production preview UI.

## Results

### Static source and staging evidence

The dependency-free probe resolves these claims without importing or executing any
project Python:

| Beat | Exact source | Visual list | Embedded preview | Timeline |
| --- | --- | --- | --- | --- |
| Literal dialogue | `game/testcases.rpy:9` | Faithful for literal speaker token and bytes | Approximate: Ren'Py owns font metrics, text tags, interpolation, and layout | Faithful for declared order only |
| Scene plus dissolve | `game/testcases.rpy:5-6` | Faithful statement/order mapping | Approximate: a solid can be staged, but transition timing/easing is engine-owned | Approximate: declared transition has no authoritative rendered duration |
| Named ATL transform use | `game/testcases.rpy:7` | Faithful statement/range mapping | Approximate: illustrative offsets are not ATL execution | Approximate: segments can be listed but interpolation is not simulated |
| Python-dependent screen | `game/screens/route_status.rpy:1-11` | Approximate partial structure; expressions remain opaque | Runtime-only for interpolation, conditionals, styles, and evaluation | Runtime-only because changes depend on runtime state |
| Media commands | `micro/valid/media_and_atl.rpy:7-15` | Faithful commands/channels/order | Runtime-only for decode, playback, movie display, channel policy, and fades | Runtime-only for duration and synchronization |

Command:

```bash
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 spikes/lossless-source/preview_probe.py
```

Result: 19/19 combined lossless-source/preview tests passed, including seven new
mapping tests. The five beats resolved in 0.652 ms in the recorded local Linux run.
Each record contains only a project-relative path, exact byte/line span, complete
SHA-256 source revision, per-surface fidelity labels, and limitations. Tests prove
unchanged source bytes, stale-revision rejection, unique-narrowest selection,
ambiguous equal-span reporting, exact relative diagnostic mapping, and denial of
absolute, escaping, missing, out-of-range, translated, and generated locations.

The emitted JSON states `projectPythonExecuted:false`; inspection remains separate
from the explicit runtime trust boundary. This is unit/static evidence and does not
claim an OS WebView result.

### Official runtime comparison

[SDK run 34723797776](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34723797776)
restored the already pinned archive from cache, downloaded the official checksum
metadata again, and verified SHA-256 before extraction. On GitHub-hosted x86-64 Linux,
Ren'Py `8.5.3.26051504` compiled and linted the copied synthetic project, then passed
two testcases and six assertions. The new `preview_mapping` runtime case took 0.147 s
and established that Ren'Py could execute the mapped scene/dissolve, named transform,
screen, literal dialogue, and `fixture_route_bonus` state transition. The enclosing
test command took 6.347 s and exited 0.

That runtime pass validates the deliberate boundary: the editor can map declarations
and stage approximations, while Ren'Py remains authoritative for screen evaluation,
ATL/transition behavior, and Python-driven state. The media microfixture deliberately
references absent synthetic assets and was not put into the runnable game, so decode,
playback quality, timing, and platform codec behavior remain runtime-only rather than
being inferred from compilation.

## Failures and retained artifacts

The first local mapping test used line 4 for the existing `with fade` diagnostic
fixture; exact mapping correctly returned the scene line. The test was corrected to
line 5 before publication. This was a test expectation defect, not a source-mapping
failure.

Run 34723797776 retained its bounded JSON SDK report for seven days. Source mappings
are reproducible from committed fixture bytes and the complete hashes emitted by the
probe, so no machine-specific path, SDK, screenshot, media, or generated project was
retained.

## Limitations and conclusion

- The static implementation is declarative disposable evidence, not a general Ren'Py
  parser, renderer, timeline engine, or production source-mapping service.
- The runtime comparison is Linux x86-64 only. It establishes the fidelity boundary,
  not Windows/macOS rendering or launch behavior; those remain explicit work in the
  next target SDK/secure-install checkpoint.
- No pixel screenshot, font rasterization, audio/video decode, input timing, or
  accessibility comparison was attempted. Those cannot be called faithful from this
  evidence.
- Translation and generated/runtime locations stay runtime-only until a later adapter
  can relate them to an exact authoritative source revision without guessing.

The checkpoint closes with `.rpy` bytes authoritative: literal declarations and exact
navigation can be faithful; editor-native staging is approximate where engine layout
or timing matters; Python, screens, media decode, and runtime-generated behavior are
runtime-only. This result does not select a desktop stack.
