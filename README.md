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

## Inserting a Scoreboard via API (Example)

You can create a new scoreboard using the backend REST API with this curl command:

```sh
curl -X POST http://localhost:4000/api/scoreboard \
  -H "Content-Type: application/json" \
  -d '{
    "TeamName1": "Team A",
    "TeamName2": "Team B",
    "TeamColor1": "#00adb5",
    "TeamAccent1": "#007c85",
    "TeamColor2": "#ff6f3c",
    "TeamAccent2": "#ffb26b",
    "Tournament": "Spring Open",
    "BoardColor": "#23272b",
    "Scores": "0,0,0,0,0,0",
    "ActiveSet": 0
  }'
```

This will return a JSON object with the generated `BoardSqid` for use in the admin and overlay URLs.

## License

MIT
