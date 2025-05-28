# Build and deploy Skorbord frontend to Raspberry Pi

# 1. Build the frontend (from project root, using src as prefix)
npm --prefix src run build

# 2. Copy built files to Raspberry Pi
scp -r src/dist/* pi@raspberrypi.local:~/skorbord/frontend/

# 3. Restart the frontend service on the Pi
ssh pi@raspberrypi.local "sudo systemctl restart skorbord-frontend.service"

Write-Host "skorbord-frontend.service restarted successfully on Raspberry Pi."
