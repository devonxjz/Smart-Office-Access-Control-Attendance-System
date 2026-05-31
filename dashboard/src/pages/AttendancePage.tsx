import { useState, useMemo } from 'react';
import { useAttendance } from '../hooks/useAttendance';
import { Search, Download, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useApp } from '../contexts/app-context';

export function AttendancePage() {
  const { t, lang } = useApp();
  const { records, loading, error } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const COLUMNS = useMemo(() => [
    { key: 'uid',         label: t('attendance.uid') },
    { key: 'name',        label: t('attendance.name') },
    { key: 'shiftStart',  label: t('attendance.table.shift') },
    { key: 'timeIn',      label: t('attendance.checkin') },
    { key: 'status',      label: t('attendance.status') },
    { key: 'timeOut',     label: t('attendance.checkout') },
    { key: 'workingTime', label: t('attendance.workingTime') },
  ], [t]);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch = rec.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rec.uid?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const recStatus = (rec.status || '').toUpperCase();
      let matchStatus = true;
      if (statusFilter === 'ON_TIME') matchStatus = recStatus.includes('ĐÚNG GIỜ') || recStatus === 'ON_TIME';
      if (statusFilter === 'LATE') matchStatus = recStatus.includes('TRỄ') || recStatus === 'LATE';
      if (statusFilter === 'ABSENT') matchStatus = recStatus.includes('VẮNG') || recStatus === 'ABSENT';

      return matchSearch && matchStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return records.reduce((acc: { onTime: number; late: number; absent: number }, rec) => {
      const s = (rec.status || '').toUpperCase();
      if (s.includes('ĐÚNG GIỜ') || s === 'ON_TIME') acc.onTime++;
      else if (s.includes('TRỄ') || s === 'LATE') acc.late++;
      else if (s.includes('VẮNG') || s === 'ABSENT') acc.absent++;
      return acc;
    }, { onTime: 0, late: 0, absent: 0 });
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <span className="animate-pulse">{t('system.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {t('system.error.connection')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('attendance.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-[250px] rounded-md border border-border bg-card pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="ALL">{t('attendance.filter.all')}</option>
            <option value="ON_TIME">{t('attendance.ontime')}</option>
            <option value="LATE">{t('attendance.late')}</option>
            <option value="ABSENT">{t('attendance.absent')}</option>
          </select>
          <input 
            type="date"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <button className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Download className="h-4 w-4" />
          {t('attendance.export')}
        </button>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>{t('overview.stats.ontimeCount').replace('{count}', String(stats.onTime))}</span>
        </div>
        <div className="flex items-center gap-1.5 text-warning">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('attendance.stats.lateCount').replace('{count}', String(stats.late))}</span>
        </div>
        <div className="flex items-center gap-1.5 text-destructive">
          <XCircle className="h-4 w-4" />
          <span>{t('attendance.stats.absentCount').replace('{count}', String(stats.absent))}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg overflow-hidden shadow-card transition-all duration-300">
        <div className="px-6 py-4 border-b border-border bg-background/30 backdrop-blur-md">
          <h2 className="text-sm font-semibold text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">{t('attendance.table.title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('attendance.table.records').replace('{count}', String(filteredRecords.length))}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border sticky top-0 z-10 bg-sidebar/95 backdrop-blur">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-6 py-10 text-center text-muted-foreground text-xs"
                  >
                    {t('attendance.table.noData')}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, i) => {
                  const isLate = (rec.status || '').toUpperCase().includes('TRỄ') || (rec.status || '').toUpperCase().includes('LATE');
                  const isAbsent = (rec.status || '').toUpperCase().includes('VẮNG') || (rec.status || '').toUpperCase().includes('ABSENT');
                  
                  let statusText = rec.status || 'Đúng giờ';
                  if (statusText === 'Đúng giờ' || statusText.toLowerCase() === 'on_time' || statusText.toLowerCase() === 'on time') {
                    statusText = t('attendance.ontime');
                  } else if (statusText.startsWith('Trễ')) {
                    const mins = statusText.replace(/\D/g, '');
                    statusText = lang === 'vi' ? `Trễ ${mins} phút` : `Late ${mins}m`;
                  } else if (statusText.toLowerCase().startsWith('late')) {
                    const mins = statusText.replace(/\D/g, '');
                    statusText = lang === 'vi' ? `Trễ ${mins} phút` : `Late ${mins}m`;
                  } else if (statusText === 'Vắng' || statusText.toLowerCase() === 'absent') {
                    statusText = t('attendance.absent');
                  }

                  return (
                    <tr
                      key={`${rec.uid}-${i}`}
                      className="border-b border-border/50 hover:bg-accent/40 transition-colors bg-card"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-primary cursor-pointer hover:underline">
                        {rec.uid || '–'}
                      </td>
                      <td className="px-6 py-3 text-xs font-medium text-foreground">
                        {rec.name || '–'}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {rec.shiftStart || '–'}
                      </td>
                      <td className={`px-6 py-3 font-mono text-xs ${isLate ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
                        {rec.timeIn || '–'}
                      </td>
                      <td className="px-6 py-3">
                        {isLate ? (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1.5 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            {statusText}
                          </Badge>
                        ) : isAbsent ? (
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent shadow-none hover:bg-destructive/20 gap-1.5 font-medium">
                            <XCircle className="h-3 w-3" />
                            {statusText}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1.5 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            {statusText}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {rec.timeOut || '–'}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-primary font-semibold">
                        {rec.workingTime && rec.workingTime !== '—' && rec.workingTime !== '0' && rec.workingTime !== '' ? (
                          /[a-zA-Z\u00C0-\u1EF9]/.test(rec.workingTime) ? rec.workingTime : `${rec.workingTime}h`
                        ) : '–'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
