import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Session restore failed:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  const login = async (email, password, userType) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password, userType });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed. Please check credentials.';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
