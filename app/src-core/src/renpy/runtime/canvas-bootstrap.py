"""Trusted, pinned-SDK canvas bootstrap. Never imports project Python."""
import ctypes
import json
import os
import sys

_callbacks = []
_native_status = None


def refuse(root, stage):
    try:
        with open(os.path.join(root, "startup-refusal.json"), "w") as output:
            json.dump({"refused": True, "stage": stage}, output)
    finally:
        # Avoid Ren'Py's graphical exception handler, including bootstrap failures.
        os._exit(72)


def windows_api():
    from ctypes import wintypes as w
    user = ctypes.WinDLL("user32", use_last_error=True)
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    for name, args, result in (
        ("GetThreadDesktop", [w.DWORD], w.HANDLE),
        ("CloseDesktop", [w.HANDLE], w.BOOL),
        ("OpenInputDesktop", [w.DWORD, w.BOOL, w.DWORD], w.HANDLE),
        ("GetUserObjectInformationW", [w.HANDLE, ctypes.c_int, w.LPVOID, w.DWORD, ctypes.POINTER(w.DWORD)], w.BOOL),
    ):
        function = getattr(user, name)
        function.argtypes, function.restype = args, result
    kernel.GetCurrentThreadId.restype = w.DWORD

    def name(handle):
        value = ctypes.create_unicode_buffer(256)
        needed = w.DWORD()
        if not handle or not user.GetUserObjectInformationW(handle, 2, value, ctypes.sizeof(value), ctypes.byref(needed)):
            raise RuntimeError("Desktop identity unavailable")
        return value.value
    return user, kernel, name


def mac_install():
    # Use the SDK's ctypes and system Objective-C runtime. No additional executable,
    # unsigned plug-in, project module or signing-policy exception is needed.
    ctypes.CDLL("/System/Library/Frameworks/AppKit.framework/AppKit")
    objc = ctypes.CDLL("/usr/lib/libobjc.A.dylib")
    pointer = ctypes.c_void_p
    objc.objc_getClass.argtypes, objc.objc_getClass.restype = [ctypes.c_char_p], pointer
    objc.sel_registerName.argtypes, objc.sel_registerName.restype = [ctypes.c_char_p], pointer
    objc.class_getInstanceMethod.argtypes, objc.class_getInstanceMethod.restype = [pointer, pointer], pointer
    objc.method_getTypeEncoding.argtypes, objc.method_getTypeEncoding.restype = [pointer], ctypes.c_char_p
    objc.class_addMethod.argtypes, objc.class_addMethod.restype = [pointer, pointer, pointer, ctypes.c_char_p], ctypes.c_byte
    objc.class_replaceMethod.argtypes, objc.class_replaceMethod.restype = [pointer, pointer, pointer, ctypes.c_char_p], pointer

    def send(receiver, name, result=pointer, arguments=(), values=()):
        call = ctypes.CFUNCTYPE(result, pointer, pointer, *arguments)(("objc_msgSend", objc))
        return call(receiver, objc.sel_registerName(name.encode()), *values)

    cls = objc.objc_getClass(b"SDLWindow")
    app = send(objc.objc_getClass(b"NSApplication"), "sharedApplication")
    if not send(objc.objc_getClass(b"NSThread"), "isMainThread", ctypes.c_byte):
        raise RuntimeError("Main thread required")
    if not cls or not send(cls, "isSubclassOfClass:", ctypes.c_byte, (pointer,), (objc.objc_getClass(b"NSWindow"),)):
        raise RuntimeError("Pinned SDLWindow required")
    if send(send(app, "windows"), "count", ctypes.c_ulong):
        raise RuntimeError("Window created before guard")
    if send(app, "activationPolicy", ctypes.c_long) != 2:
        send(app, "setActivationPolicy:", ctypes.c_byte, (ctypes.c_long,), (2,))
    if send(app, "activationPolicy", ctypes.c_long) != 2:
        raise RuntimeError("Background activation policy required")

    blocked = [0]

    def suppress(*args):
        blocked[0] += 1

    for name, result, args, implementation in (
        ("makeKeyAndOrderFront:", None, (pointer,), suppress),
        ("orderFront:", None, (pointer,), suppress),
        ("orderFrontRegardless", None, (), suppress),
        ("orderWindow:relativeTo:", None, (ctypes.c_long, ctypes.c_long), suppress),
        ("makeKeyWindow", None, (), suppress),
        ("makeMainWindow", None, (), suppress),
        ("canBecomeKeyWindow", ctypes.c_byte, (), lambda *args: 0),
        ("canBecomeMainWindow", ctypes.c_byte, (), lambda *args: 0),
    ):
        selector = objc.sel_registerName(name.encode())
        method = objc.class_getInstanceMethod(cls, selector)
        if not method:
            raise RuntimeError("Pinned SDL method missing")
        callback = ctypes.CFUNCTYPE(result, pointer, pointer, *args)(implementation)
        _callbacks.append(callback)  # Objective-C retains function pointers, not Python objects.
        types = objc.method_getTypeEncoding(method)
        if not objc.class_addMethod(cls, selector, callback, types):
            objc.class_replaceMethod(cls, selector, callback, types)

    def status():
        windows = send(app, "windows")
        visible = key = 0
        for i in range(send(windows, "count", ctypes.c_ulong)):
            window = send(windows, "objectAtIndex:", arguments=(ctypes.c_ulong,), values=(i,))
            visible += bool(send(window, "isVisible", ctypes.c_byte))
            key += bool(send(window, "isKeyWindow", ctypes.c_byte))
        active = bool(send(app, "isActive", ctypes.c_byte))
        policy = send(app, "activationPolicy", ctypes.c_long)
        if visible or key or active or policy != 2:
            raise RuntimeError("Hidden helper invariant failed")
        return dict(hidden=True, visibleWindows=visible, keyWindows=key,
                    applicationActive=active, activationPolicy=policy, blockedOrders=blocked[0])
    return status


def install(root):
    global _native_status
    try:
        with open(os.path.join(root, "helper.pid"), "w") as output:
            output.write(str(os.getpid()))
        if os.environ.get("LOOMLIGHT_CANVAS_REFUSE") == "1":
            refuse(root, "selected-refusal")
        if sys.platform == "darwin":
            _native_status = mac_install()
        elif os.name == "nt":
            user, kernel, name = windows_api()
            actual = name(user.GetThreadDesktop(kernel.GetCurrentThreadId()))
            input_desktop = user.OpenInputDesktop(0, False, 1)
            try:
                different = actual != name(input_desktop)
            finally:
                if input_desktop:
                    user.CloseDesktop(input_desktop)
            if not different or actual != os.environ["LOOMLIGHT_CANVAS_DESKTOP"]:
                raise RuntimeError("Private desktop required")
            _native_status = lambda: dict(hidden=True, privateDesktop=True, differsFromInputDesktop=True)
        else:
            raise RuntimeError("Unsupported canvas host")
        return status(root)
    except BaseException:
        refuse(root, "native-bootstrap")


def status(root):
    try:
        return _native_status()
    except BaseException:
        refuse(root, "native-status")
