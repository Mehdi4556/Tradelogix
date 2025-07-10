import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios default base URL (ensure no trailing slash)
axios.defaults.baseURL = API_BASE_URL.replace(/\/$/, '');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token validity
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await axios.get('/auth/me');
      console.log('User data from API:', response.data.data.user);
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token: newToken, data } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(data.user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      // Split the name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName; // Use firstName as lastName if no last name provided
      
      const payload = { 
        username: name,
        firstName,
        lastName,
        email, 
        password 
      };
      
      console.log('🚀 Signup payload:', payload);
      console.log('📡 API URL:', `${API_BASE_URL}/auth/register`);
      
      const response = await axios.post('/auth/register', payload);
      const { token: newToken, data } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(data.user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('❌ Signup error:', error);
      console.error('📋 Error response:', error.response?.data);
      console.error('🔍 Error status:', error.response?.status);
      
      return { 
        success: false, 
        error: error.response?.data?.message || `Signup failed (${error.response?.status || 'Unknown'})` 
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await axios.patch('/auth/update-me', profileData);
      setUser(response.data.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    signup,
    logout,
    updateProfile,
    loading,
    isAuthenticated: !!user
  }), [user, login, signup, logout, updateProfile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 