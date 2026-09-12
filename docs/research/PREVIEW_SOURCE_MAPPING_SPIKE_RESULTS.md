# Preview and source-mapping spike results

**Status:** In progress<br>
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

Implementation and measurements are pending.
