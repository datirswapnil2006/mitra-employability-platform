import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Select from '../../components/Select';
import {
  User,
  Mail,
  Hash,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  Award,
  BookOpen
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
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
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

    if (!agreeTerms) {
      setError('Please agree to the Terms and Conditions and Privacy Policy to create your account.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        rollNo: formData.erpNumber // compatibility with backend model
      };

      const res = await register(payload);
      if (res.success) {
        setCreatedCredentials({
          name: formData.name,
          email: formData.email,
          erpNumber: formData.erpNumber,
          emailDispatched: res.emailDispatched
        });
        setSuccess(true);
      } else {
        setError(res.message || 'Registration failed. Please verify your details.');
      }
    } catch (err) {
      setError(err?.message || 'Connection error. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#F8C85A]/35 grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
          
          {/* Left Branding Panel (Navy Blue #08284B) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#08284B] via-[#0A315C] to-[#051A31] text-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8C85A]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#08284B] rounded-full blur-2xl pointer-events-none" />

            {/* Top Branding Section */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#FFF8E9]/10 border border-[#F8C85A]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#FFF8E9]">
                <Sparkles className="w-3.5 h-3.5 text-[#F8C85A]" />
                <span>Student Onboarding & Verification</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Start Your Placement Journey With{' '}
                <span className="text-[#F8C85A]">MITRA Portal.</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#FFF8E9]/80 leading-relaxed font-normal">
                Join engineering and management students preparing systematically with verified curriculum modules, AI diagnostics, and campus recruitment readiness scorecards.
              </p>
            </div>

            {/* Middle Feature Highlights with Student Illustration */}
            <div className="relative z-10 my-6 space-y-4">
              {/* Framed student illustration */}
              <div className="rounded-xl overflow-hidden border border-[#F8C85A]/35 shadow-lg bg-[#08284B]">
                <img
                  src="/student_career_hero.jpg"
                  alt="Student Training and Placement Preparation"
                  className="w-full h-36 sm:h-44 object-cover object-center"
                />
              </div>

              {/* Trust bullets */}
              <div className="space-y-2 text-xs text-[#FFF8E9]/85">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#F8C85A] shrink-0" />
                  <span>Institutional Academic Record Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#F8C85A] shrink-0" />
                  <span>Modular Syllabus Mapped to Hiring Criteria</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F8C85A] shrink-0" />
                  <span>Verified 75%+ Recruiter Cutoff Benchmarking</span>
                </div>
              </div>
            </div>

            {/* Bottom Panel Notice */}
            <div className="relative z-10 pt-4 border-t border-[#FFF8E9]/15 flex items-center justify-between text-[11px] text-[#FFF8E9]/65">
              <span>© 2026 MITRA Platform</span>
              <Link to="/about" className="hover:text-[#F8C85A] transition-colors">
                About the Platform →
              </Link>
            </div>
          </div>

          {/* Right Form Panel (Cream Background with Clean White Form Card) */}
          <div className="lg:col-span-7 bg-[#FFF8E9]/40 p-6 sm:p-9 lg:p-12 flex flex-col justify-center">
            <div className="max-w-xl w-full mx-auto space-y-6">
              
              {success && createdCredentials ? (
                /* Success Screen */
                <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-300 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#08284B] tracking-tight">
                      Enrollment Successful!
                    </h2>
                    <p className="text-xs sm:text-sm text-[#183451]/80 max-w-md mx-auto leading-relaxed">
                      Welcome to MITRA, <strong className="text-[#08284B] font-bold">{createdCredentials.name}</strong>. Your student account has been registered.
                    </p>
                  </div>

                  {/* Account Summary Card */}
                  <div className="bg-white rounded-2xl p-5 border border-[#F8C85A]/40 shadow-xs space-y-3 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold text-[#08284B] uppercase tracking-wider">
                        Account Details
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Profile Created
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Registered Email:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#08284B]">{createdCredentials.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                            className="text-slate-400 hover:text-[#08284B] p-1 rounded transition-colors cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {createdCredentials.erpNumber && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500 font-medium">ERP / Roll No:</span>
                          <span className="font-mono font-bold text-[#08284B]">{createdCredentials.erpNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Credentials Notification Box */}
                  <div className="p-4 bg-[#FFF8E9] border border-[#F8C85A]/50 rounded-2xl flex items-start gap-3 text-xs text-[#183451] text-left shadow-xs">
                    <Mail className="w-5 h-5 text-[#08284B] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-[#08284B] block text-xs">Login Password Dispatched</span>
                      <p className="text-[12px] text-[#183451]/80 leading-relaxed">
                        Your sign-in password has been emailed to <strong className="font-mono text-[#08284B]">{createdCredentials.email}</strong>. Please check your inbox to sign in and begin your training.
                      </p>
                    </div>
                  </div>

                  {/* Proceed to Sign In CTA */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/login?role=student')}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#08284B] hover:bg-[#0c3664] text-[#F8C85A] font-bold text-sm shadow-md transition-all duration-200 border border-[#F8C85A]/30 cursor-pointer"
                    >
                      <span>Proceed to Student Sign In</span>
                      <ArrowRight className="w-4 h-4 text-[#F8C85A]" />
                    </button>

                    <Link
                      to="/"
                      className="block text-xs font-bold text-[#183451]/75 hover:text-[#08284B] transition-colors"
                    >
                      ← Back to Homepage
                    </Link>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <>
                  {/* Form Header */}
                  <div className="space-y-1.5 text-left">
                    <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#08284B]/10 text-[#08284B] text-[11px] font-bold uppercase tracking-wider">
                      Student Registration
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#08284B] tracking-tight">
                      Create Your Account
                    </h2>
                    <p className="text-xs sm:text-sm text-[#183451]/75 leading-relaxed">
                      Register with your institutional details to access department-mapped training modules and diagnostic tests.
                    </p>
                  </div>

                  {/* Informational Banner */}
                  <div className="p-3.5 bg-[#FFF8E9] border border-[#F8C85A]/40 rounded-2xl flex items-start gap-3 text-xs text-[#183451] shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-[#08284B] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong className="text-[#08284B]">Institutional Credentials:</strong> Provide your official college email and ERP roll number. Your official sign-in password will be automatically generated and sent directly to your registered email address.
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 font-medium shadow-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Registration Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <Input
                      label="Full Name *"
                      name="name"
                      icon={User}
                      placeholder="e.g. Aarav Patel"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20"
                    />

                    {/* Email */}
                    <Input
                      label="Institutional Email Address *"
                      type="email"
                      name="email"
                      icon={Mail}
                      placeholder="student@mitra.edu"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20"
                    />

                    {/* ERP Number & Department Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Input
                        label="ERP / Roll Number *"
                        name="erpNumber"
                        icon={Hash}
                        placeholder="e.g. ERP-2026-042"
                        value={formData.erpNumber}
                        onChange={handleChange}
                        required
                        className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20"
                      />
                      <Select
                        label="Academic Department *"
                        name="department"
                        options={departments}
                        value={formData.department}
                        onChange={handleChange}
                        className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20 cursor-pointer"
                      />
                    </div>

                    {/* Gender & Section Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Select
                        label="Gender *"
                        name="gender"
                        options={genders}
                        value={formData.gender}
                        onChange={handleChange}
                        className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20 cursor-pointer"
                      />
                      <Select
                        label="Section / Division *"
                        name="section"
                        options={sections}
                        value={formData.section}
                        onChange={handleChange}
                        className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20 cursor-pointer"
                      />
                    </div>

                    {/* Academic Year & Graduation Batch Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Select
                        label="Academic Year *"
                        name="year"
                        options={years}
                        value={formData.year}
                        onChange={handleChange}
                        className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20 cursor-pointer"
                      />
                      <Input
                        label="Graduation Batch *"
                        name="batch"
                        icon={Calendar}
                        placeholder="2026"
                        value={formData.batch}
                        onChange={handleChange}
                        required
                        className="bg-white border-[#F8C85A]/40 text-[#183451] focus:border-[#08284B] focus:ring-[#08284B]/20"
                      />
                    </div>

                    {/* Terms & Conditions Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 text-xs text-[#183451] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-4 h-4 rounded text-[#08284B] focus:ring-[#08284B] border-slate-300 accent-[#08284B] mt-0.5"
                        />
                        <span className="leading-relaxed">
                          I agree to the{' '}
                          <Link to="/terms-and-conditions" className="font-bold text-[#08284B] hover:underline" target="_blank">
                            Terms & Conditions
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy-policy" className="font-bold text-[#08284B] hover:underline" target="_blank">
                            Privacy Policy
                          </Link>{' '}
                          of the MITRA Employability Platform.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#08284B] hover:bg-[#0c3664] text-[#F8C85A] font-bold text-sm shadow-md transition-all duration-200 border border-[#F8C85A]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#F8C85A] border-t-transparent" />
                          <span>Enrolling Student Profile...</span>
                        </span>
                      ) : (
                        <>
                          <span>Create Account & Enroll</span>
                          <ArrowRight className="w-4 h-4 text-[#F8C85A]" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Sign In Link */}
                  <div className="pt-4 border-t border-[#F8C85A]/30 text-center text-xs text-[#183451]/80">
                    Already enrolled?{' '}
                    <Link
                      to="/login"
                      className="text-[#08284B] font-extrabold hover:text-[#0c3664] underline underline-offset-2 transition-colors"
                    >
                      Sign In to Account
                    </Link>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Footer Minimal Notice */}
      <footer className="text-center py-2 relative z-10 text-[11px] text-[#183451]/60">
        <p>© 2026 MITRA Employability Platform. Dedicated to Student Career Readiness.</p>
      </footer>

    </div>
  );
};

export default RegisterPage;
