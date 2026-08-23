import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Button from '../components/Button';

export const StudentLayout = () => {
  const { user, token, loading, profileCompletion } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('mitra_sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('mitra_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      handleToggleCollapse();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Connecting to MITRA Student Ecosystem...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const isProfilePage = location.pathname === '/student/profile';
  const isGated = profileCompletion < 100 && !isProfilePage;

  return (
    <div
      className="flex min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: 'var(--page-bg, #F8FAFC)',
        color: 'var(--text-primary, #0F172A)'
      }}
    >
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={handleMenuToggle} />

        {/* Profile Completion Warning Banner */}
        {profileCompletion < 100 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Profile Incomplete ({profileCompletion}%):</strong> Complete all required fields to 100% to unlock MITRA training modules and assessments.
              </span>
            </div>
            {!isProfilePage && (
              <Link to="/student/profile" className="shrink-0">
                <Button size="sm" variant="warning" icon={ArrowRight}>
                  Complete Profile
                </Button>
              </Link>
            )}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* Profile Gating Interceptor: Mandatory 100% Profile Completion Rule */}
          {isGated ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 border border-amber-200 shadow-xl space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">100% Profile Completion Required</h2>
                <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">
                  Your profile completion is currently at <strong className="text-amber-700">{profileCompletion}%</strong>. In accordance with MITRA institutional regulations, all required academic and portfolio details must reach <strong className="text-slate-900">100%</strong> before you can access the student dashboard, training modules, assessments, and psychometric evaluation.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/student/profile">
                  <Button size="lg" variant="primary" icon={ArrowRight} className="shadow-lg shadow-blue-600/20">
                    Complete Required Profile Fields ({profileCompletion}%)
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
