import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { calculateProfileCompletion } from '../utils/profileCompletion';

const AuthContext = createContext();

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity on client

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mitra_token') || null);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(100);
  const [inactivityNotice, setInactivityNotice] = useState(false);

  const lastActivityRef = useRef(Date.now());

  // Logout handler
  const logout = useCallback(async (allDevices = false) => {
    try {
      if (allDevices) {
        await api.logoutAll();
      } else {
        await api.logout();
      }
    } catch (e) {
      console.warn('[Logout]: Network revocation failed, clearing local session.', e);
    } finally {
      localStorage.removeItem('mitra_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    await logout(true);
  }, [logout]);

  // Handle Initial Boot and Silent Session Restoration
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('mitra_token');

      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && isMounted) {
            setUser(res.user);
            if (res.studentProfile) {
              const comp = res.studentProfile.profileCompletionPercentage !== undefined
                ? res.studentProfile.profileCompletionPercentage
                : calculateProfileCompletion(res.studentProfile, res.user);
              setProfileCompletion(comp);
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          // Token expired or invalid, fallback to silent refresh
        }
      }

      // Silent Refresh fallback using HttpOnly cookie
      try {
        const refreshRes = await api.refreshToken();
        if (refreshRes.success && refreshRes.token && isMounted) {
          localStorage.setItem('mitra_token', refreshRes.token);
          setToken(refreshRes.token);
          setUser(refreshRes.user);
          if (refreshRes.user?.profileCompletion !== undefined) {
            setProfileCompletion(refreshRes.user.profileCompletion);
          }
        } else if (isMounted) {
          localStorage.removeItem('mitra_token');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        if (isMounted) {
          localStorage.removeItem('mitra_token');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for global auth expired events from api.js
  useEffect(() => {
    const handleAuthExpired = (e) => {
      setToken(null);
      setUser(null);
      if (e.detail?.reason?.includes('inactivity')) {
        setInactivityNotice(true);
      }
    };

    window.addEventListener('mitra:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('mitra:auth-expired', handleAuthExpired);
    };
  }, []);

  // Inactivity Timeout Detection
  useEffect(() => {
    if (!token || !user) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime > INACTIVITY_TIMEOUT_MS) {
        setInactivityNotice(true);
        logout(false);
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
    };
  }, [token, user, logout]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      localStorage.setItem('mitra_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setInactivityNotice(false);
      lastActivityRef.current = Date.now();
      if (res.user.profileCompletion !== undefined) {
        setProfileCompletion(res.user.profileCompletion);
      }
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('mitra_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setInactivityNotice(false);
      lastActivityRef.current = Date.now();
    }
    return res;
  };

  const refreshUser = async () => {
    const res = await api.getMe();
    if (res.success) {
      setUser(res.user);
      if (res.studentProfile) {
        const comp = res.studentProfile.profileCompletionPercentage !== undefined
          ? res.studentProfile.profileCompletionPercentage
          : calculateProfileCompletion(res.studentProfile, res.user);
        setProfileCompletion(comp);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        profileCompletion,
        inactivityNotice,
        dismissInactivityNotice: () => setInactivityNotice(false),
        login,
        register,
        logout,
        logoutAll,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
