# Windows hidden GPU capability

This disposable probe answers whether the pinned Ren'Py 8.5.3 GL2 renderer works
on a private Windows desktop that the owner never switches into view. Production
still uses its existing adapter. [Issue #36](https://github.com/Caldwell-41/Renpy-editor/issues/36)
owns the selected integration scope and cumulative allowance.

The native owner starts a focus sentinel on the disposable CI input desktop,
creates a separate desktop, and starts the helper suspended there. It attaches a
kill-on-close job before resuming. The helper independently verifies that its
desktop matches the owner's name and differs from the input desktop. No desktop
switch, ACL change or signing-policy change occurs.

The probe derives its renderer from the Loomlight-owned data-only renderer with
checked substitutions for GL2 export and cooperative stop. It loads only a
synthetic composition and the pinned SDK font. One SDK launch requests four
frames at two aspects and normal/hover, then writes a stop request. Passing
requires its acknowledgment, exit 0 and an empty job without forced termination.
A second SDK launch exercises explicit bootstrap refusal and requires exit 72.
Both cases require zero observed foreground/focus changes or helper windows on
the input desktop, successful inventories and closed native resources.

Native sampling is bounded and reports its largest gap. It does not prove
physical keyboard input, continuous observation, matched source fidelity,
packaged app behavior or production lifecycle integration. Windows windows may
exist on the private desktop; they must never appear on the input desktop.

Run `python3 spikes/canvas-gpu/probe.py --check` for portable generation and
rejecting receipt checks. The `Canvas GPU capability` workflow owns the Windows
compiler and two SDK runs. It admits only the selected branch, exact candidate,
attempt 1 and cumulative CI ordinal 7. Artifacts retain partial failures and
cleanup results after a privacy scan. Do not infer a pass from a dispatched run.

The OS mechanism uses documented [CreateDesktopW](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdesktopw)
and [STARTUPINFOW.lpDesktop](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/ns-processthreadsapi-startupinfow).
The owner requests create/read/write/enumerate rights, without
[desktop-switch rights](https://learn.microsoft.com/en-us/windows/win32/winstation/desktop-security-and-access-rights).
