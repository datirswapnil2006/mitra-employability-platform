import React, { useState } from 'react';

const DEFAULT_COMPETENCIES = [
  { key: 'communication', label: 'Communication' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'emotionalIntelligence', label: 'Emotional Intelligence' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'timeManagement', label: 'Time Management' },
  { key: 'resilience', label: 'Resilience' },
  { key: 'professionalism', label: 'Professionalism' }
];

export const RadarChart = ({
  traitScores = {},
  size = 460,
  className = '',
  showBenchmark = true,
  benchmarkValue = 70,
  title = '10-Dimension Talent Radar'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const center = size / 2;
  const radius = size * 0.36;
  const totalAxes = DEFAULT_COMPETENCIES.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // Levels for concentric grid (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to calculate X, Y from angle & normalized value (0..1)
  const getCoordinates = (index, value = 1.0) => {
    // Start from top (-PI / 2)
    const angle = angleSlice * index - Math.PI / 2;
    const r = radius * Math.max(0, Math.min(1.0, value));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Build grid polygon points for each concentric level
  const gridPolygons = levels.map((lvl) => {
    return DEFAULT_COMPETENCIES.map((_, i) => {
      const { x, y } = getCoordinates(i, lvl);
      return `${x},${y}`;
    }).join(' ');
  });

  // Benchmark polygon points (e.g. 70%)
  const benchmarkPolygon = DEFAULT_COMPETENCIES.map((_, i) => {
    const { x, y } = getCoordinates(i, benchmarkValue / 100);
    return `${x},${y}`;
  }).join(' ');

  // Student scores polygon
  const scorePoints = DEFAULT_COMPETENCIES.map((comp, i) => {
    const rawVal = traitScores[comp.key]?.score ?? traitScores[comp.key] ?? 70;
    const norm = Math.max(10, Math.min(100, rawVal)) / 100;
    const coords = getCoordinates(i, norm);
    return {
      ...coords,
      score: rawVal,
      comp,
      level: traitScores[comp.key]?.level || (rawVal >= 85 ? 'Excellent' : rawVal >= 70 ? 'Strong' : 'Developing'),
      explanation: traitScores[comp.key]?.explanation || ''
    };
  });

  const studentPolygon = scorePoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible drop-shadow-sm"
        >
          <defs>
            {/* Gradient Fill for Student Polygon */}
            <linearGradient id="radarStudentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.15" />
            </linearGradient>

            {/* Glowing filter for vertices */}
            <filter id="vertexGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#4F46E5" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Concentric Grid Rings */}
          {gridPolygons.map((poly, idx) => (
            <polygon
              key={idx}
              points={poly}
              fill={idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'}
              stroke="#E2E8F0"
              strokeWidth={idx === levels.length - 1 ? '1.5' : '1'}
              strokeDasharray={idx === levels.length - 1 ? 'none' : '2,2'}
            />
          ))}

          {/* Axis Lines from Center to Outer Vertices */}
          {DEFAULT_COMPETENCIES.map((_, i) => {
            const outer = getCoordinates(i, 1.0);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {/* Benchmark Ring Overlay (Industry Target: 70%) */}
          {showBenchmark && (
            <polygon
              points={benchmarkPolygon}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          )}

          {/* Student Filled Polygon */}
          <polygon
            points={studentPolygon}
            fill="url(#radarStudentGradient)"
            stroke="#4F46E5"
            strokeWidth="2.5"
            className="transition-all duration-700 ease-out"
          />

          {/* Data Points & Vertex Circles */}
          {scorePoints.map((point, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 7 : 4.5}
                  fill={isHovered ? '#4338CA' : '#4F46E5'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter="url(#vertexGlow)"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Vertex Labels & Score Badges */}
          {DEFAULT_COMPETENCIES.map((comp, i) => {
            const point = scorePoints[i];
            const labelCoord = getCoordinates(i, 1.22);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Competency Name */}
                <text
                  x={labelCoord.x}
                  y={labelCoord.y - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[10.5px] font-bold ${
                    isHovered ? 'fill-indigo-900 font-black scale-105' : 'fill-slate-700'
                  }`}
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {comp.label}
                </text>

                {/* Score Pill Badge */}
                <text
                  x={labelCoord.x}
                  y={labelCoord.y + 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[10px] font-black ${
                    point.score >= 85
                      ? 'fill-emerald-700'
                      : point.score >= 70
                      ? 'fill-indigo-700'
                      : 'fill-amber-700'
                  }`}
                  style={{ fontFamily: 'monospace, system-ui' }}
                >
                  {point.score}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Hover Tooltip Overlay */}
        {hoveredIndex !== null && scorePoints[hoveredIndex] && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-indigo-500/40 backdrop-blur-xs pointer-events-none z-20 max-w-xs text-center space-y-1 animate-fadeIn">
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-indigo-300">{scorePoints[hoveredIndex].comp.label}</span>
              <span className="px-2 py-0.5 bg-indigo-600/80 rounded-full font-black text-[10px]">
                {scorePoints[hoveredIndex].score}% ({scorePoints[hoveredIndex].level})
              </span>
            </div>
            {scorePoints[hoveredIndex].explanation && (
              <p className="text-[11px] text-slate-300 leading-tight">
                {scorePoints[hoveredIndex].explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600 font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-600 border border-white shadow-xs" />
          <span>Candidate Talent Score</span>
        </div>
        {showBenchmark && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400" />
            <span>Placement Readiness Target ({benchmarkValue}%)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarChart;
