import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, Grid3x3, Users, FileText, Settings, Shield, ClipboardList } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/brand-logo";

constmainItems = [
  { title: "Dash", url: "/", icon: LayoutDashboard },
  { title: "Plano interactivo", url: "/plano", icon: Map },
  { title: "Parcelas", url: "/parcelas", icon: Grid3x3 },
  { title: "Solicitudes", url: "/servicios", icon: ClipboardList },
  { title: "Fallecidos", url: "/fallecidos", icon: Users },
  { title: "Reportes", url: "/reportes", icon: FileText },
];

const adminItems = [
  { title: "Usuarios y roles", url: "/usuarios", icon: Shield },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });
  const isActive = (path: string) => (path === "/" ? currentPath === "/" : currentPath.startsWith(path));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <BrandLogo showText={!collapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Gestión
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-gradient-brand data-[active=true]:text-primary-foreground data-[active=true]:shadow-[var(--shadow-glow)]"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Administración
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-gradient-brand data-[active=true]:text-primary-foreground"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <div className="font-medium text-foreground">v1.0 · Demo</div>
          <div className="mt-1">Derechos San Nicolás P.A - 2026</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
