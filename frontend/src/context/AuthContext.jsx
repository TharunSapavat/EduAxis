import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Cookie is automatically sent with requests
        // Just restore user data from localStorage
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error restoring user session:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData) => {
    if (!userData || !userData.role) {
      console.error('Valid user data with role is required for login');
      return false; // Return false to indicate login failed
    }
    
    setUser(userData);
    setIsAuthenticated(true);
    // Cookie is set automatically by backend, we just store user info
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Navigate to appropriate dashboard
    if (userData.role === 'student') {
      navigate('/student/home');
    } else if (userData.role === 'teacher') {
      navigate('/teacher/home');
    } else if (userData.role === 'admin') {
      navigate('/admin/home');
    }
    
    return true; // Return true to indicate successful login
  };

  const logout = async () => {
    try {
      // Call backend to clear cookie
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear frontend state regardless of API call result
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      // Navigate to landing page
      navigate('/');
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
