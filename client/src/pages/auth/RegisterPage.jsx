import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import {
  User,
  Mail,
  Hash,
  Calendar,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react';

import {
  OFFICIAL_DEPARTMENTS,
  ACADEMIC_YEARS,
  GENDERS,
  SECTIONS
} from '../../constants/departments';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'CSE',
    erpNumber: '',
    gender: 'Male',
    section: 'A',
    year: 'Third Year',
    batch: '2026'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const departments = OFFICIAL_DEPARTMENTS;
  const years = ACADEMIC_YEARS;
  const genders = GENDERS;
  const sections = SECTIONS;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const generatedTempPassword = `Mitra@${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = {
        ...formData,
        password: generatedTempPassword,
        rollNo: formData.erpNumber // compatibility
      };

      const res = await register(payload);
      if (res.success) {
        setCreatedCredentials({
          name: formData.name,
          email: formData.email,
          erpNumber: formData.erpNumber,
          password: res.credentials?.temporaryPassword || generatedTempPassword,
          emailDispatched: res.emailDispatched
        });
        setSuccess(true);
      } else {
        setError(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setError(err?.message || 'Connection error. Ensure backend server is running.');
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

        <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition">
          ← Back to Homepage
        </Link>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-lg mx-auto my-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          {success && createdCredentials ? (
            <div className="space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Enrollment Successful!</h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Welcome to MITRA, <strong className="text-slate-800">{createdCredentials.name}</strong>. Your account has been registered.
                </p>
              </div>

              {/* Account Confirmation Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Credentials</span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Registered Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{createdCredentials.email}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                        className="text-slate-400 hover:text-blue-600 p-1"
                        title="Copy Email"
                      >
                        {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {createdCredentials.erpNumber && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">ERP / Roll No:</span>
                      <span className="font-mono font-bold text-slate-800">{createdCredentials.erpNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Delivered to Email Notice */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
                <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-blue-900 block text-xs">Credentials Dispatched to Email</span>
                  <p className="text-[12px] text-blue-800 leading-relaxed">
                    Your official student account password and login instructions have been emailed to <strong className="font-mono text-blue-950">{createdCredentials.email}</strong>. Please check your inbox (and spam/promotions folder) to retrieve your password and sign in.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => navigate('/login?role=student')}
                  className="w-full justify-center"
                  icon={ArrowRight}
                >
                  Proceed to Sign In
                </Button>
                <Link
                  to="/"
                  className="block w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 space-y-2">
                <img
                  src="/college-logo.jpg"
                  alt="College Logo"
                  className="h-12 w-auto mx-auto rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-xs mb-2"
                />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Enrollment</h2>
                <p className="text-xs text-slate-500">
                  Create your MITRA account using institutional details
                </p>
              </div>

              {/* Email Credentials Notice */}
              <div className="mb-5 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Automatic Credential Pass:</strong> Sign up with your institutional details. Your official login password will be automatically generated, shown on the confirmation screen, and dispatched to your email.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name *"
                  name="name"
                  icon={User}
                  placeholder="e.g. Aarav Patel"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Institutional Email *"
                  type="email"
                  name="email"
                  icon={Mail}
                  placeholder="student@mitra.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="ERP / Roll Number *"
                    name="erpNumber"
                    icon={Hash}
                    placeholder="e.g. ERP-2026-042"
                    value={formData.erpNumber}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Department *"
                    name="department"
                    options={departments}
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Gender *"
                    name="gender"
                    options={genders}
                    value={formData.gender}
                    onChange={handleChange}
                  />
                  <Select
                    label="Section / Division *"
                    name="section"
                    options={sections}
                    value={formData.section}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Academic Year *"
                    name="year"
                    options={years}
                    value={formData.year}
                    onChange={handleChange}
                  />
                  <Input
                    label="Graduation Batch *"
                    name="batch"
                    icon={Calendar}
                    placeholder="2026"
                    value={formData.batch}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full justify-center mt-2" loading={loading} icon={ArrowRight}>
                  Enroll & Generate Credentials
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                Already enrolled?{' '}
                <Link to="/login" className="text-blue-600 font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 pb-2 font-medium">
        © 2026 MITRA Employability Portal • Institutional Verified
      </div>
    </div>
  );
};

export default RegisterPage;

