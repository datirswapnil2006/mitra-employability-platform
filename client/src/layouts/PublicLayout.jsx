import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { Menu, X, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { to: '/training', label: 'Training' },
    { to: '/#features', label: 'Capabilities' },
    { to: '/#how-it-works', label: 'How It Works' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Compact & Modern Public Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          {/* Institutional & Product Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/college-logo.jpg"
              alt="College Logo"
              className="h-8 w-auto rounded-md object-contain bg-white p-0.5 border border-slate-200 shadow-2xs"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-base font-medium tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                MITRA Employability Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.to}
                className="hover:text-blue-600 transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
                <Button size="sm" variant="primary" icon={ArrowRight} className="h-8 text-xs font-bold shadow-xs">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold text-slate-700 hover:text-slate-900">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="primary" icon={ArrowRight} className="h-8 text-xs font-bold shadow-xs">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 shadow-lg">
            <div className="space-y-2">
              {navLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700 hover:text-blue-600 py-1.5"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" variant="outline" className="w-full justify-center">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" variant="primary" className="w-full justify-center">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Institutional Multi-Column Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;
