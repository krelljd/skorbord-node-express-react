# Skorbord Volleyball Scoreboard App

A real-time volleyball scoreboard app using Node.js, Express, React, Socket.IO, and SQLite. Designed for live streaming overlays and admin/operator control.

## Features

- Real-time score updates via WebSockets
- Admin/operator view for score and match management
- Overlay/public view for embedding in streaming software
- SQLite persistence
- Secure access via unique encoded URL (Sqids)

## Project Structure

- `src/` – React frontend (admin/operator & overlay views)
- `server/` – Node.js + Express + Socket.IO backend

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Setup (Windows & Raspberry Pi)

1. **Install dependencies**

   ```sh
   npm install
   cd server
   npm install
   cd ..
   ```

2. **Start the backend**

   ```sh
   cd server
   node index.js
   ```

3. **Start the frontend**

   ```sh
   npm run dev
   ```

4. **Access the app**

   - Admin/Operator: `http://localhost:5173/score/{BoardSqid}`
   - Overlay/Public: `http://localhost:5173/board/{BoardSqid}`

## Deployment

- Use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) to expose the app securely at your custom domain.



## License

MIT
