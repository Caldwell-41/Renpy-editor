"""Qualification-only native Keychain seam; no secret CLI, export or fallback."""
import ctypes as C
from contextlib import contextmanager
import json
from pathlib import Path
import sys
import uuid

from contract import Refused

SERVICE = "app.loomlight.desktop.ai.test"
ORIGIN = "http://192.168.1.13:8888"
REFERENCE = Path(".toolchains/reports/provider-qualification/credential-reference.json")


class Keychain:
    def __init__(self):
        if sys.platform != "darwin":
            raise Refused("credential_store_unavailable")
        self.cf = C.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
        self.sec = C.CDLL("/System/Library/Frameworks/Security.framework/Security")
        signatures = {
            "CFStringCreateWithCString": ([C.c_void_p, C.c_char_p, C.c_uint32], C.c_void_p),
            "CFDataCreate": ([C.c_void_p, C.c_void_p, C.c_long], C.c_void_p),
            "CFDataGetLength": ([C.c_void_p], C.c_long),
            "CFDataGetBytePtr": ([C.c_void_p], C.c_void_p),
            "CFDataGetTypeID": ([], C.c_ulong),
            "CFGetTypeID": ([C.c_void_p], C.c_ulong),
            "CFDictionaryCreateMutable": ([C.c_void_p, C.c_long, C.c_void_p, C.c_void_p], C.c_void_p),
            "CFDictionarySetValue": ([C.c_void_p, C.c_void_p, C.c_void_p], None),
            "CFRelease": ([C.c_void_p], None),
        }
        for name, (args, result) in signatures.items():
            f = getattr(self.cf, name)
            f.argtypes, f.restype = args, result
        for name in ("SecItemAdd", "SecItemCopyMatching"):
            f = getattr(self.sec, name)
            f.argtypes, f.restype = [C.c_void_p, C.POINTER(C.c_void_p)], C.c_int32
        self.sec.SecItemDelete.argtypes = [C.c_void_p]
        self.sec.SecItemDelete.restype = C.c_int32

    def constant(self, name):
        library = self.cf if name.startswith("kCF") else self.sec
        return C.c_void_p.in_dll(library, name).value

    @contextmanager
    def query(self, account, *, data=None, read=False):
        owned = []
        key_callbacks = C.addressof(C.c_byte.in_dll(self.cf, "kCFTypeDictionaryKeyCallBacks"))
        value_callbacks = C.addressof(C.c_byte.in_dll(self.cf, "kCFTypeDictionaryValueCallBacks"))
        d = self.cf.CFDictionaryCreateMutable(None, 0, key_callbacks, value_callbacks)
        if not d:
            raise Refused("credential_store_unavailable")
        try:
            def string(s):
                p = self.cf.CFStringCreateWithCString(None, s.encode("utf-8"), 0x08000100)
                if not p:
                    raise Refused("credential_store_unavailable")
                owned.append(p)
                return p

            def put(k, v):
                self.cf.CFDictionarySetValue(d, self.constant(k), v)

            put("kSecClass", self.constant("kSecClassGenericPassword"))
            put("kSecAttrService", string(SERVICE))
            put("kSecAttrAccount", string(account))
            put("kSecAttrSynchronizable", self.constant("kCFBooleanFalse"))
            if data is not None:
                p = self.cf.CFDataCreate(None, data, len(data))
                if not p:
                    raise Refused("credential_store_unavailable")
                owned.append(p)
                put("kSecValueData", p)
                put("kSecAttrLabel", string("Loomlight Studio synthetic qualification"))
            if read:
                put("kSecReturnData", self.constant("kCFBooleanTrue"))
                put("kSecMatchLimit", self.constant("kSecMatchLimitOne"))
            yield d
        finally:
            self.cf.CFRelease(d)
            for p in owned:
                self.cf.CFRelease(p)

    def read(self, account):
        result = C.c_void_p()
        with self.query(account, read=True) as q:
            status = self.sec.SecItemCopyMatching(q, C.byref(result))
        if status == -25300:
            return None
        if status != 0 or not result.value:
            raise Refused("credential_store_read_unavailable")
        try:
            if self.cf.CFGetTypeID(result) != self.cf.CFDataGetTypeID():
                raise Refused("credential_store_invalid")
            n = self.cf.CFDataGetLength(result)
            if not 0 < n <= 4096:
                raise Refused("credential_store_invalid")
            try:
                return C.string_at(self.cf.CFDataGetBytePtr(result), n).decode("utf-8")
            except UnicodeError:
                raise Refused("credential_store_invalid") from None
        finally:
            self.cf.CFRelease(result)

    def add(self, account, key):
        with self.query(account, data=key.encode("utf-8")) as q:
            if self.sec.SecItemAdd(q, None) != 0:
                raise Refused("credential_store_write_unavailable")

    def delete(self, account):
        with self.query(account) as q:
            if self.sec.SecItemDelete(q) not in (0, -25300):
                raise Refused("credential_store_cleanup_unavailable")


