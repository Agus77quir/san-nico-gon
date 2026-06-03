import { createFileRoute } from "@tanstack/react-router";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PLOTS, STATS } from "@/lib/demo-data";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes · San Nicolás Renacimiento" },
      { name: "description", content: "Generación de reportes y exportaciones." },
    ],
  }),
  component: ReportesPage,
});

const reports = [
  { title: "Parcelas con espacios libres", desc: "Disponibles + parcialmente ocupadas", get count() { return PLOTS.filter((p) => p.status === "available" || p.status === "partial").length; } },
  { title: "Parcelas completamente ocupadas", desc: "Sin espacios libres", get count() { return PLOTS.filter((p) => p.status === "occupied").length; } },
  { title: "Parcelas municipales", desc: "Capacidad 3 personas", get count() { return STATS.municipal; } },
  { title: "Parcelas de socios", desc: "Grupo familiar", get count() { return STATS.socio; } },
  { title: "Fallecidos por año", desc: "Histórico anual", get count() { return STATS.deceasedCount; } },
];

function ReportesPage() {
  return (
    <AppShell title="Reportes" subtitle="Generación y exportación">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <div key={r.title} className="glass group rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="rounded-xl border border-border bg-accent/20 p-2.5">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-semibold tracking-tight text-gradient-brand">
                {r.count}
              </div>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">{r.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <FileDown className="mr-2 h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Excel
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
