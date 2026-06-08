import { useEffect, type ReactNode } from "react";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import { startDemoStream } from "@/lib/notifications-store";

interface Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AppShell({ children, title, subtitle, actions }: Props) {
  useEffect(() => {
    startDemoStream();
  }, []);
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex h-screen min-h-0 flex-col bg-transparent">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger />
            <div className="flex flex-1 items-baseline gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {subtitle}
                </span>
              )}
            </div>
            {actions}
            <NotificationsBell />
          </header>
          <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
