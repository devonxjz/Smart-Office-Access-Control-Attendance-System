import { useSheetsData } from '../../hooks/useSheetsData';

interface AttendanceRecord {
  Date: string;
  UID: string;
  Name: string;
  ShiftStart: string;
  TimeIn: string;
  Status: string;
  TimeOut: string;
  Note: string;
}

const COLUMNS: (keyof AttendanceRecord)[] = ['Date', 'UID', 'Name', 'ShiftStart', 'TimeIn', 'Status', 'TimeOut'];

const STATUS_COLOR: Record<string, string> = {
  'Đúng giờ':       'text-success',
  'Trễ nhẹ (<15p)': 'text-warning',
  'Trễ giờ':        'text-destructive',
};

export function AttendanceLogs() {
  const { data, loading, error } = useSheetsData<AttendanceRecord>('Attendance sheet');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <span className="animate-pulse">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">Nhật ký chấm công</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{data.length} bản ghi</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {COLUMNS.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  Chưa có dữ liệu chấm công
                </td>
              </tr>
            ) : (
              data.map((rec, i) => (
                <tr key={`${rec.UID}-${rec.Date}-${i}`} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  {COLUMNS.map((col) => (
                    <td
                      key={col}
                      className={`px-4 py-3 font-mono text-xs ${col === 'Status' ? STATUS_COLOR[rec[col]] ?? '' : ''}`}
                    >
                      {String(rec[col] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
