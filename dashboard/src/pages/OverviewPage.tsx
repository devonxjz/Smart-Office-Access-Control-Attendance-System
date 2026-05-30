import { Users, ClipboardCheck, Clock, ShieldCheck, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useAppData } from '../contexts/app-data-context';
import { useChartData } from '../hooks/useChartData';
import { HourlyAreaChart } from '../features/dashboard/HourlyAreaChart';
import { PunctualityDonutChart } from '../features/dashboard/PunctualityDonutChart';
import { WeeklyBarChart } from '../features/dashboard/WeeklyBarChart';
import { DoorStatusGrid } from '../features/dashboard/DoorStatusGrid';

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

function getGreeting() {
  const h = parseInt(
    new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hour12: false })
  );
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const todayLabel = new Date().toLocaleDateString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Demo recent check-ins shown when Google Sheets has no data yet */
const DEMO_CHECKINS = [
  { name: 'Nguyễn Văn An', dept: 'Kỹ thuật', time: '07:58', status: 'Đúng giờ', late: false },
  { name: 'Trần Thị Bình', dept: 'Kinh doanh', time: '08:03', status: 'Đúng giờ', late: false },
  { name: 'Lê Minh Cường', dept: 'Kế toán', time: '08:27', status: 'Trễ 27 phút', late: true },
  { name: 'Phạm Thị Dung', dept: 'Nhân sự', time: '07:55', status: 'Đúng giờ', late: false },
  { name: 'Hoàng Quốc Huy', dept: 'Kỹ thuật', time: '09:02', status: 'Trễ 62 phút', late: true },
  { name: 'Vũ Thị Mai', dept: 'Marketing', time: '08:00', status: 'Đúng giờ', late: false },
];

