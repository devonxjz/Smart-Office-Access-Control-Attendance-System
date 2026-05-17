import { Users, ClipboardCheck, Clock, Wifi } from 'lucide-react';
import { useAppData } from '../contexts/app-data-context';
import { useChartData } from '../hooks/useChartData';
import { HourlyAreaChart } from '../features/dashboard/HourlyAreaChart';
import { PunctualityDonutChart } from '../features/dashboard/PunctualityDonutChart';
import { WeeklyBarChart } from '../features/dashboard/WeeklyBarChart';
import { DoorStatusGrid } from '../features/dashboard/DoorStatusGrid';

// ISO date in VN timezone — must match GAS backend format
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

export function OverviewPage() {
  const employees = useAppData('employees');
  const attendance = useAppData('attendance');
  const chartData = useChartData();

  const todayCheckins = attendance.data.filter((r) => r.Date === today);
  const checkinCount = todayCheckins.length;
  const lateCount = todayCheckins.filter((r) => String(r.Status ?? '').startsWith('Trễ')).length;

  const stats = [
    {
      id: 'stat-employees',
      label: 'Tổng nhân viên',
      value: employees.loading ? '—' : String(employees.data.length),
      sub: employees.data.length === 0 ? 'Chưa có nhân viên nào' : 'đã đăng ký',
      icon: Users,
    },
    {
      id: 'stat-checkins',
      label: 'Check-in hôm nay',
      value: attendance.loading ? '—' : String(checkinCount),
      sub: checkinCount === 0 ? 'Chưa có ai check-in hôm nay' : `${lateCount} đi trễ`,
      icon: ClipboardCheck,
    },
    {
      id: 'stat-late',
      label: 'Đi trễ hôm nay',
      value: attendance.loading ? '—' : String(lateCount),
      sub: lateCount === 0 ? 'Tốt lắm!' : 'cần chú ý',
      icon: Clock,
    },
    {
      id: 'stat-date',
      label: 'Ngày hôm nay',
      value: today,
      sub: 'Asia/Ho_Chi_Minh',
      icon: Wifi,
    },
  ];

  const hasError = employees.error || attendance.error || chartData.error;

  return (
    <div className="space-y-6 pb-10">
      {hasError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {employees.error || attendance.error || chartData.error}
        </div>
      )}

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ id, label, value, sub, icon: Icon }) => (
          <div key={id} className="group rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 space-y-3 shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-glow hover:border-primary/30">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100" />
            </div>
            <p data-testid={id} className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Chart Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <HourlyAreaChart 
          data={chartData.hourlyData} 
          isLoading={chartData.loading} 
          className="lg:col-span-8" 
        />
        <PunctualityDonutChart 
          summary={chartData.punctualityData} 
          isLoading={chartData.loading} 
          className="lg:col-span-4" 
        />
        <WeeklyBarChart 
          data={chartData.weeklyData} 
          isLoading={chartData.loading} 
          className="lg:col-span-6" 
        />
        <DoorStatusGrid 
          doors={chartData.doorData} 
          isLoading={chartData.loading} 
          className="lg:col-span-6" 
        />
      </div>
    </div>
  );
}
