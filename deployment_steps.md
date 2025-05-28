# Deployment Steps for Skorbord App

This guide explains how to build and deploy both the backend (Node.js/Express) and frontend (React) apps to your Raspberry Pi server (`raspberrypi.local`) using SSH and SCP. **All commands should be run from the root of the project.**

---
## 1. Prerequisites

- SSH access to `raspberrypi.local` (replace `pi` with your actual username if different).
- Node.js and npm installed on the Raspberry Pi.
- Network access to `raspberrypi.local` from your development machine.

---
## 2. Automated Build & Deploy (Recommended)

You can use the provided scripts to automate the frontend build and deploy process:

- **For macOS/Linux:**
  ```sh
  ./deploy-frontend.sh
  ```
- **For Windows/PowerShell:**
  ```powershell
  ./deploy-frontend.ps1
  ```

These scripts will:
- Build the frontend (`src/`)
- Copy the build output to the Raspberry Pi (`~/skorbord/frontend/`)
- (You may need to make the shell script executable: `chmod +x deploy-frontend.sh`)

> **Note:** Backend deployment and DB copy are still manual (see below).

---
## 3. Manual Build & Deploy Steps

### 3.1. Build the Frontend (React)

1. **Install dependencies:**
   ```sh
   cd src
   npm install
   cd ..
   ```

2. **Build the production frontend:**
   ```sh
   npm run --prefix src build
   ```
   This will generate a `dist` (or `build`) folder in `src/` with static files.

---
## 4. Prepare the Backend (Node.js/Express)

1. **Install backend dependencies:**
   ```sh
   cd server
   npm install
   cd ..
   ```

2. **(Optional) Test locally:**
   ```sh
   npm run --prefix server dev
   ```
   Ensure the backend works as expected.

---
## 5. Deploy to Raspberry Pi

### 5.1. Copy Files to Raspberry Pi

1. **Create target directories on the Pi:**
   ```sh
   ssh pi@raspberrypi.local "mkdir -p ~/skorbord/server ~/skorbord/frontend"
   ```

2. **Copy backend files:**
   ```sh
   scp -r server/* pi@raspberrypi.local:~/skorbord/server/
   ```

3. **Copy frontend build files:**
   ```sh
   scp -r src/dist/* pi@raspberrypi.local:~/skorbord/frontend/
   ```
   > If your build output is in `build/` instead of `dist/`, adjust the path accordingly.

4. **Copy the SQLite database (if needed):**
   ```sh
   scp server/scoreboards.db pi@raspberrypi.local:~/skorbord/server/
   ```

### 5.2. Install Dependencies on the Pi

1. **SSH into the Pi:**
   ```sh
   ssh pi@raspberrypi.local
   ```

2. **Install backend dependencies:**
   ```sh
   cd ~/skorbord/server
   npm install
   ```

---
## 6. Run the Backend Server

1. **Start the backend:**
   ```sh
   cd ~/skorbord/server
   npm run dev
   ```
   Or, for production:
   ```sh
   node index.js
   ```

2. **(Optional) Serve the frontend static files:**
   - Use a static file server (e.g., `serve`, `http-server`, or configure Express to serve static files from `../frontend`).

---
## 7. (Optional) Automate with a Script

- You can create a shell script to automate the build and deploy steps, or use the provided `deploy-frontend.sh`/`deploy-frontend.ps1` scripts for the frontend.

---
## 8. (Optional) Set Up as a Service

- For production, consider using `pm2` or a systemd service to keep the backend running.

---
## 9. Set Up as a systemd Service

You can run both backend and frontend as systemd services on your Raspberry Pi for automatic startup and management.

### Backend Service (`skorbord-backend.service`)

Create a file `/etc/systemd/system/skorbord-backend.service` with the following content:

```ini
[Unit]
Description=Skorbord Backend (Node.js/Express)
After=network.target

[Service]
WorkingDirectory=/home/pi/skorbord/server
ExecStart=/usr/bin/node index.js
Restart=always
User=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Frontend Service (`skorbord-frontend.service`)

If you are serving the frontend with a static file server (e.g., using `serve` or `http-server`), install it globally on your Pi:

```sh
npm install -g serve
```

Then create `/etc/systemd/system/skorbord-frontend.service`:

```ini
[Unit]
Description=Skorbord Frontend (Static File Server)
After=network.target

[Service]
WorkingDirectory=/home/pi/skorbord/frontend
ExecStart=/usr/bin/serve -s . -l 3000
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

- Adjust the port (`-l 3000`) as needed.
- If you use a different static server, update `ExecStart` accordingly.

### Enable and Start the Services

1. Copy the service files to your Pi (e.g., `scp skorbord-backend.service pi@raspberrypi.local:~/`)
2. Move them to `/etc/systemd/system/`:
   ```sh
   sudo mv ~/skorbord-backend.service /etc/systemd/system/
   sudo mv ~/skorbord-frontend.service /etc/systemd/system/
   ```
3. Reload systemd and enable/start the services:
   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable skorbord-backend
   sudo systemctl start skorbord-backend
   sudo systemctl enable skorbord-frontend
   sudo systemctl start skorbord-frontend
   ```
4. Check status:
   ```sh
   sudo systemctl status skorbord-backend
   sudo systemctl status skorbord-frontend
   ```

---
**Summary:**
- Build frontend → copy `dist/` to Pi  
- Copy backend and DB to Pi  
- Install backend dependencies on Pi  
- Start backend server  
- Serve frontend static files as needed
- **Automated:** Use `deploy-frontend.sh` or `deploy-frontend.ps1` from the project root for the frontend
