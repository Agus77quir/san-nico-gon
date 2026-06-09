import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { PLOTS, SECTORS, STATS, statusLabel, type Plot } from "./demo-data";

export type ReportId =
  | "espacios-libres"
  | "ocupadas"
  | "municipales"
  | "socios"
  | "fallecidos-anio";

interface ReportDef {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

function plotRow(p: Plot): (string | number)[] {
  const sector = SECTORS.find((s) => s.id === p.sectorId)?.name ?? p.sectorId;
  const ocup = p.spots.filter((s) => s.occupant).length;
  return [
    p.code,
    sector,
    p.type === "socio" ? "Socio" : "Municipal",
    statusLabel(p.status),
    `${ocup}/3`,
    p.holder?.fullName ?? "—",
  ];
}

function plotColumns() {
  return ["Código", "Sector", "Tipo", "Estado", "Ocupación", "Titular"];
}

export function buildReport(id: ReportId): ReportDef {
  switch (id) {
    case "espacios-libres": {
      const rows = PLOTS.filter((p) => p.status === "available" || p.status === "partial").map(plotRow);
      return { title: "Parcelas con espacios libres", columns: plotColumns(), rows };
    }
    case "ocupadas": {
      const rows = PLOTS.filter((p) => p.status === "occupied").map(plotRow);
      return { title: "Parcelas completamente ocupadas", columns: plotColumns(), rows };
    }
    case "municipales": {
      const rows = PLOTS.filter((p) => p.type === "municipal").map(plotRow);
      return { title: "Parcelas municipales", columns: plotColumns(), rows };
    }
    case "socios": {
      const rows = PLOTS.filter((p) => p.type === "socio").map(plotRow);
      return { title: "Parcelas de socios", columns: plotColumns(), rows };
    }
    case "fallecidos-anio": {
      const counts = new Map<string, number>();
      for (const p of PLOTS) {
        for (const s of p.spots) {
          if (s.occupant) {
            const year = s.occupant.deathDate.slice(0, 4);
            counts.set(year, (counts.get(year) ?? 0) + 1);
          }
        }
      }
      const rows = [...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([y, n]) => [y, n]);
      return { title: "Fallecidos por año", columns: ["Año", "Cantidad"], rows };
    }
  }
}

export function downloadReportPDF(id: ReportId) {
  const { title, columns, rows } = buildReport(id);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("San Nicolás · Renacimiento", 40, 40);
  doc.setFontSize(11);
  doc.text(title, 40, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, 40, 74);
  doc.text(`Total registros: ${rows.length}`, W - 40, 74, { align: "right" });

  autoTable(doc, {
    startY: 90,
    head: [columns],
    body: rows.map((r) => r.map((c) => String(c))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [40, 60, 110], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${id}.pdf`);
}

export function printReport(id: ReportId) {
  const { title, columns, rows } = buildReport(id);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("San Nicolás · Renacimiento", 40, 40);
  doc.setFontSize(11);
  doc.text(title, 40, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, 40, 74);
  doc.text(`Total registros: ${rows.length}`, W - 40, 74, { align: "right" });

  autoTable(doc, {
    startY: 90,
    head: [columns],
    body: rows.map((r) => r.map((c) => String(c))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [40, 60, 110], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 40, right: 40 },
  });

  doc.autoPrint();
  const url = doc.output("bloburl");
  window.open(url, "_blank");
}

export async function downloadReportExcel(id: ReportId) {
  const { title, columns, rows } = buildReport(id);
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 30));
  XLSX.writeFile(wb, `${id}.xlsx`);
}

export const REPORT_DEFS: { id: ReportId; title: string; desc: string; count: number }[] = [
  {
    id: "espacios-libres",
    title: "Parcelas con espacios libres",
    desc: "Disponibles + parcialmente ocupadas",
    count: PLOTS.filter((p) => p.status === "available" || p.status === "partial").length,
  },
  {
    id: "ocupadas",
    title: "Parcelas completamente ocupadas",
    desc: "Sin espacios libres",
    count: PLOTS.filter((p) => p.status === "occupied").length,
  },
  {
    id: "municipales",
    title: "Parcelas municipales",
    desc: "Capacidad 3 personas",
    count: STATS.municipal,
  },
  {
    id: "socios",
    title: "Parcelas de socios",
    desc: "Grupo familiar",
    count: STATS.socio,
  },
  {
    id: "fallecidos-anio",
    title: "Fallecidos por año",
    desc: "Histórico anual",
    count: STATS.deceasedCount,
  },
];
