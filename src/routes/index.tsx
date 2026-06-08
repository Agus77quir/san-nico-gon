import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Grid3x3,
  Users,
  Building2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Map,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PLOTS, STATS, SECTORS, statusColor } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · San Nicolás Renacimiento" },
      { name: "description", content: "Resumen ejecutivo del cementerio San Nicolás - Renacimiento." },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  chart,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  chart?: "area" | "bar";
}) {
  const color = accent ?? "var(--color-primary)";
  const seedKey = String(label);
  const data = Array.from({ length: 12 }).map((_, i) => {
    let h = 0;
    for (let j = 0; j < seedKey.length; j++) h = (h * 31 + seedKey.charCodeAt(j) + i * 7) >>> 0;
    return { i, v: 30 + (h % 70) };
  });
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5">
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div
          className="rounded-xl border border-border p-2.5"
          style={{ background: `color-mix(in oklab, ${color} 18%, transparent)` }}
        >
          <Icon className="h-4 w-4 text-foreground" />
        </div>
      </div>
      <div className="relative mt-3 h-14 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart === "bar" ? (
            <BarChart data={data}>
              <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-${seedKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#g-${seedKey})`} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Dashboard() {
  const occupancyPct = Math.round((STATS.spotsOccupied / STATS.spotsTotal) * 100);

  const sectorStats = SECTORS.filter((s) => s.shape !== "landmark" && s.shape !== "rotonda").map((s) => {
    const plots = PLOTS.filter((p) => p.sectorId === s.id);
    const occupied = plots.reduce(
      (n, p) => n + p.spots.filter((sp) => sp.occupant).length,
      0,
    );
    return {
      ...s,
      plots: plots.length,
      occupied,
      total: plots.length * 3,
    };
  });

  return (
    <AppShell
      title="Dashboard"
      subtitle="Resumen ejecutivo"
      actions={
        <Button asChild className="bg-gradient-brand text-primary-foreground hover:opacity-90">
          <Link to="/plano">
            <Map className="mr-2 h-4 w-4" /> Abrir plano
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Hero strip */}
        <div className="glass relative overflow-hidden rounded-2xl p-6 md:p-8">
          <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-glow)" }} />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3 w-3" /> Bienvenido
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Cementerio <span className="text-gradient-brand">San Nicolás · Renacimiento</span>
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Administra parcelas, registra fallecidos y genera reportes desde un único panel.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/parcelas">
                  Ver parcelas <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/reportes">
                  Reportes <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total parcelas" value={STATS.total} icon={Grid3x3} accent="var(--color-primary-glow)" chart="area" />
          <StatCard label="Municipales" value={STATS.municipal} hint="3 lugares c/u" icon={Building2} accent="var(--color-chart-2)" chart="bar" />
          <StatCard label="De socios" value={STATS.socio} hint="Familiares" icon={Users} accent="var(--color-success)" chart="area" />
          <StatCard label="Fallecidos registrados" value={STATS.deceasedCount} icon={TrendingUp} accent="var(--color-warning)" chart="bar" />
        </div>

        {/* Occupancy + Sectors */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-2xl p-6 lg:col-span-1">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Ocupación global
            </div>
            <div className="mt-4 flex items-end gap-2">
              <div className="text-5xl font-semibold tracking-tight text-gradient-brand">
                {occupancyPct}%
              </div>
              <div className="pb-2 text-xs text-muted-foreground">
                {STATS.spotsOccupied} / {STATS.spotsTotal} lugares
              </div>
            </div>
            <Progress value={occupancyPct} className="mt-4 h-2" />
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-card/40 p-3">
                <div className="text-muted-foreground">Disponibles</div>
                <div className="mt-1 text-lg font-semibold text-success">
                  {STATS.spotsAvailable}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card/40 p-3">
                <div className="text-muted-foreground">Ocupados</div>
                <div className="mt-1 text-lg font-semibold text-destructive">
                  {STATS.spotsOccupied}
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Por sector
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/plano">Ver plano <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {sectorStats.map((s) => {
                const pct = Math.round((s.occupied / s.total) * 100);
                return (
                  <div key={s.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="font-medium text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.occupied}/{s.total} · {pct}%
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-brand transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status distribution */}
        <div className="glass rounded-2xl p-6">
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Distribución por estado
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["available", "partial", "occupied", "reserved"] as const).map((st) => {
              const count = PLOTS.filter((p) => p.status === st).length;
              const pct = Math.round((count / STATS.total) * 100);
              return (
                <div key={st} className="rounded-xl border border-border bg-card/40 p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: statusColor(st) }}
                    />
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {st === "available" ? "Disponibles" : st === "partial" ? "Parciales" : st === "occupied" ? "Ocupadas" : "Reservadas"}
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">{pct}% del total</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
