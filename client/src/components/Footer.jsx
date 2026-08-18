import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Mail, MapPin, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Institutional & Product Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/college-logo.jpg"
                alt="College Logo"
                className="h-10 w-auto rounded-lg object-contain bg-white p-1 border border-slate-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-wider text-white">MITRA</span>
                  <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 tracking-wide">Employability Platform</p>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Integrated academic training, modular assessments, AI-assisted evaluations, and centralized placement analytics for student career readiness.
            </p>

            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Institutional Verification
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI Grounded
              </span>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/training" className="hover:text-blue-400 transition">Training Curriculum</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Submodule Assessments</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">AI Assessment Studio</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Placement Analytics</Link></li>
            </ul>
          </div>

          {/* Column 3: Project & Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Project</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/about" className="hover:text-blue-400 transition">About MITRA</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition">Placement Cell & Support</Link></li>
              <li><Link to="/register" className="hover:text-blue-400 transition">Student Registration</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Portal Sign In</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Legal & Integrity</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/terms-and-conditions" className="hover:text-blue-400 transition">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              <li><span className="text-slate-500">Academic Integrity Standards</span></li>
              <li><span className="text-slate-500">Enterprise Security</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 MITRA Employability Portal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition">Privacy</Link>
            <Link to="/terms-and-conditions" className="hover:text-slate-300 transition">Terms</Link>
            <Link to="/contact" className="hover:text-slate-300 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
