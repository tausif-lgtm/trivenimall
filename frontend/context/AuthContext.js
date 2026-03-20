import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getUser, getUserFromToken, saveToken, saveUser, removeToken, isAuthenticated } from '../lib/auth';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = () => {
    if (isAuthenticated()) {
      const storedUser = getUser() || getUserFromToken();
      setUser(storedUser);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data;
    saveToken(token);
    saveUser(userData);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const updateUserData = (updatedUser) => {
    saveUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserData, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
