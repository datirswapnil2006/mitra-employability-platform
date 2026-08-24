import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Toast from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import {
  LifeBuoy,
  Send,
  Paperclip,
  X,
  FileText,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Wrench,
  ShieldCheck,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';

export const StudentSupportPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Feedback Form State
  const [category, setCategory] = useState('Suggestion / Improvement');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const categories = [
    'Suggestion / Improvement',
    'Technical Problem',
    'Feature Request',
    'Test/Assessment Issue',
    'Other'
  ];

  // Fetch Student Profile & Previous Submissions
  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await api.getProfile();
      if (res.success) {
        setProfile(res.profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getMySupportFeedback();
      if (res.success) {
        setFeedbackList(res.feedback || []);
      }
    } catch (err) {
      console.error('Error fetching support history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Attachment must be under 5MB.'
      });
      return;
    }

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment('');
    setAttachmentName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setToast({
        type: 'warning',
        title: 'Subject Required',
        message: 'Please provide a clear subject for your feedback.'
      });
      return;
    }

    if (!description.trim()) {
      setToast({
        type: 'warning',
        title: 'Description Required',
        message: 'Please enter details explaining your suggestion or issue.'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitSupportFeedback({
        category,
        subject: subject.trim(),
        description: description.trim(),
        attachment
      });

      if (res.success) {
        setToast({
          type: 'success',
          title: 'Feedback Submitted!',
          message: `Your ticket (${res.feedback.feedbackId}) has been logged. Admin will review it shortly.`
        });
        // Reset form
        setSubject('');
        setDescription('');
        setAttachment('');
        setAttachmentName('');
        setCategory('Suggestion / Improvement');
        // Refresh history
        fetchHistory();
      } else {
        setToast({
          type: 'error',
          title: 'Submission Failed',
          message: res.message || 'Unable to submit feedback.'
        });
      }
    } catch (err) {
      console.error('Submission error:', err);
      setToast({
        type: 'error',
        title: 'Error',
        message: 'Server error while submitting. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Suggestion / Improvement':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'Technical Problem':
        return <Wrench className="w-4 h-4 text-rose-500" />;
      case 'Feature Request':
        return <HelpCircle className="w-4 h-4 text-blue-500" />;
      case 'Test/Assessment Issue':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            New
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title="Support & Suggestions"
        subtitle="Submit your suggestions, report technical problems, or request features. Track administrative reviews and resolutions in real-time."
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Support & Suggestions' }
        ]}
      />

      {/* Verified Profile Identity Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold tracking-tight text-white">
                {user?.name || 'Student'}
              </span>
              <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                ERP: {profile?.erpNumber || profile?.rollNo || 'Authenticated'}
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Department: <strong>{profile?.department || user?.department || 'CSE'}</strong> &bull; Batch: <strong>{profile?.batch || '2026'}</strong> &bull; Year: <strong>{profile?.year || 'Third Year'}</strong>
            </p>
          </div>
        </div>
        <div className="text-[11px] font-medium text-blue-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
          ✓ Profile Verified
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Feedback Submission Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">New Feedback or Query</h3>
                <p className="text-xs text-slate-500">Provide clear context to help our administrators address your feedback.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={categories.map(c => ({ value: c, label: c }))}
                  className="w-full"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Suggestion for Aptitude practice timer / Assessment submission issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your suggestion, the problem you faced, or feature you would like to see in detail..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition resize-none"
                  required
                />
              </div>

              {/* Attachment Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Optional Attachment / Screenshot (Max 5MB)
                </label>

                {attachment ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-blue-900 truncate">
                        {attachmentName || 'Attachment Uploaded'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition group">
                    <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-700">
                      Upload Screenshot or Document
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Send}
                  loading={submitting}
                  className="w-full shadow-md shadow-blue-600/20"
                >
                  Submit Feedback
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Submitted Feedback History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Your Past Submissions</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {feedbackList.length} total
              </span>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading feedback history...</span>
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Feedback Submitted Yet</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Have an idea to improve MITRA or encountered a glitch? Fill out the form to let us know.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                {feedbackList.map((item) => {
                  const isResolved = item.status === 'Resolved';
                  const isInReview = item.status === 'In Review';

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition cursor-pointer space-y-2.5 bg-slate-50/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getCategoryIcon(item.category)}
                          <span className="text-[11px] font-bold text-slate-600 truncate">
                            {item.category}
                          </span>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.subject}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      {/* Admin Response Preview if available */}
                      {item.adminResponse && (
                        <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
                          <div className="font-bold flex items-center gap-1 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Admin Remarks:
                          </div>
                          <p className="line-clamp-2 text-emerald-950 font-medium">
                            {item.adminResponse}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span className="font-mono font-bold text-slate-500">{item.feedbackId}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {selectedItem.feedbackId}
                </span>
                {getStatusBadge(selectedItem.status)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedItem.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedItem.subject}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submitted on {new Date(selectedItem.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Detailed Description</label>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {selectedItem.attachment && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Attachment</label>
                  {selectedItem.attachment.startsWith('data:image') ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-950 flex items-center justify-center">
                      <img
                        src={selectedItem.attachment}
                        alt="Screenshot"
                        className="max-h-64 object-contain"
                      />
                    </div>
                  ) : (
                    <a
                      href={selectedItem.attachment}
                      download="feedback-attachment"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition"
                    >
                      <Paperclip className="w-4 h-4" /> Download Attached File
                    </a>
                  )}
                </div>
              )}

              {/* Admin Response Box */}
              <div className={`p-4 rounded-xl border ${selectedItem.adminResponse ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <CheckCircle2 className={`w-4 h-4 ${selectedItem.adminResponse ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Administrative Feedback & Action
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedItem.adminResponse || 'Your feedback is currently in queue. Once reviewed by the MITRA administration team, remarks will appear here.'}
                </p>
                {selectedItem.resolvedAt && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-2">
                    Resolved at: {new Date(selectedItem.resolvedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSupportPage;
