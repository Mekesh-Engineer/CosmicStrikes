import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  checkAuth, 
  clearError 
} from '../features/auth';

// Custom hook for auth state and actions
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, status, token, error } = useAppSelector((state) => state.auth);

  // Login with email and password
  const login = useCallback(async (email: string, password: string) => {
    const result = await dispatch(loginUser({ email, password }));
    return loginUser.fulfilled.match(result);
  }, [dispatch]);

  // Register new user
  const register = useCallback(async (username: string, email: string, password: string) => {
    const result = await dispatch(registerUser({ username, email, password }));
    return registerUser.fulfilled.match(result);
  }, [dispatch]);

  // Logout
  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  // Check auth on app load
  const checkSession = useCallback(async () => {
    await dispatch(checkAuth());
  }, [dispatch]);

  // Clear any auth errors
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    user,
    status,
    token,
    error,
    
    // Computed
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || status === 'idle',
    
    // Actions
    login,
    register,
    logout,
    checkSession,
    clearAuthError,
  };
};
