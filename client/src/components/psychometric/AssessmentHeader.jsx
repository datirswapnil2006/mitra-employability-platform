import React, { useState } from 'react';
import { Bell, GraduationCap, Sparkles, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../../services/api';

export const AssessmentHeader = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const studentName = user?.name || 'Student Candidate';
  const department = user?.department || 'Engineering';
  const batch = user?.batch || '2026';

  return (
    <header className="bg-white border-b border-slate-200/90 shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: MITRA Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/student/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-0.5 shadow-sm shadow-indigo-600/20 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-black text-indigo-700 text-sm tracking-tighter group-hover:scale-105 transition-transform">
                M
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-sm text-slate-900 tracking-tight block leading-none">
                MITRA
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                Employability Portal
              </span>
            </div>
          </Link>

          <div className="hidden md:block h-6 w-px bg-slate-200" />
        </div>

        {/* Center: Assessment Context Badge & Title */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
              AI Talent Assessment
            </h1>
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate hidden xs:block">
            Psychometric & Behavioral Profiling
          </p>
        </div>

        {/* Right: Notifications & Student Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Notification Icon */}
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition border border-transparent hover:border-slate-200 relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
          </button>

          {/* Student Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-2xl hover:bg-slate-50 border border-slate-200/80 transition cursor-pointer"
            >
              {user?.profilePhoto ? (
                <img
                  src={getMediaUrl(user.profilePhoto)}
                  alt={studentName}
                  className="w-8 h-8 rounded-xl object-cover border border-indigo-200 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {studentName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="text-left hidden lg:block pr-1">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[130px] leading-tight">
                  {studentName}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                  {department} • {batch}
                </p>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-black text-slate-900">{studentName}</p>
                    <p className="text-[11px] text-slate-500">{user?.email || 'student@mitra.edu'}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-600">
                      <GraduationCap className="w-3 h-3" />
                      <span>{department} • Batch {batch}</span>
                    </div>
                  </div>

                  <Link
                    to="/student/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Student Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AssessmentHeader;
