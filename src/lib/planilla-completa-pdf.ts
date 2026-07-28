import { jsPDF } from "jspdf";

/**
 * Planilla COMPLETA (versión ampliada) de solicitud de servicio para
 * completar a mano. Incluye responsable asignado a cada área operativa,
 * detalle de facturación, documentación, testigos y control de calidad.
 * Cementerios: Parque Cementerio Renacimiento y Chilecito.
 */
export function downloadPlanillaCompletaPDF() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 32;
  let y = M;

  // ---------- Encabezado ----------
  doc.setFillColor(20, 40, 90);
  doc.rect(M, y, W - M * 2, 54, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SAN NICOLÁS · RENACIMIENTO", M + 12, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Planilla completa de Solicitud de Servicio — para completar a mano",
    M + 12,
    y + 34,
  );
  doc.setFontSize(8);
  doc.text(
    "Con asignación de responsables por área, documentación, facturación y control",
    M + 12,
    y + 46,
  );
  doc.setTextColor(0);
  y += 58;

  // ---------- Cabecera ----------
  doc.setDrawColor(180);
  doc.setLineWidth(0.6);
  doc.rect(M, y, W - M * 2, 78);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AGENCIA:", M + 8, y + 14);
  line(doc, M + 70, y + 15, M + 320);
  doc.text("CÓDIGO AGENCIA:", M + 340, y + 14);
  line(doc, M + 430, y + 15, W - M - 8);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(110);
  doc.text(
    "Códigos de agencia — Ag. 1: 1001+   ·   Ag. 2: 20001+   ·   Ag. 3: 30001+   ·   Ag. 4: 40001+   (correlativo por agencia)",
    M + 8,
    y + 28,
  );
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");

  doc.text("N° PLANILLA:", M + 8, y + 46);
  doc.text("FECHA:", M + 220, y + 46);
  doc.text("HORA:", M + 360, y + 46);
  line(doc, M + 78, y + 47, M + 210);
  line(doc, M + 260, y + 47, M + 350);
  line(doc, M + 400, y + 47, M + 500);

  doc.text("N° EXPEDIENTE:", M + 8, y + 66);
  doc.text("N° CONTRATO / ORDEN:", M + 220, y + 66);
  line(doc, M + 90, y + 67, M + 210);
  line(doc, M + 340, y + 67, W - M - 8);
  y += 86;

  // ---------- Helpers ----------
  const GAP = 5;

  const ensure = (need: number) => {
    if (y + need > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const section = (title: string) => {
    ensure(28);
    y += GAP;
    doc.setFillColor(235, 240, 250);
    doc.setDrawColor(200, 210, 225);
    doc.rect(M, y, W - M * 2, 16, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 40, 90);
    doc.text(title.toUpperCase(), M + 8, y + 11);
    doc.setTextColor(0);
    y += 20;
  };

  const field = (label: string, x: number, w: number, h = 24) => {
    doc.setDrawColor(170);
    doc.setLineWidth(0.5);
    doc.rect(x, y, w, h);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(90);
    doc.text(label.toUpperCase(), x + 4, y + 8);
    doc.setTextColor(0);
  };

  const rowFields = (fields: { label: string; w: number }[], h = 24) => {
    ensure(h + 2);
    let x = M;
    const total = fields.reduce((a, f) => a + f.w, 0);
    const scale = (W - M * 2) / total;
    fields.forEach((f) => {
      const w = f.w * scale;
      field(f.label, x, w, h);
      x += w;
    });
    y += h + 2;
  };

  const checkboxes = (label: string, opts: string[]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const labelText = label.toUpperCase() + ":";
    const labelW = doc.getTextWidth(labelText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const maxRight = W - M - 6;
    const rows: string[][] = [[]];
    let curX = M + 8 + labelW + 10;
    const startX = curX;
    opts.forEach((opt) => {
      const w = 13 + doc.getTextWidth(opt) + 16;
      if (curX + w > maxRight && rows[rows.length - 1].length > 0) {
        rows.push([]);
        curX = M + 12;
      }
      rows[rows.length - 1].push(opt);
      curX += w;
    });
    const rowH = 16;
    const totalH = Math.max(20, rows.length * rowH + 4);
    ensure(totalH + 4);
    doc.setDrawColor(170);
    doc.setLineWidth(0.5);
    doc.rect(M, y, W - M * 2, totalH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60);
    doc.text(labelText, M + 6, y + 13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.setFontSize(9);
    rows.forEach((row, ri) => {
      let x = ri === 0 ? startX : M + 12;
      const yy = y + 6 + ri * rowH;
      row.forEach((opt) => {
        doc.rect(x, yy, 9, 9);
        doc.text(opt, x + 13, yy + 7);
        x += 13 + doc.getTextWidth(opt) + 16;
      });
    });
    y += totalH + 4;
  };

  const responsable = (area: string) => {
    ensure(34);
    doc.setFillColor(250, 245, 230);
    doc.setDrawColor(210, 190, 140);
    doc.rect(M, y, W - M * 2, 32, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(120, 85, 20);
    doc.text(`RESPONSABLE ${area.toUpperCase()}`, M + 6, y + 9);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(90);
    doc.text("NOMBRE Y APELLIDO", M + 6, y + 18);
    doc.text("DNI", M + (W - M * 2) * 0.45, y + 18);
    doc.text("HORA", M + (W - M * 2) * 0.6, y + 18);
    doc.text("FIRMA", M + (W - M * 2) * 0.75, y + 18);
    doc.setTextColor(0);
    line(doc, M + 6, y + 28, M + (W - M * 2) * 0.43);
    line(doc, M + (W - M * 2) * 0.45, y + 28, M + (W - M * 2) * 0.58);
    line(doc, M + (W - M * 2) * 0.6, y + 28, M + (W - M * 2) * 0.73);
    line(doc, M + (W - M * 2) * 0.75, y + 28, W - M - 6);
    y += 34;
  };

  // ---------- Solicitante ----------
  section("Datos del solicitante / firmante");
  checkboxes("Actúa como", ["Firmante", "Contratante", "Socio", "Particular", "Familiar", "Apoderado"]);
  rowFields([
    { label: "Apellido y nombre", w: 3 },
    { label: "DNI", w: 1.2 },
    { label: "Fecha nac.", w: 1 },
    { label: "Parentesco con el extinto", w: 1.6 },
  ]);
  rowFields([
    { label: "Domicilio", w: 3 },
    { label: "Barrio", w: 1.4 },
    { label: "Localidad", w: 1.4 },
    { label: "CP", w: 0.6 },
  ]);
  rowFields([
    { label: "Provincia", w: 1.2 },
    { label: "Teléfono fijo", w: 1.2 },
    { label: "Celular", w: 1.2 },
    { label: "E-mail", w: 2 },
  ]);
  rowFields([
    { label: "Lugar de trabajo", w: 2 },
    { label: "Domicilio de trabajo", w: 2.5 },
    { label: "Tel. trabajo", w: 1.2 },
  ]);
  rowFields([
    { label: "N° de afiliado", w: 1.2 },
    { label: "N° de socio", w: 1.2 },
    { label: "Titular del servicio", w: 2.4 },
    { label: "CUIT / CUIL", w: 1.4 },
    { label: "Estado civil", w: 1 },
  ]);

  // ---------- Extinto ----------
  section("Datos del extinto");
  rowFields([
    { label: "Apellido y nombre", w: 3 },
    { label: "L.E. / L.C. / D.N.I.", w: 1.4 },
    { label: "Sexo (M/F)", w: 0.7 },
    { label: "Edad", w: 0.6 },
  ]);
  rowFields([
    { label: "Fecha de nacimiento", w: 1.2 },
    { label: "Lugar de nacimiento", w: 2 },
    { label: "Nacionalidad", w: 1.2 },
    { label: "Estado civil", w: 1 },
  ]);
  rowFields([
    { label: "Cónyuge / pareja", w: 2.2 },
    { label: "Padre", w: 2 },
    { label: "Madre", w: 2 },
  ]);
  rowFields([
    { label: "Último domicilio", w: 3 },
    { label: "Barrio / Localidad", w: 2 },
    { label: "Ocupación", w: 1.4 },
  ]);
  rowFields([
    { label: "Fecha de fallecimiento", w: 1.2 },
    { label: "Hora de fallecimiento", w: 1 },
    { label: "Causa (según certificado)", w: 2.2 },
    { label: "N° acta / defunción", w: 1.4 },
  ]);
  checkboxes("Lugar de fallecimiento", [
    "Domicilio",
    "Hospital",
    "Clínica",
    "Sanatorio",
    "Geriátrico",
    "Vía pública",
  ]);
  rowFields([
    { label: "Nombre del establecimiento", w: 3 },
    { label: "Médico certificante", w: 2 },
    { label: "Matrícula", w: 1 },
  ]);

  // ---------- Documentación entregada ----------
  section("Documentación entregada");
  checkboxes("Documentos", [
    "DNI del extinto",
    "DNI solicitante",
    "Certif. médico",
    "Acta defunción",
    "Libreta familiar",
    "Autorización",
  ]);
  rowFields([
    { label: "Otros documentos", w: 3 },
    { label: "Recibido por", w: 2 },
    { label: "Fecha / hora", w: 1.4 },
  ]);

  // ---------- Cobertura ----------
  section("Cobertura y forma de pago");
  checkboxes("Tipo de cobertura", [
    "Socio activo",
    "Particular",
    "Obra social",
    "Mutual",
    "Convenio",
  ]);
  rowFields([
    { label: "Obra social / mutual", w: 2 },
    { label: "N° afiliado", w: 1.2 },
    { label: "Plan / categoría", w: 1.2 },
    { label: "Autorización N°", w: 1.2 },
  ]);
  checkboxes("Forma de pago", [
    "Efectivo",
    "Transferencia",
    "Débito",
    "Crédito",
    "Cuenta corriente",
    "A convenir",
  ]);
  rowFields([
    { label: "Importe total", w: 1.4 },
    { label: "Seña / anticipo", w: 1.4 },
    { label: "Saldo", w: 1.4 },
    { label: "Vencimiento saldo", w: 1.4 },
  ]);
  responsable("de cobranzas / administración");

  // ---------- Sala velatoria ----------
  section("Sala velatoria");
  checkboxes("Sala", ["Sala 1", "Sala 2", "Sala 3", "Domiciliario", "Otro"]);
  checkboxes("Tipo servicio", [
    "Servicio A (Suite – Buffet)",
    "Servicio B",
    "Servicio C",
    "Personalizado",
  ]);
  rowFields([
    { label: "Domicilio del velatorio", w: 3 },
    { label: "Barrio / Localidad", w: 2 },
    { label: "Teléfono sala", w: 1.2 },
  ]);
  rowFields([
    { label: "Fecha inicio", w: 1 },
    { label: "Hora inicio", w: 1 },
    { label: "Fecha fin", w: 1 },
    { label: "Hora fin", w: 1 },
    { label: "Cant. horas", w: 0.8 },
  ]);
  checkboxes("Servicios adicionales", [
    "Café / infusiones",
    "Buffet",
    "Ambientación",
    "Música",
    "Livestream",
  ]);
  responsable("de sala velatoria");

  // ---------- Servicio religioso ----------
  section("Servicio religioso / ceremonia");
  checkboxes("Culto", ["Católico", "Evangélico", "Otro", "Laico"]);
  rowFields([
    { label: "Día", w: 1 },
    { label: "Hora", w: 1 },
    { label: "Lugar / templo", w: 3 },
    { label: "Oficiante", w: 2 },
  ]);
  responsable("del servicio religioso");

  // ---------- Cementerio ----------
  section("Cementerio / destino final");
  checkboxes("Cementerio", [
    "San Nicolás",
    "Renacimiento",
    "Parque",
  ]);
  checkboxes("Modalidad", [
    "Sepultura",
    "Nicho",
    "Panteón",
    "Cremación",
    "Traslado",
  ]);
  rowFields([
    { label: "Sector", w: 1 },
    { label: "Fila", w: 0.8 },
    { label: "Parcela / N°", w: 1 },
    { label: "Nicho / cuerpo", w: 1 },
    { label: "Fecha inhumación", w: 1.2 },
    { label: "Hora", w: 0.8 },
  ]);
  rowFields([
    { label: "Titular parcela / nicho", w: 3 },
    { label: "N° título", w: 1.4 },
    { label: "Vencimiento", w: 1.4 },
  ]);
  rowFields([
    { label: "Observaciones del destino (traslado, dirección, cremación, urna, etc.)", w: 4 },
  ]);
  responsable("1 del cementerio / inhumación");
  responsable("2 del cementerio / inhumación");
  responsable("3 del cementerio / inhumación");

  // ---------- Coche fúnebre ----------
  section("Servicio de calle — Coche fúnebre y unidades");
  checkboxes("Unidades utilizadas", [
    "Coche fúnebre",
    "Portacoronas",
    "Coche acompañante",
    "Furgón sanitario",
    "Micro",
  ]);
  rowFields([
    { label: "Coche fúnebre — unidad N°", w: 1.4 },
    { label: "Patente", w: 1 },
    { label: "Km inicial", w: 0.8 },
    { label: "Km final", w: 0.8 },
  ]);
  rowFields([
    { label: "Portacoronas — unidad N°", w: 1.4 },
    { label: "Patente", w: 1 },
    { label: "Coche acompañante — N°", w: 1.4 },
    { label: "Patente", w: 1 },
  ]);
  rowFields([
    { label: "Furgón sanitario — unidad N°", w: 1.4 },
    { label: "Patente", w: 1 },
    { label: "Micro — unidad N°", w: 1.4 },
    { label: "Patente", w: 1 },
  ]);
  rowFields([
    { label: "Recorrido desde", w: 2 },
    { label: "Recorrido hasta", w: 2 },
    { label: "Km total", w: 0.6 },
    { label: "Peajes", w: 0.6 },
  ]);
  responsable("del coche fúnebre / chofer");

  // ---------- Traslados ----------
  section("Traslados");
  checkboxes("Empresa", ["OMBU", "Propia", "Otra"]);
  rowFields([
    { label: "Empresa (si es otra)", w: 2 },
    { label: "Desde", w: 2 },
    { label: "Hasta", w: 2 },
  ]);
  rowFields([
    { label: "Fecha", w: 1 },
    { label: "Hora salida", w: 1 },
    { label: "Hora llegada", w: 1 },
    { label: "N° unidad", w: 1 },
    { label: "Km", w: 0.8 },
  ]);
  rowFields([
    { label: "Autorización / guía sanitaria N°", w: 3 },
    { label: "Provincia destino", w: 2 },
  ]);
  responsable("de traslado");

  // ---------- Ataúd ----------
  section("Ataúd, urna y elementos");
  rowFields([
    { label: "Modelo de ataúd", w: 2 },
    { label: "Código", w: 1 },
    { label: "Medida", w: 1 },
    { label: "Proveedor", w: 1.8 },
  ]);
  rowFields([
    { label: "Urna (cremación) — modelo", w: 2 },
    { label: "Código", w: 1 },
    { label: "Placa / grabado", w: 2 },
  ]);
  checkboxes("Elementos incluidos", [
    "Velas",
    "Estaño",
    "Formol",
    "Capilla ardiente",
    "Cristo",
    "Portarretratos",
  ]);
  rowFields([
    { label: "Capilla ardiente (código)", w: 1.4 },
    { label: "Coronas / arreglos florales", w: 2 },
    { label: "Cant.", w: 0.5 },
    { label: "Cinta / dedicatoria", w: 2 },
  ]);
  responsable("de ataúd y elementos");

  // ---------- Preparación / tanatopraxia ----------
  section("Preparación del extinto / tanatopraxia");
  checkboxes("Servicios", [
    "Higienización",
    "Vestimenta",
    "Maquillaje",
    "Tanatopraxia",
    "Formolización",
  ]);
  rowFields([
    { label: "Vestimenta aportada por", w: 2 },
    { label: "Observaciones (rasgos, cabello, prótesis, joyas, etc.)", w: 4 },
  ]);
  responsable("de preparación / tanatopraxia");

  // ---------- Publicaciones ----------
  section("Publicaciones / avisos");
  checkboxes("Medios", ["Diario", "Radio", "Redes sociales", "Web propia", "Otros"]);
  rowFields([
    { label: "Diario / medio", w: 2 },
    { label: "Fecha publicación", w: 1.2 },
    { label: "Texto / aviso", w: 3 },
  ]);
  responsable("de publicaciones");

  // ---------- Personal ----------
  section("Personal interviniente");
  rowFields([
    { label: "Responsable de agencia", w: 2 },
    { label: "DNI", w: 1 },
    { label: "Firma", w: 2 },
  ]);
  rowFields([
    { label: "Operador / asistente 1", w: 2 },
    { label: "Operador / asistente 2", w: 2 },
    { label: "Operador / asistente 3", w: 2 },
  ]);
  rowFields([
    { label: "Portador 1", w: 1.5 },
    { label: "Portador 2", w: 1.5 },
    { label: "Portador 3", w: 1.5 },
    { label: "Portador 4", w: 1.5 },
  ]);

  // ---------- Testigos ----------
  section("Testigos / familiares presentes");
  rowFields([
    { label: "Testigo 1 — Nombre", w: 2.5 },
    { label: "DNI", w: 1.2 },
    { label: "Firma", w: 2.3 },
  ]);
  rowFields([
    { label: "Testigo 2 — Nombre", w: 2.5 },
    { label: "DNI", w: 1.2 },
    { label: "Firma", w: 2.3 },
  ]);

  // ---------- Observaciones ----------
  section("Observaciones generales");
  ensure(110);
  doc.setDrawColor(160);
  doc.rect(M, y, W - M * 2, 100);
  for (let i = 1; i <= 5; i++) {
    doc.setDrawColor(220);
    doc.line(M + 6, y + i * 17, W - M - 6, y + i * 17);
  }
  y += 110;

  // ---------- Control de calidad ----------
  section("Control de calidad / cierre del servicio");
  checkboxes("Control", [
    "Servicio conforme",
    "Documentación completa",
    "Cobro conforme",
    "Reclamo pendiente",
  ]);
  rowFields([
    { label: "Observaciones del cierre", w: 4 },
    { label: "Fecha cierre", w: 1.2 },
    { label: "Hora", w: 0.8 },
  ]);
  responsable("del control de calidad / cierre");

  // ---------- Firmas finales ----------
  ensure(90);
  const colW = (W - M * 2 - 20) / 2;
  doc.setDrawColor(80);
  doc.line(M, y + 40, M + colW, y + 40);
  doc.line(M + colW + 20, y + 40, W - M, y + 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Firma y aclaración del solicitante", M, y + 54);
  doc.text(
    "Firma y aclaración responsable de agencia",
    M + colW + 20,
    y + 54,
  );
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text("DNI:", M, y + 68);
  doc.text("DNI:", M + colW + 20, y + 68);
  line(doc, M + 20, y + 69, M + colW - 6);
  line(doc, M + colW + 40, y + 69, W - M - 6);
  doc.setTextColor(0);

  // ---------- Footer ----------
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    `Planilla completa — para completar manualmente — ${new Date().toLocaleDateString()}`,
    M,
    H - 20,
  );

  doc.save("planilla-completa-solicitud-servicio.pdf");
}

function line(doc: jsPDF, x1: number, y1: number, x2: number) {
  doc.setDrawColor(120);
  doc.line(x1, y1, x2, y1);
}
