import { jsPDF } from "jspdf";

/**
 * Planilla COMPLETA (versión ampliada) de solicitud de servicio para
 * completar a mano. Incluye responsable asignado a cada área operativa,
 * detalle de facturación, documentación, testigos y control de calidad.
 * Cementerios: Parque Cementerio Renacimiento y Chilecito.
 */
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadPlanillaCompletaPDF() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 32;
  let y = M;

  // ---------- Encabezado ----------
  doc.setFillColor(20, 40, 90);
  doc.rect(M, y, W - M * 2, 54, "F");

  const logoData = await loadLogoDataUrl();
  if (logoData) {
    try {
      const img = new Image();
      img.src = logoData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
      const maxW = 40;
      const maxH = 40;
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const w = img.naturalWidth * ratio;
      const h = img.naturalHeight * ratio;
      const x = M + 8 + (maxW - w) / 2;
      const yy = y + 7 + (maxH - h) / 2;
      doc.addImage(logoData, "PNG", x, yy, w, h);
    } catch {
      /* ignore */
    }
  }

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SN · RENACIMIENTO · PARQUE", M + 56, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Planilla completa de Solicitud de Servicio — para completar a mano",
    M + 56,
    y + 34,
  );
  doc.setFontSize(8);
  doc.text(
    "Con asignación de responsables por área, documentación, facturación y control",
    M + 56,
    y + 46,
  );
  doc.setTextColor(0);
  y += 58;

  // ---------- Cabecera ----------
  doc.setDrawColor(180);
  doc.setLineWidth(0.6);
  doc.rect(M, y, W - M * 2, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AGENCIA:", M + 8, y + 16);
  line(doc, M + 70, y + 17, W - M - 8);

  doc.text("N° PLANILLA:", M + 8, y + 34);
  doc.text("FECHA:", M + 220, y + 34);
  doc.text("HORA:", M + 360, y + 34);
  line(doc, M + 78, y + 35, M + 210);
  line(doc, M + 260, y + 35, M + 350);
  line(doc, M + 400, y + 35, M + 500);

  doc.text("N° EXPEDIENTE:", M + 8, y + 52);
  doc.text("N° CONTRATO / ORDEN:", M + 220, y + 52);
  line(doc, M + 90, y + 53, M + 210);
  line(doc, M + 340, y + 53, W - M - 8);
  y += 68;

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

  const responsable = (area: string, multi = false) => {
    const blockH = multi ? 50 : 36;
    ensure(blockH + 4);
    doc.setFillColor(250, 245, 230);
    doc.setDrawColor(210, 190, 140);
    doc.rect(M, y, W - M * 2, blockH, "FD");

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(120, 85, 20);
    doc.text(`RESPONSABLE ${area.toUpperCase()}`, M + 6, y + 10);

    if (multi) {
      // Selector N°: 1 / 2 / 3 (solo para solicitante/firmante)
      doc.setTextColor(90);
      doc.setFontSize(7);
      const nLabel = "N°:";
      let nx = M + 6;
      doc.text(nLabel, nx, y + 23);
      nx += doc.getTextWidth(nLabel) + 6;
      doc.setDrawColor(150);
      ["1", "2", "3"].forEach((n) => {
        doc.rect(nx, y + 17, 8, 8);
        doc.setFont("helvetica", "normal");
        doc.text(n, nx + 12, y + 23);
        doc.setFont("helvetica", "bold");
        nx += 22;
      });
    }

    // Etiquetas de firma
    const labelY = multi ? y + 36 : y + 24;
    const lineY = multi ? y + 46 : y + 32;
    doc.setTextColor(90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    if (multi) {
      // Solicitante/contratante: sin DNI (se completa abajo), más espacio para nombre
      doc.text("NOMBRE Y APELLIDO", M + 6, labelY);
      doc.text("HORA", M + (W - M * 2) * 0.65, labelY);
      doc.text("FIRMA", M + (W - M * 2) * 0.8, labelY);
      doc.setTextColor(0);
      line(doc, M + 6, lineY, M + (W - M * 2) * 0.62);
      line(doc, M + (W - M * 2) * 0.65, lineY, M + (W - M * 2) * 0.78);
      line(doc, M + (W - M * 2) * 0.8, lineY, W - M - 6);
    } else {
      doc.text("NOMBRE Y APELLIDO", M + 6, labelY);
      doc.text("DNI", M + (W - M * 2) * 0.45, labelY);
      doc.text("HORA", M + (W - M * 2) * 0.6, labelY);
      doc.text("FIRMA", M + (W - M * 2) * 0.75, labelY);
      doc.setTextColor(0);
      line(doc, M + 6, lineY, M + (W - M * 2) * 0.43);
      line(doc, M + (W - M * 2) * 0.45, lineY, M + (W - M * 2) * 0.58);
      line(doc, M + (W - M * 2) * 0.6, lineY, M + (W - M * 2) * 0.73);
      line(doc, M + (W - M * 2) * 0.75, lineY, W - M - 6);
    }
    y += blockH + 4;
  };

  // ---------- Solicitante ----------
  section("Datos del solicitante / contratante");
  checkboxes("Actúa como", ["Firmante", "Contratante", "Socio", "Particular", "Familiar", "Apoderado"]);
  responsable("del solicitante / contratante", true);
  rowFields([
    { label: "DNI", w: 1.4 },
    { label: "Fecha nac.", w: 1.2 },
    { label: "Parentesco con el extinto", w: 2 },
    { label: "Estado civil", w: 1.2 },
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
    { label: "Fecha de fallecimiento", w: 1.3 },
    { label: "Hora de fallecimiento", w: 1.5 },
    { label: "Causa (según certificado)", w: 2.4 },
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
  responsable("del cementerio / inhumación");

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
