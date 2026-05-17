import type { DoorStatus } from '../../lib/chart-transforms';
import { ChartSkeleton } from './ChartSkeleton';

interface DoorStatusGridProps {
  doors: DoorStatus[];
  isLoading?: boolean;
  className?: string;
}

export function DoorStatusGrid({ doors, isLoading, className = '' }: DoorStatusGridProps) {
  if (isLoading) return <ChartSkeleton className={`h-full min-h-[250px] ${className}`} />;

  return (
    <div className={`rounded-xl border border-border bg-card/60 backdrop-blur-lg p-5 flex flex-col shadow-card transition-all duration-300 hover:shadow-glow ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">Trạng thái cửa</h3>
        <p className="text-xs text-muted-foreground">Realtime · cập nhật mỗi 2s</p>
      </div>
      
      <div className="grid grid-cols-4 grid-rows-2 gap-3 flex-1">
        {doors.map((door) => {
          let dotColor = 'bg-muted-foreground';
          let textColor = 'text-muted-foreground';
          let label = 'Đóng';
          let pulse = false;
          let bgTint = 'bg-background/40';

          if (door.status === 'online') {
            dotColor = 'bg-success';
            textColor = 'text-success drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]';
            label = 'Hoạt động';
            pulse = true;
            bgTint = 'bg-success/10';
          } else if (door.status === 'error') {
            dotColor = 'bg-destructive';
            textColor = 'text-destructive drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]';
            label = 'Lỗi';
            pulse = true;
            bgTint = 'bg-destructive/10';
          }

          return (
            <div 
              key={door.id} 
              className={`rounded-lg border border-border/50 flex flex-col items-center justify-center p-2 gap-2 ${bgTint} backdrop-blur-md transition-all duration-300 hover:scale-[1.05] hover:shadow-card cursor-pointer`}
            >
              <div className="relative flex h-3 w-3">
                {pulse && (
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColor}`} />
                )}
                <span className={`relative inline-flex h-3 w-3 rounded-full ${dotColor}`} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">{door.label}</p>
                <p className={`text-[10px] font-mono ${textColor}`}>{label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
