import { useSheetsData } from '../../hooks/useSheetsData';

interface Employee {
  UID: string;
  Name: string;
  Phone: string;
  Email: string;
  Gender: string;
}

const HIDDEN = ['Password', 'password', 'Mật khẩu'];

export function EmployeeList() {
  const { data, loading, error } = useSheetsData<Employee>('Employee');

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
        {error}
      </div>
    );
  }

  // Determine visible columns: use first row's keys, exclude hidden
  const columns = data.length > 0
    ? Object.keys(data[0]).filter((k) => !HIDDEN.includes(k))
    : ['UID', 'Họ tên', 'Email', 'SĐT', 'Giới tính'];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">Danh sách nhân viên</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{data.length} nhân viên</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  Chưa có nhân viên nào
                </td>
              </tr>
            ) : (
              data.map((emp, i) => (
                <tr key={emp.UID ?? i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 font-mono text-xs">
                      {String((emp as any)[col] ?? '')}
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
