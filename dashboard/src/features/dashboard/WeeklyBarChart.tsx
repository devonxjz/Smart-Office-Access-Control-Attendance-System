import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyBreakdown } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';
import { useApp } from '../../contexts/app-context';

interface WeeklyBarChartProps {
  data: DailyBreakdown[];
  isLoading?: boolean;
  className?: string;
}

const getDayLabel = (label: string, lang: string) => {
  if (lang === 'vi') return label;
  const mapping: Record<string, string> = {
    'T2': 'Mon',
    'T3': 'Tue',
    'T4': 'Wed',
    'T5': 'Thu',
    'T6': 'Fri',
    'T7': 'Sat',
    'CN': 'Sun'
  };
  return mapping[label] || label;
};

/** Demo data shown when no real weekly records exist */
const DEMO: DailyBreakdown[] = [
  { date: '', label: 'T2', on_time: 20, late: 3, absent: 1, isToday: false },
  { date: '', label: 'T3', on_time: 18, late: 5, absent: 2, isToday: false },
  { date: '', label: 'T4', on_time: 22, late: 2, absent: 0, isToday: false },
  { date: '', label: 'T5', on_time: 19, late: 4, absent: 1, isToday: false },
  { date: '', label: 'T6', on_time: 21, late: 2, absent: 2, isToday: false },
  { date: '', label: 'T7', on_time: 10, late: 1, absent: 0, isToday: false },
  { date: '', label: 'CN', on_time: 5, late: 0, absent: 0, isToday: true },
];

export function WeeklyBarChart({ data, isLoading, className = '' }: WeeklyBarChartProps) {
  const { t, lang } = useApp();
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[260px] ${className}`} />;

  const hasRealData = data.some(d => d.on_time > 0 || d.late > 0 || d.absent > 0);
  const chartData = hasRealData ? data : DEMO;
  const isDemo = !hasRealData;

  const totalWeek = chartData.reduce((s, d) => s + d.on_time + d.late + d.absent, 0);

  return (
    <div className={`rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 flex flex-col shadow-card transition-all duration-300 hover:shadow-glow ${className}`}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{t('overview.chart.trend7Days')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('overview.chart.weeklyTotal').replace('{count}', String(totalWeek))}</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              demo
            </span>
          )}
          <span className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
            {t('overview.chart.weeklyTotalSub')}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={20}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={({ x, y, payload }) => {
                const isToday = chartData.find(d => d.label === payload.value)?.isToday;
                const translatedLabel = getDayLabel(payload.value, lang);
                return (
                  <text
                    x={x} y={y} dy={16}
                    textAnchor="middle"
                    fill={isToday ? 'var(--color-primary)' : 'var(--color-muted-foreground)'}
                    fontSize={11}
                    fontWeight={isToday ? 'bold' : 'normal'}
                  >
                    {translatedLabel}
                  </text>
                );
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-muted)', opacity: 0.08 }}
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                borderColor: 'var(--color-border)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                padding: '8px 14px',
              }}
              itemStyle={{ color: 'var(--color-foreground)', fontSize: '12px' }}
              labelStyle={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{value}</span>
              )}
            />
            <Bar dataKey="on_time" name={t('attendance.ontime')} stackId="a" fill="var(--color-success)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="late" name={t('attendance.late')} stackId="a" fill="var(--color-warning)" />
            <Bar dataKey="absent" name={t('attendance.absent')} stackId="a" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