export function OverviewPage() {
  const employees = useAppData('employees');
  const attendance = useAppData('attendance');
  const chartData = useChartData();

  // We determine if we are in demo mode based on whether the sheet has zero registered employees
  const isDemo = !employees.loading && employees.data.length === 0;

  const todayCheckins = attendance.data.filter((r) => r.Date === today);
  const checkinCount = todayCheckins.length;
  const lateCount = todayCheckins.filter((r) => String(r.Status ?? '').startsWith('Trễ')).length;
  const onTimeCount = checkinCount - lateCount;
  const onTimeRate = checkinCount > 0 ? Math.round((onTimeCount / checkinCount) * 100) : 0;

  // Recent 6 check-ins (newest first)
  const recentCheckins = [...todayCheckins]
    .sort((a, b) => String(b.CheckInTime ?? '').localeCompare(String(a.CheckInTime ?? '')))
    .slice(0, 6);

  const hasError = employees.error || attendance.error || chartData.error;

  const stats = [
    {
      id: 'stat-employees',
      label: 'Tổng nhân viên',
      value: employees.loading ? '—' : isDemo ? '24' : String(employees.data.length),
      sub: isDemo ? 'demo' : 'Đã đăng ký',
      icon: Users,
      trend: null as 'up' | 'down' | null,
      accent: 'primary',
    },
    {
      id: 'stat-checkins',
      label: 'Check-in hôm nay',
      value: attendance.loading ? '—' : isDemo ? '22' : String(checkinCount),
      sub: isDemo 
        ? 'demo · 20 đúng giờ' 
        : checkinCount === 0 
          ? 'Chưa có ai check-in hôm nay' 
          : `${onTimeCount} đúng giờ`,
      icon: ClipboardCheck,
      trend: 'up' as const,
      accent: 'success',
    },
    {
      id: 'stat-late',
      label: 'Đi trễ hôm nay',
      value: attendance.loading ? '—' : isDemo ? '2' : String(lateCount),
      sub: isDemo
        ? 'demo'
        : lateCount === 0 ? '✓ Tốt lắm!' : 'Cần chú ý',
      icon: Clock,
      trend: (isDemo ? 2 : lateCount) > 0 ? 'down' as const : null,
      accent: (isDemo ? 2 : lateCount) > 0 ? 'warning' : 'success',
    },
    {
      id: 'stat-ontime-rate',
      label: 'Tỷ lệ đúng giờ',
      value: attendance.loading ? '—' : isDemo ? '91%' : checkinCount === 0 ? '—' : `${onTimeRate}%`,
      sub: isDemo 
        ? 'demo' 
        : checkinCount === 0 
          ? 'Chưa có dữ liệu' 
          : `Trên ${checkinCount} lượt`,
      icon: ShieldCheck,
      trend: (isDemo ? 91 : onTimeRate) >= 80 ? 'up' as const : 'down' as const,
      accent: (isDemo ? 91 : onTimeRate) >= 80 ? 'success' : 'warning',
    },
  ];

  const accentMap: Record<string, string> = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    destructive: 'var(--color-destructive)',
  };

  return (
    <div className="space-y-6 pb-10">
      {/* ── Error Banner ── */}
      {hasError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive">
          {employees.error || attendance.error || chartData.error}
        </div>
      )}

      {/* ── Greeting Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {getGreeting()}, Admin! 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground capitalize">{todayLabel}</p>
        </div>
        <button
          onClick={() => { employees.refetch(); attendance.refetch(); }}
          className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur transition-all duration-200 hover:border-primary/40 hover:text-primary hover:shadow-glow"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </div>

      {/* ── Row 1: KPI Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ id, label, value, sub, icon: Icon, trend, accent }) => {
          const accentColor = accentMap[accent] ?? accentMap.primary;
          return (
            <div
              key={id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 shadow-card transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-glow"
            >
              {/* Glow top-right */}
              <div
                className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
                style={{ backgroundColor: accentColor }}
              />
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `color-mix(in oklab, ${accentColor} 15%, transparent)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: accentColor }} />
                </div>
              </div>
              <p data-testid={id} className="text-3xl font-bold tracking-tight text-foreground">
                {value}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-success flex-shrink-0" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-warning flex-shrink-0" />}
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Main Area Chart + Donut ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HourlyAreaChart
          data={chartData.hourlyData}
          isLoading={chartData.loading}
          className="lg:col-span-8 min-h-[300px]"
        />
        <PunctualityDonutChart
          summary={chartData.punctualityData}
          isLoading={chartData.loading}
          className="lg:col-span-4 min-h-[300px]"
        />
      </div>

      {/* ── Row 3: Weekly Bar + Door Status ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <WeeklyBarChart
          data={chartData.weeklyData}
          isLoading={chartData.loading}
          className="lg:col-span-7 min-h-[280px]"
        />
        <DoorStatusGrid
          doors={chartData.doorData}
          isLoading={chartData.loading}
          className="lg:col-span-5 min-h-[280px]"
        />
      </div>

      {/* ── Row 4: Recent Check-ins ── */}
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 shadow-card transition-all duration-300 hover:shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Check-in gần đây</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {!isDemo ? `Hôm nay · ${checkinCount} lượt tổng` : 'demo · hiển thị khi có dữ liệu thực'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                demo
              </span>
            )}
            <span className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
              {today}
            </span>
          </div>
        </div>

        {attendance.loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {['Nhân viên', 'Phòng ban', 'Giờ check-in', 'Trạng thái'].map(h => (
                    <th key={h} className="pb-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isDemo ? (
                  DEMO_CHECKINS.map((r, idx) => (
                    <tr key={idx} className="group transition-colors duration-150 hover:bg-muted/20">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary flex-shrink-0">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">{r.dept}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{r.time}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${r.late ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${r.late ? 'bg-warning' : 'bg-success'}`} />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : recentCheckins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có check-in nào hôm nay
                    </td>
                  </tr>
                ) : (
                  recentCheckins.map((r, idx) => {
                    const isLate = String(r.Status ?? '').startsWith('Trễ');
                    const name = String(r.EmployeeName ?? r.Name ?? `ID: ${r.EmployeeID ?? '—'}`);
                    return (
                      <tr key={idx} className="group transition-colors duration-150 hover:bg-muted/20">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[140px]">{name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{String(r.Department ?? '—')}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{String(r.CheckInTime ?? '—')}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${isLate ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isLate ? 'bg-warning' : 'bg-success'}`} />
                            {String(r.Status ?? 'Đúng giờ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
