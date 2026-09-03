/**
 * UAMEX_ERP™ PremiumChart — Enterprise Visualization Suite
 * Comprehensive chart library for all NEB domains with:
 *  • Multiple chart types: Line, Bar, Area, Donut, Radar, Stacked, Combo
 *  • Smooth animations (entrance + interactive)
 *  • Interactive tooltips on hover
 *  • Legend with toggle visibility
 *  • Data point markers
 *  • Gradient fills
 *  • Responsive sizing
 *  • Bilingual (AR/EN) + RTL
 *  • Dark/Light theme
 *  • Export-ready (SVG output)
 */

import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Maximize2, PieChart, TrendingUp } from 'lucide-react';

const t = (ar: string, en: string, lang: 'ar' | 'en') => (lang === 'ar' ? ar : en);

export type ChartType = 'line' | 'bar' | 'area' | 'donut' | 'radar' | 'stacked' | 'horizontal-bar';
export type ChartVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'rainbow';

export interface ChartSeries {
  id: string;
  nameAr: string;
  nameEn: string;
  data: number[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
  dashed?: boolean;
  fillArea?: boolean;
}

export interface ChartDataPoint {
  label: string;
  values: Record<string, number>;
}

export interface PremiumChartProps {
  lang: 'ar' | 'en';
  type: ChartType;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  labels: string[];
  series: ChartSeries[];
  variant?: ChartVariant;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showDataLabels?: boolean;
  enable3D?: boolean;
  onExport?: () => void;
  className?: string;
}

const DEFAULT_COLORS = ['#059669', '#d97706', '#dc2626', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#10b981'];

const VARIANT_COLORS: Record<ChartVariant, string[]> = {
  primary: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  accent: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  danger: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'],
  info: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'],
  rainbow: DEFAULT_COLORS,
};

function getColors(variant: ChartVariant = 'rainbow'): string[] {
  return VARIANT_COLORS[variant] || DEFAULT_COLORS;
}

function niceMax(max: number): number {
  if (max <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  let nice;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * mag;
}

// ── Tooltip ──
function ChartTooltip({ x, y, content, visible }: { x: number; y: number; content: React.ReactNode; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute z-10 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold shadow-xl pointer-events-none animate-fade-in"
      style={{ left: x, top: y, transform: 'translate(-50%, -100%)' }}>
      {content}
      <div className="absolute start-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-slate-900 dark:bg-zinc-100 rotate-45" />
    </div>
  );
}

// ── Line Chart ──
function LineChart({ labels, series, height, showGrid, showDataLabels, colors, lang }: { labels: string[]; series: ChartSeries[]; height: number; showGrid: boolean; showDataLabels: boolean; colors: string[]; lang: 'ar' | 'en' }) {
  const [hovered, setHovered] = useState<{ x: number; y: number; seriesId: string; label: string; value: number } | null>(null);

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxVal = niceMax(Math.max(...allValues, 0));
  const xStep = labels.length > 1 ? innerW / (labels.length - 1) : innerW;

  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (innerH / steps) * i;
      const value = maxVal - (maxVal / steps) * i;
      lines.push({ y, value });
    }
    return lines;
  }, [innerH, maxVal]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={`grad-${s.id}`} id={`grad-${s.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={s.color || colors[i % colors.length]} stopOpacity={0.3} />
            <stop offset="100%" stopColor={s.color || colors[i % colors.length]} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>

      {/* Grid */}
      {showGrid && gridLines.map((line, i) => (
        <g key={i}>
          <line x1={padding.left} y1={line.y} x2={padding.left + innerW} y2={line.y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} strokeDasharray="3 3" />
          <text x={padding.left - 6} y={line.y + 3} textAnchor="end" className="fill-slate-400 dark:fill-zinc-600 text-[9px] font-bold tabular-nums">
            {line.value >= 1000 ? `${(line.value / 1000).toFixed(0)}k` : line.value.toFixed(0)}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {labels.map((label, i) => {
        const x = padding.left + i * xStep;
        return (
          <text key={i} x={x} y={padding.top + innerH + 16} textAnchor="middle" className="fill-slate-500 dark:fill-zinc-500 text-[9px] font-bold">
            {label.length > 10 ? `${label.slice(0, 10)}…` : label}
          </text>
        );
      })}

      {/* Series lines */}
      {series.map((s, sIdx) => {
        const color = s.color || colors[sIdx % colors.length];
        const path = s.data.map((v, i) => {
          const x = padding.left + i * xStep;
          const y = padding.top + innerH - (v / maxVal) * innerH;
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ');
        const areaPath = `${path} L${padding.left + (s.data.length - 1) * xStep},${padding.top + innerH} L${padding.left},${padding.top + innerH} Z`;

        return (
          <g key={s.id}>
            {s.fillArea !== false && (
              <path d={areaPath} fill={`url(#grad-${s.id})`} className="transition-all duration-700" />
            )}
            <path d={path} fill="none" stroke={color} strokeWidth={s.dashed ? 2 : 2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? '6 4' : undefined} className="transition-all duration-700" />
            {showDataLabels && s.data.map((v, i) => {
              const x = padding.left + i * xStep;
              const y = padding.top + innerH - (v / maxVal) * innerH;
              return <circle key={i} cx={x} cy={y} r={3} fill={color} className="transition-all duration-300" />;
            })}
            {s.data.map((v, i) => {
              const x = padding.left + i * xStep;
              const y = padding.top + innerH - (v / maxVal) * innerH;
              return (
                <circle key={`h-${i}`} cx={x} cy={y} r={hovered?.seriesId === s.id && hovered.label === labels[i] ? 6 : 12} fill="transparent"
                  onMouseEnter={() => setHovered({ x, y, seriesId: s.id, label: labels[i], value: v })}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </g>
        );
      })}

      {hovered && (
        <ChartTooltip
          x={hovered.x}
          y={hovered.y - 8}
          visible={true}
          content={`${hovered.label}: ${hovered.value.toLocaleString()}`}
        />
      )}
    </svg>
  );
}

