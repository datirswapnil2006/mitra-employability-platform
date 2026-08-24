import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  GraduationCap,
  BookOpen,
  Sparkles,
  FileCheck,
  HelpCircle,
  Award,
  BarChart3,
  FileSpreadsheet,
  Settings,
  User,
  Bell,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Layers,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Palette,
  LifeBuoy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, profileCompletion } = useAuth();
  const { openCustomizer } = useTheme();
  const location = useLocation();
  const isAdmin = user && user.role === 'admin';

  // Internal collapse state fallback if not passed from layout
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('mitra_sidebar_collapsed') === 'true';
  });

  const effectiveCollapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('mitra_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  // Manage open states of collapsible groups (Training, Registration, Assessment)
  // Closed by default so sections do not open automatically upon login
  const [openGroups, setOpenGroups] = useState({
    registration: false,
    training: false,
    assessment: false
  });

  const toggleGroup = (groupKey, e) => {
    if (e) e.preventDefault();
    // If sidebar is collapsed on desktop, auto-expand it when clicking a group
    if (effectiveCollapsed) {
      handleToggleCollapse();
    }
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  // Admin Navigation Definition (Section 31)
  const adminNav = [
    {
      type: 'link',
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      type: 'group',
      key: 'registration',
      label: 'Registration',
      icon: UserCheck,
      children: [
        { to: '/admin/students', label: 'Student Directory' },
        { to: '/admin/students/export', label: 'Profile Data Export' }
      ]
    },
    {
      type: 'group',
      key: 'training',
      label: 'Training',
      icon: BookOpen,
      children: [
        { to: '/admin/training?module=Aptitude', label: 'Aptitude' },
        { to: '/admin/training?module=Domain', label: 'Domain Knowledge' },
        { to: '/admin/training?module=Communication', label: 'Communication' },
        { to: '/admin/training?module=Resume', label: 'Resume' },
        { to: '/admin/training?module=Interview', label: 'Interview Preparation' }
      ]
    },
    {
      type: 'link',
      to: '/admin/ai-gen',
      label: 'Psychometric',
      icon: BrainCircuit
    },
    {
      type: 'group',
      key: 'assessment',
      label: 'Assessment',
      icon: FileCheck,
      children: [
        { to: '/admin/assessments?type=Aptitude', label: 'Aptitude' },
        { to: '/admin/assessments?type=Domain', label: 'Domain Knowledge' },
        { to: '/admin/assessments?type=Communication', label: 'Communication' },
        { to: '/admin/assessments?type=Resume', label: 'Resume' },
        { to: '/admin/assessments?type=Interview', label: 'Interview' },
        { to: '/admin/assessments?type=Full', label: 'Full Assessment' }
      ]
    },
    {
      type: 'link',
      to: '/admin/question-bank',
      label: 'Question Bank',
      icon: HelpCircle
    },
    {
      type: 'link',
      to: '/admin/results',
      label: 'Results',
      icon: Award
    },
    {
      type: 'link',
      to: '/admin/analytics',
      label: 'Analytics',
      icon: BarChart3
    },
    {
      type: 'link',
      to: '/admin/reports',
      label: 'Reports',
      icon: FileSpreadsheet
    },
    {
      type: 'link',
      to: '/admin/support',
      label: 'Support Management',
      icon: LifeBuoy
    },
    {
      type: 'link',
      to: '/admin/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  // Student Navigation Definition (Section 32)
  const studentNav = [
    {
      type: 'link',
      to: '/student/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      type: 'link',
      to: '/student/profile',
      label: 'Profile',
      icon: User,
      badge: profileCompletion < 100 ? `${profileCompletion}%` : '✓',
      badgeColor: profileCompletion < 100 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      type: 'group',
      key: 'training',
      label: 'Training',
      icon: BookOpen,
      children: [
        { to: '/student/training?category=Aptitude', label: 'Aptitude' },
        { to: '/student/training?category=Domain', label: 'Domain Knowledge' },
        { to: '/student/training?category=Communication', label: 'Communication' },
        { to: '/student/training?category=Resume', label: 'Resume' },
        { to: '/student/training?category=Interview', label: 'Interview Preparation' }
      ]
    },
    {
      type: 'link',
      to: '/student/psychometric',
      label: 'Psychometric',
      icon: BrainCircuit
    },
    {
      type: 'link',
      to: '/student/assessments',
      label: 'Assessment',
      icon: FileCheck
    },
    {
      type: 'link',
      to: '/student/performance',
      label: 'Performance',
      icon: TrendingUp
    },
    {
      type: 'link',
      to: '/student/support',
      label: 'Support & Suggestions',
      icon: LifeBuoy
    },
    {
      type: 'link',
      to: '/student/notifications',
      label: 'Notifications',
      icon: Bell
    },
    {
      type: 'link',
      to: '/student/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  const currentNav = isAdmin ? adminNav : studentNav;

  // Helper to check if a specific child link is active
  const isChildActive = (childTo, cIdx, allChildren) => {
    const currentPath = location.pathname;
    const currentFull = currentPath + location.search;

    if (childTo.includes('?')) {
      const [targetPath, targetQuery] = childTo.split('?');
      if (currentPath !== targetPath) return false;

      if (location.search) {
        return currentFull.toLowerCase() === childTo.toLowerCase() ||
               location.search.toLowerCase() === `?${targetQuery.toLowerCase()}`;
      }

      // If on target path with no query param, default to first child
      return cIdx === 0;
    }

    // Exact path match for non-query routes (e.g. /admin/students vs /admin/students/export)
    return currentPath === childTo;
  };

  // Helper to check if a top-level link is active
  const isTopLinkActive = (itemTo) => {
    const currentPath = location.pathname;
    if (itemTo === '/student/assessments') {
      return (
        currentPath === '/student/assessments' ||
        currentPath.startsWith('/student/assessment') ||
        currentPath.startsWith('/student/take-assessment') ||
        currentPath.startsWith('/student/assessment-result')
      );
    }
    if (itemTo === '/admin/question-bank' || itemTo === '/admin/questions') {
      return currentPath.startsWith('/admin/question-bank') || currentPath.startsWith('/admin/questions');
    }
    return currentPath === itemTo;
  };

  const sidebarContent = (
    <div
      className="flex flex-col h-full select-none overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: 'var(--sidebar-bg, #0F172A)',
        color: 'var(--sidebar-text, #94A3B8)'
      }}
    >
      {/* Brand Header */}
      <div
        className={`p-4 border-b flex items-center ${effectiveCollapsed ? 'justify-center' : 'justify-between'} gap-2 transition-all`}
        style={{ borderColor: 'var(--sidebar-border, rgba(51, 65, 85, 0.8))' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/college-logo.jpg"
            alt="MITRA Logo"
            className="h-9 w-9 rounded-lg object-contain bg-white p-1 border border-slate-700 shadow-sm shrink-0"
          />
          {!effectiveCollapsed && (
            <div className="min-w-0 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-widest uppercase text-white">MITRA</span>
                <span
                  className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: 'var(--primary-light, rgba(37,99,235,0.2))',
                    color: 'var(--primary-color, #60A5FA)',
                    borderColor: 'var(--primary-color, #3B82F6)'
                  }}
                >
                  {isAdmin ? 'ADMIN' : 'STUDENT'}
                </span>
              </div>
              <p className="text-[10px] font-semibold opacity-75 truncate">
                {isAdmin ? 'Management Console' : 'Employability Portal'}
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse / Expand Icon Button */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition"
          title={effectiveCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {effectiveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close button for mobile drawer */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {!effectiveCollapsed ? (
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
            {isAdmin ? 'Institutional Rights' : 'Student Ecosystem'}
          </div>
        ) : (
          <div className="h-2" />
        )}

        {currentNav.map((item, idx) => {
          if (item.type === 'link') {
            const Icon = item.icon;
            const active = isTopLinkActive(item.to);

            return (
              <Link
                key={idx}
                to={item.to}
                title={effectiveCollapsed ? item.label : undefined}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--sidebar-active-bg, #2563EB)',
                        color: 'var(--sidebar-active-text, #FFFFFF)'
                      }
                    : {}
                }
                className={`flex items-center ${effectiveCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                  active
                    ? 'shadow-md font-bold'
                    : 'opacity-80 hover:opacity-100 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!effectiveCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          if (item.type === 'group') {
            const Icon = item.icon;
            const isOpen = openGroups[item.key] ?? false;
            const hasActiveChild = item.children?.some((c, cIdx) => isChildActive(c.to, cIdx, item.children));

            return (
              <div key={idx} className="space-y-1">
                {/* Collapsible Section Header */}
                <button
                  type="button"
                  onClick={(e) => toggleGroup(item.key, e)}
                  title={effectiveCollapsed ? `${item.label} (Click to toggle)` : undefined}
                  className={`w-full flex items-center ${effectiveCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                    hasActiveChild
                      ? 'bg-white/15 font-bold opacity-100'
                      : 'opacity-80 hover:opacity-100 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                    {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!effectiveCollapsed && (
                    <div className="p-0.5">
                      <ChevronDown
                        className={`w-3.5 h-3.5 opacity-75 transition-transform duration-200 ${
                          isOpen ? 'transform rotate-0' : 'transform -rotate-90'
                        }`}
                      />
                    </div>
                  )}
                </button>

                {/* Sub-Items Accordion Drawer */}
                {!effectiveCollapsed && isOpen && (
                  <div
                    className="pl-7 pr-2 py-1 space-y-1 border-l ml-4 animate-in fade-in slide-in-from-top-1 duration-200"
                    style={{ borderColor: 'var(--sidebar-border, rgba(51, 65, 85, 0.8))' }}
                  >
                    {item.children.map((child, cIdx) => {
                      const active = isChildActive(child.to, cIdx, item.children);

                      return (
                        <Link
                          key={cIdx}
                          to={child.to}
                          style={
                            active
                              ? {
                                  backgroundColor: 'var(--sidebar-active-bg, #2563EB)',
                                  color: 'var(--sidebar-active-text, #FFFFFF)'
                                }
                              : {}
                          }
                          className={`block px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            active
                              ? 'font-bold shadow-xs'
                              : 'opacity-75 hover:opacity-100 hover:bg-white/10'
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </nav>

      {/* Footer Info, Theme Trigger & Collapse Action */}
      <div
        className={`p-3.5 border-t text-[10px] flex items-center ${effectiveCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}
        style={{
          borderColor: 'var(--sidebar-border, rgba(51, 65, 85, 0.8))',
          backgroundColor: 'rgba(0, 0, 0, 0.15)'
        }}
      >
        {!effectiveCollapsed ? (
          <>
            <div>
              <span className="font-bold opacity-90">MITRA 2026</span>
              <p className="text-[9px] opacity-60">Institutional v2.4</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCustomizer}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/15 transition flex items-center gap-1"
                title="Theme Customization"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold hidden xl:inline">Theme</span>
              </button>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={openCustomizer}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/15 transition"
              title="Theme Customization"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/15 transition"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar with Dynamic Width Transition */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 z-30 shadow-xl shrink-0 border-r transition-all duration-300 ease-in-out ${
          effectiveCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{ borderColor: 'var(--sidebar-border, rgba(51, 65, 85, 0.8))' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
