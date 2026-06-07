import { DoorOpen, DoorClosed, AlertTriangle } from 'lucide-react';
import type { DoorStatus } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';
import { useApp } from '../../contexts/app-context';

interface DoorStatusGridProps {
  doors: DoorStatus[];
  isLoading?: boolean;
  className?: string;
}

export function DoorStatusGrid({ doors, isLoading, className = '' }: DoorStatusGridProps) {
  const { t } = useApp();
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[260px] ${className}`} />;

  const onlineCount = doors.filter(d => d.status === 'online').length;
  const offlineCount = doors.filter(d => d.status === 'offline').length;
  const errorCount = doors.filter(d => d.status === 'error').length;

  return (
    <div className={`rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 flex flex-col shadow-card transition-all duration-300 hover:shadow-glow ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{t('overview.chart.doorStatus')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('overview.chart.doorStatusSub')}</p>
        </div>
        {/* Summary chips */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-mono text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {onlineCount}
          </span>
          {offlineCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              {offlineCount}
            </span>
          )}
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-mono text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {errorCount}
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2.5 flex-1">
        {doors.map((door) => {
          const isOnline = door.status === 'online';
          const isError = door.status === 'error';

          const Icon = isError ? AlertTriangle : isOnline ? DoorOpen : DoorClosed;

          const bgClass = isOnline
            ? 'bg-success/8 border-success/20 hover:border-success/40'
            : isError
            ? 'bg-destructive/8 border-destructive/20 hover:border-destructive/40'
            : 'bg-muted/20 border-border/40 hover:border-border';

          const iconColor = isOnline
            ? 'var(--color-success)'
            : isError
            ? 'var(--color-destructive)'
            : 'var(--color-muted-foreground)';

          const dotColor = isOnline ? 'bg-success' : isError ? 'bg-destructive' : 'bg-muted-foreground';
          const statusLabel = isOnline 
            ? t('overview.chart.doorActive') 
            : isError 
            ? t('overview.chart.doorError') 
            : t('overview.chart.doorClosed');
          const statusTextColor = isOnline
            ? 'text-success'
            : isError
            ? 'text-destructive'
            : 'text-muted-foreground';

          return (
            <div
              key={door.id}
              className={`relative rounded-xl border flex flex-col items-center justify-center p-3 gap-1.5 transition-all duration-300 cursor-pointer hover:scale-[1.04] hover:shadow-card ${bgClass}`}
            >
              {/* Ping dot */}
              {(isOnline || isError) && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColor}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
                </span>
              )}

              <Icon size={20} style={{ color: iconColor }} />

              <div className="text-center leading-tight">
                <p className="text-[11px] font-semibold text-foreground">{door.label}</p>
                <p className={`text-[10px] font-mono font-bold ${statusTextColor}`}>{statusLabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 border-t border-border/40 pt-3">
        {[
          { color: 'bg-success', label: t('overview.chart.doorActive') },
          { color: 'bg-muted-foreground', label: t('overview.chart.doorClosed') },
          { color: 'bg-destructive', label: t('overview.chart.doorError') },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${l.color}`} />
            <span className="text-[11px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
