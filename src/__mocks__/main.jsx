import React, { useState } from 'react';

export const AdminView = () => {
  const [showEdit, setShowEdit] = useState(false);

  const handleSave = () => {
    fetch('/api/scoreboard/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TeamName1: 'Gamma' })
    });
  };

  const handleReset = () => {
    fetch('/api/scoreboard/reset', {
      method: 'POST'
    });
  };

  return (
    <div>
      <div>Alpha</div>
      <div>Beta</div>
      <div>Set 2</div>
      <div>Active</div>
      <div>10</div>
      <div>12</div>
      <button onClick={() => setShowEdit(!showEdit)}>Show Match Info</button>
      {showEdit && (
        <div>
          <input placeholder="Team 1 Name" />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleReset}>Reset Scores</button>
        </div>
      )}
    </div>
  );
};

export const OverlayView = () => (
  <div>
    <div>Alpha</div>
    <div>Beta</div>
    <div>Spring Cup</div>
    <div>25</div>
    <div>23</div>
    <div>15</div>
    <div>17</div>
  </div>
);

export const useSocket = jest.fn();