def valid_key(key):
    if not isinstance(key, str) or not 0 < len(key) <= 4096 or any(ord(c) <= 32 or ord(c) >= 127 for c in key):
        raise Refused("credential_entry_invalid")
    return key


def account_for(ref):
    if (not isinstance(ref, dict) or set(ref) != {"version", "origin", "service", "profile_id", "credential_id"}
            or type(ref["version"]) is not int or ref["version"] != 1
            or ref["origin"] != ORIGIN or ref["service"] != SERVICE):
        raise Refused("credential_reference_invalid")
    try:
        ids = [str(uuid.UUID(ref[k])) for k in ("profile_id", "credential_id")]
    except (ValueError, TypeError, AttributeError):
        raise Refused("credential_reference_invalid") from None
    if ids != [ref["profile_id"], ref["credential_id"]]:
        raise Refused("credential_reference_invalid")
    return "provider/" + ids[0] + "/qualification/" + ids[1]


class CredentialSetupFailure(Refused):
    """Primary fixed category plus nonsecret cleanup state; never raw exceptions."""
    def __init__(self, category, *, cleanup_pending):
        super().__init__(category)
        self.cleanup_pending = cleanup_pending


def cleanup_pending(store=None):
    """One explicitly selected cleanup attempt. Never called by entry/startup."""
    from contract import strict_json
    pending = REFERENCE.with_suffix(".pending")
    if not pending.exists():
        return False
    if REFERENCE.exists():
        raise Refused("credential_cleanup_reference_conflict")
    try:
        ref = strict_json(pending.read_bytes(), limit=4096)
    except OSError:
        raise Refused("credential_reference_read_unavailable") from None
    account = account_for(ref)  # Refuse foreign/malformed state before native access.
    try:
        store = store if store is not None else Keychain()
        store.delete(account)
    except Exception:
        raise Refused("credential_store_cleanup_unavailable") from None
    try:
        pending.unlink()
    except OSError:
        raise Refused("credential_cleanup_reference_unavailable") from None
    return True


def qualification_key(enter, store=None):
    """Native Remember click is required on initial entry; subsequent runs reuse it."""
    from contract import strict_json
    pending = REFERENCE.with_suffix(".pending")
    if pending.exists():
        raise Refused("credential_cleanup_pending")
    if REFERENCE.exists():
        try:
            ref = strict_json(REFERENCE.read_bytes(), limit=4096)
        except OSError:
            raise Refused("credential_reference_read_unavailable") from None
        account = account_for(ref)
        try:
            store = store if store is not None else Keychain()
            key = store.read(account)
        except Refused:
            raise
        except Exception:
            raise Refused("credential_store_read_unavailable") from None
        if key is None:
            raise Refused("credential_missing_no_automatic_reentry")
        return valid_key(key)
    key = valid_key(enter())
    ref = {"version": 1, "origin": ORIGIN, "service": SERVICE,
           "profile_id": str(uuid.uuid4()), "credential_id": str(uuid.uuid4())}
    account = account_for(ref)
    try:
        REFERENCE.parent.mkdir(parents=True, exist_ok=True)
        with pending.open("x", encoding="utf-8") as record:
            record.write(json.dumps(ref, indent=2) + "\n")
    except OSError:
        # No Keychain write occurs unless the owned cleanup identity was saved.
        raise Refused("credential_reference_stage_unavailable") from None
    category = "credential_store_write_unavailable"
    try:
        store = store if store is not None else Keychain()
        store.add(account, key)
        category = "credential_store_roundtrip_failed"
        if store.read(account) != key:
            raise Refused("credential_store_roundtrip_failed")
        category = "credential_reference_publish_unavailable"
        pending.replace(REFERENCE)
    except Exception as exc:
        if isinstance(exc, Refused):
            category = str(exc)
        try:
            # Keep the saved identity until deletion AND record removal succeed.
            if store is None:
                raise Refused("credential_store_unavailable")
            store.delete(account)
            pending.unlink()
        except Exception:
            raise CredentialSetupFailure(category, cleanup_pending=True) from None
        raise CredentialSetupFailure(category, cleanup_pending=False) from None
    return key
