import { useAppSelector } from '../store';

// Custom hook for profile state
export const useProfile = () => {
  const { highScore, recentScores, settings } = useAppSelector((state) => state.profile);

  return {
    highScore,
    recentScores,
    settings,
  };
};
