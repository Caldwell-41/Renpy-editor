// Windows-only canvas owner. Core attaches this process to its kill-on-close job
// before resume. The SDK inherits that job and starts on our private desktop.
#define UNICODE
#define _UNICODE
#include <windows.h>
#include <stdio.h>
#include <wchar.h>

int wmain(int argc, wchar_t **argv) {
    if (argc != 7) return 72;
    for (int i = 1; i < argc; i++) if (wcschr(argv[i], L'"')) return 72;
    wchar_t command[32768] = L"", desktop_name[80], receipt_path[32768];
    for (int i = 1; i < argc; i++) {
        if (wcslen(command) + wcslen(argv[i]) + 4 > 32768) return 72;
        if (wcscat_s(command, 32768, L"\"") || wcscat_s(command, 32768, argv[i]) ||
            wcscat_s(command, 32768, L"\" ")) return 72;
    }
    if (wcslen(argv[3]) + 32 >= 32768) return 72;
    HDESK original = GetThreadDesktop(GetCurrentThreadId());
    if (!original) return 72;
    swprintf_s(desktop_name, 80, L"LoomlightCanvas-%lu-%llu", GetCurrentProcessId(), GetTickCount64());
    HDESK desktop = CreateDesktopW(desktop_name, NULL, NULL, 0,
        DESKTOP_CREATEWINDOW | DESKTOP_READOBJECTS | DESKTOP_WRITEOBJECTS | DESKTOP_ENUMERATE, NULL);
    if (!desktop) return 72;
    // The owner has no windows or hooks. Keep its thread off the owned desktop
    // so CloseDesktop can release the handle after the SDK has exited.
    if (GetThreadDesktop(GetCurrentThreadId()) != original && !SetThreadDesktop(original)) {
        CloseDesktop(desktop); return 72;
    }
    if (!SetEnvironmentVariableW(L"LOOMLIGHT_CANVAS_DESKTOP", desktop_name)) {
        CloseDesktop(desktop); return 72;
    }
    STARTUPINFOW startup = {0};
    startup.cb = sizeof(startup);
    startup.lpDesktop = desktop_name;
    startup.dwFlags = STARTF_USESTDHANDLES;
    startup.hStdInput = GetStdHandle(STD_INPUT_HANDLE);
    startup.hStdOutput = GetStdHandle(STD_OUTPUT_HANDLE);
    startup.hStdError = GetStdHandle(STD_ERROR_HANDLE);
    PROCESS_INFORMATION child = {0};
    if (!CreateProcessW(argv[1], command, NULL, NULL, TRUE, CREATE_NO_WINDOW,
            NULL, argv[3], &startup, &child)) {
        CloseDesktop(desktop); return 72;
    }
    CloseHandle(child.hThread);
    // Core bounds the cooperative wait and terminates the entire job on failure.
    DWORD code = 73;
    if (WaitForSingleObject(child.hProcess, INFINITE) == WAIT_OBJECT_0)
        GetExitCodeProcess(child.hProcess, &code);
    CloseHandle(child.hProcess);
    BOOL closed = CloseDesktop(desktop);
    swprintf_s(receipt_path, 32768, L"%ls\\desktop-closed.json", argv[3]);
    FILE *receipt = NULL;
    if (_wfopen_s(&receipt, receipt_path, L"w") || !receipt) return 73;
    fprintf(receipt, "{\"closed\":%s}", closed ? "true" : "false");
    fclose(receipt);
    return closed ? (int)code : 73;
}
