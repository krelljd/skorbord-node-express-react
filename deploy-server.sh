#!/bin/bash
# Build and deploy Skorbord backend to Raspberry Pi (bash version)

# 1. Copy backend files to Raspberry Pi (excluding node_modules, db, and test files)
rsync -av --exclude 'node_modules' --exclude 'scoreboards.db' --exclude '*.test.js' ./server/ pi@raspberrypi.local:~/skorbord/server/

# 2. Copy .env file securely
scp ./server/.env pi@raspberrypi.local:~/skorbord/server/.env

# 3. Install dependencies on the Pi
ssh pi@raspberrypi.local "cd ~/skorbord/server && npm install --omit=dev"

# 4. Restart the backend service on the Pi
ssh pi@raspberrypi.local "sudo systemctl restart skorbord-backend.service"

echo "skorbord-backend.service restarted successfully on Raspberry Pi."
