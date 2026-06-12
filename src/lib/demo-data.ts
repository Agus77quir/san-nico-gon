export type PlotStatus = "available" | "occupied" | "partial" | "reserved";
export type PlotType = "municipal" | "socio";

export interface Deceased {
  fullName: string;
  dni: string;
  birthDate: string;
  deathDate: string;
  notes?: string;
}

export interface PlotSpot {
  index: 1 | 2 | 3;
  label: string;
  occupant?: Deceased;
}

export interface Holder {
  fullName: string;
  dni: string;
  address: string;
  phone: string;
  email: string;
}

export interface Plot {
  id: string;
  code: string;
  sectorId: string;
  row: number;
  col: number;
  type: PlotType;
  status: PlotStatus;
  spots: PlotSpot[];
  holder?: Holder;
}

export type SectorShape = "grid" | "landmark" | "rotonda";

export interface Sector {
  id: string;
  name: string;
  x: number;
  y: number;
  rows: number;
  cols: number;
  /** cantidad real de parcelas (≤ rows*cols cuando la última fila no está completa) */
  parcelas: number;
  shape?: SectorShape;
  landmark?: string;
}

// --- Layout constants (deben coincidir con cemetery-map.tsx) ---
const CELL = 22;
const GAP = 3;
const PAD_X = 14;
const PAD_TOP = 24;
const PAD_BOT = 8;
const AVENIDA_Y = 560;
const AVENIDA_H = 18;
const SECTOR_VGAP = 18;
const SECTOR_HGAP = 14;

const TEMPLO_W = 220;
const TEMPLO_H = 280;
const ROTONDA_SIZE = 320;

// --- Datos reales del cementerio (PARA AGUSTIN - SISTEMAS.xlsx) ---
// Sectores pareados: norte (A) y sur. 1A/1B y 2A/2 son zonas sin filas formales.
interface SectorRaw {
  id: string;
  rows: number;
  parcelas: number;
  sinFilas?: boolean;
}

const PAIRS: Array<[SectorRaw, SectorRaw]> = [
  [
    { id: "1A", rows: 4, parcelas: 34, sinFilas: true },
    { id: "1B", rows: 4, parcelas: 34, sinFilas: true },
  ],
  [
    { id: "2A", rows: 4, parcelas: 56, sinFilas: true },
    { id: "2", rows: 4, parcelas: 55, sinFilas: true },
  ],
  [{ id: "3A", rows: 14, parcelas: 227 }, { id: "3", rows: 14, parcelas: 225 }],
  [{ id: "4A", rows: 18, parcelas: 370 }, { id: "4", rows: 18, parcelas: 358 }],
  [{ id: "5A", rows: 18, parcelas: 323 }, { id: "5", rows: 18, parcelas: 336 }],
  [{ id: "6A", rows: 18, parcelas: 365 }, { id: "6", rows: 18, parcelas: 325 }],
  [{ id: "7A", rows: 18, parcelas: 342 }, { id: "7", rows: 18, parcelas: 332 }],
  [{ id: "8A", rows: 18, parcelas: 352 }, { id: "8", rows: 18, parcelas: 324 }],
  [{ id: "9A", rows: 18, parcelas: 336 }, { id: "9", rows: 18, parcelas: 291 }],
  [{ id: "10A", rows: 18, parcelas: 333 }, { id: "10", rows: 19, parcelas: 260 }],
  [{ id: "11A", rows: 18, parcelas: 322 }, { id: "11", rows: 18, parcelas: 318 }],
  [{ id: "12A", rows: 14, parcelas: 170 }, { id: "12", rows: 14, parcelas: 159 }],
  [{ id: "13A", rows: 14, parcelas: 187 }, { id: "13", rows: 14, parcelas: 187 }],
  [{ id: "14A", rows: 18, parcelas: 346 }, { id: "14", rows: 18, parcelas: 336 }],
  [{ id: "15A", rows: 18, parcelas: 343 }, { id: "15", rows: 18, parcelas: 354 }],
  [{ id: "16A", rows: 18, parcelas: 340 }, { id: "16", rows: 18, parcelas: 337 }],
  [{ id: "17A", rows: 18, parcelas: 325 }, { id: "17", rows: 18, parcelas: 352 }],
  [{ id: "18A", rows: 18, parcelas: 329 }, { id: "18", rows: 18, parcelas: 337 }],
  [{ id: "19A", rows: 18, parcelas: 323 }, { id: "19", rows: 18, parcelas: 352 }],
  [{ id: "20A", rows: 18, parcelas: 316 }, { id: "20", rows: 18, parcelas: 323 }],
  [{ id: "21A", rows: 18, parcelas: 306 }, { id: "21", rows: 18, parcelas: 333 }],
  [{ id: "22A", rows: 18, parcelas: 312 }, { id: "22", rows: 18, parcelas: 320 }],
  [{ id: "23A", rows: 14, parcelas: 236 }, { id: "23", rows: 14, parcelas: 258 }],
];

