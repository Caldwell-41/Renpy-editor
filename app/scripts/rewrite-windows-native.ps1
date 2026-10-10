param(
    [ValidateSet('preflight','observe-light','observe-dark','observe-narrow','physical-send','physical-accept')]
    [string]$Stage,
    [Parameter(Mandatory=$true)][string]$Output,
    [int]$ProcessId = 0,
    [string]$Executable,
    [switch]$ContinueScene,
    [switch]$DraftScene
)
# CI-only native driver. Never creates .done files or invokes a renderer bridge.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Windows.Forms, System.Drawing, UIAutomationClient, UIAutomationTypes
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class RewriteNative {
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left,Top,Right,Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct MOUSEINPUT { public int dx,dy; public uint mouseData,dwFlags,time; public IntPtr dwExtraInfo; }
    [StructLayout(LayoutKind.Explicit)] public struct UNION { [FieldOffset(0)] public MOUSEINPUT mouse; }
    [StructLayout(LayoutKind.Sequential)] public struct INPUT { public uint type; public UNION data; }
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern IntPtr OpenInputDesktop(uint flags,bool inherit,uint access);
    [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern bool GetUserObjectInformation(IntPtr handle,int index,System.Text.StringBuilder text,int size,out int needed);
    [DllImport("user32.dll")] public static extern bool CloseDesktop(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr handle,out RECT rect);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr handle);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
    [DllImport("user32.dll")] public static extern uint GetDpiForWindow(IntPtr handle);
    [DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
    [DllImport("user32.dll")] public static extern uint SendInput(uint count,INPUT[] input,int size);
    public static bool Click(int x,int y) {
        if(!SetCursorPos(x,y)) return false;
        var input=new INPUT[2]; input[0].data.mouse.dwFlags=2; input[1].data.mouse.dwFlags=4;
        return SendInput(2,input,Marshal.SizeOf(typeof(INPUT)))==2;
    }
    public static string HashFile(string path) {
        using (var stream=System.IO.File.OpenRead(path))
        using (var hash=System.Security.Cryptography.SHA256.Create()) {
            return BitConverter.ToString(hash.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
        }
    }
}
'@
[void][RewriteNative]::SetProcessDPIAware()
New-Item -ItemType Directory -Path $Output -Force | Out-Null
$acceptName=if($DraftScene){'Accept Scene'}elseif($ContinueScene){'Accept Beat group'}else{'Accept 1 change'}
$actionTitle=if($DraftScene){'Draft Scene'}elseif($ContinueScene){'Continue Scene'}else{'Rewrite dialogue'}
$receipt = [ordered]@{
    action=if($DraftScene){'draftScene'}elseif($ContinueScene){'continueScene'}else{'rewriteDialogue'};
    stage=$Stage; passed=$false; processId=$ProcessId; executableSHA256=$null
    inputDesktop=$null; layer='Windows UI Automation observation and OS SendInput; automated, not human acceptance'
    checks=[ordered]@{}; captures=@(); controls=@(); uiaStaleRetries=0
    powershellVersion=$PSVersionTable.PSVersion.ToString(); hashProvider='System.Security.Cryptography.SHA256'
}
function Assert-Native($Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function Input-Desktop {
    $desktop=[RewriteNative]::OpenInputDesktop(0,$false,1)
    Assert-Native ($desktop -ne [IntPtr]::Zero) 'Input desktop unavailable'
    try {
        $name=New-Object System.Text.StringBuilder 256; $needed=0
        Assert-Native ([RewriteNative]::GetUserObjectInformation($desktop,2,$name,512,[ref]$needed)) 'Desktop name unavailable'
        return $name.ToString()
    } finally { [void][RewriteNative]::CloseDesktop($desktop) }
}
function Capture([string]$Name, $Rect) {
    $bounds=New-Object System.Drawing.Rectangle ([RewriteNative]::GetSystemMetrics(76)),([RewriteNative]::GetSystemMetrics(77)),([RewriteNative]::GetSystemMetrics(78)),([RewriteNative]::GetSystemMetrics(79))
    Assert-Native ($Rect.Width -ge 100 -and $Rect.Height -ge 100 -and $Rect.Left -ge $bounds.Left -and $Rect.Top -ge $bounds.Top -and $Rect.Right -le $bounds.Right -and $Rect.Bottom -le $bounds.Bottom) 'Owned window clipped outside observable desktop'
    $bitmap=New-Object System.Drawing.Bitmap $Rect.Width,$Rect.Height
    $graphics=[System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.CopyFromScreen($Rect.Left,$Rect.Top,0,0,$bitmap.Size)
        $samples=@()
        for($y=20;$y -lt $Rect.Height;$y+=31) {
            for($x=20;$x -lt $Rect.Width;$x+=31) {
                $pixel=$bitmap.GetPixel($x,$y); $samples+=([int]$pixel.R+[int]$pixel.G+[int]$pixel.B)/3
            }
        }
        $stats=$samples | Measure-Object -Minimum -Maximum -Average
        $file=$Name+'.png'; $path=Join-Path $Output $file
        $bitmap.Save($path,[System.Drawing.Imaging.ImageFormat]::Png)
        Assert-Native (($stats.Maximum-$stats.Minimum) -ge 20) 'Native screenshot is blank'
        return [ordered]@{file=$file;width=$Rect.Width;height=$Rect.Height;sha256=[RewriteNative]::HashFile($path);sampleRange=$stats.Maximum-$stats.Minimum;meanBrightness=$stats.Average}
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}
function Window-Rect($Handle) {
    $rect=New-Object RewriteNative+RECT
    Assert-Native ([RewriteNative]::GetWindowRect($Handle,[ref]$rect)) 'Owned window bounds unavailable'
    return New-Object System.Drawing.Rectangle $rect.Left,$rect.Top,($rect.Right-$rect.Left),($rect.Bottom-$rect.Top)
}
function Nodes {
    return $script:window.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.Condition]::TrueCondition)
}
function Button([string]$Name) {
    $nameCondition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty,$Name)
    $typeCondition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty,[System.Windows.Automation.ControlType]::Button)
    $condition=[System.Windows.Automation.AndCondition]::new([System.Windows.Automation.Condition[]]@($nameCondition,$typeCondition))
    return $script:window.FindFirst([System.Windows.Automation.TreeScope]::Descendants,$condition)
}
function Wait-Native([scriptblock]$Check) {
    $timer=[System.Diagnostics.Stopwatch]::StartNew()
    do {
        try { if (& $Check) { return } }
        catch {
            $exception=$_.Exception
            while($null -ne $exception -and $exception -isnot [System.Windows.Automation.ElementNotAvailableException]) {
                $exception=$exception.InnerException
            }
            if($null -eq $exception) { throw }
            # WebView replaces descendants while rendering. Re-query on the next
            # bounded poll; other failures still escape and fail the receipt.
            $receipt.uiaStaleRetries++
        }
        Start-Sleep -Milliseconds 100
    } while($timer.Elapsed.TotalSeconds -lt 20)
    throw 'Required native state did not appear within 20 seconds'
}
function Has-Text([string]$Text) {
    foreach($node in (Nodes)) {
        if($null -eq $node) { continue }
        $name=$node.Current.Name
        if($null -ne $name -and $name.Contains($Text)) { return $true }
    }
    return $false
}
function Has-ButtonState([string]$Name, [bool]$Enabled) {
    $control=Button $Name
    # A temporarily absent control is never proof of its disabled state.
    return ($null -ne $control -and $control.Current.IsEnabled -eq $Enabled)
}
function Focus-Control($Control) {
    Assert-Native ($null -ne $Control) 'Native control missing'
    $pattern=$null
    if($Control.TryGetCurrentPattern([System.Windows.Automation.ScrollItemPattern]::Pattern,[ref]$pattern)) { $pattern.ScrollIntoView() }
    $Control.SetFocus()
    Start-Sleep -Milliseconds 150
    $bounds=$Control.Current.BoundingRectangle; $rect=Window-Rect $script:handle
    Assert-Native (-not $Control.Current.IsOffscreen -and $bounds.Width -gt 0 -and $bounds.Height -gt 0 -and $bounds.Left -ge $rect.Left -and $bounds.Right -le $rect.Right -and $bounds.Top -ge $rect.Top -and $bounds.Bottom -le $rect.Bottom) 'Native action control outside observable viewport'
    $receipt.checks.controlsInViewport=$true
}
function Click-Control([string]$Name) {
    $control=Button $Name; Assert-Native ($null -ne $control -and $control.Current.IsEnabled) 'Native action control unavailable'
    Focus-Control $control
    Assert-Native ([RewriteNative]::GetForegroundWindow() -eq $script:handle) 'Owned native window lost foreground before input'
    $bounds=$control.Current.BoundingRectangle
    Assert-Native ([RewriteNative]::Click([int]($bounds.Left+$bounds.Width/2),[int]($bounds.Top+$bounds.Height/2))) 'OS mouse input failed'
    $receipt.checks.osMouseInput=$true
}
try {
    $receipt.inputDesktop=Input-Desktop
    Assert-Native ($receipt.inputDesktop -eq 'Default' -and [Environment]::UserInteractive -and [Environment]::Is64BitProcess) 'Unlocked interactive Windows x64 desktop required'
    if($Stage -eq 'preflight') {
        if($Executable) { $receipt.executableSHA256=[RewriteNative]::HashFile($Executable) }
        $bounds=New-Object System.Drawing.Rectangle 0,0,([RewriteNative]::GetSystemMetrics(0)),([RewriteNative]::GetSystemMetrics(1))
        $receipt.initialDesktopWidth=$bounds.Width; $receipt.initialDesktopHeight=$bounds.Height
        $receipt.resolutionChanged=$false
        if(($bounds.Width -lt 1280 -or $bounds.Height -lt 960) -and (Get-Command Set-DisplayResolution -ErrorAction SilentlyContinue)) {
            $receipt.displayCommandResult=(Set-DisplayResolution -Width 1920 -Height 1080 -Force | Out-String).Trim()
            $receipt.resolutionChanged=$true
            Start-Sleep -Milliseconds 500
        }
        # WinForms Screen can retain the original display bounds without a message
        # loop. Read user32 again after the display command; never accept stale size.
        $bounds=New-Object System.Drawing.Rectangle 0,0,([RewriteNative]::GetSystemMetrics(0)),([RewriteNative]::GetSystemMetrics(1))
        $receipt.captures=@(Capture 'preflight-desktop' $bounds)
        $receipt.sessionId=[System.Diagnostics.Process]::GetCurrentProcess().SessionId
        $receipt.uiaAvailable=([System.Windows.Automation.AutomationElement]::RootElement -ne $null)
        $receipt.desktopWidth=$bounds.Width; $receipt.desktopHeight=$bounds.Height
        Assert-Native ($receipt.uiaAvailable -and $bounds.Width -ge 1280 -and $bounds.Height -ge 960) 'Runner cannot fully observe required 1280x900 native layout'
    } else {
        $owned=Get-Process -Id $ProcessId
        Assert-Native ([System.IO.Path]::GetFullPath($owned.Path) -eq [System.IO.Path]::GetFullPath($Executable)) 'Owned executable/PID mismatch'
        $receipt.executableSHA256=[RewriteNative]::HashFile($Executable)
        Wait-Native { (Get-Process -Id $ProcessId).MainWindowHandle -ne [IntPtr]::Zero }
        $script:handle=(Get-Process -Id $ProcessId).MainWindowHandle
        $script:window=[System.Windows.Automation.AutomationElement]::FromHandle($script:handle)
        Assert-Native ($script:window.Current.ProcessId -eq $ProcessId) 'Native window owner mismatch'
        [void][RewriteNative]::SetForegroundWindow($script:handle)
        Wait-Native { [RewriteNative]::GetForegroundWindow() -eq $script:handle }
        $receipt.checks.ownedWindow=$true
        $controlName=if($Stage -eq 'physical-accept') { $acceptName } else {'Generate proposal'}
        Wait-Native { $null -ne (Button $controlName) }
        Focus-Control (Button $controlName)
        Assert-Native ((Has-Text $actionTitle) -and $null -ne (Button 'Generate proposal') -and $null -ne (Button $acceptName)) 'Required native rewrite controls missing'
        $receipt.checks.nativeControls=$true
        $before=Capture ($Stage+'-before') (Window-Rect $script:handle)
        $receipt.captures=@($before); $receipt.checks.captureNonblank=$true
        if($Stage -eq 'observe-light') {
            Assert-Native ($before.meanBrightness -gt 130) 'Light native theme not observed'; $receipt.checks.themeLight=$true
        } elseif($Stage -eq 'observe-dark') {
            Assert-Native ($before.meanBrightness -lt 120) 'Dark native theme not observed'; $receipt.checks.themeDark=$true
        } elseif($Stage -eq 'observe-narrow') {
            $dpi=[RewriteNative]::GetDpiForWindow($script:handle); Assert-Native ($dpi -ge 96) 'Native DPI unavailable'
            $receipt.dpi=$dpi
            Assert-Native (($before.width*96/$dpi) -le 800) 'Compact native width not observed'; $receipt.checks.compactWidth=$true
        } elseif($Stage -eq 'physical-send') {
            Click-Control 'Generate proposal'
            Wait-Native { (Has-Text 'Proposal received. No source changed.') -and (Has-ButtonState $acceptName $true) }
            $receipt.checks.inertProposalObserved=$true
            $receipt.captures+=Capture ($Stage+'-after') (Window-Rect $script:handle)
        } elseif($Stage -eq 'physical-accept') {
            Assert-Native ((Has-Text 'Exact Source changes') -and (Has-Text 'New [[str(7)] {{a=jump:label}')) 'Exact native source review missing'
            Click-Control $acceptName
            Wait-Native { (Has-Text 'Accepted and saved as one change.') -and (Has-ButtonState $acceptName $false) }
            $receipt.checks.savedOnceObserved=$true
            $receipt.captures+=Capture ($Stage+'-after') (Window-Rect $script:handle)
        }
        Wait-Native {
            $receipt.controls=@(foreach($node in (Nodes)) {
                $current=$node.Current; $bounds=$current.BoundingRectangle
                if($current.Name) { [ordered]@{name=$current.Name;type=$current.ControlType.ProgrammaticName;enabled=$current.IsEnabled;offscreen=$current.IsOffscreen;bounds=@($bounds.Left,$bounds.Top,$bounds.Width,$bounds.Height)} }
            })
            return $true
        }
    }
    $receipt.passed=$true
} catch {
    $receipt.failure=$_.Exception.Message
    $receipt.failureType=$_.Exception.GetType().FullName
    $receipt.failureId=$_.FullyQualifiedErrorId
    $receipt.failureStack=$_.ScriptStackTrace
    $receipt.failurePosition=$_.InvocationInfo.PositionMessage
}
$receipt | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $Output ($Stage+'.json')) -Encoding UTF8
Write-Output ($Stage+': passed='+$receipt.passed)
if(-not $receipt.passed) { exit 1 }
