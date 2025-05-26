# Copilot Instructions for Skorbord App
<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This project is a volleyball scoreboard app using Node.js, Express, React, Socket.IO, and SQLite. The backend provides REST and WebSocket APIs for real-time score tracking and management. The frontend has an admin/operator view for updating scores and a public/overlay view for display, styled for embedding in streaming software. Data is persisted in SQLite. Secure access to each scoreboard is via a unique encoded URL parameter (Sqids).

- Backend code is in the `server/` directory.
- Frontend code is in the `src/` directory.
- Use REST and WebSocket APIs for all scoreboard data operations.
- Follow the app specification in `scoreboard app specification.md` for all business logic and data model details.
