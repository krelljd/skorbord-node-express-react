import { useState } from 'react';
import './App.css';

function App() {
  // Placeholder: Route logic will go here for /score/:id and /board/:id
  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <h1>Skorbord Volleyball Scoreboard</h1>
      <p>To get started, navigate to <code>/score/&lt;BoardSqid&gt;</code> for admin/operator or <code>/board/&lt;BoardSqid&gt;</code> for overlay view.</p>
      <p>This is a placeholder. The full UI for both views will be implemented next.</p>
    </div>
  );
}

export default App;