function colsFor(rows: number, parcelas: number, sinFilas?: boolean): number {
  if (sinFilas) {
    // Distribución compacta para zonas sin filas formales
    return Math.ceil(parcelas / rows);
  }
  return Math.ceil(parcelas / rows);
}

function sectorWidth(cols: number): number {
  return cols * (CELL + GAP) - GAP + PAD_X * 2;
}
function sectorHeight(rows: number): number {
  return rows * (CELL + GAP) - GAP + PAD_TOP + PAD_BOT;
}

export const SECTORS: Sector[] = (() => {
  const list: Sector[] = [];
  let cursor = 40;

  // Templo (capilla) — al oeste, alineado con la avenida
  list.push({
    id: "TEMPLO",
    name: "Templo Ecuménico",
    x: cursor,
    y: AVENIDA_Y + AVENIDA_H / 2 - TEMPLO_H / 2,
    rows: 0,
    cols: 0,
    parcelas: 0,
    shape: "landmark",
    landmark: "TEMPLO ECUMÉNICO",
  });
  cursor += TEMPLO_W + SECTOR_HGAP * 3;

  for (const [n, s] of PAIRS) {
    const nCols = colsFor(n.rows, n.parcelas, n.sinFilas);
    const sCols = colsFor(s.rows, s.parcelas, s.sinFilas);
    const w = Math.max(sectorWidth(nCols), sectorWidth(sCols));
    const nH = sectorHeight(n.rows);
    const sH = sectorHeight(s.rows);

    list.push({
      id: n.id,
      name: `Sector ${n.id} — Norte`,
      x: cursor,
      y: AVENIDA_Y - SECTOR_VGAP - nH,
      rows: n.rows,
      cols: nCols,
      parcelas: n.parcelas,
    });
    list.push({
      id: s.id,
      name: `Sector ${s.id} — Sur`,
      x: cursor,
      y: AVENIDA_Y + AVENIDA_H + SECTOR_VGAP,
      rows: s.rows,
      cols: sCols,
      parcelas: s.parcelas,
    });
    cursor += w + SECTOR_HGAP;
  }

  // Rotonda (capilla circular 3D) — al este
  cursor += SECTOR_HGAP;
  list.push({
    id: "ROTONDA",
    name: "Rotonda · Capilla",
    x: cursor,
    y: AVENIDA_Y + AVENIDA_H / 2 - ROTONDA_SIZE / 2,
    rows: 0,
    cols: 0,
    parcelas: 0,
    shape: "rotonda",
    landmark: "ROTONDA",
  });

  return list;
})();

// --- Generación de parcelas con datos demo ---

const NAMES = [
  "María González", "Juan Pérez", "Ana Rodríguez", "Carlos López", "Lucía Fernández",
  "Roberto Silva", "Elena Martínez", "Pedro Sánchez", "Sofía Romero", "Diego Torres",
  "Carmen Ruiz", "Miguel Castro", "Laura Vega", "Andrés Morales", "Patricia Herrera",
];

