# Copies server/.env from Raspberry Pi to local server/.env
# Usage: .\copy-server-env.ps1

$remoteUser = "pi"
$remoteHost = "raspberrypi.local"
$remotePath = "/home/pi/skorbord/server/scoreboards.db"
$localPath = "server/scoreboards.db"

Write-Host "Copying $remoteUser@${remoteHost}:${remotePath} to $localPath ..."

# Verify local directory exists
$localDir = Split-Path $localPath -Parent
if (!(Test-Path -Path $localDir)) {
    Write-Error "Local directory '$localDir' does not exist. Aborting."
    exit 1
}

Write-Host "$remoteUser@${remoteHost}:${remotePath} $localPath"
exit 1

# Use scp to copy the file
scp "$remoteUser@${remoteHost}:${remotePath}" $localPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully copied scoreboards.db to $localPath"
} else {
    Write-Error "Failed to copy scoreboards.db. Check your network and SSH keys."
}
