import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { Menu, X, ArrowRight, Sparkles, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/training', label: 'Training' },
    { to: '/#practice', label: 'Practice Tests' },
    { to: '/#assessments', label: 'Assessments' },
    { to: '/#resources', label: 'Resources' },
    { to: '/about', label: 'About Us' },
  ];

  const isCurrentActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/#')) return location.pathname === '/' && location.hash === path.slice(1);
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#FFF8E9] text-[#08284B] flex flex-col font-sans selection:bg-[#F8C85A] selection:text-[#08284B]">
      {/* Premium Navy Blue + Gold Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-[#08284B] border-b border-[#F8C85A]/25 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Institutional Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img
              src="/college-logo.jpg"
              alt="Institutional Logo"
              className="h-9 w-auto rounded-md object-contain bg-white p-0.5 border border-[#F8C85A]/40 shadow-xs transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-[#F8C85A] transition-colors">
                  MITRA
                </span>
                <span className="hidden sm:inline-block bg-[#F8C85A]/20 text-[#F8C85A] text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#F8C85A]/40 uppercase tracking-wider">
                  Portal
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-[#FFF8E9]/75 tracking-tight -mt-0.5">
                Employability Training & Assessment
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold text-[#FFF8E9]">
            {navLinks.map((link, idx) => {
              const active = isCurrentActive(link.to);
              return (
                <a
                  key={idx}
                  href={link.to}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                    active
                      ? 'text-[#F8C85A] bg-[#FFF8E9]/10 font-bold'
                      : 'hover:text-[#F8C85A] hover:bg-[#FFF8E9]/5'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop Auth Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#08284B]" />
                  <span>My Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#08284B]" />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-[#F8C85A]/40 bg-[#08284B]/60 hover:bg-[#FFF8E9]/10 text-[#FFF8E9] hover:text-[#F8C85A] hover:border-[#F8C85A] text-xs font-semibold transition cursor-pointer"
                  >
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>Sign Up</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#FFF8E9] hover:text-[#F8C85A] hover:bg-[#FFF8E9]/10 rounded-lg transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#F8C85A]" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#08284B] border-t border-[#F8C85A]/25 px-5 py-5 space-y-4 shadow-xl">
            <div className="space-y-1">
              {navLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-[#FFF8E9] hover:text-[#F8C85A] hover:bg-[#FFF8E9]/10 px-3 py-2 rounded-lg transition"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-[#F8C85A]/20 flex flex-col gap-2">
              {user ? (
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] text-sm font-bold transition shadow-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to My Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#F8C85A]/40 text-[#FFF8E9] hover:text-[#F8C85A] text-sm font-semibold transition"
                    >
                      Login
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] text-sm font-bold transition shadow-sm"
                    >
                      <span>Sign Up</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </>
              )}
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

