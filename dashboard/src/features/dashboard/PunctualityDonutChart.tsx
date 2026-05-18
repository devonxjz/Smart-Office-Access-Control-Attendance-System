import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PunctualitySummary } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';

interface PunctualityDonutChartProps {
  summary: PunctualitySummary;
  isLoading?: boolean;
  className?: string;
}

const COLORS = {
  on_time: 'var(--color-success)',
  late: 'var(--color-warning)',
  absent: 'var(--color-destructive)',
  empty: 'var(--color-muted)'
};

export function PunctualityDonutChart({ summary, isLoading, className = '' }: PunctualityDonutChartProps) {
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[250px] ${className}`} />;

  const hasData = summary.total > 0;

  const data = hasData ? [
    { name: 'Đúng giờ', value: summary.on_time, color: COLORS.on_time },
    { name: 'Trễ', value: summary.late, color: COLORS.late },
    { name: 'Vắng', value: summary.absent, color: COLORS.absent },
  ].filter(d => d.value > 0) : [{ name: 'Chưa có data', value: 1, color: COLORS.empty }];

  return (
    <div className={`rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 flex flex-col shadow-card transition-all duration-300 hover:shadow-glow ${className}`}>
      <div>
        <h3 className="font-semibold text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">Tỷ lệ hôm nay</h3>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              isAnimationActive={hasData}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {hasData && (
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--color-foreground)' }}
                formatter={(value) => [`${value} lượt`, '']}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold">{hasData ? `${summary.on_time_rate}%` : '--'}</span>
          <span className="text-[10px] uppercase text-muted-foreground">Đúng giờ</span>
        </div>
      </div>

      {hasData && (
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.on_time }} />
            <span className="text-muted-foreground">Đúng giờ ({summary.on_time})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.late }} />
            <span className="text-muted-foreground">Trễ ({summary.late})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.absent }} />
            <span className="text-muted-foreground">Vắng ({summary.absent})</span>
          </div>
        </div>
      )}
    </div>
  );
}
