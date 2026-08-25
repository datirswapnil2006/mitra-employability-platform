import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();

  // Extract token from multiple potential locations (query param, route param, or hash)
  const getToken = () => {
    const queryToken = searchParams.get('token') || searchParams.get('resetToken') || searchParams.get('t');
    if (queryToken) return queryToken.trim();

    if (routeParams?.token) return routeParams.token.trim();

    // Fallback: check window location directly for malformed hash/query strings
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const rawQueryToken = urlParams.get('token') || urlParams.get('resetToken');
      if (rawQueryToken) return rawQueryToken.trim();

      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?')));
        const rawHashToken = hashParams.get('token') || hashParams.get('resetToken');
        if (rawHashToken) return rawHashToken.trim();
      }
    } catch (_) {}

    return '';
  };

  const token = getToken();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No reset token provided. Please make sure you opened the complete link from your email.');
      return;
    }

    // Pre-verify token in background to get student info
    api.verifyResetToken(token)
      .then(res => {
        if (res.success) {
          setStudentInfo(res.student);
          setError('');
        } else {
          setError(res.message || 'This password reset link may be invalid or expired.');
        }
      })
      .catch(() => {
        // Silently ignore pre-verification network hiccups; actual submission will perform authoritative check
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing. Please click the reset link sent to your email.');
      return;
    }

    if (!newPassword.trim()) {
      setError('New password cannot be empty.');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Confirm password cannot be empty.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(token, newPassword, confirmPassword);
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset successfully. You can now log in using your new password.');
      } else {
        setError(res.message || 'Failed to reset password. Please verify the reset link or request a new one.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="text-center mb-6 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Create New Password</h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {studentInfo?.name
                ? `Hello ${studentInfo.name}, enter your new password below.`
                : 'Enter your new password below to regain portal access.'}
            </p>
          </div>

          {/* Success State */}
          {successMsg ? (
            <div className="space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-3 font-medium leading-relaxed shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-950">Password Updated Successfully</p>
                  <p className="mt-1 text-[11px] text-emerald-800">{successMsg}</p>
                </div>
              </div>

              <Button
                onClick={() => navigate('/login?role=student')}
                className="w-full justify-center"
                icon={ArrowRight}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            /* Reset Password Form (Always Visible) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2.5 font-medium leading-relaxed shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative">
                <Input
                  label="New Password *"
                  type={showNewPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  helperText="Minimum 6 characters required"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600"
                  tabIndex="-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600"
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full justify-center mt-2"
                icon={KeyRound}
              >
                Set New Password
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Need assistance?{' '}
            <Link to="/contact" className="text-blue-600 font-bold hover:underline">
              Contact T&P Department
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Minimal Notice */}
      <div className="text-center text-[11px] text-slate-400 pb-2 font-medium">
        © 2026 MITRA Employability Portal • Training & Placement Cell
      </div>
    </div>
  );
};

export default ResetPasswordPage;
