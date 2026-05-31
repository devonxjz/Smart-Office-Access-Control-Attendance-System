import { Users, ClipboardCheck, Clock, ShieldCheck, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useAppData } from '../contexts/app-data-context';
import { useChartData } from '../hooks/useChartData';
import { HourlyAreaChart } from '../features/dashboard/HourlyAreaChart';
import { PunctualityDonutChart } from '../features/dashboard/PunctualityDonutChart';
import { WeeklyBarChart } from '../features/dashboard/WeeklyBarChart';
import { DoorStatusGrid } from '../features/dashboard/DoorStatusGrid';
import { useApp } from '../contexts/app-context';

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

function getGreeting(lang: string) {
  const h = parseInt(
    new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hour12: false })
  );
  if (h < 12) return lang === 'vi' ? 'Chào buổi sáng' : 'Good morning';
  if (h < 18) return lang === 'vi' ? 'Chào buổi chiều' : 'Good afternoon';
  return lang === 'vi' ? 'Chào buổi tối' : 'Good evening';
}

export function OverviewPage() {
  const { t, lang } = useApp();
  const employees = useAppData('employees');
  const attendance = useAppData('attendance');
  const chartData = useChartData();

  const todayLabel = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const DEMO_CHECKINS = [
    { name: 'Nguyễn Văn An', dept: 'Kỹ thuật', time: '07:58', status: t('attendance.ontime'), late: false },
    { name: 'Trần Thị Bình', dept: 'Kinh doanh', time: '08:03', status: t('attendance.ontime'), late: false },
    { name: 'Lê Minh Cường', dept: 'Kế toán', time: '08:27', status: lang === 'vi' ? 'Trễ 27 phút' : 'Late 27m', late: true },
    { name: 'Phạm Thị Dung', dept: 'Nhân sự', time: '07:55', status: t('attendance.ontime'), late: false },
    { name: 'Hoàng Quốc Huy', dept: 'Kỹ thuật', time: '09:02', status: lang === 'vi' ? 'Trễ 62 phút' : 'Late 62m', late: true },
    { name: 'Vũ Thị Mai', dept: 'Marketing', time: '08:00', status: t('attendance.ontime'), late: false },
  ];

  // We determine if we are in demo mode based on whether the sheet has zero registered employees
  const isDemo = !employees.loading && employees.data.length === 0;

  const todayCheckins = attendance.data.filter((r) => String(r.date ?? r.Date ?? '') === today);
  const checkinCount = todayCheckins.length;
  const lateCount = todayCheckins.filter((r) => {
    const s = String(r.status ?? r.Status ?? '').toUpperCase();
    return s === 'LATE' || s.startsWith('TRỄ');
  }).length;
  const onTimeCount = checkinCount - lateCount;
  const onTimeRate = checkinCount > 0 ? Math.round((onTimeCount / checkinCount) * 100) : 0;

  // Recent 6 check-ins (newest first) — Sheet field: "TimeIn"
  const recentCheckins = [...todayCheckins]
    .sort((a, b) => String(b.timeIn ?? b.TimeIn ?? '').localeCompare(String(a.timeIn ?? a.TimeIn ?? '')))
    .slice(0, 6);

  const hasError = employees.error || attendance.error || chartData.error;

  const stats = [
    {
      id: 'stat-employees',
      label: t('employees.total'),
      value: employees.loading ? '—' : isDemo ? '24' : String(employees.data.length),
      sub: isDemo ? 'demo' : t('overview.stats.registered'),
      icon: Users,
      trend: null as 'up' | 'down' | null,
      accent: 'primary',
    },
    {
      id: 'stat-checkins',
      label: t('overview.stats.todayCheckins'),
      value: attendance.loading ? '—' : isDemo ? '22' : String(checkinCount),
      sub: isDemo 
        ? (lang === 'vi' ? 'demo · 20 đúng giờ' : 'demo · 20 on time')
        : checkinCount === 0 
          ? t('overview.stats.noCheckins') 
          : t('overview.stats.ontimeCount').replace('{count}', String(onTimeCount)),
      icon: ClipboardCheck,
      trend: 'up' as const,
      accent: 'success',
    },
    {
      id: 'stat-late',
      label: t('overview.stats.todayLate'),
      value: attendance.loading ? '—' : isDemo ? '2' : String(lateCount),
      sub: isDemo
        ? 'demo'
        : lateCount === 0 ? t('overview.stats.goodJob') : t('overview.stats.needsAttention'),
      icon: Clock,
      trend: (isDemo ? 2 : lateCount) > 0 ? 'down' as const : null,
      accent: (isDemo ? 2 : lateCount) > 0 ? 'warning' : 'success',
    },
    {
      id: 'stat-ontime-rate',
      label: t('overview.stats.ontimeRate'),
      value: attendance.loading ? '—' : isDemo ? '91%' : checkinCount === 0 ? '—' : `${onTimeRate}%`,
      sub: isDemo 
        ? 'demo' 
        : checkinCount === 0 
          ? t('overview.stats.noData') 
          : t('overview.stats.outOf').replace('{count}', String(checkinCount)),
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
            {getGreeting(lang)}, Admin! 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground capitalize">{todayLabel}</p>
        </div>
        <button
          onClick={() => { employees.refetch(); attendance.refetch(); }}
          className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur transition-all duration-200 hover:border-primary/40 hover:text-primary hover:shadow-glow"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('overview.refresh')}
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
            <h3 className="font-semibold text-foreground">{t('overview.recentCheckins')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {!isDemo 
                ? t('overview.recent.subReal').replace('{count}', String(checkinCount)) 
                : t('overview.recent.subDemo')}
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
                  {[t('overview.table.employee'), t('overview.table.shift'), t('overview.table.checkinTime'), t('overview.table.status')].map(h => (
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
                      {t('overview.table.noCheckinsToday')}
                    </td>
                  </tr>
                ) : (
                  recentCheckins.map((r, idx) => {
                    const rawStatus = String(r.status ?? r.Status ?? '').toUpperCase();
                    const isLate = rawStatus === 'LATE' || rawStatus.startsWith('TRỄ');
                    const name = String(r.name ?? r.Name ?? `ID: ${r.uid ?? r.UID ?? '—'}`);
                    
                    let statusLabel: string;
                    if (rawStatus === 'ON_TIME' || rawStatus === 'ON TIME') {
                      statusLabel = t('attendance.ontime');
                    } else if (rawStatus === 'LATE' || rawStatus.startsWith('TRỄ') || rawStatus.startsWith('LATE')) {
                      statusLabel = lang === 'vi' ? 'Trễ' : 'Late';
                    } else {
                      statusLabel = t('attendance.ontime');
                    }

                    // Hiển thị ShiftStart thay Department (sheet không có cột Department)
                    const shift = String(r.shiftStart ?? r.ShiftStart ?? '—');

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
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{shift}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{String(r.timeIn ?? r.TimeIn ?? '—')}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${isLate ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isLate ? 'bg-warning' : 'bg-success'}`} />
                            {statusLabel}
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
