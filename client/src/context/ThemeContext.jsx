import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

export const PRESET_PRIMARY_COLORS = [
  { id: 'blue', label: 'Blue (MITRA Default)', hex: '#2563EB', ring: 'ring-blue-500' },
  { id: 'green', label: 'Emerald Green', hex: '#16A34A', ring: 'ring-green-500' },
  { id: 'purple', label: 'Royal Purple', hex: '#9333EA', ring: 'ring-purple-500' },
  { id: 'orange', label: 'Vibrant Orange', hex: '#EA580C', ring: 'ring-orange-500' },
  { id: 'red', label: 'Crimson Red', hex: '#DC2626', ring: 'ring-red-500' },
  { id: 'teal', label: 'Deep Teal', hex: '#0D9488', ring: 'ring-teal-500' },
  { id: 'pink', label: 'Fuchsia Pink', hex: '#DB2777', ring: 'ring-pink-500' },
  { id: 'neutral', label: 'Neutral Slate', hex: '#334155', ring: 'ring-slate-500' }
];

export const PRESET_SIDEBAR_THEMES = [
  {
    id: 'default',
    label: 'Default Slate',
    desc: 'Deep slate background with crisp contrast',
    bg: '#0F172A',
    text: '#94A3B8',
    activeBg: 'var(--primary-color)',
    activeText: '#FFFFFF',
    border: '#1E293B'
  },
  {
    id: 'dark',
    label: 'Midnight Dark',
    desc: 'Ultra-dark contrast for focused workflow',
    bg: '#090D16',
    text: '#64748B',
    activeBg: 'var(--primary-color)',
    activeText: '#FFFFFF',
    border: '#182030'
  },
  {
    id: 'light',
    label: 'Clean Light',
    desc: 'Bright minimalism with subtle border',
    bg: '#FFFFFF',
    text: '#475569',
    activeBg: 'var(--primary-color)',
    activeText: '#FFFFFF',
    border: '#E2E8F0'
  },
  {
    id: 'custom',
    label: 'Custom / Accent',
    desc: 'User specified background hex color',
    bg: '#1E1B4B',
    text: '#A5B4FC',
    activeBg: 'var(--primary-color)',
    activeText: '#FFFFFF',
    border: '#312E81'
  }
];

const DEFAULT_PREFERENCES = {
  mode: 'light', // 'light' | 'dark' | 'system'
  primaryColor: '#2563EB',
  sidebarColor: 'default',
  customPrimaryColor: '',
  customSidebarColor: ''
};

