import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { checkAuth } from './features/auth';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function AppRoutes() {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  // Check authentication on app load
  useEffect(() => {
    if (status === 'idle') {
      dispatch(checkAuth());
    }
  }, [dispatch, status]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
