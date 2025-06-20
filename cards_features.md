# Card Game Scoring App Features

## Player Management
- Default to 2 players per game.
- Add or remove players, up to a maximum of 10.
- Edit player names and assign avatars or colors for easy identification.

## Score Tracking
- Add, edit, or undo scores for each round or hand.
- Display running totals and per-round breakdowns.
- Support for negative scores (for games where this is relevant).
- Option to set a target score or winning condition.

## Game Management
- Start a new game, save, and resume previous games.
- View game history and statistics (wins, losses, average scores).
- Option to reset scores or clear the current game.

## Rivalry Tracking
- Define rivalries between two or more players (e.g., Player A vs Player B, Player A+B vs Player C+D, or Player A vs Player B vs Player C).
- Support multiple rivalry groups per game.
- Assign players to rivalry groups and teams (for team-based or multi-player rivalries).
- Track head-to-head stats for each rivalry group: wins, losses, average margin, etc.
- Highlight rivalry matchups in the UI.

## Customization
- Rename the game/session.
- Choose card game type (optional, for stats or rules reference).
- Set custom rules or notes for each game.

## User Experience
- Responsive UI for mobile and desktop.
- Simple, intuitive controls for adding scores and managing players.
- Visual indicators for current leader, last round winner, etc.

## Sharing & Export
- Share game results or rivalry stats via link or export (CSV, image, etc.).

---

## Database Schema (SQLite)

### games
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- game_type (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)
- target_score (INTEGER)
- notes (TEXT)
- is_active (BOOLEAN)

### players
- id (INTEGER PRIMARY KEY)
- game_id (INTEGER, FOREIGN KEY to games.id)
- name (TEXT)
- avatar (TEXT)
- color (TEXT)
- position (INTEGER)

### rounds
- id (INTEGER PRIMARY KEY)
- game_id (INTEGER, FOREIGN KEY to games.id)
- round_number (INTEGER)
- created_at (DATETIME)

### scores
- id (INTEGER PRIMARY KEY)
- round_id (INTEGER, FOREIGN KEY to rounds.id)
- player_id (INTEGER, FOREIGN KEY to players.id)
- score (INTEGER)
- created_at (DATETIME)

### rivalries
- id (INTEGER PRIMARY KEY)
- game_id (INTEGER, FOREIGN KEY to games.id)
- name (TEXT)  # Name or label for the rivalry group
- notes (TEXT)

### rivalry_players
- id (INTEGER PRIMARY KEY)
- rivalry_id (INTEGER, FOREIGN KEY to rivalries.id)
- player_id (INTEGER, FOREIGN KEY to players.id)
- team_number (INTEGER)  # To support team-based or multi-player rivalries

### rivalry_stats
- id (INTEGER PRIMARY KEY)
- rivalry_id (INTEGER, FOREIGN KEY to rivalries.id)
- wins_team1 (INTEGER)
- wins_team2 (INTEGER)
- total_games (INTEGER)
- avg_margin (REAL)
