// Local store for "Solicitudes de Servicio" — demo persistence via localStorage.

export type SalaVelatoria = "1" | "2" | "3" | "OTRO";
export type SiNo = "SI" | "NO" | "";
export type TipoServicio = "A" | "B" | "";
export type Cementerio = "RENACIMIENTO" | "EL_SALVADOR" | "OTRO" | "";
export type EmpresaTraslado = "OMBU" | "OTROS" | "";

export interface Personal {
  nombre: string;
  desde: string;
  hasta: string;
}

export interface Solicitud {
  id: string;
  createdAt: string;
  // Cabecera
  numeroFactura: string;
  numeroSocio: string;
  fecha: string; // yyyy-mm-dd
  ciudad: string;
  brindadoPor: string; // quien brindó el servicio (firmante cochería / operador)

  // Socio / Firmante
  socioNombre: string;
  firmanteNombre: string;
  firmanteDni: string;
  firmanteParentesco: string;
  firmanteDomicilio: string;
  firmanteBarrio: string;
  firmanteLocalidad: string;
  firmanteProvincia: string;
  firmanteTelefono: string;
  firmanteCelular: string;
  firmanteDomicilioTrabajo: string;
  firmanteLugarTrabajo: string;
  firmanteEmail: string;

  // Extinto (familiar)
  extintoNombre: string;
  extintoDni: string;
  extintoParentesco: string;
  extintoFechaNac: string;
  extintoSexo: "M" | "F" | "";

  // Establecimiento médico
  hospital: SiNo;
  clinica: SiNo;
  sanatorio: SiNo;
  establecimientoNombre: string;
  establecimientoDomicilio: string;

  // Socios/Jubilados/Pensionados
  obraSocial: string;
  mutual: string;
  otrosSeguro: string;

  // Velatorio
  salaVelatoria: SalaVelatoria | "";
  velatorioDomicilio: string;
  velatorioBarrio: string;
  velatorioHora: string;
  velatorioTelefono: string;
  velatorioLocalidad: string;
  velatorioProvincia: string;
  tipoServicio: TipoServicio;
  importe: string;

  // Religioso
  religiosoDia: string;
  religiosoLugar: string;
  religiosoHora: string;

  // Inhumación
  cementerio: Cementerio;
  cementerioOtro: string;
  cementerioLocalidad: string;
  inhumacionDia: string;
  inhumacionHora: string;

  // Servicio de calle
  cocheFunebre: SiNo;
  cocheFunebreUnidad: string;
  cocheFunebreKm: string;
  portacoronasUnidad: string;
  portacoronasKm: string;
  cocheAcompUnidad: string;
  cocheAcompKm: string;
  furgonSanitario: SiNo;
  furgonUnidad: string;
  furgonKm: string;

  // Elementos
  velas: string;
  estano: string;
  formol: string;
  codigoCapilla: string;

  // Traslados
  lugarDesde: string;
  lugarHasta: string;
  horaSalida: string;
  horaLlegada: string;
  empresaTraslado: EmpresaTraslado;
  empresaTrasladoNombre: string;

  // Personal interviniente
  personal: Personal[];

  // Ataúd
  ataud: string;
  ataudCodigo: string;
  proveedor: string;

  observaciones: string;
}

const KEY = "snr_solicitudes_v1";

export function emptySolicitud(): Solicitud {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    numeroFactura: "",
    numeroSocio: "",
    fecha: new Date().toISOString().slice(0, 10),
    ciudad: "La Rioja",
    brindadoPor: "",
    socioNombre: "",
    firmanteNombre: "",
    firmanteDni: "",
    firmanteParentesco: "",
    firmanteDomicilio: "",
    firmanteBarrio: "",
    firmanteLocalidad: "",
    firmanteProvincia: "",
    firmanteTelefono: "",
    firmanteCelular: "",
    firmanteDomicilioTrabajo: "",
    firmanteLugarTrabajo: "",
    firmanteEmail: "",
    extintoNombre: "",
    extintoDni: "",
    extintoParentesco: "",
    extintoFechaNac: "",
    extintoSexo: "",
    hospital: "",
    clinica: "",
    sanatorio: "",
    establecimientoNombre: "",
    establecimientoDomicilio: "",
    obraSocial: "",
    mutual: "",
    otrosSeguro: "",
    salaVelatoria: "",
    velatorioDomicilio: "",
    velatorioBarrio: "",
    velatorioHora: "",
    velatorioTelefono: "",
    velatorioLocalidad: "",
    velatorioProvincia: "",
    tipoServicio: "",
    importe: "",
    religiosoDia: "",
    religiosoLugar: "",
    religiosoHora: "",
    cementerio: "",
    cementerioOtro: "",
    cementerioLocalidad: "",
    inhumacionDia: "",
    inhumacionHora: "",
    cocheFunebre: "",
    cocheFunebreUnidad: "",
    cocheFunebreKm: "",
    portacoronasUnidad: "",
    portacoronasKm: "",
    cocheAcompUnidad: "",
    cocheAcompKm: "",
    furgonSanitario: "",
    furgonUnidad: "",
    furgonKm: "",
    velas: "",
    estano: "",
    formol: "",
    codigoCapilla: "",
    lugarDesde: "",
    lugarHasta: "",
    horaSalida: "",
    horaLlegada: "",
    empresaTraslado: "",
    empresaTrasladoNombre: "",
    personal: [
      { nombre: "", desde: "", hasta: "" },
      { nombre: "", desde: "", hasta: "" },
      { nombre: "", desde: "", hasta: "" },
    ],
    ataud: "",
    ataudCodigo: "",
    proveedor: "",
    observaciones: "",
  };
}

export function loadAll(): Solicitud[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedDemo();
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAll(list: Solicitud[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function upsert(s: Solicitud) {
  const all = loadAll();
  const i = all.findIndex((x) => x.id === s.id);
  if (i >= 0) all[i] = s;
  else all.unshift(s);
  saveAll(all);
}

export function remove(id: string) {
  saveAll(loadAll().filter((x) => x.id !== id));
}

function seedDemo(): Solicitud[] {
  const demo: Solicitud[] = [
    {
      ...emptySolicitud(),
      id: "demo-001",
      numeroFactura: "0001-00002370",
      numeroSocio: "12345",
      fecha: "2026-05-20",
      brindadoPor: "Juan Pérez",
      socioNombre: "Familia González",
      firmanteNombre: "María González",
      firmanteDni: "20123456",
      firmanteParentesco: "Hija",
      extintoNombre: "Roberto González",
      extintoDni: "5678901",
      extintoParentesco: "Padre",
      extintoSexo: "M",
      salaVelatoria: "1",
      tipoServicio: "A",
      cementerio: "RENACIMIENTO",
      empresaTraslado: "OMBU",
      hospital: "SI",
    },
    {
      ...emptySolicitud(),
      id: "demo-002",
      numeroFactura: "0001-00002371",
      numeroSocio: "00892",
      fecha: "2026-05-28",
      brindadoPor: "Carlos López",
      socioNombre: "Familia Fernández",
      firmanteNombre: "Lucía Fernández",
      firmanteDni: "30234567",
      firmanteParentesco: "Esposa",
      extintoNombre: "Pedro Fernández",
      extintoSexo: "M",
      salaVelatoria: "2",
      tipoServicio: "B",
      cementerio: "EL_SALVADOR",
      empresaTraslado: "OMBU",
      clinica: "SI",
    },
  ];
  saveAll(demo);
  return demo;
}
