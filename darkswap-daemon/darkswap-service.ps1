# PowerShell script to install DarkSwap as a Windows service

# Requires NSSM (Non-Sucking Service Manager)
# Download from: https://nssm.cc/

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator"
    exit
}

# Configuration
$ServiceName = "DarkSwapDaemon"
$DisplayName = "DarkSwap Daemon"
$Description = "Background service for DarkSwap P2P trading platform"
$BinaryPath = "$env:ProgramFiles\DarkSwap\darkswap-daemon.exe"
$WorkingDirectory = "$env:ProgramFiles\DarkSwap"
$LogPath = "$env:ProgramData\DarkSwap\logs"

# Create log directory if it doesn't exist
if (-not (Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force
}

# Check if NSSM is available
$nssmPath = "nssm.exe"
try {
    Get-Command $nssmPath -ErrorAction Stop
} catch {
    Write-Error "NSSM is not installed or not in PATH. Please install NSSM from https://nssm.cc/"
    exit
}

# Check if service already exists
$serviceExists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($serviceExists) {
    Write-Warning "Service $ServiceName already exists. Removing it first..."
    & $nssmPath remove $ServiceName confirm
}

# Install the service
Write-Host "Installing $ServiceName service..."
& $nssmPath install $ServiceName $BinaryPath
& $nssmPath set $ServiceName DisplayName $DisplayName
& $nssmPath set $ServiceName Description $Description
& $nssmPath set $ServiceName AppDirectory $WorkingDirectory
& $nssmPath set $ServiceName AppStdout "$LogPath\stdout.log"
& $nssmPath set $ServiceName AppStderr "$LogPath\stderr.log"
& $nssmPath set $ServiceName AppRotateFiles 1
& $nssmPath set $ServiceName AppRotateOnline 1
& $nssmPath set $ServiceName AppRotateSeconds 86400
& $nssmPath set $ServiceName AppRotateBytes 10485760
& $nssmPath set $ServiceName AppEnvironmentExtra "RUST_LOG=info"
& $nssmPath set $ServiceName Start SERVICE_AUTO_START
& $nssmPath set $ServiceName ObjectName LocalSystem

# Start the service
Write-Host "Starting $ServiceName service..."
Start-Service -Name $ServiceName

Write-Host "Service $ServiceName installed and started successfully."
Write-Host "Logs are available at: $LogPath"