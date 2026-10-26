"""Desktop admission and power assertions for packaged Mac UI probes."""
from contextlib import contextmanager
import ctypes
import json
import sys
import time


class MacPower:
    """The CoreGraphics/CoreFoundation/IOKit boundary; no credentials or UI input."""
    def __init__(self):
        self.cf = ctypes.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
        self.cg = ctypes.CDLL('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
        self.io = ctypes.CDLL('/System/Library/Frameworks/IOKit.framework/IOKit')
        self.cf.CFStringCreateWithCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_uint32]
        self.cf.CFStringCreateWithCString.restype = ctypes.c_void_p
        self.cf.CFDictionaryGetValue.argtypes = [ctypes.c_void_p, ctypes.c_void_p]
        self.cf.CFDictionaryGetValue.restype = ctypes.c_void_p
        self.cf.CFGetTypeID.argtypes = [ctypes.c_void_p]
        self.cf.CFGetTypeID.restype = ctypes.c_ulong
        self.cf.CFBooleanGetTypeID.argtypes = []
        self.cf.CFBooleanGetTypeID.restype = ctypes.c_ulong
        self.cf.CFBooleanGetValue.argtypes = [ctypes.c_void_p]
        self.cf.CFBooleanGetValue.restype = ctypes.c_bool
        self.cf.CFRelease.argtypes = [ctypes.c_void_p]
        self.cf.CFRelease.restype = None
        self.cg.CGSessionCopyCurrentDictionary.argtypes = []
        self.cg.CGSessionCopyCurrentDictionary.restype = ctypes.c_void_p
        self.cg.CGMainDisplayID.argtypes = []
        self.cg.CGMainDisplayID.restype = ctypes.c_uint32
        for name in ('CGDisplayIsActive', 'CGDisplayIsAsleep'):
            function = getattr(self.cg, name)
            function.argtypes = [ctypes.c_uint32]
            function.restype = ctypes.c_uint32
        self.io.IOPMAssertionCreateWithName.argtypes = [ctypes.c_void_p, ctypes.c_uint32,
                                                       ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint32)]
        self.io.IOPMAssertionCreateWithName.restype = ctypes.c_int32
        self.io.IOPMAssertionRelease.argtypes = [ctypes.c_uint32]
        self.io.IOPMAssertionRelease.restype = ctypes.c_int32

    def string(self, value):
        result = self.cf.CFStringCreateWithCString(None, value.encode('utf-8'), 0x08000100)
        if not result:
            raise RuntimeError('Cannot create a macOS power/session query')
        return result

    def state(self):
        session = self.cg.CGSessionCopyCurrentDictionary()
        def boolean(key, absent=None):
            if not session:
                return None
            name = self.string(key)
            try:
                value = self.cf.CFDictionaryGetValue(session, name)
                if not value:
                    return absent
                if self.cf.CFGetTypeID(value) != self.cf.CFBooleanGetTypeID():
                    return None
                return bool(self.cf.CFBooleanGetValue(value))
            finally:
                self.cf.CFRelease(name)
        try:
            display = self.cg.CGMainDisplayID()
            active = self.cg.CGDisplayIsActive(display) if display else None
            asleep = self.cg.CGDisplayIsAsleep(display) if display else None
            return dict(onConsole=boolean('kCGSSessionOnConsoleKey'),
                        loginDone=boolean('kCGSessionLoginDoneKey'),
                        # macOS omits this key for an unlocked session.
                        screenLocked=boolean('CGSSessionScreenIsLocked', absent=False),
                        displayActive=bool(active) if active in (0, 1) else None,
                        displayAsleep=bool(asleep) if asleep in (0, 1) else None)
        finally:
            if session:
                self.cf.CFRelease(session)

    def hold(self, kind):
        assertion_type = self.string(kind)
        try:
            reason = self.string('Loomlight native UI probe')
            try:
                identifier = ctypes.c_uint32()
                result = self.io.IOPMAssertionCreateWithName(assertion_type, 255, reason,
                                                            ctypes.byref(identifier))
                if result:
                    raise RuntimeError(f'macOS power assertion failed: {result}')
                return identifier.value
            finally:
                self.cf.CFRelease(reason)
        finally:
            self.cf.CFRelease(assertion_type)

    def release(self, identifier):
        result = self.io.IOPMAssertionRelease(identifier)
        if result:
            raise RuntimeError(f'macOS power assertion release failed: {result}')


def require_desktop(state):
    if not (state.get('onConsole') is True and state.get('loginDone') is True
            and state.get('screenLocked') is False and state.get('displayActive') is True
            and state.get('displayAsleep') is False):
        raise RuntimeError('Native UI probes require an unlocked, awake Mac desktop')


@contextmanager
def native_desktop(receipt_path, *, platform=None, power=None):
    if (platform or sys.platform) != 'darwin':
        yield
        return
    receipt = dict(admitted=False, cleanupComplete=False, samples=[], assertions=[], released=[])
    def sample(phase):
        state = power.state()
        receipt['samples'].append(dict(phase=phase, monotonic=time.monotonic(), **state))
        return state
    try:
        power = power or MacPower()
        require_desktop(sample('before-assertions'))
        for kind in ('PreventUserIdleDisplaySleep', 'PreventUserIdleSystemSleep'):
            receipt['assertions'].append(dict(kind=kind, id=power.hold(kind)))
        require_desktop(sample('before-launch'))
        receipt['admitted'] = True
        yield receipt
    except BaseException as error:
        receipt['failure'] = type(error).__name__
        raise
    finally:
        errors = []
        if power is not None:
            try:
                state = sample('after-child')
                if receipt['admitted']:
                    require_desktop(state)
            except Exception as error:
                errors.append(str(error))
            for assertion in reversed(receipt['assertions']):
                try:
                    power.release(assertion['id'])
                    receipt['released'].append(assertion['id'])
                except Exception as error:
                    errors.append(str(error))
        receipt['cleanupComplete'] = len(receipt['assertions']) == len(receipt['released'])
        receipt['errors'] = errors
        receipt_path.write_text(json.dumps(receipt, indent=2) + '\n')
        if errors:
            raise RuntimeError('; '.join(errors))
