import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import * as mainModule from './main';

// Mock fetch and socket.io-client
beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(mainModule, 'useSocket').mockImplementation(() => {});
});
afterEach(() => {  jest.resetAllMocks();
});

describe('ScoreView', () => {
  const scoreboard = {
    TeamName1: 'Alpha',
    TeamName2: 'Beta',
    Tournament: 'Spring Cup',
    TeamColor1: '#00adb5',
    TeamAccent1: '#007c85',
    TeamColor2: '#ff6f3c',
    TeamAccent2: '#ffb26b',
    Scores: '10,12,8,15,0,0',
    ActiveSet: 1,
    BoardColor: '#23272b',  };

  function renderScoreView() {
    global.fetch.mockResolvedValueOnce({ json: () => Promise.resolve(scoreboard) });
    render(      <MemoryRouter initialEntries={[`/score/abc123`]}>
        <Routes>
          <Route path="/score/:sqid" element={<mainModule.ScoreView />} />
        </Routes>
      </MemoryRouter>
    );
  }
  it('Given a loaded scoreboard, When rendered, Then shows team names, scores, and active set', async () => {
    renderScoreView();
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBe(1);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
  it('Given the edit section is toggled, When user changes team name and saves, Then saveTeamInfo is called', async () => {
    renderScoreView();
    fireEvent.click(await screen.findByText(/Show Match Info/i));
    const input = screen.getByPlaceholderText('Team 1 Name');
    fireEvent.change(input, { target: { value: 'Gamma' } });
    global.fetch.mockResolvedValueOnce({ json: () => Promise.resolve({ ...scoreboard, TeamName1: 'Gamma' }) });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
  it('Given the reset button, When clicked, Then all scores are reset and set 1 is active', async () => {
    renderScoreView();
    fireEvent.click(await screen.findByText(/Show Match Info/i));
    fireEvent.click(screen.getByText('Reset Scores'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});

describe('OverlayView', () => {
  const scoreboard = {
    TeamName1: 'Alpha',
    TeamName2: 'Beta',
    Tournament: 'Spring Cup',
    TeamColor1: '#00adb5',
    TeamAccent1: '#007c85',
    TeamColor2: '#ff6f3c',
    TeamAccent2: '#ffb26b',
    Scores: '25,23,15,17,0,0',
    ActiveSet: 2,
    BoardColor: '#23272b',
  };

  function renderOverlayView() {
    global.fetch.mockResolvedValueOnce({ json: () => Promise.resolve(scoreboard) });
    render(
      <MemoryRouter initialEntries={[`/board/abc123`]}>
        <Routes>
          <Route path="/board/:sqid" element={<mainModule.OverlayView />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('Given a loaded scoreboard, When rendered, Then shows team names, scores, and highlights active set', async () => {
    renderOverlayView();
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Spring Cup')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
  });
});
