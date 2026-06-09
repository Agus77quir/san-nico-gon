import { createFileRoute } from "@tanstack/react-router";
import { FileDown, FileSpreadsheet, FileText, Printer } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { downloadReportExcel, downloadReportPDF, printReport, REPORT_DEFS } from "@/lib/reportes";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes · San Nicolás Renacimiento" },
      { name: "description", content: "Generación de reportes y exportaciones." },
    ],
  }),
  component: ReportesPage,
});

function ReportesPage() {
  return (
    <AppShell title="Reportes" subtitle="Generación y exportación">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORT_DEFS.map((r) => (
          <div key={r.id} className="glass group rounded-2xl p-6">
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
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadReportPDF(r.id)}>
                <FileDown className="mr-1 h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadReportExcel(r.id)}>
                <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => printReport(r.id)}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Imprimir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
