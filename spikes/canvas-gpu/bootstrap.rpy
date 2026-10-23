# Probe only: the owner creates this desktop and never switches to it.
init -999 python:
    import ctypes as _probe_ctypes
    from ctypes import wintypes as _probe_types
    import json as _probe_json
    import os as _probe_os
    try:
        _probe_user = _probe_ctypes.WinDLL("user32", use_last_error=True)
        _probe_kernel = _probe_ctypes.WinDLL("kernel32", use_last_error=True)
        _probe_kernel.GetCurrentThreadId.restype = _probe_types.DWORD
        _probe_user.GetThreadDesktop.argtypes = [_probe_types.DWORD]
        _probe_user.GetThreadDesktop.restype = _probe_types.HANDLE
        _probe_user.OpenInputDesktop.argtypes = [_probe_types.DWORD, _probe_types.BOOL, _probe_types.DWORD]
        _probe_user.OpenInputDesktop.restype = _probe_types.HANDLE
        _probe_user.CloseDesktop.argtypes = [_probe_types.HANDLE]
        _probe_user.CloseDesktop.restype = _probe_types.BOOL
        _probe_user.GetUserObjectInformationW.argtypes = [_probe_types.HANDLE, _probe_ctypes.c_int, _probe_types.LPVOID, _probe_types.DWORD, _probe_ctypes.POINTER(_probe_types.DWORD)]
        _probe_user.GetUserObjectInformationW.restype = _probe_types.BOOL
        def _probe_desktop_name(handle):
            value = _probe_ctypes.create_unicode_buffer(256)
            needed = _probe_types.DWORD()
            if not handle or not _probe_user.GetUserObjectInformationW(handle, 2, value, _probe_ctypes.sizeof(value), _probe_ctypes.byref(needed)):
                raise RuntimeError("Desktop identity unavailable")
            return value.value
        _probe_actual = _probe_desktop_name(_probe_user.GetThreadDesktop(_probe_kernel.GetCurrentThreadId()))
        _probe_input = _probe_user.OpenInputDesktop(0, False, 1)
        try:
            _probe_input_name = _probe_desktop_name(_probe_input)
        finally:
            if _probe_input:
                _probe_user.CloseDesktop(_probe_input)
        if _probe_actual != _probe_os.environ["LOOMLIGHT_PROBE_DESKTOP"] or _probe_actual == _probe_input_name:
            raise RuntimeError("Private desktop required")
        if _probe_os.environ.get("LOOMLIGHT_PROBE_REFUSE") == "1":
            raise RuntimeError("Selected startup refusal")
        with open(config.basedir + "/desktop.json", "w") as _probe_output:
            _probe_json.dump(dict(privateDesktop=True, differsFromInputDesktop=True), _probe_output)
    except BaseException:
        # Never enter Ren'Py's graphical error handler on bootstrap refusal.
        try:
            with open(config.basedir + "/refusal.json", "w") as _probe_output:
                _probe_json.dump(dict(refused=True), _probe_output)
        finally:
            _probe_os._exit(72)
