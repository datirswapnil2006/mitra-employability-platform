import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mitra_token') || null);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(100);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(res => {
          if (res.success) {
            setUser(res.user);
            if (res.studentProfile) {
              setProfileCompletion(res.studentProfile.profileCompletionPercentage);
            }
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      localStorage.setItem('mitra_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.profileCompletion !== undefined) {
        setProfileCompletion(res.user.profileCompletion);
      }
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('mitra_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.getMe();
    if (res.success) {
      setUser(res.user);
      if (res.studentProfile) {
        setProfileCompletion(res.studentProfile.profileCompletionPercentage);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, profileCompletion, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
