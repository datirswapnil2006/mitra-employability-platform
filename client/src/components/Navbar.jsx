import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Badge from './Badge';
import { LogOut, Menu, ShieldAlert, Bell, GraduationCap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = ({ onMenuToggle }) => {
  const { user, profileCompletion, logout } = useAuth();
  const isStudent = user && user.role === 'student';
  const isAdmin = user && user.role === 'admin';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Toggle & Brand Context */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
            aria-label="Toggle Sidebar Navigation"
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
          <span className="text-sm font-black tracking-wider text-slate-900">MITRA</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <Badge variant={isAdmin ? 'warning' : 'primary'} className="flex items-center gap-1.5">
            {isAdmin ? <Shield className="w-3.5 h-3.5 text-indigo-600" /> : <GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isAdmin ? 'Administrative Rights' : `${user?.department || 'CSE'} Department`}</span>
          </Badge>
        </div>
      </div>

      {/* Right: Profile Indicator & User Controls */}
      <div className="flex items-center gap-3">
        {/* Profile Completion Indicator for Student */}
        {isStudent && (
          <Link
            to="/student/profile"
            className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition text-xs shadow-xs"
          >
            <span className="text-slate-600 font-medium hidden md:inline">Profile:</span>
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

        {/* User Profile Chip */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role} Access</p>
          </div>
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-blue-200 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            icon={LogOut}
            onClick={logout}
            title="Sign Out of MITRA Portal"
            className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
