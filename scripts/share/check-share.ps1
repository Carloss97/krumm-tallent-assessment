param(
  [int]$FrontendPort = 5180,
  [int]$BackendPort = 4000,
  [int]$TimeoutSec = 5
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$stateDir = Join-Path $projectRoot '.runtime\share'
$devPidFile = Join-Path $stateDir 'dev.pid'
$tunnelPidFile = Join-Path $stateDir 'tunnel.pid'
$shareUrlFile = Join-Path $stateDir 'share.url'

function Read-PidFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return $null
  }
  $content = (Get-Content $Path -Raw).Trim()
  if ([string]::IsNullOrWhiteSpace($content)) {
    return $null
  }
  $parsed = 0
  if ([int]::TryParse($content, [ref]$parsed)) {
    return $parsed
  }
  return $null
}

function Test-PidRunning {
  param([int]$Pid)
  if ($null -eq $Pid -or $Pid -le 0) {
    return $false
  }
  return $null -ne (Get-Process -Id $Pid -ErrorAction SilentlyContinue)
}

function Test-Endpoint {
  param([string]$Url, [int]$Seconds)
  try {
    $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Seconds -UseBasicParsing
    return [PSCustomObject]@{
      Ok = $true
      Status = [int]$response.StatusCode
      Error = $null
    }
  } catch {
    $status = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $status = [int]$_.Exception.Response.StatusCode
    }
    return [PSCustomObject]@{
      Ok = $false
      Status = $status
      Error = $_.Exception.Message
    }
  }
}

$frontendUrl = "http://127.0.0.1:$FrontendPort"
$backendHealthUrl = "http://127.0.0.1:$BackendPort/health"
$publicUrl = if (Test-Path $shareUrlFile) { (Get-Content $shareUrlFile -Raw).Trim() } else { '' }

$devPid = Read-PidFile -Path $devPidFile
$tunnelPid = Read-PidFile -Path $tunnelPidFile

$devRunning = if ($null -ne $devPid) { Test-PidRunning -Pid $devPid } else { $false }
$tunnelRunning = if ($null -ne $tunnelPid) { Test-PidRunning -Pid $tunnelPid } else { $false }

$frontendCheck = Test-Endpoint -Url $frontendUrl -Seconds $TimeoutSec
$backendCheck = Test-Endpoint -Url $backendHealthUrl -Seconds $TimeoutSec
$publicCheck = if ([string]::IsNullOrWhiteSpace($publicUrl)) {
  [PSCustomObject]@{ Ok = $false; Status = $null; Error = 'No existe .runtime/share/share.url o esta vacio.' }
} else {
  Test-Endpoint -Url $publicUrl -Seconds $TimeoutSec
}

Write-Host '=== Share Health Check ==='
Write-Host "Project root  : $($projectRoot.Path)"
Write-Host "Frontend local: $frontendUrl"
Write-Host "Backend health: $backendHealthUrl"
Write-Host "Public URL    : $publicUrl"
Write-Host ''
Write-Host "Dev PID       : $devPid (running: $devRunning)"
Write-Host "Tunnel PID    : $tunnelPid (running: $tunnelRunning)"
Write-Host "Frontend      : ok=$($frontendCheck.Ok) status=$($frontendCheck.Status)"
Write-Host "Backend       : ok=$($backendCheck.Ok) status=$($backendCheck.Status)"
Write-Host "Public URL    : ok=$($publicCheck.Ok) status=$($publicCheck.Status)"

if (-not $frontendCheck.Ok -and $frontendCheck.Error) {
  Write-Host "Frontend error: $($frontendCheck.Error)" -ForegroundColor Yellow
}
if (-not $backendCheck.Ok -and $backendCheck.Error) {
  Write-Host "Backend error : $($backendCheck.Error)" -ForegroundColor Yellow
}
if (-not $publicCheck.Ok -and $publicCheck.Error) {
  Write-Host "Public error  : $($publicCheck.Error)" -ForegroundColor Yellow
}

$allOk = $devRunning -and $tunnelRunning -and $frontendCheck.Ok -and $backendCheck.Ok -and $publicCheck.Ok
if ($allOk) {
  Write-Host ''
  Write-Host 'Resultado: OK. La sesion de sharing esta operativa.' -ForegroundColor Green
  exit 0
}

Write-Host ''
Write-Host 'Resultado: FALLO. Ejecuta scripts/share/stop-share.ps1 y luego scripts/share/start-share.ps1.' -ForegroundColor Red
exit 1
