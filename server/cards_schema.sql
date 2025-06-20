-- SQLite schema for card game scoring app

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    name TEXT,
    game_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    target_score INTEGER,
    notes TEXT,
    is_active BOOLEAN
);

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    game_id INTEGER NOT NULL,
    name TEXT,
    avatar TEXT,
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
    game_id INTEGER NOT NULL,
    name TEXT, -- Name or label for the rivalry group
    notes TEXT,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rivalry_players (
    id INTEGER PRIMARY KEY,
    rivalry_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_number INTEGER, -- To support team-based or multi-player rivalries
    FOREIGN KEY (rivalry_id) REFERENCES rivalries(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rivalry_stats (
    id INTEGER PRIMARY KEY,
    rivalry_id INTEGER NOT NULL,
    wins_team1 INTEGER,
    wins_team2 INTEGER,
    total_games INTEGER,
    avg_margin REAL,
    FOREIGN KEY (rivalry_id) REFERENCES rivalries(id) ON DELETE CASCADE
);
