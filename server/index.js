// Entry point for the Express + Socket.IO + SQLite backend
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const Sqids = require('sqids').default;
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

// Rate limiting middleware for API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// SQLite setup
const db = new sqlite3.Database('./scoreboards.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scoreboards (
    ScoreboardId INTEGER PRIMARY KEY AUTOINCREMENT,
    TeamName1 TEXT,
    TeamName2 TEXT,
    TeamColor1 TEXT,
    TeamAccent1 TEXT,
    TeamColor2 TEXT,
    TeamAccent2 TEXT,
    Tournament TEXT,
    BoardColor TEXT,
    Scores TEXT,
    ActiveSet INTEGER
  )`);
});

// Sqids setup (use env vars for security)
// Add to your .env file:
// SQIDS_ALPHABET=your-long-random-alphabet
// SQIDS_MIN_LENGTH=6
const SQIDS_ALPHABET = process.env.SQIDS_ALPHABET;
const SQIDS_MIN_LENGTH = parseInt(process.env.SQIDS_MIN_LENGTH, 10);
if (!SQIDS_ALPHABET || typeof SQIDS_ALPHABET !== 'string' || SQIDS_ALPHABET.length < 20) {
  throw new Error('Missing or invalid SQIDS_ALPHABET env variable. Set a long, random string in your .env file.');
}
if (!SQIDS_MIN_LENGTH || isNaN(SQIDS_MIN_LENGTH) || SQIDS_MIN_LENGTH < 4) {
  throw new Error('Missing or invalid SQIDS_MIN_LENGTH env variable. Set a number >= 4 in your .env file.');
}
const sqids = new Sqids({ minLength: SQIDS_MIN_LENGTH, alphabet: SQIDS_ALPHABET });

// CORS policy: allow localhost for dev, skorbord.app for prod
const allowedOrigins = [
  'http://localhost:5173', // Vite default
  'http://localhost:3000', // Common React dev
  'http://localhost:4000', // Backend dev
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000', // Backend dev
  'https://skorbord.app'
];
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// --- Input validation helper ---
function validateScoreboardInput(body) {
  const errors = [];
  // Team names: string, max 40 chars
  if (typeof body.TeamName1 !== 'string' || body.TeamName1.length > 40) errors.push('Invalid TeamName1');
  if (typeof body.TeamName2 !== 'string' || body.TeamName2.length > 40) errors.push('Invalid TeamName2');
  // Colors: hex string, 4-9 chars
  const colorRe = /^#[0-9a-fA-F]{3,8}$/;
  if (!colorRe.test(body.TeamColor1)) errors.push('Invalid TeamColor1');
  if (!colorRe.test(body.TeamAccent1)) errors.push('Invalid TeamAccent1');
  if (!colorRe.test(body.TeamColor2)) errors.push('Invalid TeamColor2');
  if (!colorRe.test(body.TeamAccent2)) errors.push('Invalid TeamAccent2');
  // Tournament: string, max 100 chars
  if (typeof body.Tournament !== 'string' || body.Tournament.length > 100) errors.push('Invalid Tournament');
  // BoardColor: hex string or empty
  if (body.BoardColor && !colorRe.test(body.BoardColor)) errors.push('Invalid BoardColor');
  // Scores: comma-separated numbers, 6 values
  if (typeof body.Scores !== 'string' || !/^\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2}$/.test(body.Scores)) errors.push('Invalid Scores');
  // ActiveSet: 0, 1, or 2
  if (![0,1,2].includes(body.ActiveSet)) errors.push('Invalid ActiveSet');
  return errors;
}

// --- Socket.IO payload validation helpers ---
function isValidSqid(sqid) {
  // Sqids are alphanumeric, length >= SQIDS_MIN_LENGTH
  return typeof sqid === 'string' && sqid.length >= SQIDS_MIN_LENGTH && /^[a-zA-Z0-9]+$/.test(sqid);
}
function isValidScores(scores) {
  // Scores: comma-separated numbers, 6 values
  return typeof scores === 'string' && /^\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2}$/.test(scores);
}
function isValidTeamInfo(obj) {
  const colorRe = /^#[0-9a-fA-F]{3,8}$/;
  return obj &&
    typeof obj.team1 === 'string' && obj.team1.length <= 40 &&
    typeof obj.team2 === 'string' && obj.team2.length <= 40 &&
    colorRe.test(obj.team1Color) &&
    colorRe.test(obj.team1Accent) &&
    colorRe.test(obj.team2Color) &&
    colorRe.test(obj.team2Accent);
}
function isValidDisplay(obj) {
  const colorRe = /^#[0-9a-fA-F]{3,8}$/;
  return obj &&
    typeof obj.tournament === 'string' && obj.tournament.length <= 100 &&
    (!obj.boardColor || colorRe.test(obj.boardColor));
}
function isValidSetIndex(idx) {
  return [0, 1, 2].includes(idx);
}

// REST API: Get scoreboard by Sqid
app.get('/api/scoreboard/:sqid', (req, res) => {
  const id = sqids.decode(req.params.sqid)[0];
  if (!id) return res.status(404).json({ error: 'Invalid Sqid' });
  db.get('SELECT * FROM scoreboards WHERE ScoreboardId = ?', [id], (err, row) => {
    if (err) {
      console.error('GET /api/scoreboard/:sqid error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// REST API: Create new scoreboard
app.post('/api/scoreboard', (req, res) => {
  const errors = validateScoreboardInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  const { TeamName1, TeamName2, TeamColor1, TeamAccent1, TeamColor2, TeamAccent2, Tournament, BoardColor, Scores, ActiveSet } = req.body;
  db.run(
    'INSERT INTO scoreboards (TeamName1, TeamName2, TeamColor1, TeamAccent1, TeamColor2, TeamAccent2, Tournament, BoardColor, Scores, ActiveSet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [TeamName1, TeamName2, TeamColor1, TeamAccent1, TeamColor2, TeamAccent2, Tournament, BoardColor, Scores, ActiveSet],
    function (err) {
      if (err) {
        console.error('POST /api/scoreboard error:', err);
        return res.status(500).json({ error: err.message });
      }
      const sqid = sqids.encode([this.lastID]);
      res.json({ BoardSqid: sqid });
    }
  );
});

// REST API: Update scoreboard
app.put('/api/scoreboard/:sqid', (req, res) => {
  const errors = validateScoreboardInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  const id = sqids.decode(req.params.sqid)[0];
  if (!id) return res.status(404).json({ error: 'Invalid Sqid' });
  const { TeamName1, TeamName2, TeamColor1, TeamAccent1, TeamColor2, TeamAccent2, Tournament, BoardColor, Scores, ActiveSet } = req.body;
  db.run(
    'UPDATE scoreboards SET TeamName1=?, TeamName2=?, TeamColor1=?, TeamAccent1=?, TeamColor2=?, TeamAccent2=?, Tournament=?, BoardColor=?, Scores=?, ActiveSet=? WHERE ScoreboardId=?',
    [TeamName1, TeamName2, TeamColor1, TeamAccent1, TeamColor2, TeamAccent2, Tournament, BoardColor, Scores, ActiveSet, id],
    function (err) {
      if (err) {
        console.error('PUT /api/scoreboard/:sqid error:', err);
        return res.status(500).json({ error: err.message });
      }
      // Emit socket events for real-time update
      const sqid = req.params.sqid;
      // Emit scores
      if (typeof Scores === 'string' && /^\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2}$/.test(Scores)) {
        const scoresArray = Scores.split(',').map(Number);
        io.to(sqid).emit('UpdateScores', scoresArray);
      }
      // Emit active set
      if ([0,1,2].includes(ActiveSet)) {
        io.to(sqid).emit('UpdateActiveSet', ActiveSet);
      }
      // Emit team info
      io.to(sqid).emit('UpdateTeamInfo', {
        team1: TeamName1,
        team1Color: TeamColor1,
        team1Accent: TeamAccent1,
        team2: TeamName2,
        team2Color: TeamColor2,
        team2Accent: TeamAccent2,
        tournament: Tournament
      });
      // Emit display info
      io.to(sqid).emit('UpdateDisplay', {
        tournament: Tournament,
        boardColor: BoardColor
      });
      res.json({ success: true });
    }
  );
});

// Socket.IO connection rate limiting (basic)
const socketConnectionCounts = {};
io.use((socket, next) => {
  const ip = socket.handshake.address;
  const now = Date.now();
  if (!socketConnectionCounts[ip]) socketConnectionCounts[ip] = [];
  // Remove timestamps older than 15 min
  socketConnectionCounts[ip] = socketConnectionCounts[ip].filter(ts => now - ts < 15 * 60 * 1000);
  if (socketConnectionCounts[ip].length >= 30) {
    return next(new Error('Too many socket connections from this IP.'));
  }
  socketConnectionCounts[ip].push(now);
  next();
});

// Socket.IO events for real-time updates
io.on('connection', (socket) => {
  socket.on('joinBoard', (sqid) => {
    if (!isValidSqid(sqid)) {
      socket.emit('error', { error: 'Invalid Sqid for joinBoard' });
      return;
    }
    socket.join(sqid);
  });

  socket.on('UpdateScores', ({ sqid, scores }) => {
    if (!isValidSqid(sqid) || !isValidScores(scores)) {
      socket.emit('error', { error: 'Invalid payload for UpdateScores' });
      return;
    }
    io.to(sqid).emit('UpdateScores', scores);
  });

  socket.on('UpdateTeamInfo', (payload) => {
    if (!isValidSqid(payload.sqid) || !isValidTeamInfo(payload)) {
      socket.emit('error', { error: 'Invalid payload for UpdateTeamInfo' });
      return;
    }
    const { sqid, team1, team1Color, team1Accent, team2, team2Color, team2Accent } = payload;
    io.to(sqid).emit('UpdateTeamInfo', { team1, team1Color, team1Accent, team2, team2Color, team2Accent });
  });

  socket.on('UpdateDisplay', (payload) => {
    if (!isValidSqid(payload.sqid) || !isValidDisplay(payload)) {
      socket.emit('error', { error: 'Invalid payload for UpdateDisplay' });
      return;
    }
    const { sqid, tournament, boardColor } = payload;
    io.to(sqid).emit('UpdateDisplay', { tournament, boardColor });
  });

  socket.on('UpdateActiveSet', (payload) => {
    if (!isValidSqid(payload.sqid) || !isValidSetIndex(payload.setIndex)) {
      socket.emit('error', { error: 'Invalid payload for UpdateActiveSet' });
      return;
    }
    io.to(payload.sqid).emit('UpdateActiveSet', payload.setIndex);
  });
});

// --- Card Game Scoring API (Sqid-based discrimination) ---
// All endpoints below require a valid 'sqid' as a URL segment for user/session separation.

// --- GAMES ---
app.get('/api/cards/:sqid/games', (req, res) => {
  const { sqid } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.all('SELECT * FROM games WHERE sqid = ?', [sqid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/cards/:sqid/games', (req, res) => {
  const { sqid } = req.params;
  const { name, game_type, target_score, notes } = req.body;
  if (!isValidSqid(sqid) || typeof name !== 'string') return res.status(400).json({ error: 'Missing or invalid sqid or name' });
  db.run(
    'INSERT INTO games (name, game_type, target_score, notes, sqid) VALUES (?, ?, ?, ?, ?)',
    [name, game_type, target_score, notes, sqid],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/api/cards/:sqid/games/:gameId', (req, res) => {
  const { sqid, gameId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.get('SELECT * FROM games WHERE id = ? AND sqid = ?', [gameId, sqid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Game not found' });
    res.json(row);
  });
});

app.put('/api/cards/:sqid/games/:gameId', (req, res) => {
  const { sqid, gameId } = req.params;
  const { name, game_type, target_score, notes, is_active } = req.body;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.run(
    'UPDATE games SET name=?, game_type=?, target_score=?, notes=?, is_active=? WHERE id=? AND sqid=?',
    [name, game_type, target_score, notes, is_active, gameId, sqid],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Game not found' });
      res.json({ success: true });
    }
  );
});

// PATCH: Partially update a game (only provided fields)
app.patch('/api/cards/:sqid/games/:gameId', (req, res) => {
  const { sqid, gameId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  // Only allow updatable fields
  const allowed = ['name', 'game_type', 'target_score', 'notes', 'is_active'];
  const updates = [];
  const params = [];
  for (const key of allowed) {
    if (key in req.body) {
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  params.push(gameId, sqid);
  const sql = `UPDATE games SET ${updates.join(', ')} WHERE id = ? AND sqid = ?`;
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ success: true });
  });
});

app.delete('/api/cards/:sqid/games/:gameId', (req, res) => {
  const { sqid, gameId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.run('DELETE FROM games WHERE id = ? AND sqid = ?', [gameId, sqid], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Game not found' });
    res.status(204).end();
  });
});

// --- PLAYERS ---
app.get('/api/cards/:sqid/games/:gameId/players', (req, res) => {
  const { sqid, gameId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.all('SELECT * FROM players WHERE game_id = ? AND game_id IN (SELECT id FROM games WHERE id = ? AND sqid = ?)', [gameId, gameId, sqid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/cards/:sqid/games/:gameId/players', (req, res) => {
  const { sqid, gameId } = req.params;
  const { name, color, position } = req.body;
  if (!isValidSqid(sqid) || typeof name !== 'string') return res.status(400).json({ error: 'Missing or invalid sqid or name' });
  db.run(
    'INSERT INTO players (game_id, name, color, position) VALUES (?, ?, ?, ?)',
    [gameId, name, color, position],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});
app.put('/api/cards/:sqid/players/:playerId', (req, res) => {
  const { sqid, playerId } = req.params;
  const { name, color, position } = req.body;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.run(
    'UPDATE players SET name=?, color=?, position=? WHERE id=? AND game_id IN (SELECT id FROM games WHERE sqid = ?)',
    [name, color, position, playerId, sqid],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
      res.json({ success: true });
    }
  );
});

// PATCH: Partially update a player (only provided fields)
app.patch('/api/cards/:sqid/players/:playerId', (req, res) => {
  const { sqid, playerId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  // Only allow updatable fields
  const allowed = ['name', 'color', 'position'];
  const updates = [];
  const params = [];
  for (const key of allowed) {
    if (key in req.body) {
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  params.push(playerId, sqid);
  const sql = `UPDATE players SET ${updates.join(', ')} WHERE id = ? AND game_id IN (SELECT id FROM games WHERE sqid = ?)`;
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ success: true });
  });
});
app.delete('/api/cards/:sqid/players/:playerId', (req, res) => {
  const { sqid, playerId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.run('DELETE FROM players WHERE id = ? AND game_id IN (SELECT id FROM games WHERE sqid = ?)', [playerId, sqid], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.status(204).end();
  });
});

// --- ROUNDS ---
app.get('/api/cards/:sqid/games/:gameId/rounds', (req, res) => {
  const { sqid, gameId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.all('SELECT * FROM rounds WHERE game_id = ? AND game_id IN (SELECT id FROM games WHERE id = ? AND sqid = ?)', [gameId, gameId, sqid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/cards/:sqid/games/:gameId/rounds', (req, res) => {
  const { sqid, gameId } = req.params;
  const { round_number } = req.body;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.run(
    'INSERT INTO rounds (game_id, round_number) VALUES (?, ?)',
    [gameId, round_number],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// --- SCORES ---
app.get('/api/cards/:sqid/rounds/:roundId/scores', (req, res) => {
  const { sqid, roundId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.all('SELECT * FROM scores WHERE round_id = ? AND round_id IN (SELECT id FROM rounds WHERE id = ? AND game_id IN (SELECT id FROM games WHERE sqid = ?))', [roundId, roundId, sqid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/cards/:sqid/rounds/:roundId/scores', (req, res) => {
  const { sqid, roundId } = req.params;
  const { scores } = req.body;
  if (!isValidSqid(sqid) || !Array.isArray(scores)) return res.status(400).json({ error: 'Missing or invalid sqid or scores' });
  // Upsert scores for each player
  let completed = 0, errored = false;
  scores.forEach(({ player_id, score }) => {
    db.run(
      'INSERT INTO scores (round_id, player_id, score) VALUES (?, ?, ?) ON CONFLICT(round_id, player_id) DO UPDATE SET score=excluded.score',
      [roundId, player_id, score],
      function (err) {
        if (errored) return;
        if (err) {
          errored = true;
          return res.status(500).json({ error: err.message });
        }
        completed++;
        if (completed === scores.length) res.status(201).json({ success: true });
      }
    );
  });
});

app.put('/api/cards/:sqid/scores/:scoreId', (req, res) => {
  const { sqid, scoreId } = req.params;
  const { score } = req.body;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.run(
    'UPDATE scores SET score=? WHERE id=? AND round_id IN (SELECT id FROM rounds WHERE game_id IN (SELECT id FROM games WHERE sqid = ?))',
    [score, scoreId, sqid],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Score not found' });
      res.json({ success: true });
    }
  );
});
app.delete('/api/cards/:sqid/scores/:scoreId', (req, res) => {
  const { sqid, scoreId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  db.run('DELETE FROM scores WHERE id = ? AND round_id IN (SELECT id FROM rounds WHERE game_id IN (SELECT id FROM games WHERE sqid = ?))', [scoreId, sqid], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Score not found' });
    res.status(204).end();
  });
});

// PATCH: Partially update a score (only provided fields)
app.patch('/api/cards/:sqid/scores/:scoreId', (req, res) => {
  const { sqid, scoreId } = req.params;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  // Only allow updatable fields
  const allowed = ['score'];
  const updates = [];
  const params = [];
  for (const key of allowed) {
    if (key in req.body) {
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  params.push(scoreId, sqid);
  const sql = `UPDATE scores SET ${updates.join(', ')} WHERE id = ? AND round_id IN (SELECT id FROM rounds WHERE game_id IN (SELECT id FROM games WHERE sqid = ?))`;
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Score not found' });
    res.json({ success: true });
  });
});

// --- RIVALRIES ---
app.get('/api/cards/:sqid/rivalries', (req, res) => {
  const { sqid } = req.params;
  const { game_type, group_id } = req.query;
  if (!isValidSqid(sqid)) return res.status(400).json({ error: 'Missing or invalid sqid' });
  let sql = 'SELECT * FROM rivalries WHERE sqid = ?';
  const params = [sqid];
  if (game_type) { sql += ' AND game_type = ?'; params.push(game_type); }
  if (group_id) { sql += ' AND group_id = ?'; params.push(group_id); }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/cards/:sqid/rivalries', (req, res) => {
  const { sqid } = req.params;
  const { game_type, group_id, name, notes } = req.body;
  if (!isValidSqid(sqid) || typeof name !== 'string' || typeof game_type !== 'string') return res.status(400).json({ error: 'Missing or invalid sqid, name, or game_type' });
  db.run(
    'INSERT INTO rivalries (game_type, group_id, name, notes, sqid) VALUES (?, ?, ?, ?, ?)',
    [game_type, group_id, name, notes, sqid],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
