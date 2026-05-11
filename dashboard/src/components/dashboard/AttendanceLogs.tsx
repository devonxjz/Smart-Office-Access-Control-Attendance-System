import { useAttendance } from '../../hooks/useAttendance';

const COLUMNS: { key: string; label: string }[] = [
  { key: 'uid',        label: 'UID' },
  { key: 'name',       label: 'Nhân viên' },
  { key: 'shiftStart', label: 'Ca vào' },
  { key: 'timeIn',     label: 'Giờ vào' },
  { key: 'status',     label: 'Trạng thái' },
  { key: 'timeOut',    label: 'Giờ ra' },
];

/**
 * Maps both Vietnamese (from real sheet) and English (from future PRD schema)
 * status values to Tailwind color classes.
 */
const STATUS_COLOR: Record<string, string> = {
  // Vietnamese (current sheet)
  'Đúng giờ':       'text-success',
  'Trễ nhẹ (<15p)': 'text-warning',
  'Trễ':            'text-warning',
  'Trễ giờ':        'text-destructive',
  // English (PRD target)
  'ON_TIME': 'text-success',
  'LATE':    'text-warning',
  'ABSENT':  'text-destructive',
};

export function AttendanceLogs() {
  const { records, loading, error } = useAttendance();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <span className="animate-pulse">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Đang mất kết nối...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">Nhật ký chấm công</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{records.length} bản ghi</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-10 text-center text-muted-foreground text-xs"
                >
                  Chưa có dữ liệu chấm công
                </td>
              </tr>
            ) : (
              records.map((rec, i) => (
                <tr
                  key={`${rec.uid}-${i}`}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  {COLUMNS.map((col) => {
                    const value = (rec as Record<string, string>)[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 font-mono text-xs ${col.key === 'status' ? (STATUS_COLOR[value] ?? '') : ''}`}
                      >
                        {value || '–'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