function rand<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function makeDeceased(seed: number): Deceased {
  const name = rand(NAMES, seed);
  const birth = 1920 + (seed % 60);
  const death = birth + 40 + (seed % 40);
  return {
    fullName: name,
    dni: String(10_000_000 + seed * 137).slice(0, 8),
    birthDate: `${birth}-${String((seed % 12) + 1).padStart(2, "0")}-${String((seed % 27) + 1).padStart(2, "0")}`,
    deathDate: `${death}-${String((seed % 12) + 1).padStart(2, "0")}-${String((seed % 27) + 1).padStart(2, "0")}`,
    notes: seed % 5 === 0 ? "Reposa junto a su familia." : undefined,
  };
}

function makeHolder(seed: number): Holder {
  const name = rand(NAMES, seed + 3);
  return {
    fullName: name,
    dni: String(20_000_000 + seed * 211).slice(0, 8),
    address: `Av. San Martín ${100 + (seed % 900)}`,
    phone: `+54 336 ${String(4_000_000 + seed * 31).slice(0, 7)}`,
    email: `${name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "")}@correo.com`,
  };
}

function buildPlot(sectorId: string, row: number, col: number, seed: number): Plot {
  const type: PlotType = seed % 3 === 0 ? "socio" : "municipal";
  const r = seed % 10;
  const occupiedCount = r < 3 ? 0 : r < 6 ? 1 : r < 8 ? 2 : 3;
  const reserved = r === 9 && occupiedCount === 0;

  const spots: PlotSpot[] = [1, 2, 3].map((i) => ({
    index: i as 1 | 2 | 3,
    label: type === "socio" ? `Familiar ${i}` : `Lugar ${i}`,
    occupant: i <= occupiedCount ? makeDeceased(seed * 7 + i) : undefined,
  }));

  const status: PlotStatus =
    reserved
      ? "reserved"
      : occupiedCount === 0
      ? "available"
      : occupiedCount === 3
      ? "occupied"
      : "partial";

  const code = `S${sectorId}-F${row + 1}-${String(col + 1).padStart(2, "0")}`;

  return {
    id: `${sectorId}-${row}-${col}`,
    code,
    sectorId,
    row,
    col,
    type,
    status,
    spots,
    holder: type === "socio" ? makeHolder(seed) : undefined,
  };
}

export const PLOTS: Plot[] = (() => {
  const out: Plot[] = [];
  let seed = 1;
  for (const s of SECTORS) {
    if (s.shape === "landmark" || s.shape === "rotonda") continue;
    let remaining = s.parcelas;
    for (let r = 0; r < s.rows && remaining > 0; r++) {
      for (let c = 0; c < s.cols && remaining > 0; c++) {
        out.push(buildPlot(s.id, r, c, seed++));
        remaining--;
      }
    }
  }
  return out;
})();

export const STATS = {
  get total() { return PLOTS.length; },
  get municipal() { return PLOTS.filter((p) => p.type === "municipal").length; },
  get socio() { return PLOTS.filter((p) => p.type === "socio").length; },
  get spotsTotal() { return PLOTS.length * 3; },
  get spotsOccupied() {
    return PLOTS.reduce((n, p) => n + p.spots.filter((s) => s.occupant).length, 0);
  },
  get spotsAvailable() { return this.spotsTotal - this.spotsOccupied; },
  get deceasedCount() {
    return PLOTS.reduce((n, p) => n + p.spots.filter((s) => s.occupant).length, 0);
  },
};

export function statusColor(s: PlotStatus): string {
  switch (s) {
    case "available":
      return "var(--color-success)";
    case "occupied":
      return "var(--color-destructive)";
    case "partial":
      return "var(--color-warning)";
    case "reserved":
      return "var(--color-muted-foreground)";
  }
}

export function statusLabel(s: PlotStatus): string {
  return {
    available: "Disponible",
    occupied: "Ocupada",
    partial: "Parcialmente ocupada",
    reserved: "Reservada",
  }[s];
}
