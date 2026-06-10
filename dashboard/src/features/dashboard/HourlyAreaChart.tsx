import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { HourlyBucket } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';
import { useApp } from '../../contexts/app-context';

interface HourlyAreaChartProps {
  data: HourlyBucket[];
  isLoading?: boolean;
  className?: string;
}

/** Demo data rendered when no real check-ins exist yet */
const DEMO: HourlyBucket[] = [
  { hour: '07:00', count: 3 },
  { hour: '08:00', count: 14 },
  { hour: '09:00', count: 8 },
  { hour: '10:00', count: 2 },
  { hour: '11:00', count: 1 },
  { hour: '12:00', count: 0 },
  { hour: '13:00', count: 1 },
  { hour: '14:00', count: 0 },
  { hour: '15:00', count: 0 },
  { hour: '16:00', count: 0 },
  { hour: '17:00', count: 5 },
  { hour: '18:00', count: 1 },
  { hour: '19:00', count: 0 },
];

export function HourlyAreaChart({ data, isLoading, className = '' }: HourlyAreaChartProps) {
  const { t, lang } = useApp();
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[280px] ${className}`} />;

  const todayStr = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
  const hasRealData = data.some(d => d.count > 0);
  const chartData = hasRealData ? data : DEMO;
  const isDemo = !hasRealData;

  const peakHour = [...chartData].sort((a, b) => b.count - a.count)[0]?.hour ?? null;
  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <div className={`rounded-lg border border-border bg-card p-5 flex flex-col shadow-card ${className}`}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">{t('overview.chart.hourlyVolume')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              demo
            </span>
          )}
          <div className="text-right">
            <p className="text-xl font-bold text-foreground font-sans">{total} {t('overview.chart.hourlyVolumeUnit')}</p>
            {peakHour && (
              <p className="text-[10px] text-muted-foreground">{t('overview.chart.hourlyPeakPrefix')}: {peakHour}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCheck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              dy={10}
              interval={1}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-card)',
                padding: '8px 14px',
              }}
              itemStyle={{ color: 'var(--foreground)', fontSize: '13px' }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px', fontSize: '11px' }}
              formatter={(value) => [`${value} ${t('overview.chart.hourlyVolumeUnit')}`, 'Check-in']}
              labelFormatter={(label) => `${label} – ${String(Number(label.split(':')[0]) + 1).padStart(2, '0')}:00`}
            />
            {peakHour && (
              <ReferenceLine
                x={peakHour}
                stroke="var(--primary)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradCheck)"
              dot={false}
              activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}