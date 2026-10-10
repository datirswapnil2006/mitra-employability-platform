import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, getMediaUrl } from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import LoadingState from '../../components/LoadingState';
import Toast from '../../components/Toast';
import {
  calculateProfileCompletion,
  getMissingProfileRequirements
} from '../../utils/profileCompletion';
import {
  User, Phone, Hash, Globe, ShieldCheck, Check, Sparkles, Save,
  Link as LinkIcon, FileText, Mail, GraduationCap, Award, MapPin,
  CreditCard, AlertCircle
} from 'lucide-react';
import {
  OFFICIAL_DEPARTMENTS,
  ACADEMIC_YEARS,
  GENDERS,
  SECTIONS
} from '../../constants/departments';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAllChecklist, setShowAllChecklist] = useState(false);
  const [profileData, setProfileData] = useState({
    erpNumber: '',
    rollNo: '',
    gender: 'Male',
    section: 'A',
    department: 'CSE',
    year: 'Third Year',
    batch: '2026',
    phone: '',
    hometown: '',
    aadhaarNumber: '',
    educationGap: 'No',
    hasBacklogs: 'No',
    bio: '',
    resumeUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    diplomaPercentage: '',
    cgpa: '',
    profileCompletionPercentage: 0
  });

  const departments = OFFICIAL_DEPARTMENTS;
  const years = ACADEMIC_YEARS;
  const genders = GENDERS;
  const sections = SECTIONS;

  const educationGapOptions = [
    { value: 'No', label: 'No Education Gap' },
    { value: '1 Year', label: '1 Year Gap' },
    { value: '2 Years', label: '2 Years Gap' },
    { value: '3+ Years', label: '3+ Years Gap' }
  ];

  const backlogOptions = [
    { value: 'No', label: 'No Active Backlogs' },
    { value: '1 Backlog', label: '1 Active Backlog' },
    { value: '2 Backlogs', label: '2 Active Backlogs' },
    { value: '3+ Backlogs', label: '3+ Active Backlogs' }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.getProfile();
        if (res.success && (res.profile || res.student)) {
          const p = res.profile || res.student;
          const initialData = {
            erpNumber: p.erpNumber || p.rollNo || '',
            rollNo: p.erpNumber || p.rollNo || '',
            gender: p.gender || 'Male',
            section: p.section || 'A',
            department: p.department || user?.department || 'CSE',
            year: p.year || 'Third Year',
            batch: p.batch || '2026',
            phone: p.phone ? p.phone.replace(/\D/g, '').slice(-10) : '',
            hometown: p.hometown || '',
            aadhaarNumber: p.aadhaarNumber ? p.aadhaarNumber.replace(/\D/g, '').slice(0, 12) : '',
            educationGap: p.educationGap || 'No',
            hasBacklogs: p.hasBacklogs || 'No',
            bio: p.bio || '',
            resumeUrl: p.resumeUrl || '',
            linkedinUrl: p.linkedinUrl || '',
            githubUrl: p.githubUrl || '',
            tenthPercentage: p.tenthPercentage !== null && p.tenthPercentage !== undefined ? p.tenthPercentage : '',
            twelfthPercentage: p.twelfthPercentage !== null && p.twelfthPercentage !== undefined ? p.twelfthPercentage : '',
            diplomaPercentage: p.diplomaPercentage !== null && p.diplomaPercentage !== undefined ? p.diplomaPercentage : '',
            cgpa: p.cgpa !== null && p.cgpa !== undefined ? p.cgpa : ''
          };
          const completion = calculateProfileCompletion(initialData, user);
          setProfileData({
            ...initialData,
            profileCompletionPercentage: completion
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'phone') {
      // Only digits allowed, maximum 10 digits
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'aadhaarNumber') {
      // Only digits allowed, maximum 12 digits
      sanitizedValue = value.replace(/\D/g, '').slice(0, 12);
    }

    setProfileData(prev => {
      const next = { ...prev, [name]: sanitizedValue };
      if (name === 'erpNumber') next.rollNo = sanitizedValue;
      return {
        ...next,
        profileCompletionPercentage: calculateProfileCompletion(next, user)
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Strict validation for Phone (10 digits only) and Aadhaar (12 digits only)
    const cleanPhone = (profileData.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError(`Contact Phone Number is required and must be exactly 10 digits (${cleanPhone.length}/10 entered).`);
      return;
    }

    const cleanAadhaar = (profileData.aadhaarNumber || '').replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      setError(`Aadhaar Card Number is required and must be exactly 12 digits (${cleanAadhaar.length}/12 entered).`);
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfile({
        ...profileData,
        rollNo: profileData.erpNumber
      });
      if (res.success && (res.profile || res.student)) {
        const updated = res.profile || res.student;
        const newCompletion = calculateProfileCompletion(updated, user);
        setProfileData(prev => ({
          ...prev,
          ...updated,
          erpNumber: updated.erpNumber || updated.rollNo || prev.erpNumber,
          rollNo: updated.erpNumber || updated.rollNo || prev.erpNumber,
          profileCompletionPercentage: newCompletion
        }));
        if (newCompletion === 100) {
          setMessage('Profile verified at 100%! All requirements completed successfully. All portal modules unlocked.');
        } else {
          const missing = getMissingProfileRequirements(updated, user);
          const missingNames = missing.map(m => m.label).join(', ');
          setMessage(`Profile saved (${newCompletion}%). Incomplete required fields: ${missingNames}`);
        }
        await refreshUser();
      } else {
        setError(res.message || 'Error updating profile');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const missingRequirements = getMissingProfileRequirements(profileData, user);
  const is100 = profileData.profileCompletionPercentage === 100;

  if (loading) return <LoadingState message="Loading your student profile..." />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Floating Action Toast Messages */}
      {message && (
        <Toast
          type="success"
          title="Profile Saved"
          message={message}
          onClose={() => setMessage('')}
        />
      )}

      {error && (
        <Toast
          type="error"
          title="Update Error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Header Profile Status Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Student Initial Avatar Badge */}
          <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-600 to-indigo-600 border-2 border-blue-200 flex items-center justify-center text-white font-black text-3xl shadow-md shrink-0">
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-slate-900">{user?.name || 'Student Name'}</h1>
              <Badge variant={is100 ? 'success' : 'warning'}>
                {is100 ? 'Verified 100%' : `${profileData.profileCompletionPercentage}% Complete`}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ERP: {profileData.erpNumber || 'Unassigned'} • {profileData.department} Department • Section {profileData.section}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Academic Year: {profileData.year} • Batch: {profileData.batch}
            </p>
          </div>
        </div>

        <div className="w-full md:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-slate-600">Profile Completion</span>
            <span className={is100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {profileData.profileCompletionPercentage}%
            </span>
          </div>
          <ProgressBar progress={profileData.profileCompletionPercentage} color={is100 ? 'emerald' : 'amber'} showPercentage={false} />
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            {is100 ? '✓ Complete Profile (100%)' : 'Complete all required fields to reach 100%'}
          </p>
        </div>
      </div>

      {/* Missing Requirements Clean Banner */}
      {!is100 && missingRequirements.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950">
                  Required Profile Fields Remaining
                </h3>
                <p className="text-xs text-amber-800">
                  Complete the following required fields to reach 100% and unlock all portal features:
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-200/70 text-amber-900 rounded-full border border-amber-300 w-fit shrink-0">
              {missingRequirements.length} field{missingRequirements.length === 1 ? '' : 's'} remaining
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {missingRequirements.map(item => (
              <div
                key={item.id}
                className="bg-white/95 rounded-2xl p-3 border border-amber-200 shadow-xs flex items-start gap-2.5 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{item.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Academic & Institutional Identity */}
        <Card title="1. Academic & Institutional Identity" subtitle="Managed in synchronization with college records">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input
              label="ERP Number *"
              name="erpNumber"
              icon={Hash}
              placeholder="e.g. ERP-2026-042"
              value={profileData.erpNumber}
              onChange={handleChange}
              required
            />
            <Select
              label="Department *"
              name="department"
              options={departments}
              value={profileData.department}
              onChange={handleChange}
            />
            <Select
              label="Gender *"
              name="gender"
              options={genders}
              value={profileData.gender}
              onChange={handleChange}
            />
            <Select
              label="Academic Year *"
              name="year"
              options={years}
              value={profileData.year}
              onChange={handleChange}
            />
            <Select
              label="Section / Division *"
              name="section"
              options={sections}
              value={profileData.section}
              onChange={handleChange}
            />
            <Input
              label="Graduation Batch *"
              name="batch"
              placeholder="2026"
              value={profileData.batch}
              onChange={handleChange}
              required
            />
          </div>
        </Card>

        {/* Section 2: Academic Qualifications & Performance */}
        <Card title="2. Academic Qualifications & Performance" subtitle="10th, 12th, Diploma, CGPA, Education Gap & Backlogs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input
              label="10th Standard Percentage (%) *"
              name="tenthPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              icon={GraduationCap}
              placeholder="e.g. 88.50"
              value={profileData.tenthPercentage}
              onChange={handleChange}
              helperText="Secondary School Certificate (SSC) aggregate score"
              required
            />
            <Input
              label="12th Standard Percentage (%) * (or Diploma %)"
              name="twelfthPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              icon={GraduationCap}
              placeholder="e.g. 82.40"
              value={profileData.twelfthPercentage}
              onChange={handleChange}
              helperText="Required. (Enter either 12th % or Diploma % below)"
            />
            <Input
              label="Diploma Percentage (%) (Alternative to 12th)"
              name="diplomaPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              icon={Award}
              placeholder="e.g. 85.00 (For Polytechnic / DSE students)"
              value={profileData.diplomaPercentage}
              onChange={handleChange}
              helperText="Enter if you did Polytechnic/Diploma instead of 12th"
            />
            <Input
              label="Current Degree CGPA *"
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="100"
              icon={Award}
              placeholder="e.g. 8.75 (out of 10)"
              value={profileData.cgpa}
              onChange={handleChange}
              helperText="Cumulative Grade Point Average up to latest semester"
              required
            />
            <Select
              label="Do you have any year Gap in Education? *"
              name="educationGap"
              options={educationGapOptions}
              value={profileData.educationGap}
              onChange={handleChange}
              required
            />
            <Select
              label="Do you have current Backlogs? *"
              name="hasBacklogs"
              options={backlogOptions}
              value={profileData.hasBacklogs}
              onChange={handleChange}
              required
            />
          </div>
        </Card>

        {/* Section 3: Contact Details & Identity */}
        <Card title="3. Contact Details & Identity" subtitle="Required for placement communications and verification">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input
              label="Institutional Email *"
              name="email"
              type="email"
              icon={Mail}
              value={user?.email || ''}
              disabled
            />
            <Input
              label="Contact Phone Number *"
              name="phone"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              icon={Phone}
              placeholder="e.g. 9876543210 (10 digits)"
              value={profileData.phone}
              onChange={handleChange}
              helperText={
                profileData.phone && profileData.phone.length < 10
                  ? `Enter remaining ${10 - profileData.phone.length} digit${10 - profileData.phone.length > 1 ? 's' : ''}`
                  : '10-digit mobile number (digits only)'
              }
              required
            />
            <Input
              label="Aadhaar Card Number *"
              name="aadhaarNumber"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{12}"
              maxLength={12}
              icon={CreditCard}
              placeholder="e.g. 123456789012 (12 digits)"
              value={profileData.aadhaarNumber}
              onChange={handleChange}
              helperText={
                profileData.aadhaarNumber && profileData.aadhaarNumber.length < 12
                  ? `Enter remaining ${12 - profileData.aadhaarNumber.length} digit${12 - profileData.aadhaarNumber.length > 1 ? 's' : ''}`
                  : '12-digit Government Aadhaar identification number (digits only)'
              }
              required
            />
            <Input
              label="Your Hometown (Name of City/Place with State) *"
              name="hometown"
              type="text"
              icon={MapPin}
              placeholder="e.g. Pune, Maharashtra"
              value={profileData.hometown}
              onChange={handleChange}
              helperText="City/town of permanent residence with State"
              required
            />
          </div>
        </Card>

        {/* Section 4: Professional & Career Links */}
        <Card title="4. Career & Portfolio Profiles" subtitle="Resume document and professional portfolio links">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2">
              <Input
                label="Resume Document URL *"
                name="resumeUrl"
                icon={FileText}
                placeholder="https://drive.google.com/your-resume.pdf"
                value={profileData.resumeUrl}
                onChange={handleChange}
                helperText="Link to your updated PDF resume (Google Drive, Dropbox, etc.)"
                required
              />
            </div>
            <Input
              label="GitHub Profile URL (Optional)"
              name="githubUrl"
              icon={Globe}
              placeholder="https://github.com/username"
              value={profileData.githubUrl}
              onChange={handleChange}
              helperText="Optional link to your GitHub profile or projects"
            />
            <Input
              label="LinkedIn Profile URL (Optional)"
              name="linkedinUrl"
              icon={LinkIcon}
              placeholder="https://linkedin.com/in/username"
              value={profileData.linkedinUrl}
              onChange={handleChange}
              helperText="Optional link to your professional LinkedIn profile"
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" size="lg" loading={saving} icon={ShieldCheck}>
            Save & Verify Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
