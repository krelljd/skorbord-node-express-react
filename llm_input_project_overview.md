# Skorbord Volleyball Scoreboard App - LLM Input File

## Project Overview
This is a volleyball scoreboard application built with Node.js, Express, React, Socket.IO, and SQLite. It provides real-time score tracking and management for volleyball matches, with both an admin/operator view and a public overlay view suitable for embedding in streaming software.

## Features
- Real-time score updates using REST and WebSocket APIs
- Admin view for updating scores, team names, colors, and tournament info
- Overlay view for public display, styled for streaming overlays
- Data persistence with SQLite
- Secure scoreboard access via unique encoded URL parameter (Sqids)

## Backend (Node.js/Express)
- Directory: `server/`
- REST API endpoints for scoreboard CRUD and updates
- WebSocket (Socket.IO) for real-time updates
- SQLite database for storing scoreboards
- Error logging and schema validation

## Frontend (React)
- Directory: `src/`
- AdminView: Allows editing of team names, colors, tournament, and scores
- OverlayView: Displays scores and team info for streaming overlays
- Overlay always uses light mode, fills viewport, minimal padding, top-aligned
- Team color/accent bars extend full height, no spacing or borders
- Active set is visually highlighted (border left/right only)
- Winning score in each set is highlighted if set is won (to 25 for sets 1/2, 15 for set 3, must win by 2)
- All font sizes use relative units (em)
- Tournament name updates in real time
- White and black are allowed as accent colors

## Data Model
- Scoreboard: TeamName1, TeamName2, TeamColor1, TeamAccent1, TeamColor2, TeamAccent2, Tournament, BoardColor, Scores (CSV), ActiveSet, Sqid

## UI/UX
- Modern, clean, and accessible design
- OverlayView: minimal, stream-friendly, always light mode
- AdminView: compact controls, collapsible match info section
- Buttons and text use relative font sizes for accessibility

## Example: OverlayView Set Highlighting Logic
- Sets 1 & 2: play to 25, set 3: play to 15
- Must win by 2 points
- Highlight winning score with color and glow only if criteria met

## Example: OverlayView Score Highlighting (JSX)
```
<span className="overlay-score">
  <span style={team1Won ? { color: '#00ffae', fontWeight: 900, textShadow: '0 0 8px #00ffae88', fontSize: 'inherit' } : { fontSize: 'inherit' }}>{team1Score}</span>
  <span className="overlay-score-sep">-</span>
  <span style={team2Won ? { color: '#00ffae', fontWeight: 900, textShadow: '0 0 8px #00ffae88', fontSize: 'inherit' } : { fontSize: 'inherit' }}>{team2Score}</span>
</span>
```

## Usage
- Start backend: `cd server && node index.js`
- Start frontend: `npm run dev`
- Access admin: `/score/:sqid`
- Access overlay: `/board/:sqid`

## Additional Notes
- See `scoreboard app specification.md` for business logic and data model details.
- All code follows modern best practices for accessibility and maintainability.
