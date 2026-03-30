param(
  [int]$FrontendPort = 5180,
  [int]$StartupTimeoutSeconds = 90
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$stateDir = Join-Path $projectRoot '.runtime\share'
$devPidFile = Join-Path $stateDir 'dev.pid'
$tunnelPidFile = Join-Path $stateDir 'tunnel.pid'
$devOutLog = Join-Path $stateDir 'dev.out.log'
$devErrLog = Join-Path $stateDir 'dev.err.log'
$tunnelOutLog = Join-Path $stateDir 'tunnel.out.log'
$tunnelErrLog = Join-Path $stateDir 'tunnel.err.log'
$shareUrlFile = Join-Path $stateDir 'share.url'

function Ensure-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontro el comando requerido: $Name"
  }
}

function Install-CloudflaredWithWinget {
  $winget = Get-Command 'winget' -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw 'No se encontro cloudflared y winget no esta disponible para instalarlo automaticamente.'
  }

  Write-Host 'cloudflared no encontrado. Intentando instalacion automatica con winget...'
  $null = & $winget.Source install --id Cloudflare.cloudflared -e --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw 'Fallo la instalacion automatica de cloudflared. Ejecuta manualmente: winget install --id Cloudflare.cloudflared -e --accept-package-agreements --accept-source-agreements'
  }

  # Refresh PATH for current process so new commands can be resolved without reopening shell.
  $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machinePath;$userPath"
}

function Resolve-CloudflaredPath {
  $cmd = Get-Command 'cloudflared' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $cmd) {
    $cmd = Get-Command 'cloudflared' -ErrorAction SilentlyContinue | Select-Object -First 1
  }
  if ($cmd) {
    return $cmd.Source
  }

  $candidatePaths = @(
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\cloudflared.exe'),
    (Join-Path $env:ProgramFiles 'cloudflared\cloudflared.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe')
  )

  foreach ($path in $candidatePaths) {
    if ($path -and (Test-Path $path)) {
      return $path
    }
  }

  $wingetPackageRoots = @(
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'),
    (Join-Path $env:ProgramFiles 'WindowsApps')
  )

  foreach ($root in $wingetPackageRoots) {
    if (-not (Test-Path $root)) {
      continue
    }

    $found = Get-ChildItem -Path $root -Recurse -Filter 'cloudflared.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
      return $found.FullName
    }
  }

  throw 'No se encontro cloudflared.'
}

function Get-OrInstall-CloudflaredPath {
  try {
    return Resolve-CloudflaredPath
  } catch {
    Install-CloudflaredWithWinget
    return Resolve-CloudflaredPath
  }
}

function Test-HttpReady {
  param([string]$Url)
  try {
    $null = Invoke-WebRequest -Uri $Url -TimeoutSec 3 -UseBasicParsing
    return $true
  } catch {
    return $false
  }
}

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

function Assert-NotRunning {
  param([string]$Name, [string]$PidPath)
  $pidValue = Read-PidFile -Path $PidPath
  if ($null -eq $pidValue) {
    return
  }
  $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($null -ne $proc) {
    throw "$Name ya esta en ejecucion (PID $pidValue). Ejecuta scripts/share/stop-share.ps1 antes de volver a iniciar."
  }
}

Ensure-Command -Name 'npm'
$cloudflaredPath = Get-OrInstall-CloudflaredPath

New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
Assert-NotRunning -Name 'Servidor de desarrollo' -PidPath $devPidFile
Assert-NotRunning -Name 'Tunnel' -PidPath $tunnelPidFile

Remove-Item $devOutLog, $devErrLog, $tunnelOutLog, $tunnelErrLog, $shareUrlFile -ErrorAction SilentlyContinue

Write-Host "Iniciando app local en puerto $FrontendPort..."
$devProcess = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev') -WorkingDirectory $projectRoot -PassThru -RedirectStandardOutput $devOutLog -RedirectStandardError $devErrLog
$devProcess.Id | Set-Content -Path $devPidFile -NoNewline

$frontendUrl = "http://127.0.0.1:$FrontendPort"
$deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
while ((Get-Date) -lt $deadline) {
  if (Test-HttpReady -Url $frontendUrl) {
    break
  }
  Start-Sleep -Seconds 2
}

if (-not (Test-HttpReady -Url $frontendUrl)) {
  Write-Host 'La app no quedo disponible a tiempo. Revisa logs y corrige antes de exponer.' -ForegroundColor Red
  Write-Host "Log salida: $devOutLog"
  Write-Host "Log error : $devErrLog"
  throw 'No fue posible iniciar la app local.'
}

Write-Host 'Iniciando Cloudflare Quick Tunnel...'
$tunnelProcess = Start-Process -FilePath $cloudflaredPath -ArgumentList @('tunnel', '--url', "http://localhost:$FrontendPort") -WorkingDirectory $projectRoot -PassThru -RedirectStandardOutput $tunnelOutLog -RedirectStandardError $tunnelErrLog
$tunnelProcess.Id | Set-Content -Path $tunnelPidFile -NoNewline

$urlRegex = 'https://[-a-zA-Z0-9]+\.trycloudflare\.com'
$publicUrl = $null
$tunnelDeadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
while ((Get-Date) -lt $tunnelDeadline) {
  $candidateLogs = @()
  if (Test-Path $tunnelOutLog) {
    $candidateLogs += $tunnelOutLog
  }
  if (Test-Path $tunnelErrLog) {
    $candidateLogs += $tunnelErrLog
  }

  if ($candidateLogs.Count -gt 0) {
    $match = Select-String -Path $candidateLogs -Pattern $urlRegex | Select-Object -Last 1
    if ($null -ne $match) {
      $urlMatch = [regex]::Match($match.Line, $urlRegex)
      if ($urlMatch.Success) {
        $publicUrl = $urlMatch.Value
        break
      }
    }
  }
  Start-Sleep -Seconds 2
}

if ([string]::IsNullOrWhiteSpace($publicUrl)) {
  Write-Host 'No se pudo extraer la URL publica del tunnel. Revisa logs.' -ForegroundColor Red
  Write-Host "Log salida: $tunnelOutLog"
  Write-Host "Log error : $tunnelErrLog"
  throw 'Tunnel iniciado sin URL detectable.'
}

$publicUrl | Set-Content -Path $shareUrlFile -NoNewline

Write-Host ''
Write-Host 'Listo. Acceso temporal activo.' -ForegroundColor Green
Write-Host "URL publica  : $publicUrl"
Write-Host "Frontend local: $frontendUrl"
Write-Host 'Stop comando : .\scripts\share\stop-share.ps1'
Write-Host "Estado/logs  : $stateDir"
