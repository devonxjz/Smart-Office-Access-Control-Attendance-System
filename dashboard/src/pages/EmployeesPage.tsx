import { useState, useMemo } from 'react';
import { useAppData } from '../contexts/app-data-context';
import { Search, Plus, Eye } from 'lucide-react';
import { AddEmployeeModal } from '../features/employees/AddEmployeeModal';
import { EmployeeDetailModal } from '../features/employees/EmployeeDetailModal';

interface Employee {
  'Mã NV'?: string;
  'Họ tên'?: string;
  'RFID UID'?: string;
  'Phòng ban'?: string;
  'Trạng thái'?: string;
  [key: string]: string | undefined;
}

const HIDDEN = ['Password', 'password', 'Mật khẩu', 'hash'];

export function EmployeesPage() {
  const { data: rawData, loading, error, refetch } = useAppData('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Normalize employee records from Google Sheets (which might have English/mixed headers)
  // to the consistent Vietnamese keys expected by the frontend.
  const data = useMemo<Employee[]>(() => {
    if (!rawData) return [];
    return rawData.map((emp) => ({
      'Mã NV': String(emp['Mã NV'] ?? emp['UID'] ?? emp['uid'] ?? ''),
      'Họ tên': String(emp['Họ tên'] ?? emp['Name'] ?? emp['name'] ?? ''),
      'RFID UID': String(emp['RFID UID'] ?? emp['Phone'] ?? emp['phone'] ?? ''),
      'Phòng ban': String(emp['Phòng ban'] ?? emp['Email'] ?? emp['email'] ?? ''),
      'Trạng thái': String(emp['Trạng thái'] ?? emp['Gender'] ?? emp['gender'] ?? 'Active'),
    }));
  }, [rawData]);

  const filteredData = useMemo(() => {
    return data.filter((emp) => {
      const name = String(emp['Họ tên'] || '').toLowerCase();
      const id = String(emp['Mã NV'] || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = name.includes(term) || id.includes(term);
      
      const matchesDept = department === 'All' || emp['Phòng ban'] === department;
      
      return matchesSearch && matchesDept;
    });
  }, [data, searchTerm, department]);

  const departments = useMemo(() => {
    const depts = new Set(data.map((emp) => emp['Phòng ban']).filter(Boolean));
    return ['All', ...Array.from(depts)] as string[];
  }, [data]);

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
    : ['Mã NV', 'Họ tên', 'RFID UID', 'Phòng ban', 'Trạng thái'];

  return (
    <>
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg overflow-hidden shadow-card transition-all duration-300">
        <div className="px-6 py-4 border-b border-border flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-background/30 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground drop-shadow-md">Danh sách nhân viên</h2>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{filteredData.length} nhân viên</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã NV"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-9 w-full sm:w-[140px] rounded-md border border-border bg-input px-3 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              aria-label="Department Filter"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept === 'All' ? 'Tất cả phòng ban' : dept}</option>
              ))}
            </select>
            
            <button 
              onClick={() => setIsAddOpen(true)}
              className="h-9 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              + Thêm nhân viên
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/20">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-6 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {col}
                  </th>
                ))}
                <th className="px-6 py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Không tìm thấy nhân viên phù hợp
                  </td>
                </tr>
              ) : (
                filteredData.map((emp, i) => (
                  <tr key={emp['Mã NV'] ?? i} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-6 py-3">
                        {col === 'Trạng thái' ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            String(emp[col]).toLowerCase() === 'active' 
                              ? 'bg-success/10 text-success border border-success/20' 
                              : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${String(emp[col]).toLowerCase() === 'active' ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                            {String(emp[col] ?? '')}
                          </span>
                        ) : col === 'Mã NV' || col === 'RFID UID' ? (
                          <span className="font-mono text-xs text-muted-foreground">{String(emp[col] ?? '')}</span>
                        ) : (
                          <span className="font-medium text-foreground">{String(emp[col] ?? '')}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => setSelectedEmployee(emp)}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20">
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEmployeeModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={() => { setIsAddOpen(false); refetch(); }} 
      />
      
      <EmployeeDetailModal 
        isOpen={!!selectedEmployee} 
        employee={selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        onSuccess={() => { setSelectedEmployee(null); refetch(); }} 
      />
    </>
  );
}
