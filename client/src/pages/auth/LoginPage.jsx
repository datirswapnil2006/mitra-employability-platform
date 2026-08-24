import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Mail, Lock, ArrowRight, GraduationCap, Shield, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { login } = useAuth();
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
    setSearchParams({ role: newRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
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
        setForgotMsg(res.message || `A new password has been dispatched to ${forgotEmail}. Please check your inbox.`);
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 hero-glow text-[#0F172A]">
      {/* Top Bar with Home Link */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/college-logo.jpg"
            alt="College Logo"
            className="h-9 w-auto rounded-lg object-contain bg-white p-1 border border-slate-200 shadow-xs"
          />
          <div>
            <span className="text-sm font-black tracking-wider text-slate-900">MITRA</span>
            <span className="text-[10px] text-blue-600 font-bold block -mt-1">Employability Portal</span>
          </div>
        </Link>

        <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition">
          ← Back to Homepage
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-6 space-y-2">
            <img
              src="/college-logo.jpg"
              alt="Institutional Logo"
              className="h-14 w-auto mx-auto rounded-xl object-contain bg-white p-1.5 border border-slate-200 shadow-xs mb-3"
            />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isStudent ? 'Student Sign In' : 'Administrator Sign In'}
            </h2>
            <p className="text-xs text-slate-500">
              {isStudent
                ? 'Sign in to access your modules, assessments & placement readiness'
                : 'Sign in to access faculty analytics, student management & exams'}
            </p>
          </div>

          {/* Role Toggle Selector */}
          <div className="mb-6 bg-slate-100 p-1 rounded-2xl flex border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                isStudent
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                !isStudent
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={isStudent ? 'Student Email / Institutional ID *' : 'Administrator Email / Institutional ID *'}
              type="email"
              icon={Mail}
              placeholder={isStudent ? 'student@mitra.edu' : 'admin@mitra.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Password *"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotMsg('');
                    setForgotError('');
                    setForgotModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full justify-center mt-2" loading={loading} icon={ArrowRight}>
              {isStudent ? 'Sign In as Student' : 'Sign In as Administrator'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            {isStudent ? (
              <>
                New student enrolling?{' '}
                <Link to="/register" className="text-blue-600 font-bold hover:underline">
                  Create Student Profile
                </Link>
              </>
            ) : (
              <>
                Faculty or placement access questions?{' '}
                <Link to="/contact" className="text-blue-600 font-bold hover:underline">
                  Contact T&P Department
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-950">
            <KeyRound className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              Enter your registered email address to submit a password reset request. Your request will be forwarded to the Training & Placement (T&P) department for authorization.
            </p>
          </div>

          {forgotMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 font-medium leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{forgotMsg}</span>
            </div>
          )}

          {forgotError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{forgotError}</span>
            </div>
          )}

          {!forgotMsg ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                label="Registered Email Address *"
                type="email"
                icon={Mail}
                placeholder="e.g. student@mitra.edu"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                loading={forgotLoading}
                className="w-full justify-center"
                icon={Mail}
              >
                Submit Reset Request
              </Button>
            </form>
          ) : (
            <Button
              onClick={() => {
                setForgotModalOpen(false);
                setEmail(forgotEmail);
              }}
              className="w-full justify-center"
            >
              Back to Sign In
            </Button>
          )}
        </div>
      </Modal>

      {/* Footer Minimal Notice */}
      <div className="text-center text-[11px] text-slate-400 pb-2 font-medium">
        © 2026 MITRA Employability Portal • Institutional Verified
      </div>
    </div>
  );
};

export default LoginPage;

