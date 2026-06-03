import { jsPDF } from "jspdf";
import type { Solicitud } from "./servicios-store";

function chk(v: string | undefined, target = "SI") {
  return v === target ? "[X]" : "[ ]";
}

export function downloadSolicitudPDF(s: Solicitud) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("San Nicolás · Renacimiento — Solicitud de Servicio", 40, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Factura N°: ${s.numeroFactura || "—"}    Socio N°: ${s.numeroSocio || "—"}    Fecha: ${s.fecha}    Ciudad: ${s.ciudad}`, 40, y);
  y += 10;
  doc.text(`Servicio brindado por: ${s.brindadoPor || "—"}`, 40, y);
  y += 16;
  doc.setDrawColor(180);
  doc.line(40, y, W - 40, y);
  y += 14;

  const section = (title: string) => {
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, 40, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };
  const row = (label: string, value: string) => {
    if (y > 780) {
      doc.addPage();
      y = 40;
    }
    doc.text(`${label}:`, 40, y);
    doc.text(value || "—", 180, y);
    y += 12;
  };

  section("SOCIO / FIRMANTE");
  row("Socio", s.socioNombre);
  row("Nombre y apellido", s.firmanteNombre);
  row("DNI", s.firmanteDni);
  row("Parentesco", s.firmanteParentesco);
  row("Domicilio", `${s.firmanteDomicilio} — ${s.firmanteBarrio} — ${s.firmanteLocalidad} — ${s.firmanteProvincia}`);
  row("Teléfono / Celular", `${s.firmanteTelefono} / ${s.firmanteCelular}`);
  row("E-Mail", s.firmanteEmail);
  row("Trabajo", `${s.firmanteLugarTrabajo} — ${s.firmanteDomicilioTrabajo}`);

  section("DATOS DEL EXTINTO");
  row("Nombre y apellido", s.extintoNombre);
  row("L.E./L.C./D.N.I.", s.extintoDni);
  row("Parentesco", s.extintoParentesco);
  row("Fecha de nacimiento", s.extintoFechaNac);
  row("Sexo", s.extintoSexo === "M" ? "Masculino" : s.extintoSexo === "F" ? "Femenino" : "");

  section("ESTABLECIMIENTO MÉDICO");
  doc.text(`Hospital ${chk(s.hospital)}   Clínica ${chk(s.clinica)}   Sanatorio ${chk(s.sanatorio)}`, 40, y);
  y += 12;
  row("Nombre", s.establecimientoNombre);
  row("Domicilio", s.establecimientoDomicilio);

  section("SOCIOS — JUBILADOS — PENSIONADOS");
  row("Obra social / seguro de vida", s.obraSocial);
  row("Mutual", s.mutual);
  row("Otros", s.otrosSeguro);

  section("DATOS DEL VELATORIO");
  doc.text(
    `Sala: 1 ${chk(s.salaVelatoria, "1")}  2 ${chk(s.salaVelatoria, "2")}  3 ${chk(s.salaVelatoria, "3")}  Otro ${chk(s.salaVelatoria, "OTRO")}    Servicio A ${chk(s.tipoServicio, "A")}  Servicio B ${chk(s.tipoServicio, "B")}`,
    40,
    y,
  );
  y += 12;
  row("Domicilio", s.velatorioDomicilio);
  row("Barrio", s.velatorioBarrio);
  row("Hora / Teléfono", `${s.velatorioHora} / ${s.velatorioTelefono}`);
  row("Localidad / Provincia", `${s.velatorioLocalidad} / ${s.velatorioProvincia}`);
  row("Importe", s.importe);

  section("SERVICIO RELIGIOSO");
  row("Día / Hora", `${s.religiosoDia} / ${s.religiosoHora}`);
  row("Lugar", s.religiosoLugar);

  section("SERVICIO DE INHUMACIÓN");
  doc.text(
    `Renacimiento ${chk(s.cementerio, "RENACIMIENTO")}   El Salvador ${chk(s.cementerio, "EL_SALVADOR")}   Otro ${chk(s.cementerio, "OTRO")} ${s.cementerioOtro}`,
    40,
    y,
  );
  y += 12;
  row("Localidad", s.cementerioLocalidad);
  row("Día / Hora", `${s.inhumacionDia} / ${s.inhumacionHora}`);

  section("DATOS SERVICIO DE CALLE");
  row("Coche fúnebre", `${chk(s.cocheFunebre)} unidad ${s.cocheFunebreUnidad} — ${s.cocheFunebreKm} km`);
  row("Portacoronas", `unidad ${s.portacoronasUnidad} — ${s.portacoronasKm} km`);
  row("Coche acompañante", `unidad ${s.cocheAcompUnidad} — ${s.cocheAcompKm} km`);
  row("Furgón sanitario", `${chk(s.furgonSanitario)} unidad ${s.furgonUnidad} — ${s.furgonKm} km`);

  section("ELEMENTOS UTILIZADOS");
  row("Velas / Estaño", `${s.velas} / ${s.estano}`);
  row("Formol", s.formol);
  row("Código capilla ardiente", s.codigoCapilla);

  section("TRASLADOS");
  row("Desde → Hasta", `${s.lugarDesde} → ${s.lugarHasta}`);
  row("Salida / Llegada", `${s.horaSalida} / ${s.horaLlegada}`);
  doc.text(
    `Empresa: OMBU ${chk(s.empresaTraslado, "OMBU")}   Otros ${chk(s.empresaTraslado, "OTROS")}  ${s.empresaTrasladoNombre}`,
    40,
    y,
  );
  y += 12;

  section("PERSONAL INTERVINIENTE");
  s.personal.forEach((p, i) => {
    row(`#${i + 1}`, `${p.nombre} (${p.desde} – ${p.hasta})`);
  });

  section("ATAÚD");
  row("Ataúd / Código", `${s.ataud} / ${s.ataudCodigo}`);
  row("Proveedor", s.proveedor);

  section("OBSERVACIONES");
  const obs = doc.splitTextToSize(s.observaciones || "—", W - 80);
  doc.text(obs, 40, y);

  doc.save(`solicitud-${s.numeroFactura || s.id}.pdf`);
}
