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
    { to: '/', label: 'Home' },
    { to: '/#features', label: 'Features' },
    { to: '/training', label: 'Training' },
    { to: '/#how-it-works', label: 'How It Works' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Sticky Public Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Institutional & Product Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/college-logo.jpg"
              alt="College Logo"
              className="h-10 w-auto rounded-lg object-contain bg-white p-1 border border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-wider text-slate-900">MITRA</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                  PORTAL
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500">Employability Platform</p>
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
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
                <Button size="sm" variant="primary" icon={ArrowRight}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" variant="outline">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="primary" icon={ArrowRight}>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
