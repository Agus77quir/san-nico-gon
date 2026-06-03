import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  markAllRead,
  useNotifications,
  type NotificationKind,
} from "@/lib/notifications-store";

const ICONS: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  alert: AlertOctagon,
};

const TONE: Record<NotificationKind, string> = {
  info: "text-primary",
  success: "text-[var(--color-success)]",
  warning: "text-[var(--color-warning)]",
  alert: "text-destructive",
};

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function NotificationsBell() {
  const items = useNotifications();
  const unread = items.filter((i) => !i.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="glass-strong w-[340px] border-border p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notificaciones</div>
            <div className="text-[11px] text-muted-foreground">
              {unread === 0 ? "Todo al día" : `${unread} sin leer`}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            <CheckCheck className="mr-1 h-3 w-3" /> Marcar leído
          </Button>
        </div>
        <ScrollArea className="h-[360px]">
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const Icon = ICONS[n.kind];
              return (
                <li
                  key={n.id}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/30"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE[n.kind]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium text-foreground">
                        {n.title}
                      </div>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {n.description && (
                      <div className="text-xs text-muted-foreground">
                        {n.description}
                      </div>
                    )}
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
