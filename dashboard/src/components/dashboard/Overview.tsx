import { Users, ClipboardCheck, Clock, Wifi } from 'lucide-react';
import { useSheetsData } from '../../hooks/useSheetsData';

interface Employee { UID: string }
interface AttendanceRecord { Date: string; UID: string; Status: string }

// ISO date in VN timezone — must match GAS backend format
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

export function Overview() {
  const employees = useSheetsData<Employee>('Employee');
  const attendance = useSheetsData<AttendanceRecord>('Attendance sheet');

  const todayCheckins = attendance.data.filter((r) => r.Date === today);
  const checkinCount = todayCheckins.length;
  const lateCount = todayCheckins.filter((r) => r.Status?.startsWith('Trễ')).length;

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

  const hasError = employees.error || attendance.error;

  return (
    <div className="space-y-6">
      {hasError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {employees.error || attendance.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ id, label, value, sub, icon: Icon }) => (
          <div key={id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p data-testid={id} className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
