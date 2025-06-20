-- SQLite schema for card game scoring app

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    name TEXT,
    game_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    target_score INTEGER,
    notes TEXT,
    is_active BOOLEAN,
    sqid TEXT NOT NULL -- Sqid discriminator for user/session
);

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    game_id INTEGER NOT NULL,
    name TEXT,
    color TEXT,
    position INTEGER,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rounds (
    id INTEGER PRIMARY KEY,
    game_id INTEGER NOT NULL,
    round_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY,
    round_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rivalries (
    id INTEGER PRIMARY KEY,
    game_type TEXT NOT NULL, -- e.g., 'volleyball'
    group_id INTEGER,        -- optional, if you support groups
    name TEXT NOT NULL,      -- Name or label for the rivalry group
    notes TEXT,
    sqid TEXT NOT NULL       -- Sqid discriminator for user/session
    -- No game_id here; rivalry is for all games of this type/group
);

CREATE TABLE IF NOT EXISTS rivalry_players (
    id INTEGER PRIMARY KEY,
    rivalry_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_number INTEGER NOT NULL, -- To support team-based or multi-player rivalries
    FOREIGN KEY (rivalry_id) REFERENCES rivalries(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(rivalry_id, player_id)
);

CREATE TABLE IF NOT EXISTS rivalry_stats (
    id INTEGER PRIMARY KEY,
    rivalry_id INTEGER NOT NULL,
    wins_team1 INTEGER DEFAULT 0,
    wins_team2 INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    avg_margin REAL DEFAULT 0,
    FOREIGN KEY (rivalry_id) REFERENCES rivalries(id) ON DELETE CASCADE
);
