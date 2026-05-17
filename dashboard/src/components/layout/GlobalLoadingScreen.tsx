import { useContext } from 'react';
import { AppDataContext } from '../../contexts/app-data-context';

export function GlobalLoadingScreen() {
  const context = useContext(AppDataContext);
  
  if (!context) return null;
  if (context.state.initialLoadComplete) return null;

  const { employees, attendance, settings } = context.state;
  const total = 3;
  let loaded = 0;
  if (!employees.loading) loaded++;
  if (!attendance.loading) loaded++;
  if (!settings.loading) loaded++;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card/60 backdrop-blur-xl p-8 shadow-card border border-border">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Đang tải hệ thống...</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {loaded}/{total} nguồn dữ liệu
          </p>
        </div>
      </div>
    </div>
  );
}
