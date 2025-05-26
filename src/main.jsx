import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import io from 'socket.io-client';

const API_BASE = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

function AdminView() {
  const { sqid } = useParams();
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/scoreboard/${sqid}`)
      .then(r => r.json())
      .then(data => {
        setScoreboard(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load scoreboard');
        setLoading(false);
      });
  }, [sqid]);

  useEffect(() => {
    if (!scoreboard) return;
    const s = io(SOCKET_URL);
    s.emit('joinBoard', sqid);
    setSocket(s);
    return () => s.disconnect();
  }, [scoreboard, sqid]);

  const updateScore = (setIdx, teamIdx, delta) => {
    if (!scoreboard) return;
    const scores = scoreboard.Scores.split(',').map(Number);
    const idx = setIdx * 2 + teamIdx;
    scores[idx] = Math.max(0, scores[idx] + delta);
    const newScores = scores.join(',');
    const updated = { ...scoreboard, Scores: newScores };
    setScoreboard(updated);
    fetch(`${API_BASE}/scoreboard/${sqid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated })
    });
    if (socket) socket.emit('UpdateScores', { sqid, scores });
  };

  const updateActiveSet = (setIdx) => {
    if (!scoreboard) return;
    const updated = { ...scoreboard, ActiveSet: setIdx };
    setScoreboard(updated);
    fetch(`${API_BASE}/scoreboard/${sqid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated })
    });
    if (socket) socket.emit('UpdateActiveSet', { sqid, setIndex: setIdx });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!scoreboard) return <div>Not found</div>;

  const scores = scoreboard.Scores.split(',').map(Number);
  return (
    <div className="admin-view">
      <h2>Admin/Operator View</h2>
      <div>
        <strong>{scoreboard.TeamName1}</strong> vs <strong>{scoreboard.TeamName2}</strong>
      </div>
      <div>Tournament: {scoreboard.Tournament}</div>
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {[0, 1, 2].map(setIdx => (
          <div key={setIdx} style={{ border: scoreboard.ActiveSet === setIdx ? '2px solid #00adb5' : '1px solid #ccc', padding: 8, borderRadius: 6, background: scoreboard.ActiveSet === setIdx ? '#e0f7fa' : '#f7f7f7', minWidth: 120, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: scoreboard.ActiveSet === setIdx ? '#00adb5' : '#222' }}>Set {setIdx + 1}</span>
              <button
                style={{
                  background: scoreboard.ActiveSet === setIdx ? '#00adb5' : '#eee',
                  color: scoreboard.ActiveSet === setIdx ? '#fff' : '#222',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontWeight: 600,
                  marginLeft: 8,
                  cursor: 'pointer',
                  fontSize: 14
                }}
                onClick={() => updateActiveSet(setIdx)}
                aria-label={`Set active set to ${setIdx + 1}`}
              >
                {scoreboard.ActiveSet === setIdx ? 'Active' : 'Set Active'}
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color: scoreboard.TeamColor1, fontWeight: 500 }}>{scoreboard.TeamName1}: {scores[setIdx * 2]}</span>
              <button onClick={() => updateScore(setIdx, 0, 1)} style={{ marginLeft: 4, marginRight: 2 }}>+</button>
              <button onClick={() => updateScore(setIdx, 0, -1)}>-</button>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ color: scoreboard.TeamColor2, fontWeight: 500 }}>{scoreboard.TeamName2}: {scores[setIdx * 2 + 1]}</span>
              <button onClick={() => updateScore(setIdx, 1, 1)} style={{ marginLeft: 4, marginRight: 2 }}>+</button>
              <button onClick={() => updateScore(setIdx, 1, -1)}>-</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverlayView() {
  const { sqid } = useParams();
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/scoreboard/${sqid}`)
      .then(r => r.json())
      .then(data => {
        setScoreboard(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load scoreboard');
        setLoading(false);
      });
  }, [sqid]);

  useEffect(() => {
    if (!scoreboard) return;
    const s = io(SOCKET_URL);
    s.emit('joinBoard', sqid);
    s.on('UpdateScores', scores => {
      setScoreboard(sb => ({ ...sb, Scores: scores.join(',') }));
    });
    setSocket(s);
    return () => s.disconnect();
  }, [scoreboard, sqid]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!scoreboard) return <div>Not found</div>;

  const scores = scoreboard.Scores.split(',').map(Number);
  // Set CSS vars for team colors
  const boardStyle = {
    background: scoreboard.BoardColor || '#222831',
    '--team1': scoreboard.TeamColor1,
    '--team2': scoreboard.TeamColor2
  };
  return (
    <div className="overlay-root">
      <div className="overlay-board" style={boardStyle}>
        <div className="overlay-row">
          <div className="overlay-team overlay-team1">
            <div className="overlay-color" style={{ background: scoreboard.TeamColor1 }} />
            <span className="overlay-team-name">{scoreboard.TeamName1}</span>
          </div>
          <div className="overlay-team overlay-team2">
            <div className="overlay-color" style={{ background: scoreboard.TeamColor2 }} />
            <span className="overlay-team-name">{scoreboard.TeamName2}</span>
          </div>
          {[0, 1, 2].map(setIdx => (
            <div
              key={setIdx}
              className={`overlay-set${scoreboard.ActiveSet === setIdx ? ' active' : ''}`}
            >
              <span className="overlay-score">
                {scores[setIdx * 2]}
                <span className="overlay-score-sep">-</span>
                {scores[setIdx * 2 + 1]}
              </span>
            </div>
          ))}
        </div>
        <div className="overlay-tournament">{scoreboard.Tournament}</div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/score/:sqid" element={<AdminView />} />
        <Route path="/board/:sqid" element={<OverlayView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
