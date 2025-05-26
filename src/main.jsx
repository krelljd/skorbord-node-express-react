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
  // Editable fields
  const [editTeam1, setEditTeam1] = useState('');
  const [editTeam2, setEditTeam2] = useState('');
  const [editTournament, setEditTournament] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/scoreboard/${sqid}`)
      .then(r => r.json())
      .then(data => {
        setScoreboard(data);
        setEditTeam1(data.TeamName1 || '');
        setEditTeam2(data.TeamName2 || '');
        setEditTournament(data.Tournament || '');
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

  // Save team/tournament edits
  const saveTeamInfo = () => {
    if (!scoreboard) return;
    const updated = {
      ...scoreboard,
      TeamName1: editTeam1,
      TeamName2: editTeam2,
      Tournament: editTournament
    };
    setScoreboard(updated);
    fetch(`${API_BASE}/scoreboard/${sqid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated })
    });
    if (socket) socket.emit('UpdateTeamInfo', {
      sqid,
      team1: editTeam1,
      team2: editTeam2,
      team1Color: scoreboard.TeamColor1,
      team2Color: scoreboard.TeamColor2
    });
    if (socket) socket.emit('UpdateDisplay', {
      sqid,
      tournament: editTournament,
      boardColor: scoreboard.BoardColor
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!scoreboard) return <div>Not found</div>;

  const scores = scoreboard.Scores.split(',').map(Number);
  // Professional complementary color scheme
  // Team 1: Teal (main accent), Team 2: Orange (complement)
  const team1Color = '#00adb5'; // Teal
  const team2Color = '#ff6f3c'; // Orange
  const team1BtnBg = team1Color;
  const team1BtnFg = '#fff';
  const team1BtnAlt = '#e0f7fa';
  const team2BtnBg = team2Color;
  const team2BtnFg = '#fff';
  const team2BtnAlt = '#fff3e6';

  return (
    <div className="admin-view" style={{ maxWidth: 420, margin: '0 auto', padding: 0, background: 'none', boxShadow: 'none' }}>
      {/* Material-style card for main controls */}
      <div style={{ background: '#f7fafd', borderRadius: 18, boxShadow: '0 2px 12px #00adb522', padding: 20, marginTop: 24, marginBottom: 16 }}>
        <div style={{ marginTop: 18, marginBottom: 0 }}>
          {[0, 1, 2].map(setIdx => (
            <div key={setIdx} style={{ border: scoreboard.ActiveSet === setIdx ? `2px solid ${team1Color}` : '1px solid #eee', borderRadius: 14, background: scoreboard.ActiveSet === setIdx ? '#e0f7fa' : '#f7fafd', marginBottom: 18, padding: 14, boxShadow: scoreboard.ActiveSet === setIdx ? '0 2px 8px #00adb522' : 'none', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: scoreboard.ActiveSet === setIdx ? team1Color : '#222', fontSize: 16 }}>Set {setIdx + 1}</span>
                <button
                  style={{
                    background: scoreboard.ActiveSet === setIdx ? team1Color : '#eee',
                    color: scoreboard.ActiveSet === setIdx ? '#fff' : '#222',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 24px',
                    fontWeight: 600,
                    marginLeft: 8,
                    cursor: 'pointer',
                    fontSize: 17,
                    boxShadow: scoreboard.ActiveSet === setIdx ? '0 1px 4px #00adb522' : 'none',
                    transition: 'box-shadow 0.2s'
                  }}
                  onClick={() => updateActiveSet(setIdx)}
                  aria-label={`Set active set to ${setIdx + 1}`}
                >
                  {scoreboard.ActiveSet === setIdx ? 'Active' : 'Set Active'}
                </button>
              </div>
              {/* Team 1 header */}
              <div style={{ fontSize: 13, fontWeight: 600, color: team1Color, marginBottom: 2, textAlign: 'center' }}>{editTeam1}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 14 }}>
                <button
                  onClick={() => updateScore(setIdx, 0, -1)}
                  style={{ width: 80, height: 64, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: team1BtnAlt, color: team1BtnBg, border: 'none', borderRadius: 22, fontWeight: 700, marginRight: 2, boxShadow: '0 1px 4px #00adb522', transition: 'background 0.2s' }}
                  aria-label="Decrement Team 1 Score"
                >
                  -
                </button>
                <span style={{ fontWeight: 700, fontSize: 38, color: team1BtnBg, minWidth: 48, textAlign: 'center' }}>{scores[setIdx * 2]}</span>
                <button
                  onClick={() => updateScore(setIdx, 0, 1)}
                  style={{ width: 80, height: 64, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: team1BtnBg, color: team1BtnFg, border: 'none', borderRadius: 22, fontWeight: 700, marginLeft: 2, boxShadow: '0 1px 4px #00adb522', transition: 'background 0.2s' }}
                  aria-label="Increment Team 1 Score"
                >
                  +
                </button>
              </div>
              {/* Team 2 header */}
              <div style={{ fontSize: 13, fontWeight: 600, color: team2Color, marginBottom: 2, textAlign: 'center' }}>{editTeam2}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                <button
                  onClick={() => updateScore(setIdx, 1, -1)}
                  style={{ width: 80, height: 64, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: team2BtnAlt, color: team2BtnBg, border: 'none', borderRadius: 22, fontWeight: 700, marginRight: 2, boxShadow: '0 1px 4px #ff6f3c22', transition: 'background 0.2s' }}
                  aria-label="Decrement Team 2 Score"
                >
                  -
                </button>
                <span style={{ fontWeight: 700, fontSize: 38, color: team2BtnBg, minWidth: 48, textAlign: 'center' }}>{scores[setIdx * 2 + 1]}</span>
                <button
                  onClick={() => updateScore(setIdx, 1, 1)}
                  style={{ width: 80, height: 64, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: team2BtnBg, color: team2BtnFg, border: 'none', borderRadius: 22, fontWeight: 700, marginLeft: 2, boxShadow: '0 1px 4px #ff6f3c22', transition: 'background 0.2s' }}
                  aria-label="Increment Team 2 Score"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Collapsible bottom section for team/tournament editing */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', borderTop: '1.5px solid #eee', boxShadow: '0 -2px 8px #0001', padding: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <button
          onClick={() => setShowEdit(v => !v)}
          style={{ width: '100%', maxWidth: 420, background: '#f7fafd', color: '#00adb5', border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8, fontWeight: 700, fontSize: 16, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 -1px 4px #00adb511' }}
          aria-expanded={showEdit}
        >
          <span style={{ marginRight: 8 }}>{showEdit ? 'Hide' : 'Show'} Match Info</span>
          <span style={{ fontSize: 18 }}>{showEdit ? '\u25B2' : '\u25BC'}</span>
        </button>
        {showEdit && (
          <div style={{ width: '100%', maxWidth: 420, padding: 16, background: '#fff', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, boxShadow: '0 2px 8px #00adb511' }}>
            <form
              style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', justifyContent: 'center', width: '100%' }}
              onSubmit={e => { e.preventDefault(); saveTeamInfo(); }}
            >
              <input
                type="text"
                value={editTeam1}
                onChange={e => setEditTeam1(e.target.value)}
                placeholder="Team 1 Name"
                aria-label="Edit Team 1 Name"
                style={{ fontWeight: 600, fontSize: 16, border: 'none', borderBottom: `2px solid ${team1Color}`, outline: 'none', background: 'transparent', minWidth: 80, color: '#222', marginBottom: 6 }}
              />
              <input
                type="text"
                value={editTeam2}
                onChange={e => setEditTeam2(e.target.value)}
                placeholder="Team 2 Name"
                aria-label="Edit Team 2 Name"
                style={{ fontWeight: 600, fontSize: 16, border: 'none', borderBottom: `2px solid ${team2Color}`, outline: 'none', background: 'transparent', minWidth: 80, color: '#222', marginBottom: 6 }}
              />
              <input
                type="text"
                value={editTournament}
                onChange={e => setEditTournament(e.target.value)}
                placeholder="Tournament Name"
                aria-label="Edit Tournament Name"
                style={{ fontWeight: 500, fontSize: 15, border: 'none', borderBottom: `2px solid ${team1Color}`, outline: 'none', background: 'transparent', minWidth: 120, color: '#222', marginBottom: 10 }}
              />
              <button type="submit" style={{ background: team1Color, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, padding: '10px 0', marginTop: 4, boxShadow: '0 1px 4px #00adb522' }}>Save</button>
            </form>
            <div style={{ fontSize: 13, color: '#888', marginTop: 8, textAlign: 'center' }}>Team names and tournament name auto-save on change.</div>
          </div>
        )}
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
