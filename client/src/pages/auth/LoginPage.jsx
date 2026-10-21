import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import {
  Mail,
  Lock,
  ArrowRight,
  GraduationCap,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  X,
  Sparkles,
  ShieldCheck,
  Award,
  ArrowLeft
} from 'lucide-react';

export const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { login, logout, inactivityNotice, dismissInactivityNotice } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'admin' || roleParam === 'student') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    setPassword('');
    setSearchParams({ role: newRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password, role);
      if (res.success) {
        // Enforce strict role matching
        if (role && res.user.role !== role) {
          await logout();
          const targetRole = res.user.role === 'admin' ? 'Administrator' : 'Student';
          setError(`This account belongs to an ${targetRole}. You cannot sign in under the ${role === 'admin' ? 'Administrator' : 'Student'} tab. Please switch to the ${targetRole} tab.`);
          return;
        }

        if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // Mandatory Rule: If profile completion < 100%, redirect to profile
          if (res.user.profileCompletion < 100) {
            navigate('/student/profile');
          } else {
            navigate('/student/dashboard');
          }
        }
      } else {
        setError(res.message || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to reach server. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMsg('');
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      if (res.success) {
        setForgotMsg(res.message || 'Password reset request submitted successfully. Please contact the Training & Placement department to enable your password reset.');
      } else {
        setForgotError(res.message || 'Unable to reset password. Please verify the email address.');
      }
    } catch (err) {
      setForgotError('Failed to connect to reset service. Please try again later.');
    } finally {
      setForgotLoading(false);
    }
  };

  const isStudent = role === 'student';

  return (
    <div className="min-h-screen bg-[#FFF8E9] text-[#183451] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#F8C85A] selection:text-[#08284B] relative overflow-hidden">
      
      {/* Ambient background decorative glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F8C85A]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#08284B]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-1 rounded-xl bg-white border border-[#F8C85A]/40 shadow-xs transition-transform group-hover:scale-105">
            <img
              src="/college-logo.jpg"
              alt="Institutional Logo"
              className="h-8 w-auto rounded-lg object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-[#08284B] group-hover:text-[#0c3664] transition-colors">
                MITRA
              </span>
              <span className="bg-[#F8C85A]/20 text-[#08284B] text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#F8C85A]/40 uppercase tracking-wider">
                Portal
              </span>
            </div>
            <span className="text-[10px] font-medium text-[#183451]/75 block -mt-0.5 tracking-tight">
              Employability Training & Assessment
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FFF8E9] text-[#08284B] border border-[#F8C85A]/40 text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#08284B]" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Split-Screen Container */}
      <main className="max-w-6xl w-full mx-auto my-4 sm:my-6 relative z-10">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#F8C85A]/35 grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* Left Branding Panel (Navy Blue #08284B) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#08284B] via-[#0A315C] to-[#051A31] text-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8C85A]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#08284B] rounded-full blur-2xl pointer-events-none" />

            {/* Top Branding Section */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#FFF8E9]/10 border border-[#F8C85A]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#FFF8E9]">
                <Sparkles className="w-3.5 h-3.5 text-[#F8C85A]" />
                <span>Institutional Placement Ecosystem</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Build Skills. Prove Your Potential.{' '}
                <span className="text-[#F8C85A]">Become Career Ready.</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#FFF8E9]/80 leading-relaxed font-normal">
                Sign in to your MITRA account to resume modular curriculum lessons, take AI-grounded diagnostic evaluations, and benchmark your campus recruitment score.
              </p>
            </div>

            {/* Middle Feature Highlights with Student Illustration */}
            <div className="relative z-10 my-6 space-y-4">
              {/* Framed student illustration */}
              <div className="rounded-xl overflow-hidden border border-[#F8C85A]/35 shadow-lg bg-[#08284B]">
                <img
                  src="/student_career_hero.jpg"
                  alt="Students Preparing for Career Readiness"
                  className="w-full h-36 sm:h-44 object-cover object-center"
                />
              </div>

              {/* Trust bullets */}
              <div className="space-y-2 text-xs text-[#FFF8E9]/85">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#F8C85A] shrink-0" />
                  <span>9 Academic Engineering & Tech Departments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F8C85A] shrink-0" />
                  <span>Curriculum-Grounded Gemini AI Diagnostics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F8C85A] shrink-0" />
                  <span>100% Profile Gated & Placement Benchmarked</span>
                </div>
              </div>
            </div>

            {/* Bottom Panel Notice */}
            <div className="relative z-10 pt-4 border-t border-[#FFF8E9]/15 flex items-center justify-between text-[11px] text-[#FFF8E9]/65">
              <span>© 2026 MITRA Platform</span>
              <Link to="/contact" className="hover:text-[#F8C85A] transition-colors">
                Placement Support →
              </Link>
            </div>
          </div>

          {/* Right Form Panel (Cream Background with Clean White Form Card) */}
          <div className="lg:col-span-7 bg-[#FFF8E9]/40 p-6 sm:p-9 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-6">
              
              {/* Form Header */}
              <div className="space-y-1.5 text-left">
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#08284B]/10 text-[#08284B] text-[11px] font-bold uppercase tracking-wider">
                  {isStudent ? 'Student Access' : 'Administrative Access'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#08284B] tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-[#183451]/75 leading-relaxed">
                  {isStudent
                    ? 'Enter your institutional credentials to access training modules, tests, and readiness analytics.'
                    : 'Enter your administrator credentials to access faculty analytics and candidate management.'}
                </p>
              </div>

              {/* Student / Admin Role Toggle */}
              <div className="bg-[#FFF8E9] p-1.5 rounded-2xl flex border border-[#F8C85A]/40 shadow-xs gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRoleChange('student')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    isStudent
                      ? 'bg-[#08284B] text-[#F8C85A] shadow-md border border-[#08284B]'
                      : 'text-[#183451] hover:text-[#08284B] hover:bg-white/60'
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Student Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    !isStudent
                      ? 'bg-[#08284B] text-[#F8C85A] shadow-md border border-[#08284B]'
                      : 'text-[#183451] hover:text-[#08284B] hover:bg-white/60'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Administrator</span>
                </button>
              </div>

              {/* Inactivity Notification */}
              {inactivityNotice && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between font-medium shadow-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Your session expired due to inactivity. Please sign in again.</span>
                  </div>
                  <button
                    type="button"
                    onClick={dismissInactivityNotice}
                    className="text-amber-700 hover:text-amber-900 ml-2 p-0.5 rounded hover:bg-amber-100 transition"
                    aria-label="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Error Message Alert */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 font-medium shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    label={isStudent ? 'Institutional Email / Student ID *' : 'Administrator Email *'}
                    type="email"
                    icon={Mail}
                    placeholder={isStudent ? 'student@mitra.edu' : 'admin@mitra.edu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20"
                  />
                </div>

                <div>
                  <div className="relative">
                    <Input
                      label="Password *"
                      type={showPassword ? 'text' : 'password'}
                      icon={Lock}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-8 text-slate-400 hover:text-[#08284B] focus:outline-none transition-colors cursor-pointer"
                      tabIndex="-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Remember Me and Forgot Password Row */}
                  <div className="flex items-center justify-between mt-2.5 text-xs">
                    <label className="flex items-center gap-2 text-[#183451] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#08284B] focus:ring-[#08284B] border-slate-300 accent-[#08284B]"
                      />
                      <span>Remember Me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotMsg('');
                        setForgotError('');
                        setForgotModalOpen(true);
                      }}
                      className="font-bold text-[#08284B] hover:text-[#0c3664] hover:underline transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Submit Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#08284B] hover:bg-[#0c3664] text-[#F8C85A] font-bold text-sm shadow-md transition-all duration-200 border border-[#F8C85A]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#F8C85A] border-t-transparent" />
                      <span>Verifying Credentials...</span>
                    </span>
                  ) : (
                    <>
                      <span>{isStudent ? 'Sign In as Student' : 'Sign In as Administrator'}</span>
                      <ArrowRight className="w-4 h-4 text-[#F8C85A]" />
                    </>
                  )}
                </button>
              </form>

              {/* Registration Link / Alternative Assistance */}
              <div className="pt-4 border-t border-[#F8C85A]/30 text-center text-xs text-[#183451]/80">
                {isStudent ? (
                  <>
                    New student enrolling?{' '}
                    <Link
                      to="/register"
                      className="text-[#08284B] font-extrabold hover:text-[#0c3664] underline underline-offset-2 transition-colors"
                    >
                      Create Student Profile
                    </Link>
                  </>
                ) : (
                  <>
                    Faculty coordinator or placement cell queries?{' '}
                    <Link
                      to="/contact"
                      className="text-[#08284B] font-extrabold hover:text-[#0c3664] underline underline-offset-2 transition-colors"
                    >
                      Contact T&P Department
                    </Link>
                  </>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-[#183451]">
          <div className="flex items-center gap-3 p-3.5 bg-[#FFF8E9] border border-[#F8C85A]/40 rounded-2xl text-xs text-[#183451]">
            <KeyRound className="w-5 h-5 text-[#08284B] shrink-0" />
            <p className="text-[11px] leading-relaxed">
              {isStudent
                ? 'Enter your registered email address to submit a password reset request to the Training & Placement department.'
                : 'Enter your registered administrator email address to receive a secure password reset link.'}
            </p>
          </div>

          {forgotMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 font-medium leading-relaxed shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{forgotMsg}</span>
            </div>
          )}

          {forgotError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{forgotError}</span>
            </div>
          )}

          {!forgotMsg ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                label="Registered Institutional Email Address *"
                type="email"
                icon={Mail}
                placeholder={isStudent ? 'student@mitra.edu' : 'admin@mitra.edu'}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="bg-white border-[#F8C85A]/40 text-[#183451]"
              />

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#08284B] hover:bg-[#0c3664] text-[#F8C85A] font-bold text-xs sm:text-sm border border-[#F8C85A]/30 shadow-xs cursor-pointer transition"
              >
                {forgotLoading ? 'Submitting Request...' : 'Submit Password Reset Request'}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setForgotModalOpen(false);
                setEmail(forgotEmail);
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#08284B] hover:bg-[#0c3664] text-[#F8C85A] font-bold text-xs sm:text-sm border border-[#F8C85A]/30 shadow-xs cursor-pointer transition"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </Modal>

      {/* Footer Minimal Notice */}
      <footer className="text-center py-2 relative z-10 text-[11px] text-[#183451]/60">
        <p>© 2026 MITRA Employability Platform. Dedicated to Student Career Readiness.</p>
      </footer>

    </div>
  );
};

export default LoginPage;