// Helper: Convert hex to rgb
function hexToRgb(hex) {
  if (!hex) return { r: 37, g: 99, b: 235 };
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 37, g: 99, b: 235 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Helper: Darken or lighten color for hover states
function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || 'guest';

  // Get initial preferences from localStorage cache or fallback
  const getInitialPreferences = () => {
    try {
      const cached = localStorage.getItem(`mitra_theme_preferences_${userId}`);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  };

  const [preferences, setPreferences] = useState(getInitialPreferences);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Sync with user profile on login or user switch
  useEffect(() => {
    if (user?.themePreferences) {
      const merged = {
        mode: user.themePreferences.mode || 'light',
        primaryColor: user.themePreferences.primaryColor || '#2563EB',
        sidebarColor: user.themePreferences.sidebarColor || 'default',
        customPrimaryColor: user.themePreferences.customPrimaryColor || '',
        customSidebarColor: user.themePreferences.customSidebarColor || ''
      };
      setPreferences(merged);
      try {
        localStorage.setItem(`mitra_theme_preferences_${userId}`, JSON.stringify(merged));
      } catch {
        // ignore
      }
    } else if (userId !== 'guest') {
      // Check if localStorage has saved theme for this user
      try {
        const cached = localStorage.getItem(`mitra_theme_preferences_${userId}`);
        if (cached) {
          setPreferences(JSON.parse(cached));
        } else {
          setPreferences(DEFAULT_PREFERENCES);
        }
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
  }, [userId, user?.themePreferences]);

  // Determine effective theme mode (light vs dark)
  const [effectiveMode, setEffectiveMode] = useState('light');

  useEffect(() => {
    const updateEffectiveMode = () => {
      if (preferences.mode === 'system') {
        const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveMode(isSystemDark ? 'dark' : 'light');
      } else {
        setEffectiveMode(preferences.mode || 'light');
      }
    };

    updateEffectiveMode();

    if (preferences.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateEffectiveMode();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [preferences.mode]);

  // Apply CSS Variables to Document Root
  useEffect(() => {
    const root = document.documentElement;
    const isDark = effectiveMode === 'dark';

    // 1. Primary Colors
    const primaryHex = preferences.primaryColor || '#2563EB';
    const { r, g, b } = hexToRgb(primaryHex);
    const primaryHover = adjustBrightness(primaryHex, -12);
    const primaryLight = `rgba(${r}, ${g}, ${b}, 0.12)`;
    const primaryRing = `rgba(${r}, ${g}, ${b}, 0.35)`;

    root.style.setProperty('--primary-color', primaryHex);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--primary-light', primaryLight);
    root.style.setProperty('--primary-ring', primaryRing);
    root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);

    // 2. Sidebar Colors
    let sidebarPreset = PRESET_SIDEBAR_THEMES.find(s => s.id === preferences.sidebarColor) || PRESET_SIDEBAR_THEMES[0];
    let sidebarBg = sidebarPreset.bg;
    let sidebarText = sidebarPreset.text;
    let sidebarBorder = sidebarPreset.border;
    let sidebarActiveBg = primaryHex;
    let sidebarActiveText = '#FFFFFF';

    if (preferences.sidebarColor === 'custom' && preferences.customSidebarColor) {
      sidebarBg = preferences.customSidebarColor;
      const sbRgb = hexToRgb(sidebarBg);
      // Determine if custom sidebar is dark or light based on luminance
      const luminance = (0.299 * sbRgb.r + 0.587 * sbRgb.g + 0.114 * sbRgb.b) / 255;
      sidebarText = luminance > 0.5 ? '#475569' : '#94A3B8';
      sidebarBorder = luminance > 0.5 ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)';
    }

    root.style.setProperty('--sidebar-bg', sidebarBg);
    root.style.setProperty('--sidebar-text', sidebarText);
    root.style.setProperty('--sidebar-border', sidebarBorder);
    root.style.setProperty('--sidebar-active-bg', sidebarActiveBg);
    root.style.setProperty('--sidebar-active-text', sidebarActiveText);

    // 3. Dark/Light Mode Data Attributes & Theme Variables
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      root.classList.add('dark');
      root.style.setProperty('--page-bg', '#0B1120');
      root.style.setProperty('--card-bg', '#111827');
      root.style.setProperty('--card-border', '#1F2937');
      root.style.setProperty('--text-primary', '#F9FAFB');
      root.style.setProperty('--text-secondary', '#9CA3AF');
      root.style.setProperty('--header-bg', 'rgba(17, 24, 39, 0.95)');
      root.style.setProperty('--header-border', '#1F2937');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--page-bg', '#F8FAFC');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--card-border', '#E2E8F0');
      root.style.setProperty('--text-primary', '#0F172A');
      root.style.setProperty('--text-secondary', '#64748B');
      root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--header-border', '#E2E8F0');
    }
  }, [preferences, effectiveMode]);

  // Update theme settings handler
  const updateTheme = useCallback((newPartial) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPartial };

      // Cache locally for immediate load on next refresh
      try {
        localStorage.setItem(`mitra_theme_preferences_${userId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }

      // Persist to backend if logged in
      if (user) {
        api.updateThemePreferences(updated).catch((err) => {
          console.warn('[ThemeContext] Failed to persist theme to backend:', err);
        });
      }

      return updated;
    });
  }, [userId, user]);

  const resetTheme = useCallback(() => {
    updateTheme(DEFAULT_PREFERENCES);
  }, [updateTheme]);

  const openCustomizer = useCallback(() => setIsCustomizerOpen(true), []);
  const closeCustomizer = useCallback(() => setIsCustomizerOpen(false), []);
  const toggleCustomizer = useCallback(() => setIsCustomizerOpen(prev => !prev), []);

  const value = useMemo(() => ({
    preferences,
    effectiveMode,
    isDark: effectiveMode === 'dark',
    isCustomizerOpen,
    openCustomizer,
    closeCustomizer,
    toggleCustomizer,
    updateTheme,
    resetTheme,
    PRESET_PRIMARY_COLORS,
    PRESET_SIDEBAR_THEMES
  }), [preferences, effectiveMode, isCustomizerOpen, openCustomizer, closeCustomizer, toggleCustomizer, updateTheme, resetTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
