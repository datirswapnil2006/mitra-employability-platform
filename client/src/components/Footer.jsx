import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Column 1: Institutional Branding */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/college-logo.jpg"
                alt="College Logo"
                className="h-8 w-auto rounded object-contain bg-white p-0.5 border border-slate-700"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white">MITRA</span>
                <span className="bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30 uppercase">
                  v2.0
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              AI-assisted, department-aware employability platform uniting training, assessments, and placement analytics.
            </p>

            <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> AI Grounded
              </span>
            </div>
          </div>

          {/* Column 2: Platform Modules */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Curriculum</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li><Link to="/training" className="hover:text-blue-400 transition">Training Tracks</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Assessments</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">AI Diagnostic Engine</Link></li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Navigation</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li><Link to="/about" className="hover:text-blue-400 transition">About MITRA</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition">Placement Cell</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Student Login</Link></li>
            </ul>
          </div>

          {/* Column 4: Compliance & Legal */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Institutional</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li><Link to="/terms-and-conditions" className="hover:text-blue-400 transition">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              <li><span className="text-slate-500">Academic Integrity</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© 2026 MITRA Employability Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[10px]">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition">Privacy</Link>
            <Link to="/terms-and-conditions" className="hover:text-slate-300 transition">Terms</Link>
            <Link to="/contact" className="hover:text-slate-300 transition">Placement Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

