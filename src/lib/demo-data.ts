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
  /** world-coord x in px (left edge of sector bounding box) */
  x: number;
  /** world-coord y in px (top edge of sector bounding box) */
  y: number;
  rows: number;
  cols: number;
  shape?: SectorShape;
  /** descriptive label for landmarks */
  landmark?: string;
}

/**
 * Layout reproduce el plano real del Cementerio Parque San Nicolás Renacimiento:
 *  - Templo Ecuménico al oeste
 *  - S1a / S1b en herradura alrededor del templo
 *  - S1 pequeño junto al templo
 *  - Avenida Principal horizontal en el centro
 *  - S2..S6 al sur de la avenida, S2a..S6a al norte
 *  - S12 rotonda al este (sala de máquinas y cisterna)
 */
export const SECTORS: Sector[] = [
  // Landmarks
  { id: "TEMPLO", name: "Templo Ecuménico", x: 0, y: 110, rows: 0, cols: 0, shape: "landmark", landmark: "TEMPLO ECUMÉNICO" },
  { id: "ROTONDA", name: "Rotonda · Sala de Máquinas", x: 2050, y: 80, rows: 0, cols: 0, shape: "rotonda", landmark: "ROTONDA" },

  // Núcleo oeste — herradura
  { id: "S1a", name: "S1a — Herradura Norte", x: 180, y: 10, rows: 4, cols: 7 },
  { id: "S1b", name: "S1b — Herradura Sur", x: 180, y: 270, rows: 4, cols: 7 },
  { id: "S1",  name: "S1 — Plazoleta", x: 360, y: 165, rows: 2, cols: 2 },

  // Tramo central — norte / sur de la Avenida Principal
  { id: "S2a", name: "S2a — Norte", x: 470, y: 10,  rows: 4, cols: 8 },
  { id: "S2",  name: "S2 — Sur",   x: 470, y: 270, rows: 4, cols: 8 },

  { id: "S3a", name: "S3a — Norte", x: 720, y: 10,  rows: 5, cols: 10 },
  { id: "S3",  name: "S3 — Sur",   x: 720, y: 270, rows: 5, cols: 10 },

  { id: "S4a", name: "S4a — Norte", x: 1020, y: 10,  rows: 6, cols: 12 },
  { id: "S4",  name: "S4 — Sur",   x: 1020, y: 270, rows: 6, cols: 12 },

  { id: "S5a", name: "S5a — Norte", x: 1380, y: 10,  rows: 6, cols: 14 },
  { id: "S5",  name: "S5 — Sur",   x: 1380, y: 270, rows: 6, cols: 14 },

  { id: "S6a", name: "S6a — Norte", x: 1790, y: 10,  rows: 5, cols: 8 },
  { id: "S6",  name: "S6 — Sur",   x: 1790, y: 270, rows: 5, cols: 8 },
];

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

let plotCounter = 0;

function buildPlot(sectorId: string, row: number, col: number, seed: number): Plot {
  plotCounter++;
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

  // Código tipo S4-F3-12 (Sector - Fila - Plot)
  const fileLabel = `F${col + 1}`;
  const code = `${sectorId}-${fileLabel}-${String(row + 1).padStart(2, "0")}`;

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
  plotCounter = 0;
  const out: Plot[] = [];
  let seed = 1;
  for (const s of SECTORS) {
    if (s.shape === "landmark" || s.shape === "rotonda") continue;
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        out.push(buildPlot(s.id, r, c, seed++));
      }
    }
  }
  return out;
})();

export const STATS = {
  total: PLOTS.length,
  municipal: PLOTS.filter((p) => p.type === "municipal").length,
  socio: PLOTS.filter((p) => p.type === "socio").length,
  spotsTotal: PLOTS.length * 3,
  spotsOccupied: PLOTS.reduce(
    (n, p) => n + p.spots.filter((s) => s.occupant).length,
    0,
  ),
  get spotsAvailable() {
    return this.spotsTotal - this.spotsOccupied;
  },
  deceasedCount: PLOTS.reduce(
    (n, p) => n + p.spots.filter((s) => s.occupant).length,
    0,
  ),
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
