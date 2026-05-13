import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyBreakdown } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';

interface WeeklyBarChartProps {
  data: DailyBreakdown[];
  isLoading?: boolean;
  className?: string;
}

export function WeeklyBarChart({ data, isLoading, className = '' }: WeeklyBarChartProps) {
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[250px] ${className}`} />;

  return (
    <div className={`rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 flex flex-col shadow-card transition-all duration-300 hover:shadow-glow ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">Xu hướng 7 ngày</h3>
      </div>
      
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={({ x, y, payload }) => {
                const isToday = data.find(d => d.label === payload.value)?.isToday;
                return (
                  <text 
                    x={x} y={y} dy={16} 
                    textAnchor="middle" 
                    fill={isToday ? 'var(--color-primary)' : 'var(--color-muted-foreground)'}
                    fontSize={10}
                    fontWeight={isToday ? 'bold' : 'normal'}
                  >
                    {payload.value}
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
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <Tooltip 
              cursor={{ fill: 'var(--color-muted)', opacity: 0.1 }}
              contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--color-foreground)', fontSize: '12px' }}
              labelStyle={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="on_time" name="Đúng giờ" stackId="a" fill="var(--color-success)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="late" name="Trễ" stackId="a" fill="var(--color-warning)" />
            <Bar dataKey="absent" name="Vắng" stackId="a" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
