$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$stateDir = Join-Path $projectRoot '.runtime\share'
$devPidFile = Join-Path $stateDir 'dev.pid'
$tunnelPidFile = Join-Path $stateDir 'tunnel.pid'

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

function Stop-ByPid {
  param([string]$Label, [string]$PidPath)
  $pidValue = Read-PidFile -Path $PidPath
  if ($null -eq $pidValue) {
    Write-Host "${Label}: sin PID registrado."
    return
  }

  $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($null -eq $proc) {
    Write-Host "${Label}: proceso no encontrado (PID $pidValue)."
    Remove-Item $PidPath -ErrorAction SilentlyContinue
    return
  }

  Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 700
  $stillRunning = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($null -eq $stillRunning) {
    Write-Host "${Label}: detenido (PID $pidValue)."
  } else {
    Write-Host "${Label}: no se pudo detener completamente (PID $pidValue)." -ForegroundColor Yellow
  }

  Remove-Item $PidPath -ErrorAction SilentlyContinue
}

Stop-ByPid -Label 'Tunnel' -PidPath $tunnelPidFile
Stop-ByPid -Label 'Servidor dev' -PidPath $devPidFile

# Fallback para hijos de node colgados en este repo.
$escapedRoot = [regex]::Escape($projectRoot.Path)
$nodeProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object {
    $_.CommandLine -match $escapedRoot -and (
      $_.CommandLine -match 'vite' -or
      $_.CommandLine -match 'server/index.js'
    )
  }

foreach ($proc in $nodeProcesses) {
  try {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Node hijo detenido (PID $($proc.ProcessId))."
  } catch {
    Write-Host "No se pudo detener node PID $($proc.ProcessId)." -ForegroundColor Yellow
  }
}

Write-Host 'Acceso temporal detenido. Si necesitas volver a compartir, ejecuta scripts/share/start-share.ps1.' -ForegroundColor Green
