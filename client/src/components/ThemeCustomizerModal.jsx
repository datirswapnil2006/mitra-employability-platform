import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Layout,
  SlidersHorizontal,
  Paintbrush
} from 'lucide-react';
import Button from './Button';

export const ThemeCustomizerModal = () => {
  const {
    preferences,
    effectiveMode,
    isDark,
    isCustomizerOpen,
    closeCustomizer,
    updateTheme,
    resetTheme,
    PRESET_PRIMARY_COLORS,
    PRESET_SIDEBAR_THEMES
  } = useTheme();

  const [customHexInput, setCustomHexInput] = useState(
    preferences.primaryColor || '#2563EB'
  );
  const [customSidebarInput, setCustomSidebarInput] = useState(
    preferences.customSidebarColor || '#1E1B4B'
  );

  if (!isCustomizerOpen) return null;

  const handleSelectMode = (mode) => {
    updateTheme({ mode });
  };

  const handleSelectPrimary = (hex) => {
    setCustomHexInput(hex);
    updateTheme({ primaryColor: hex });
  };

  const handleCustomPrimaryChange = (e) => {
    const val = e.target.value;
    setCustomHexInput(val);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      updateTheme({ primaryColor: val, customPrimaryColor: val });
    }
  };

  const handleSelectSidebar = (sidebarId) => {
    updateTheme({ sidebarColor: sidebarId });
  };

  const handleCustomSidebarChange = (e) => {
    const val = e.target.value;
    setCustomSidebarInput(val);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      updateTheme({ sidebarColor: 'custom', customSidebarColor: val });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          borderColor: 'var(--card-border, #E2E8F0)',
          color: 'var(--text-primary, #0F172A)'
        }}
      >
        {/* Modal Header */}
        <div
          className="p-5 sm:p-6 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--card-border, #E2E8F0)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--primary-light, rgba(37,99,235,0.12))',
                color: 'var(--primary-color, #2563EB)'
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary, #0F172A)' }}>
                Theme Customization
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary, #64748B)' }}>
                Personalize your MITRA dashboard mode, brand colors & sidebar appearance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCustomizer}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* 1. Theme Mode */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary, #64748B)' }}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Interface Mode</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                Active: {effectiveMode.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor }
              ].map(({ id, label, icon: Icon }) => {
                const isSelected = preferences.mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectMode(id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={isSelected ? { borderColor: 'var(--primary-color)', backgroundColor: 'var(--primary-light)' } : {}}
                  >
                    <Icon
                      className="w-5 h-5 mb-1.5"
                      style={isSelected ? { color: 'var(--primary-color)' } : { color: 'var(--text-secondary)' }}
                    />
                    <span className="text-xs font-bold" style={isSelected ? { color: 'var(--primary-color)' } : { color: 'var(--text-primary)' }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Brand / Primary Color Palette */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary, #64748B)' }}>
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Brand Accent Color</span>
              </label>
              <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--primary-color)' }}>
                {preferences.primaryColor}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {PRESET_PRIMARY_COLORS.map((color) => {
                const isSelected = preferences.primaryColor?.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleSelectPrimary(color.hex)}
                    title={color.label}
                    className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer border-2"
                    style={{
                      backgroundColor: color.hex,
                      borderColor: isSelected ? '#FFFFFF' : 'transparent',
                      outline: isSelected ? `3px solid ${color.hex}` : 'none'
                    }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Primary Color Picker */}
            <div
              className="p-3 rounded-2xl border flex items-center justify-between gap-3"
              style={{
                borderColor: 'var(--card-border, #E2E8F0)',
                backgroundColor: isDark ? '#1F2937' : '#F8FAFC'
              }}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={/^#([0-9A-F]{3}){1,2}$/i.test(customHexInput) ? customHexInput : '#2563EB'}
                  onChange={handleCustomPrimaryChange}
                  className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Custom Brand HEX:</span>
              </div>
              <input
                type="text"
                value={customHexInput}
                onChange={handleCustomPrimaryChange}
                placeholder="#2563EB"
                maxLength={7}
                className="w-24 text-xs font-mono font-bold text-center uppercase px-2 py-1.5 rounded-lg border focus:ring-2 focus:outline-none"
                style={{
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: 'var(--card-border, #E2E8F0)',
                  color: 'var(--text-primary, #0F172A)'
                }}
              />
            </div>
          </div>

          {/* 3. Sidebar Appearance */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary, #64748B)' }}>
                <Layout className="w-3.5 h-3.5" />
                <span>Sidebar Appearance</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_SIDEBAR_THEMES.map((sb) => {
                const isSelected = preferences.sidebarColor === sb.id;
                return (
                  <button
                    key={sb.id}
                    type="button"
                    onClick={() => handleSelectSidebar(sb.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: isSelected ? 'var(--primary-color)' : undefined,
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border shadow-2xs shrink-0"
                          style={{ backgroundColor: sb.bg, borderColor: sb.border }}
                        />
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {sb.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--primary-color)' }} />
                      )}
                    </div>
                    <p className="text-[10px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                      {sb.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Sidebar Color Picker when selected */}
            {preferences.sidebarColor === 'custom' && (
              <div
                className="p-3 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in duration-200"
                style={{
                  borderColor: 'var(--card-border, #E2E8F0)',
                  backgroundColor: isDark ? '#1F2937' : '#F8FAFC'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={/^#([0-9A-F]{3}){1,2}$/i.test(customSidebarInput) ? customSidebarInput : '#1E1B4B'}
                    onChange={handleCustomSidebarChange}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Custom Sidebar HEX:</span>
                </div>
                <input
                  type="text"
                  value={customSidebarInput}
                  onChange={handleCustomSidebarChange}
                  placeholder="#1E1B4B"
                  maxLength={7}
                  className="w-24 text-xs font-mono font-bold text-center uppercase px-2 py-1.5 rounded-lg border focus:ring-2 focus:outline-none"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: 'var(--card-border, #E2E8F0)',
                    color: 'var(--text-primary, #0F172A)'
                  }}
                />
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div
            className="p-4 rounded-2xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--primary-light, rgba(37,99,235,0.08))',
              borderColor: 'var(--primary-color)'
            }}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--primary-color)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Live Theme Preview
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600">
                ● Applied Instantly
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                Primary Action
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl text-xs font-bold border"
                style={{
                  color: 'var(--primary-color)',
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'transparent'
                }}
              >
                Outline Button
              </button>
              <span
                className="px-2 py-1 rounded-md text-[10px] font-bold"
                style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-color)'
                }}
              >
                Badge Tag
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 sm:p-5 border-t flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50"
          style={{ borderColor: 'var(--card-border, #E2E8F0)' }}
        >
          <button
            type="button"
            onClick={resetTheme}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to MITRA Default</span>
          </button>

          <button
            type="button"
            onClick={closeCustomizer}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition"
            style={{ backgroundColor: 'var(--primary-color, #2563EB)' }}
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizerModal;
