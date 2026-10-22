param([Parameter(Mandatory = $true)][string]$Output)
$ErrorActionPreference = 'Stop'

function Read-CanvasDesktop {
    return [ordered]@{
        width = [CanvasQualificationDisplay]::GetSystemMetrics(0)
        height = [CanvasQualificationDisplay]::GetSystemMetrics(1)
    }
}
$receipt = [ordered]@{
    passed = $false
    before = $null
    after = $null
    minimum = @{ width = 1600; height = 1000 }
    changed = $false
}
try {
    Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
public static class CanvasQualificationDisplay {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
}
'@
    [void][CanvasQualificationDisplay]::SetProcessDPIAware()
    $receipt.before = Read-CanvasDesktop
    if ($receipt.before.width -lt 1600 -or $receipt.before.height -lt 1000) {
        if (-not (Get-Command Set-DisplayResolution -ErrorAction SilentlyContinue)) {
            throw 'The runner cannot provision the required reference display.'
        }
        Set-DisplayResolution -Width 1920 -Height 1080 -Force -ErrorAction Stop | Out-Null
        $receipt.changed = $true
        Start-Sleep -Milliseconds 500
    }
    # Query user32 again. WinForms can cache the original bounds without a message loop.
    $receipt.after = Read-CanvasDesktop
    if ($receipt.after.width -lt 1600 -or $receipt.after.height -lt 1000) {
        throw 'The reference requires a desktop of at least 1600 by 1000 pixels.'
    }
    $receipt.passed = $true
} catch {
    $receipt.error = $_.Exception.Message
    throw
} finally {
    $receipt | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Output -Encoding utf8
}
