import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { HourlyBucket } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';

interface HourlyAreaChartProps {
  data: HourlyBucket[];
  isLoading?: boolean;
  className?: string;
}

export function HourlyAreaChart({ data, isLoading, className = '' }: HourlyAreaChartProps) {
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[250px] ${className}`} />;

  const todayStr = new Date().toLocaleDateString('vi-VN');
  const hasData = data.some(d => d.count > 0);

  return (
    <div className={`rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 flex flex-col shadow-card transition-all duration-300 hover:shadow-glow ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">Lưu lượng check-in hôm nay</h3>
        <p className="text-xs text-muted-foreground">{todayStr}</p>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-muted-foreground">Chưa có check-in hôm nay</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                allowDecimals={false}
              />
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--color-foreground)' }}
                labelStyle={{ color: 'var(--color-muted-foreground)', marginBottom: '4px' }}
                formatter={(value) => [`${value} lượt`, 'Số lượng']}   // ← ĐÃ SỬA
                labelFormatter={(label) => `${label} - ${String(Number(label.split(':')[0]) + 1).padStart(2, '0')}:00`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}