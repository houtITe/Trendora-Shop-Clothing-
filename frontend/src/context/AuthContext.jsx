import { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiRequestError } from '../services/api.js';

const AuthContext = createContext();

function toFrontendUser(dbUser) {
  if (!dbUser) return null;
  const [firstName, ...rest] = (dbUser.name || '').split(' ');
  return {
    id: dbUser.user_id,
    user_id: dbUser.user_id,
    firstName: firstName || dbUser.name,
    lastName: rest.join(' '),
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    phone: dbUser.phone,
    address: dbUser.address,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/auth/me');
        setUser(toFrontendUser(data.user));
        setIsAuthenticated(true);
      } catch (e) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      const loggedInUser = toFrontendUser(data.user);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true, user: loggedInUser };
    } catch (e) {
      const message = e instanceof ApiRequestError ? e.message : 'Something went wrong. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (firstName, lastName, email, password) => {
    try {
      const name = `${firstName} ${lastName}`.trim();
      const data = await api.post('/auth/register', { name, email, password });
      const newUser = toFrontendUser(data.user);
      return { success: true, user: newUser };
    } catch (e) {
      const message = e instanceof ApiRequestError ? e.message : 'Something went wrong. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore — clear local state below regardless
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(toFrontendUser(data.user));
      return data.user;
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};