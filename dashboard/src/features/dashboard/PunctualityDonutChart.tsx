import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PunctualitySummary } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';
import { useApp } from '../../contexts/app-context';

interface PunctualityDonutChartProps {
  summary: PunctualitySummary;
  isLoading?: boolean;
  className?: string;
}

const COLORS = {
  on_time: 'var(--success)',
  late: 'var(--warning)',
  absent: 'var(--destructive)',
  empty: 'var(--muted)',
};

const DEMO_SUMMARY: PunctualitySummary = {
  on_time: 18,
  late: 4,
  absent: 2,
  total: 24,
  on_time_rate: 75,
};

export function PunctualityDonutChart({ summary, isLoading, className = '' }: PunctualityDonutChartProps) {
  const { t, lang } = useApp();
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[280px] ${className}`} />;

  const isDemo = summary.total === 0;
  const s = isDemo ? DEMO_SUMMARY : summary;

  const data = [
    { name: t('attendance.ontime'), value: s.on_time, color: COLORS.on_time },
    { name: t('attendance.late'), value: s.late, color: COLORS.late },
    { name: t('attendance.absent'), value: s.absent, color: COLORS.absent },
  ].filter(d => d.value > 0);

  const legendRows = [
    { label: t('attendance.ontime'), value: s.on_time, color: COLORS.on_time, pct: s.total > 0 ? Math.round((s.on_time / s.total) * 100) : 0 },
    { label: lang === 'vi' ? 'Đi trễ' : 'Late', value: s.late, color: COLORS.late, pct: s.total > 0 ? Math.round((s.late / s.total) * 100) : 0 },
    { label: lang === 'vi' ? 'Vắng mặt' : 'Absent', value: s.absent, color: COLORS.absent, pct: s.total > 0 ? Math.round((s.absent / s.total) * 100) : 0 },
  ];

  return (
    <div className={`rounded-lg border border-border bg-card p-5 flex flex-col shadow-card ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">{t('overview.chart.attendanceRatio')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('overview.chart.attendanceRatioSub').replace('{count}', String(s.total))}</p>
        </div>
        {isDemo && (
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            demo
          </span>
        )}
      </div>

      {/* Donut */}
      <div className="relative flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="52%"
              outerRadius="72%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-card)',
                padding: '8px 14px',
              }}
              itemStyle={{ color: 'var(--foreground)', fontSize: '13px' }}
              formatter={(value) => [`${value} ${t('overview.chart.peopleUnit')}`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-foreground font-sans">{s.on_time_rate}%</span>
          <span className="mt-0.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{t('attendance.ontime')}</span>
        </div>
      </div>

      {/* Legend rows — Dentexa style with percentage bar */}
      <div className="mt-4 space-y-2.5">
        {legendRows.map(row => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                <span className="text-muted-foreground">{row.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{row.value}</span>
                <span className="w-7 text-right text-muted-foreground">{row.pct}%</span>
              </div>
            </div>
            <div className="h-1 w-full rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${row.pct}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
