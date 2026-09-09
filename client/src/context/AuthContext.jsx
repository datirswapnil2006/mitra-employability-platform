import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { calculateProfileCompletion } from '../utils/profileCompletion';

const AuthContext = createContext();

const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours of inactivity on client

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mitra_token') || null);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [inactivityNotice, setInactivityNotice] = useState(false);

  const lastActivityRef = useRef(
    parseInt(localStorage.getItem('mitra_last_activity') || String(Date.now()), 10)
  );

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
      localStorage.removeItem('mitra_last_activity');
      setToken(null);
      setUser(null);
      setProfileCompletion(0);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    await logout(true);
  }, [logout]);

  // Handle Initial Boot and Silent Session Restoration
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedLastActivity = parseInt(localStorage.getItem('mitra_last_activity') || '0', 10);
      if (storedLastActivity && Date.now() - storedLastActivity > INACTIVITY_TIMEOUT_MS) {
        localStorage.removeItem('mitra_token');
        localStorage.removeItem('mitra_last_activity');
        setInactivityNotice(true);
        if (isMounted) setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem('mitra_token');

      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && isMounted) {
            setUser(res.user);
            const now = Date.now();
            lastActivityRef.current = now;
            localStorage.setItem('mitra_last_activity', String(now));

            if (res.studentProfile) {
              const comp = res.studentProfile.profileCompletionPercentage !== undefined
                ? res.studentProfile.profileCompletionPercentage
                : calculateProfileCompletion(res.studentProfile, res.user);
              setProfileCompletion(comp);
            } else if (res.user?.profileCompletion !== undefined) {
              setProfileCompletion(res.user.profileCompletion);
            } else {
              setProfileCompletion(res.user?.role === 'admin' ? 100 : 0);
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
          const now = Date.now();
          lastActivityRef.current = now;
          localStorage.setItem('mitra_last_activity', String(now));

          setToken(refreshRes.token);
          setUser(refreshRes.user);
          if (refreshRes.user?.profileCompletion !== undefined) {
            setProfileCompletion(refreshRes.user.profileCompletion);
          } else if (refreshRes.studentProfile?.profileCompletionPercentage !== undefined) {
            setProfileCompletion(refreshRes.studentProfile.profileCompletionPercentage);
          } else {
            setProfileCompletion(refreshRes.user?.role === 'admin' ? 100 : 0);
          }
        } else if (isMounted) {
          localStorage.removeItem('mitra_token');
          localStorage.removeItem('mitra_last_activity');
          setToken(null);
          setUser(null);
          setProfileCompletion(0);
        }
      } catch (e) {
        if (isMounted) {
          localStorage.removeItem('mitra_token');
          localStorage.removeItem('mitra_last_activity');
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
      localStorage.removeItem('mitra_last_activity');
      if (e.detail?.reason?.includes('inactivity')) {
        setInactivityNotice(true);
      }
    };

    window.addEventListener('mitra:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('mitra:auth-expired', handleAuthExpired);
    };
  }, []);

  // Inactivity Timeout Detection (24 Hours)
  useEffect(() => {
    if (!token || !user) return;

    const updateActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      const lastSaved = parseInt(localStorage.getItem('mitra_last_activity') || '0', 10);
      if (now - lastSaved > 60 * 1000) {
        localStorage.setItem('mitra_last_activity', String(now));
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime > INACTIVITY_TIMEOUT_MS) {
        setInactivityNotice(true);
        logout(false);
      }
    }, 60 * 1000); // Check every 60 seconds

    return () => {
      clearInterval(interval);
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
    };
  }, [token, user, logout]);

  const login = async (email, password, role) => {
    const res = await api.login(email, password, role);
    if (res.success) {
      const now = Date.now();
      localStorage.setItem('mitra_token', res.token);
      localStorage.setItem('mitra_last_activity', String(now));
      lastActivityRef.current = now;
      setToken(res.token);
      setUser(res.user);
      setInactivityNotice(false);
      if (res.user?.profileCompletion !== undefined) {
        setProfileCompletion(res.user.profileCompletion);
      } else if (res.studentProfile?.profileCompletionPercentage !== undefined) {
        setProfileCompletion(res.studentProfile.profileCompletionPercentage);
      } else {
        setProfileCompletion(res.user?.role === 'admin' ? 100 : 0);
      }
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      const now = Date.now();
      localStorage.setItem('mitra_token', res.token);
      localStorage.setItem('mitra_last_activity', String(now));
      lastActivityRef.current = now;
      setToken(res.token);
      setUser(res.user);
      setInactivityNotice(false);
      if (res.user?.profileCompletion !== undefined) {
        setProfileCompletion(res.user.profileCompletion);
      } else if (res.studentProfile?.profileCompletionPercentage !== undefined) {
        setProfileCompletion(res.studentProfile.profileCompletionPercentage);
      } else {
        setProfileCompletion(res.user?.role === 'admin' ? 100 : 25);
      }
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
      } else if (res.user?.profileCompletion !== undefined) {
        setProfileCompletion(res.user.profileCompletion);
      } else {
        setProfileCompletion(res.user?.role === 'admin' ? 100 : 0);
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
