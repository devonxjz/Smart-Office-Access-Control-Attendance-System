import { DoorOpen, DoorClosed, AlertTriangle, Lightbulb, Plug } from 'lucide-react';
import type { DoorStatus } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';
import { useApp } from '../../contexts/app-context';

interface DoorStatusGridProps {
  doors: DoorStatus[];
  isLoading?: boolean;
  manualLightState?: 'ON' | 'OFF' | 'AUTO';
  onToggleLight?: () => void;
  className?: string;
}

export function DoorStatusGrid({ 
  doors, 
  isLoading, 
  manualLightState = 'AUTO',
  onToggleLight,
  className = '' 
}: DoorStatusGridProps) {
  const { t, lang } = useApp();
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[260px] ${className}`} />;

  const onlineCount = doors.filter(d => d.status === 'online').length;
  const offlineCount = doors.filter(d => d.status === 'offline').length;
  const errorCount = doors.filter(d => d.status === 'error').length;

  return (
    <div className={`rounded-lg border border-border bg-card p-5 flex flex-col shadow-card ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">{t('overview.chart.doorStatus')}</h3>
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

          let Icon = DoorClosed;
          let bgClass = 'bg-muted/20 border-border/40 hover:border-border';
          let iconColor = 'var(--muted-foreground)';
          let dotColor = 'bg-muted-foreground';
          let statusLabel = '';
          let statusTextColor = 'text-muted-foreground';

          if (door.type === 'light') {
            Icon = Lightbulb;
            if (isOnline) {
              bgClass = 'bg-warning/10 border-warning/30 hover:border-warning/50';
              iconColor = 'var(--warning)';
              dotColor = 'bg-warning';
              statusLabel = t('overview.chart.lightActive');
              statusTextColor = 'text-warning';
            } else if (isError) {
              bgClass = 'bg-destructive/8 border-destructive/20 hover:border-destructive/40';
              iconColor = 'var(--destructive)';
              dotColor = 'bg-destructive';
              statusLabel = t('overview.chart.doorError');
              statusTextColor = 'text-destructive';
            } else {
              statusLabel = t('overview.chart.lightInactive');
            }
          } else if (door.type === 'socket') {
            Icon = Plug;
            if (isOnline) {
              bgClass = 'bg-primary/10 border-primary/30 hover:border-primary/50';
              iconColor = 'var(--primary)';
              dotColor = 'bg-primary';
              statusLabel = t('overview.chart.lightActive');
              statusTextColor = 'text-primary';
            } else if (isError) {
              bgClass = 'bg-destructive/8 border-destructive/20 hover:border-destructive/40';
              iconColor = 'var(--destructive)';
              dotColor = 'bg-destructive';
              statusLabel = t('overview.chart.doorError');
              statusTextColor = 'text-destructive';
            } else {
              statusLabel = t('overview.chart.lightInactive');
            }
          } else {
            // door
            Icon = isError ? AlertTriangle : isOnline ? DoorOpen : DoorClosed;
            if (isOnline) {
              bgClass = 'bg-success/10 border-success/30 hover:border-success/50';
              iconColor = 'var(--success)';
              dotColor = 'bg-success';
              statusLabel = t('overview.chart.doorActive');
              statusTextColor = 'text-success';
            } else if (isError) {
              bgClass = 'bg-destructive/8 border-destructive/20 hover:border-destructive/40';
              iconColor = 'var(--destructive)';
              dotColor = 'bg-destructive';
              statusLabel = t('overview.chart.doorError');
              statusTextColor = 'text-destructive';
            } else {
              statusLabel = t('overview.chart.doorClosed');
            }
          }

          return (
            <div
              key={door.id}
              onClick={() => {
                if (door.type === 'light' && onToggleLight) {
                  onToggleLight();
                }
              }}
              className={`relative rounded-lg border flex flex-col items-center justify-center p-3 gap-1.5 transition-colors duration-200 cursor-pointer hover:shadow-card ${bgClass}`}
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
                <p className={`text-[10px] font-mono font-bold ${statusTextColor}`}>
                  {statusLabel}
                  {door.type === 'light' && (
                    <span className="text-[9px] font-normal opacity-85 block mt-0.5">
                      {manualLightState === 'AUTO' 
                        ? (lang === 'vi' ? ' (Tự động)' : ' (Auto)') 
                        : (lang === 'vi' ? ' (Thủ công)' : ' (Manual)')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 border-t border-border/40 pt-3 flex-wrap">
        {[
          { color: 'bg-success', label: `${t('overview.chart.doorActive')} (${lang === 'vi' ? 'Cửa' : 'Door'})` },
          { color: 'bg-warning', label: `${t('overview.chart.lightActive')} (${lang === 'vi' ? 'Đèn' : 'Light'})` },
          { color: 'bg-primary', label: `${t('overview.chart.lightActive')} (${lang === 'vi' ? 'Ổ cắm' : 'Socket'})` },
          { color: 'bg-muted-foreground', label: `${t('overview.chart.doorClosed')} / ${t('overview.chart.lightInactive')}` },
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
