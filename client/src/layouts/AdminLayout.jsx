import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = () => {
  const { user, token, loading } = useAuth();
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
          <span className="text-xs">Initializing MITRA Admin Console...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

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
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
