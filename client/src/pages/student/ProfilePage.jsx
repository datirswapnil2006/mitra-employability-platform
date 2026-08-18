import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import LoadingState from '../../components/LoadingState';
import Toast from '../../components/Toast';
import { User, Phone, Hash, Globe, ShieldCheck, Check, Sparkles, Save, Link as LinkIcon, FileText, Mail, GraduationCap, Award, MapPin, CreditCard, Camera, Upload, Trash2 } from 'lucide-react';
import {
  OFFICIAL_DEPARTMENTS,
  ACADEMIC_YEARS,
  GENDERS,
  SECTIONS
} from '../../constants/departments';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    erpNumber: '',
    rollNo: '',
    gender: 'Male',
    section: 'A',
    department: 'CSE',
    year: 'Third Year',
    batch: '2026',
    phone: '',
    profilePhoto: '',
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
        if (res.success && res.profile) {
          const p = res.profile;
          setProfileData({
            erpNumber: p.erpNumber || p.rollNo || '',
            rollNo: p.erpNumber || p.rollNo || '',
            gender: p.gender || 'Male',
            section: p.section || 'A',
            department: p.department || user?.department || 'CSE',
            year: p.year || 'Third Year',
            batch: p.batch || '2026',
            phone: p.phone || '',
            profilePhoto: p.profilePhoto || user?.profilePhoto || '',
            hometown: p.hometown || '',
            aadhaarNumber: p.aadhaarNumber || '',
            educationGap: p.educationGap || 'No',
            hasBacklogs: p.hasBacklogs || 'No',
            bio: p.bio || '',
            resumeUrl: p.resumeUrl || '',
            linkedinUrl: p.linkedinUrl || '',
            githubUrl: p.githubUrl || '',
            tenthPercentage: p.tenthPercentage !== null && p.tenthPercentage !== undefined ? p.tenthPercentage : '',
            twelfthPercentage: p.twelfthPercentage !== null && p.twelfthPercentage !== undefined ? p.twelfthPercentage : '',
            diplomaPercentage: p.diplomaPercentage !== null && p.diplomaPercentage !== undefined ? p.diplomaPercentage : '',
            cgpa: p.cgpa !== null && p.cgpa !== undefined ? p.cgpa : '',
            profileCompletionPercentage: p.profileCompletionPercentage || 0
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
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileData(prev => ({ ...prev, profilePhoto: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileData(prev => ({ ...prev, profilePhoto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.updateProfile({
        ...profileData,
        rollNo: profileData.erpNumber
      });
      if (res.success) {
        setProfileData(prev => ({
          ...prev,
          profileCompletionPercentage: res.profile.profileCompletionPercentage
        }));
        setMessage('Profile updated successfully! Academic credentials attached and verified.');
        await refreshUser();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading your student profile..." />;

  const is100 = profileData.profileCompletionPercentage === 100;

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
          {/* Avatar / Photo Upload Container */}
          <div className="relative group shrink-0">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-3xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-black text-2xl shadow-xs overflow-hidden cursor-pointer relative transition-all hover:ring-4 hover:ring-blue-500/20"
              title="Click to upload student profile photo"
            >
              {profileData.profilePhoto ? (
                <img
                  src={profileData.profilePhoto}
                  alt={user?.name || 'Student Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
              )}

              {/* Camera Hover Overlay */}
              <div className="absolute inset-0 bg-slate-900/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-0.5">Upload</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white transition"
              title="Upload / Change Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
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
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <Upload className="w-3 h-3" /> {profileData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </button>
              {profileData.profilePhoto && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-slate-600">Gating Status</span>
            <span className={is100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {profileData.profileCompletionPercentage}%
            </span>
          </div>
          <ProgressBar progress={profileData.profileCompletionPercentage} color={is100 ? 'emerald' : 'amber'} showPercentage={false} />
          <p className="text-[11px] text-slate-500 mt-2 text-center">
            {is100 ? '✓ All Assessments Unlocked' : '100% required to take tests'}
          </p>
        </div>
      </div>

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
              label="12th Standard Percentage (%)"
              name="twelfthPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              icon={GraduationCap}
              placeholder="e.g. 82.40"
              value={profileData.twelfthPercentage}
              onChange={handleChange}
              helperText="Higher Secondary Certificate (HSC) aggregate score"
            />
            <Input
              label="Diploma Percentage (%) (Optional)"
              name="diplomaPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              icon={Award}
              placeholder="e.g. 85.00 (Optional for DSE / Polytechnic)"
              value={profileData.diplomaPercentage}
              onChange={handleChange}
              helperText="Leave empty if not applicable"
            />
            <Input
              label="Current Degree CGPA *"
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
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
              type="tel"
              icon={Phone}
              placeholder="+91 98765 43210"
              value={profileData.phone}
              onChange={handleChange}
              required
            />
            <Input
              label="Aadhaar Card Number *"
              name="aadhaarNumber"
              type="text"
              icon={CreditCard}
              placeholder="e.g. 1234 5678 9012"
              value={profileData.aadhaarNumber}
              onChange={handleChange}
              helperText="12-digit Government Aadhaar identification number"
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
            />
            <Input
              label="LinkedIn Profile URL (Optional)"
              name="linkedinUrl"
              icon={LinkIcon}
              placeholder="https://linkedin.com/in/username"
              value={profileData.linkedinUrl}
              onChange={handleChange}
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
