import { jsPDF } from "jspdf";

export const AGENCIAS = [
  "Casa Central - La Rioja",
  "Sucursal Chilecito",
  "Sucursal Chamical",
  "Sucursal Chepes",
  "Sucursal Aimogasta",
  "Sucursal Villa Unión",
] as const;

export type Agencia = (typeof AGENCIAS)[number];

export function downloadPlanillaBlancoPDF(agencia: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  let y = M;

  // Encabezado
  doc.setFillColor(20, 40, 90);
  doc.rect(M, y, W - M * 2, 46, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SAN NICOLÁS · RENACIMIENTO", M + 12, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Planilla de Solicitud de Servicio — para completar a mano", M + 12, y + 36);
  doc.setTextColor(0);
  y += 46;

  // Agencia + N°
  doc.setDrawColor(180);
  doc.setLineWidth(0.6);
  doc.rect(M, y, W - M * 2, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AGENCIA:", M + 8, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(agencia || "________________________________________", M + 70, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("N° PLANILLA:", M + 8, y + 32);
  doc.text("FECHA:", M + 220, y + 32);
  doc.text("HORA:", M + 360, y + 32);
  doc.setFont("helvetica", "normal");
  line(doc, M + 78, y + 33, M + 210);
  line(doc, M + 260, y + 33, M + 350);
  line(doc, M + 400, y + 33, M + 500);
  y += 50;

  // helpers
  const section = (title: string) => {
    doc.setFillColor(230, 235, 245);
    doc.rect(M, y, W - M * 2, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 40, 90);
    doc.text(title.toUpperCase(), M + 8, y + 11);
    doc.setTextColor(0);
    y += 20;
  };

  const field = (label: string, x: number, w: number, h = 22) => {
    doc.setDrawColor(160);
    doc.rect(x, y, w, h);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(90);
    doc.text(label.toUpperCase(), x + 4, y + 7);
    doc.setTextColor(0);
  };

  const rowFields = (fields: { label: string; w: number }[], h = 22) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
    let x = M;
    const total = fields.reduce((a, f) => a + f.w, 0);
    const scale = (W - M * 2) / total;
    fields.forEach((f) => {
      const w = f.w * scale;
      field(f.label, x, w, h);
      x += w;
    });
    y += h;
  };

  const checkboxes = (label: string, opts: string[]) => {
    if (y + 22 > H - M) {
      doc.addPage();
      y = M;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(label + ":", M, y + 10);
    let x = M + doc.getTextWidth(label + ":") + 8;
    doc.setFont("helvetica", "normal");
    opts.forEach((opt) => {
      doc.rect(x, y + 3, 9, 9);
      doc.text(opt, x + 13, y + 10);
      x += 13 + doc.getTextWidth(opt) + 14;
    });
    y += 20;
  };

  // Solicitante
  section("Datos del solicitante");
  rowFields([
    { label: "Apellido y nombre", w: 3 },
    { label: "DNI", w: 1.2 },
    { label: "Parentesco con el extinto", w: 1.6 },
  ]);
  rowFields([
    { label: "Domicilio", w: 3 },
    { label: "Barrio", w: 1.4 },
    { label: "Localidad", w: 1.4 },
  ]);
  rowFields([
    { label: "Teléfono", w: 1.2 },
    { label: "Celular", w: 1.2 },
    { label: "E-mail", w: 2.6 },
  ]);
  rowFields([
    { label: "N° de socio (si corresponde)", w: 1.5 },
    { label: "Titular del servicio", w: 2.5 },
  ]);

  // Extinto
  section("Datos del extinto");
  rowFields([
    { label: "Apellido y nombre", w: 3 },
    { label: "DNI / L.C. / L.E.", w: 1.4 },
    { label: "Sexo (M/F)", w: 0.8 },
  ]);
  rowFields([
    { label: "Fecha de nacimiento", w: 1.2 },
    { label: "Fecha de fallecimiento", w: 1.2 },
    { label: "Hora de fallecimiento", w: 1 },
    { label: "Edad", w: 0.6 },
  ]);
  rowFields([
    { label: "Lugar de fallecimiento (domicilio / establecimiento)", w: 3 },
    { label: "Localidad", w: 1.5 },
  ]);
  checkboxes("Lugar", ["Domicilio", "Hospital", "Clínica", "Sanatorio", "Geriátrico", "Vía pública"]);
  rowFields([{ label: "Nombre del establecimiento", w: 3 }, { label: "Médico certificante / matrícula", w: 2 }]);

  // Cobertura
  section("Cobertura");
  checkboxes("Cobertura", ["Socio activo", "Servicio particular", "Obra social", "Mutual", "Convenio"]);
  rowFields([
    { label: "Obra social / mutual", w: 2 },
    { label: "N° afiliado", w: 1.2 },
    { label: "Plan / categoría", w: 1.2 },
  ]);

  // Velatorio
  section("Velatorio");
  checkboxes("Sala", ["Sala 1", "Sala 2", "Sala 3", "Domiciliario", "Otro"]);
  rowFields([
    { label: "Domicilio del velatorio", w: 3 },
    { label: "Barrio / Localidad", w: 2 },
  ]);
  rowFields([
    { label: "Fecha inicio", w: 1 },
    { label: "Hora inicio", w: 1 },
    { label: "Fecha fin", w: 1 },
    { label: "Hora fin", w: 1 },
  ]);

  // Inhumación
  section("Inhumación / destino final");
  checkboxes("Cementerio", ["Renacimiento", "El Salvador", "Otro"]);
  checkboxes("Modalidad", ["Sepultura", "Nicho", "Panteón", "Cremación", "Traslado"]);
  rowFields([
    { label: "Sector / fila / parcela", w: 2 },
    { label: "Fecha de inhumación", w: 1.2 },
    { label: "Hora", w: 0.8 },
  ]);
  rowFields([{ label: "Observaciones del destino (cementerio otro, dirección de traslado, etc.)", w: 4 }]);

  // Servicio de calle
  section("Servicio de calle");
  checkboxes("Unidades", ["Coche fúnebre", "Portacoronas", "Coche acompañante", "Furgón sanitario"]);
  rowFields([
    { label: "Recorrido desde", w: 2 },
    { label: "Recorrido hasta", w: 2 },
    { label: "Km aprox.", w: 0.6 },
  ]);

  // Ataúd
  section("Ataúd y elementos");
  rowFields([
    { label: "Modelo de ataúd", w: 2 },
    { label: "Código", w: 1 },
    { label: "Proveedor", w: 1.8 },
  ]);
  rowFields([
    { label: "Velas", w: 0.6 },
    { label: "Estaño", w: 0.6 },
    { label: "Formol", w: 0.6 },
    { label: "Capilla ardiente (código)", w: 1.4 },
    { label: "Coronas / arreglos florales", w: 1.8 },
  ]);

  // Personal
  section("Personal interviniente");
  rowFields([
    { label: "Responsable de agencia", w: 2 },
    { label: "Chofer", w: 1.5 },
    { label: "Asistente", w: 1.5 },
  ]);

  // Observaciones
  section("Observaciones");
  if (y + 90 > H - M) {
    doc.addPage();
    y = M;
  }
  doc.setDrawColor(160);
  doc.rect(M, y, W - M * 2, 90);
  for (let i = 1; i <= 4; i++) {
    doc.setDrawColor(220);
    doc.line(M + 6, y + i * 18, W - M - 6, y + i * 18);
  }
  y += 100;

  // Firmas
  if (y + 70 > H - M) {
    doc.addPage();
    y = M;
  }
  const colW = (W - M * 2 - 20) / 2;
  doc.setDrawColor(80);
  doc.line(M, y + 40, M + colW, y + 40);
  doc.line(M + colW + 20, y + 40, W - M, y + 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Firma y aclaración del solicitante", M, y + 54);
  doc.text("Firma y aclaración responsable de agencia", M + colW + 20, y + 54);

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    `Planilla generada en blanco para completar manualmente — Agencia: ${agencia} — ${new Date().toLocaleDateString()}`,
    M,
    H - 20,
  );

  const slug = agencia.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "planilla";
  doc.save(`planilla-${slug}.pdf`);
}

function line(doc: jsPDF, x1: number, y1: number, x2: number) {
  doc.setDrawColor(120);
  doc.line(x1, y1, x2, y1);
}
