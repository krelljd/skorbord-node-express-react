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
  // Tournament: string, max 60 chars
  if (typeof body.Tournament !== 'string' || body.Tournament.length > 60) errors.push('Invalid Tournament');
  // BoardColor: hex string or empty
  if (body.BoardColor && !colorRe.test(body.BoardColor)) errors.push('Invalid BoardColor');
  // Scores: comma-separated numbers, 6 values
  if (typeof body.Scores !== 'string' || !/^\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2},\d{1,2}$/.test(body.Scores)) errors.push('Invalid Scores');
  // ActiveSet: 0, 1, or 2
  if (![0,1,2].includes(body.ActiveSet)) errors.push('Invalid ActiveSet');
  return errors;
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
    socket.join(sqid);
  });

  socket.on('UpdateScores', ({ sqid, scores }) => {
    io.to(sqid).emit('UpdateScores', scores);
  });
  socket.on('UpdateTeamInfo', ({ sqid, team1, team1Color, team1Accent, team2, team2Color, team2Accent }) => {
    io.to(sqid).emit('UpdateTeamInfo', { team1, team1Color, team1Accent, team2, team2Color, team2Accent });
  });
  socket.on('UpdateDisplay', ({ sqid, tournament, boardColor }) => {
    io.to(sqid).emit('UpdateDisplay', { tournament, boardColor });
  });
  socket.on('UpdateActiveSet', ({ sqid, setIndex }) => {
    io.to(sqid).emit('UpdateActiveSet', setIndex);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
