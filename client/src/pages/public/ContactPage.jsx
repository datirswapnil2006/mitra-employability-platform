import React, { useState } from 'react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { Mail, MapPin, Phone, Send, CheckCircle2, Building2 } from 'lucide-react';

export const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    erpNumber: '',
    department: 'CSE',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-4">
        <Badge variant="primary">Training & Placement Support</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Placement Cell Contact & Support
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          Have queries regarding your training progress, profile gating verification, or upcoming assessment schedules? Get in touch with the placement office.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <Card className="hover:shadow-md transition-all">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit mb-3 border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Placement Cell Office</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Main Academic Block, Level 3<br />
              Training & Placement Directorate
            </p>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl w-fit mb-3 border border-sky-100">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Official Email</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              placements@mitra.edu<br />
              support.mitra@edu.org
            </p>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-3 border border-emerald-100">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Office Hours</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monday – Friday<br />
              09:00 AM – 05:00 PM IST
            </p>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card title="Send a Query to Placement Cell" subtitle="All requests will be routed to your department coordinator">
            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Message Received</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your query has been logged with the Placement Desk. An email confirmation has been dispatched.
                </p>
                <Button size="sm" variant="outline" onClick={() => setSubmitted(false)}>
                  Send Another Query
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Institutional Email *"
                    type="email"
                    placeholder="student@mitra.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="ERP Number *"
                    placeholder="e.g. ERP-2026-042"
                    value={formData.erpNumber}
                    onChange={e => setFormData({ ...formData, erpNumber: e.target.value })}
                    required
                  />
                  <Input
                    label="Department"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <Input
                  label="Subject *"
                  placeholder="e.g. Profile verification query or submodule assessment issue"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Message *</label>
                  <textarea
                    rows={4}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder-slate-400"
                    placeholder="Describe your inquiry in detail..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="md" icon={Send}>
                    Submit Inquiry
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
