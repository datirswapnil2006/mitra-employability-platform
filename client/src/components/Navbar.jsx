import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from './Button';
import Badge from './Badge';
import {
  LogOut,
  Menu,
  ShieldAlert,
  Bell,
  GraduationCap,
  Shield,
  Palette,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../services/api';

export const Navbar = ({ onMenuToggle }) => {
  const { user, profileCompletion, logout, logoutAll } = useAuth();
  const { preferences, effectiveMode, isDark, openCustomizer, updateTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isStudent = user && user.role === 'student';
  const isAdmin = user && user.role === 'admin';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    updateTheme({ mode: isDark ? 'light' : 'dark' });
  };

  return (
    <header
      className="h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg, rgba(255, 255, 255, 0.95))',
        borderColor: 'var(--header-border, #E2E8F0)',
        color: 'var(--text-primary, #0F172A)'
      }}
    >
      {/* Left: Menu Toggle & Brand Context */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800 cursor-pointer shadow-2xs"
            aria-label="Toggle Sidebar Navigation"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link
          to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
          className="flex items-center gap-2.5 md:hidden"
        >
          <img
            src="/college-logo.jpg"
            alt="MITRA Logo"
            className="h-8 w-auto rounded-md object-contain bg-white p-0.5 border border-slate-200 shadow-xs"
          />
          <span className="text-sm font-black tracking-wider text-slate-900 dark:text-white">MITRA</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <Badge variant={isAdmin ? 'warning' : 'primary'} className="flex items-center gap-1.5">
            {isAdmin ? <Shield className="w-3.5 h-3.5 text-indigo-600" /> : <GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isAdmin ? 'Administrative Rights' : `${user?.department || 'CSE'} Department`}</span>
          </Badge>
        </div>
      </div>

      {/* Right: Theme Quick Action, Profile Indicator & User Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Theme Customizer Trigger */}
        <button
          type="button"
          onClick={openCustomizer}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shadow-2xs group"
          title="Customize Dashboard Theme"
        >
          <div
            className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/50"
            style={{ backgroundColor: 'var(--primary-color, #2563EB)' }}
          />
          <Palette className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
          <span className="text-xs font-bold hidden lg:inline">Theme</span>
        </button>

        {/* Quick Light/Dark Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800 shadow-2xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile Completion Indicator for Student */}
        {isStudent && (
          <Link
            to="/student/profile"
            className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition text-xs shadow-xs"
          >
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden md:inline">Profile:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                profileCompletion === 100 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {profileCompletion < 100 && <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />}
              {profileCompletion}%
            </span>
          </Link>
        )}

        {/* User Profile Dropdown Menu */}
        <div className="relative pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
          >
            {user?.profilePhoto ? (
              <img
                src={getMediaUrl(user.profilePhoto)}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs"
                style={{ backgroundColor: 'var(--primary-color, #2563EB)' }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold truncate max-w-[130px]" style={{ color: 'var(--text-primary, #0F172A)' }}>
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] capitalize" style={{ color: 'var(--text-secondary, #64748B)' }}>
                {user?.role} Access
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Popover */}
          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-3xl border shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{
                backgroundColor: 'var(--card-bg, #FFFFFF)',
                borderColor: 'var(--card-border, #E2E8F0)',
                color: 'var(--text-primary, #0F172A)'
              }}
            >
              {/* User Header Info */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                <p className="text-xs font-black truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    {user?.role}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {user?.department || 'CSE'}
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5">
                {isStudent && (
                  <Link
                    to="/student/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Student Profile</span>
                  </Link>
                )}

                {/* Theme Customization Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    openCustomizer();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4" style={{ color: 'var(--primary-color, #2563EB)' }} />
                    <span>Customize Theme</span>
                  </div>
                  <div
                    className="w-3.5 h-3.5 rounded-full shadow-2xs border border-white"
                    style={{ backgroundColor: 'var(--primary-color, #2563EB)' }}
                  />
                </button>

                {/* Light / Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    toggleDarkMode();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {effectiveMode}
                  </span>
                </button>

                {isStudent && (
                  <Link
                    to="/student/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                )}
              </div>

              {/* Logout Option */}
              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logoutAll();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 dark:text-slate-400 dark:hover:bg-rose-950/20 transition cursor-pointer"
                  title="Terminate all active sessions on other computers or phones"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Sign Out All Devices</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
