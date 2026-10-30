import React, { useState } from 'react';
import { TrendingUp, Award, CheckCircle2, Sparkles, Code2, BrainCircuit, Cpu, MessageSquare } from 'lucide-react';

const DEFAULT_DOMAINS = [
  {
    id: 'tech',
    domain: 'Technical Coding & DSA',
    shortName: 'Technical & DSA',
    score: 86,
    color: '#38BDF8',
    gradientStart: '#38BDF8',
    gradientEnd: '#0284C7',
    status: 'Recruiter Qualified',
    icon: Code2,
    details: 'Recursion, Data Structures, Algorithms'
  },
  {
    id: 'aptitude',
    domain: 'Quantitative & Logical Aptitude',
    shortName: 'Quantitative & Logic',
    score: 91,
    color: '#34D399',
    gradientStart: '#34D399',
    gradientEnd: '#059669',
    status: 'Advanced Tier',
    icon: BrainCircuit,
    details: 'Arithmetic, Reasoning, Data Interpretation'
  },
  {
    id: 'core',
    domain: 'Core Department Engineering',
    shortName: 'Core Engineering',
    score: 80,
    color: '#F8C85A',
    gradientStart: '#F8C85A',
    gradientEnd: '#D97706',
    status: 'Proficient',
    icon: Cpu,
    details: 'Department Domain, Systems, Fundamentals'
  },
  {
    id: 'soft',
    domain: 'Professional & Verbal Communication',
    shortName: 'Verbal & Professional',
    score: 84,
    color: '#C084FC',
    gradientStart: '#C084FC',
    gradientEnd: '#9333EA',
    status: 'Interview Ready',
    icon: MessageSquare,
    details: 'Business English, Aptitude Comprehension'
  }
];

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function getDonutArcPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const p1 = polarToCartesian(cx, cy, outerRadius, endAngle);
  const p2 = polarToCartesian(cx, cy, outerRadius, startAngle);
  const p3 = polarToCartesian(cx, cy, innerRadius, startAngle);
  const p4 = polarToCartesian(cx, cy, innerRadius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M', p1.x.toFixed(2), p1.y.toFixed(2),
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, p2.x.toFixed(2), p2.y.toFixed(2),
    'L', p3.x.toFixed(2), p3.y.toFixed(2),
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, p4.x.toFixed(2), p4.y.toFixed(2),
    'Z'
  ].join(' ');
}

export const PlacementReadinessPieChart = ({
  domains = DEFAULT_DOMAINS,
  overallScore = 88,
  cutoffScore = 75,
  confidence = 94,
  className = ''
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const cx = 130;
  const cy = 130;
  const baseInnerR = 70;
  const baseOuterR = 104;
  const gapAngle = 4; // degrees gap between segments

  const activeDomain = hoveredIdx !== null ? domains[hoveredIdx] : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header Row with Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#F8C85A] uppercase tracking-wider">
              Student Benchmark Dashboard
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> Top 15% Cohort
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            Overall Placement Readiness Index
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#FFF8E9]/10 px-4 py-2 rounded-xl border border-[#F8C85A]/30 flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black text-[#F8C85A] leading-none">{overallScore}%</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-0.5">Cutoff {cutoffScore}% Met</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#F8C85A]/20 flex items-center justify-center text-[#F8C85A] shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Showcase: Pie Chart on Left, Breakdown Cards on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white/[0.03] p-5 sm:p-6 rounded-2xl border border-white/10 relative overflow-hidden backdrop-blur-sm">
        {/* Ambient subtle glow behind pie chart */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#F8C85A]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Left: SVG Pie / Donut Chart (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] flex items-center justify-center">
            <svg
              viewBox="0 0 260 260"
              className="w-full h-full transform transition-transform duration-300 drop-shadow-xl"
            >
              <defs>
                {domains.map((d, i) => (
                  <linearGradient key={`grad-${i}`} id={`pie-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={d.gradientStart} />
                    <stop offset="100%" stopColor={d.gradientEnd} />
                  </linearGradient>
                ))}
                {/* Glow Filter */}
                <filter id="pie-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background guide ring */}
              <circle
                cx={cx}
                cy={cy}
                r={baseOuterR + 2}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Cutout backdrop shadow circle */}
              <circle
                cx={cx}
                cy={cy}
                r={baseInnerR - 2}
                fill="#051B33"
                stroke="rgba(248, 200, 90, 0.2)"
                strokeWidth="1.5"
              />

              {/* Render 4 Slices */}
              {domains.map((domain, idx) => {
                const isHovered = hoveredIdx === idx;
                const sliceAngle = 360 / domains.length;
                const startAngle = idx * sliceAngle + gapAngle / 2;
                const endAngle = (idx + 1) * sliceAngle - gapAngle / 2;

                const outerR = isHovered ? baseOuterR + 7 : baseOuterR;
                const innerR = isHovered ? baseInnerR - 2 : baseInnerR;

                const pathData = getDonutArcPath(cx, cy, innerR, outerR, startAngle, endAngle);

                return (
                  <g
                    key={domain.id || idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer transition-all duration-300"
                    style={{ outline: 'none' }}
                  >
                    <path
                      d={pathData}
                      fill={`url(#pie-grad-${idx})`}
                      opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
                      filter={isHovered ? 'url(#pie-glow)' : undefined}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Central Info Badge (Inside Donut Hole) */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none select-none transition-all duration-300"
              style={{ width: '136px', height: '136px', margin: 'auto' }}
            >
              {activeDomain ? (
                <div className="space-y-0.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-300 truncate max-w-[110px]">
                    {activeDomain.shortName}
                  </div>
                  <div
                    className="text-3xl font-black leading-none"
                    style={{ color: activeDomain.color }}
                  >
                    {activeDomain.score}%
                  </div>
                  <div className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white mt-1 truncate max-w-[115px]">
                    {activeDomain.status}
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5 animate-in fade-in duration-200">
                  <div className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    Placement Index
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#F8C85A] leading-none tracking-tight">
                    {overallScore}%
                  </div>
                  <div className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Target Met
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#F8C85A]" /> Hover sections for domain benchmarks
          </p>
        </div>

        {/* Right: Domain Competency Cards (7 cols) */}
        <div className="md:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#FFF8E9] pb-1">
            <span>Competency Domains Breakdown</span>
            <span className="text-[#F8C85A] font-mono text-[11px]">AI Confidence: {confidence}%</span>
          </div>

          {domains.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const IconComponent = item.icon || TrendingUp;

            return (
              <div
                key={item.id || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? 'bg-white/10 border-[#F8C85A]/60 shadow-lg translate-x-1'
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color
                      }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-xs leading-tight">
                        {item.domain}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className="text-sm font-black transition-colors"
                      style={{ color: item.color }}
                    >
                      {item.score}%
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlacementReadinessPieChart;
