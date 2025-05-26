// Entry point for the Express + Socket.IO + SQLite backend
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const Sqids = require('sqids').default;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// SQLite setup
const db = new sqlite3.Database('./scoreboards.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scoreboards (
    ScoreboardId INTEGER PRIMARY KEY AUTOINCREMENT,
    TeamName1 TEXT,
    TeamName2 TEXT,
    TeamColor1 TEXT,
    TeamColor2 TEXT,
    Tournament TEXT,
    BoardColor TEXT,
    Scores TEXT,
    ActiveSet INTEGER
  )`);
});

// Sqids setup
const sqids = new Sqids({ minLength: 6, alphabet: 'hPrUuF3oQfeEGwRZX1d9ac5MB0AkgLqlynOpTVzCWJtDjsN8I7i42xvHSK6Ymb' });

// REST API: Get scoreboard by Sqid
app.get('/api/scoreboard/:sqid', (req, res) => {
  const id = sqids.decode(req.params.sqid)[0];
  if (!id) return res.status(404).json({ error: 'Invalid Sqid' });
  db.get('SELECT * FROM scoreboards WHERE ScoreboardId = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// REST API: Create new scoreboard
app.post('/api/scoreboard', (req, res) => {
  const { TeamName1, TeamName2, TeamColor1, TeamColor2, Tournament, BoardColor, Scores, ActiveSet } = req.body;
  db.run(
    'INSERT INTO scoreboards (TeamName1, TeamName2, TeamColor1, TeamColor2, Tournament, BoardColor, Scores, ActiveSet) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [TeamName1, TeamName2, TeamColor1, TeamColor2, Tournament, BoardColor, Scores, ActiveSet],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const sqid = sqids.encode([this.lastID]);
      res.json({ BoardSqid: sqid });
    }
  );
});

// REST API: Update scoreboard
app.put('/api/scoreboard/:sqid', (req, res) => {
  const id = sqids.decode(req.params.sqid)[0];
  if (!id) return res.status(404).json({ error: 'Invalid Sqid' });
  const { TeamName1, TeamName2, TeamColor1, TeamColor2, Tournament, BoardColor, Scores, ActiveSet } = req.body;
  db.run(
    'UPDATE scoreboards SET TeamName1=?, TeamName2=?, TeamColor1=?, TeamColor2=?, Tournament=?, BoardColor=?, Scores=?, ActiveSet=? WHERE ScoreboardId=?',
    [TeamName1, TeamName2, TeamColor1, TeamColor2, Tournament, BoardColor, Scores, ActiveSet, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Socket.IO events for real-time updates
io.on('connection', (socket) => {
  socket.on('joinBoard', (sqid) => {
    socket.join(sqid);
  });

  socket.on('UpdateScores', ({ sqid, scores }) => {
    io.to(sqid).emit('UpdateScores', scores);
  });
  socket.on('UpdateTeamInfo', ({ sqid, team1, team1Color, team2, team2Color }) => {
    io.to(sqid).emit('UpdateTeamInfo', { team1, team1Color, team2, team2Color });
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