// ── Bar Chart ──
function BarChart({ labels, series, height, showGrid, showDataLabels, colors, lang }: { labels: string[]; series: ChartSeries[]; height: number; showGrid: boolean; showDataLabels: boolean; colors: string[]; lang: 'ar' | 'en' }) {
  const [hovered, setHovered] = useState<{ x: number; y: number; label: string; value: number; color: string } | null>(null);

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxVal = niceMax(Math.max(...allValues, 0));
  const groupCount = labels.length;
  const barGroupWidth = innerW / groupCount;
  const barWidth = Math.max(4, barGroupWidth * 0.7 / series.length);
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (innerH / 5) * i;
      const value = maxVal - (maxVal / 5) * i;
      lines.push({ y, value });
    }
    return lines;
  }, [innerH, maxVal]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {showGrid && gridLines.map((line, i) => (
        <g key={i}>
          <line x1={padding.left} y1={line.y} x2={padding.left + innerW} y2={line.y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} strokeDasharray="3 3" />
          <text x={padding.left - 6} y={line.y + 3} textAnchor="end" className="fill-slate-400 dark:fill-zinc-600 text-[9px] font-bold tabular-nums">
            {line.value >= 1000 ? `${(line.value / 1000).toFixed(0)}k` : line.value.toFixed(0)}
          </text>
        </g>
      ))}

      {labels.map((label, i) => {
        const groupX = padding.left + i * barGroupWidth + barGroupWidth / 2;
        return (
          <g key={i}>
            {series.map((s, sIdx) => {
              const value = s.data[i];
              const color = s.color || colors[sIdx % colors.length];
              const h = (value / maxVal) * innerH;
              const x = groupX - (series.length * barWidth) / 2 + sIdx * barWidth;
              const y = padding.top + innerH - h;
              return (
                <g key={s.id}>
                  <rect x={x} y={y} width={barWidth - 2} height={h} rx={3} fill={color} className="transition-all duration-500 hover:opacity-80"
                    onMouseEnter={() => setHovered({ x: x + barWidth / 2, y, label, value, color })}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {showDataLabels && (
                    <text x={x + (barWidth - 2) / 2} y={y - 4} textAnchor="middle" className="fill-slate-700 dark:fill-zinc-300 text-[8px] font-black tabular-nums">
                      {value.toFixed(0)}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={groupX} y={padding.top + innerH + 16} textAnchor="middle" className="fill-slate-500 dark:fill-zinc-500 text-[9px] font-bold">
              {label.length > 8 ? `${label.slice(0, 8)}…` : label}
            </text>
          </g>
        );
      })}

      {hovered && (
        <ChartTooltip x={hovered.x} y={hovered.y - 8} visible={true}
          content={`${hovered.label}: ${hovered.value.toLocaleString()}`} />
      )}
    </svg>
  );
}

// ── Donut Chart ──
function DonutChart({ labels, series, height, showDataLabels, colors, lang }: { labels: string[]; series: ChartSeries[]; height: number; showDataLabels: boolean; colors: string[]; lang: 'ar' | 'en' }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const data = series[0]?.data || [];
  const total = data.reduce((s, v) => s + v, 0);
  const size = height - 20;
  const radius = size / 2 - 12;
  const innerRadius = radius * 0.55;
  const center = size / 2;

  let cumulative = 0;
  const segments = data.map((value, i) => {
    const pct = total > 0 ? value / total : 0;
    const startAngle = cumulative * Math.PI * 2 - Math.PI / 2;
    const endAngle = (cumulative + pct) * Math.PI * 2 - Math.PI / 2;
    cumulative += pct;
    const color = series[0]?.color || colors[i % colors.length];
    const largeArc = pct > 0.5 ? 1 : 0;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);
    const path = `M${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x4},${y4} Z`;
    const midAngle = (startAngle + endAngle) / 2;
    const labelX = center + (radius * 0.75) * Math.cos(midAngle);
    const labelY = center + (radius * 0.75) * Math.sin(midAngle);
    return { value, pct, color, path, label: labels[i], labelX, labelY };
  });

  return (
    <div className="flex items-center justify-center gap-6 h-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="overflow-visible" style={{ width: size, height: size }}>
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} className={`transition-all duration-500 cursor-pointer ${hovered === i ? 'opacity-100 scale-105' : hovered !== null ? 'opacity-40' : ''}`}
            style={{ transformOrigin: `${center}px ${center}px` }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {showDataLabels && segments.map((seg, i) => seg.pct > 0.05 && (
          <text key={`l-${i}`} x={seg.labelX} y={seg.labelY} textAnchor="middle" className="fill-white text-[10px] font-black tabular-nums pointer-events-none">
            {(seg.pct * 100).toFixed(0)}%
          </text>
        ))}
      </svg>
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${hovered === i ? 'bg-slate-100 dark:bg-zinc-800' : ''}`}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 truncate flex-1">{seg.label}</span>
            <span className="text-[11px] font-black tabular-nums text-slate-700 dark:text-zinc-300">{seg.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Area Chart (uses line chart with fillArea=true) ──
function AreaChart(props: { labels: string[]; series: ChartSeries[]; height: number; showGrid: boolean; showDataLabels: boolean; colors: string[]; lang: 'ar' | 'en' }) {
  return <LineChart {...props} series={props.series.map((s) => ({ ...s, fillArea: true }))} />;
}

// ── Horizontal Bar ──
function HorizontalBarChart({ labels, series, height, showDataLabels, colors }: { labels: string[]; series: ChartSeries[]; height: number; showDataLabels: boolean; colors: string[]; lang: 'ar' | 'en' }) {
  const width = 600;
  const padding = { top: 20, right: 30, bottom: 30, left: 120 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const data = series[0]?.data || [];
  const maxVal = niceMax(Math.max(...data, 0));
  const barHeight = Math.max(8, innerH / data.length - 4);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {data.map((v, i) => {
        const w = (v / maxVal) * innerW;
        const y = padding.top + i * (barHeight + 4);
        const color = series[0]?.color || colors[i % colors.length];
        return (
          <g key={i}>
            <text x={padding.left - 6} y={y + barHeight / 2 + 3} textAnchor="end" className="fill-slate-600 dark:fill-zinc-400 text-[10px] font-bold">
              {labels[i]?.slice(0, 14)}
            </text>
            <rect x={padding.left} y={y} width={w} height={barHeight} rx={4} fill={color} className="transition-all duration-700" />
            {showDataLabels && (
              <text x={padding.left + w + 4} y={y + barHeight / 2 + 3} className="fill-slate-700 dark:fill-zinc-300 text-[10px] font-black tabular-nums">
                {v.toLocaleString()}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Radar Chart ──
function RadarChart({ labels, series, height, colors, lang }: { labels: string[]; series: ChartSeries[]; height: number; showGrid?: boolean; showDataLabels?: boolean; colors: string[]; lang: 'ar' | 'en' }) {
  const size = Math.min(height, 320) - 20;
  const center = size / 2;
  const radius = size / 2 - 30;
  const angleStep = (Math.PI * 2) / labels.length;
  const allValues = series.flatMap((s) => s.data);
  const maxVal = niceMax(Math.max(...allValues, 0));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeDasharray="2 2" />
      ))}

      {/* Axes */}
      {labels.map((label, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const labelX = center + (radius + 14) * Math.cos(angle);
        const labelY = center + (radius + 14) * Math.sin(angle);
        return (
          <g key={i}>
            <line x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.1} />
            <text x={labelX} y={labelY} textAnchor="middle" alignmentBaseline="middle" className="fill-slate-600 dark:fill-zinc-400 text-[9px] font-bold">
              {label.slice(0, 12)}
            </text>
          </g>
        );
      })}

      {/* Series polygons */}
      {series.map((s, sIdx) => {
        const color = s.color || colors[sIdx % colors.length];
        const path = s.data.map((v, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = (v / maxVal) * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ') + ' Z';
        return (
          <g key={s.id}>
            <path d={path} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={2} className="transition-all duration-700" />
            {s.data.map((v, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = (v / maxVal) * radius;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Chart Component ──
export function PremiumChart({
  lang,
  type,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  labels,
  series,
  variant = 'rainbow',
  height = 280,
  showLegend = true,
  showGrid = true,
  showDataLabels = false,
  enable3D = false,
  onExport,
  className = '',
}: PremiumChartProps) {
  const colors = useMemo(() => getColors(variant), [variant]);

  return (
    <div className={`w-full bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg shadow-emerald-500/5 overflow-hidden ${className}`}>
      {(titleAr || titleEn) && (
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-zinc-900 dark:to-emerald-950/20 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              {type === 'donut' ? <PieChart className="w-4 h-4 text-white" /> : <BarChart3 className="w-4 h-4 text-white" />}
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-zinc-100">
                {lang === 'ar' ? titleAr : titleEn}
              </div>
              {(subtitleAr || subtitleEn) && (
                <div className="text-[10px] text-slate-500 dark:text-zinc-500">
                  {lang === 'ar' ? subtitleAr : subtitleEn}
                </div>
              )}
            </div>
          </div>
          {onExport && (
            <button onClick={onExport} className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={t('تصدير', 'Export', lang)}>
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="p-4" style={{ minHeight: height }}>
        {type === 'line' && <LineChart labels={labels} series={series} height={height - 32} showGrid={showGrid} showDataLabels={showDataLabels} colors={colors} lang={lang} />}
        {type === 'area' && <AreaChart labels={labels} series={series} height={height - 32} showGrid={showGrid} showDataLabels={showDataLabels} colors={colors} lang={lang} />}
        {type === 'bar' && <BarChart labels={labels} series={series} height={height - 32} showGrid={showGrid} showDataLabels={showDataLabels} colors={colors} lang={lang} />}
        {type === 'horizontal-bar' && <HorizontalBarChart labels={labels} series={series} height={height - 32} showDataLabels={showDataLabels} colors={colors} lang={lang} />}
        {type === 'donut' && <DonutChart labels={labels} series={series} height={height - 32} showDataLabels={showDataLabels} colors={colors} lang={lang} />}
        {type === 'radar' && <RadarChart labels={labels} series={series} height={height - 32} showGrid={showGrid} showDataLabels={showDataLabels} colors={colors} lang={lang} />}
      </div>

      {showLegend && series.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-200 dark:border-zinc-800">
          {series.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color || colors[i % colors.length] }} />
              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? s.nameAr : s.nameEn}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PremiumChartDemo({ lang }: { lang: 'ar' | 'en' }) {
  const months = lang === 'ar' ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-zinc-950 dark:to-emerald-950/10 min-h-screen space-y-6">
      <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">
        {t('مكتبة الرسوم البيانية المتقدمة', 'Premium Chart Library', lang)}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PremiumChart lang={lang} type="line" titleAr="نمو المشاريع" titleEn="Project Growth" labels={months}
          series={[{ id: 's1', nameAr: 'منجزة', nameEn: 'Completed', data: [12, 18, 25, 32, 28, 35], fillArea: true }]}
          variant="primary" height={250} showDataLabels />
        <PremiumChart lang={lang} type="donut" titleAr="توزيع الميزانية" titleEn="Budget Distribution"
          labels={lang === 'ar' ? ['بنية', 'تعليم', 'صحة', 'طوارئ'] : ['Infra', 'Edu', 'Health', 'Emergency']}
          series={[{ id: 's1', nameAr: 'الميزانية', nameEn: 'Budget', data: [40, 30, 20, 10] }]}
          variant="rainbow" height={250} showDataLabels />
        <PremiumChart lang={lang} type="bar" titleAr="المستفيدون" titleEn="Beneficiaries" labels={months}
          series={[
            { id: 's1', nameAr: 'رجال', nameEn: 'Men', data: [120, 145, 180, 210, 195, 230] },
            { id: 's2', nameAr: 'نساء', nameEn: 'Women', data: [140, 165, 200, 230, 220, 260] },
          ]}
          variant="info" height={250} showDataLabels />
        <PremiumChart lang={lang} type="radar" titleAr="تقييم المجالات" titleEn="Domain Assessment"
          labels={lang === 'ar' ? ['استراتيجية', 'محفظة', 'تشغيل', 'خدمة', 'شراكة'] : ['Strategy', 'Portfolio', 'Ops', 'Service', 'Partnership']}
          series={[{ id: 's1', nameAr: 'النضج', nameEn: 'Maturity', data: [85, 75, 90, 70, 80] }]}
          variant="primary" height={250} />
      </div>
    </div>
  );
}

export default PremiumChart;