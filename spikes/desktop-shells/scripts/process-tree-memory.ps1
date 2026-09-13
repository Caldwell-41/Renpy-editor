param([Parameter(Mandatory=$true)][int]$RootPid)

$all = Get-CimInstance Win32_Process
$ids = [System.Collections.Generic.HashSet[int]]::new()
[void]$ids.Add($RootPid)
do {
  $added = 0
  foreach ($process in $all) {
    if ($ids.Contains([int]$process.ParentProcessId) -and $ids.Add([int]$process.ProcessId)) {
      $added += 1
    }
  }
} while ($added -gt 0)

$workingSet = 0L
$privateBytes = 0L
$count = 0
foreach ($id in $ids) {
  $process = Get-Process -Id $id -ErrorAction SilentlyContinue
  if ($null -ne $process) {
    $workingSet += [long]$process.WorkingSet64
    $privateBytes += [long]$process.PrivateMemorySize64
    $count += 1
  }
}
[pscustomobject]@{
  workingSetBytes = $workingSet
  privateBytes = $privateBytes
  processes = $count
} | ConvertTo-Json -Compress
