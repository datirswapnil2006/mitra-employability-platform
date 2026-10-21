import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, BookOpen, FileCheck, PhoneCall, Mail, GraduationCap, ChevronRight, Award } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#08284B] border-t border-[#F8C85A]/25 text-[#FFF8E9]/80 text-xs selection:bg-[#F8C85A] selection:text-[#08284B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Institutional Branding (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/college-logo.jpg"
                alt="Institutional Logo"
                className="h-10 w-auto rounded-lg object-contain bg-white p-1 border border-[#F8C85A]/40 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white group-hover:text-[#F8C85A] transition-colors">
                    MITRA
                  </span>
                  <span className="bg-[#F8C85A]/20 text-[#F8C85A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#F8C85A]/40 uppercase tracking-wider">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#FFF8E9]/70 tracking-wide">
                  Employability & Placement Platform
                </p>
              </div>
            </Link>

            <p className="text-[#FFF8E9]/75 text-xs leading-relaxed max-w-sm">
              Institutional AI-assisted platform empowering students across 9 academic departments with modular syllabus training, AI-grounded diagnostic evaluations, and verifiable campus placement readiness.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#FFF8E9]/80">
              <span className="inline-flex items-center gap-1.5 bg-[#FFF8E9]/10 px-2.5 py-1 rounded-md border border-[#FFF8E9]/15">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F8C85A]" />
                100% Profile Gated
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#FFF8E9]/10 px-2.5 py-1 rounded-md border border-[#FFF8E9]/15">
                <Sparkles className="w-3.5 h-3.5 text-[#F8C85A]" />
                AI Diagnostic Engine
              </span>
            </div>
          </div>

          {/* Column 2: Learning Resources (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-[#F8C85A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#F8C85A]" />
              Learning Resources
            </h4>
            <ul className="space-y-2 text-[#FFF8E9]/80 text-xs">
              <li>
                <Link to="/training" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Curriculum Modules Catalog
                </Link>
              </li>
              <li>
                <a href="/#features" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Technical Coding & DSA
                </a>
              </li>
              <li>
                <a href="/#practice" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Aptitude & Reasoning Drills
                </a>
              </li>
              <li>
                <a href="/#domains" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Department Syllabus Tracks
                </a>
              </li>
              <li>
                <a href="/#assessments" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  AI-Assisted Practice Tests
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Portal Navigation (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-[#F8C85A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#F8C85A]" />
              Portal
            </h4>
            <ul className="space-y-2 text-[#FFF8E9]/80 text-xs">
              <li>
                <Link to="/" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  About MITRA
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#readiness" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Career Readiness
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Student Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#F8C85A] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#F8C85A]/60" />
                  Register Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Support (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-[#F8C85A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#F8C85A]" />
              Support & Placement
            </h4>
            <p className="text-xs text-[#FFF8E9]/75 leading-relaxed">
              Managed in collaboration with the Training & Placement Cell for campus recruitment readiness.
            </p>
            <div className="space-y-2 text-xs text-[#FFF8E9]/80 pt-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#F8C85A] shrink-0" />
                <Link to="/contact" className="hover:text-[#F8C85A] transition-colors">
                  Contact Placement Office
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-[#F8C85A] shrink-0" />
                <span>Department Faculty Coordinators</span>
              </div>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] font-bold text-xs transition-colors shadow-xs"
              >
                Launch Student Portal
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#FFF8E9]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#FFF8E9]/60">
          <p>© 2026 MITRA Employability Platform. Dedicated to Student Career Readiness.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-[#F8C85A] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-[#F8C85A] transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/contact" className="hover:text-[#F8C85A] transition-colors">
              Placement Cell Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

