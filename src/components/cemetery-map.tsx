import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { Activity, Box, Locate, Minus, Plus, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLOTS, SECTORS, statusColor, statusLabel, type Plot, type Sector } from "@/lib/demo-data";
import { useNotifications } from "@/lib/notifications-store";

interface Props {
  selectedId?: string;
  onSelect: (plot: Plot) => void;
  focusId?: string;
}

const CELL = 22;
const GAP = 3;
const SECTOR_PADDING_X = 14;
const SECTOR_PADDING_TOP = 24;
const SECTOR_PADDING_BOTTOM = 8;
const TEMPLO_W = 220;
const TEMPLO_H = 280;
const ROTONDA_SIZE = 320;
const AVENIDA_Y = 560;
const AVENIDA_H = 18;
const STATUS_ORDER = ["available", "partial", "occupied", "reserved"] as const;

interface SectorBox {
  sector: Sector;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Device = "mobile" | "tablet" | "desktop";

interface DeviceProfile {
  device: Device;
  tilt: number;
  twist: number;
  perspective: number;
  maxScale: number;
  minScale: number;
  fitBoost: number;
}

interface PlotSprite {
  plot: Plot;
  x: number;
  y: number;
}

type MapPalette = Record<Plot["status"], string> & { socio: string };

function boxFor(s: Sector): SectorBox {
  if (s.shape === "landmark") return { sector: s, x: s.x, y: s.y, width: TEMPLO_W, height: TEMPLO_H };
  if (s.shape === "rotonda") return { sector: s, x: s.x, y: s.y, width: ROTONDA_SIZE, height: ROTONDA_SIZE };
  const width = s.cols * (CELL + GAP) - GAP + SECTOR_PADDING_X * 2;
  const height = s.rows * (CELL + GAP) - GAP + SECTOR_PADDING_TOP + SECTOR_PADDING_BOTTOM;
  return { sector: s, x: s.x, y: s.y, width, height };
}

const LAYOUT = (() => {
  const boxes = SECTORS.map(boxFor);
  return {
    boxes,
    gridBoxes: boxes.filter((box) => box.sector.shape !== "landmark" && box.sector.shape !== "rotonda"),
    totalW: Math.max(...boxes.map((b) => b.x + b.width)) + 40,
    totalH: Math.max(...boxes.map((b) => b.y + b.height)) + 40,
  };
})();

const SECTOR_BOX_BY_ID = new Map(LAYOUT.boxes.map((box) => [box.sector.id, box]));
const PLOT_BY_ID = new Map(PLOTS.map((plot) => [plot.id, plot]));

const PLOT_SPRITES = (() => {
  const byStatus = {
    available: [] as PlotSprite[],
    partial: [] as PlotSprite[],
    occupied: [] as PlotSprite[],
    reserved: [] as PlotSprite[],
  };
  const socios: PlotSprite[] = [];

  for (const plot of PLOTS) {
    const box = SECTOR_BOX_BY_ID.get(plot.sectorId);
    if (!box) continue;
    const sprite = {
      plot,
      x: box.x + SECTOR_PADDING_X + plot.col * (CELL + GAP),
      y: box.y + SECTOR_PADDING_TOP + plot.row * (CELL + GAP),
    };
    byStatus[plot.status].push(sprite);
    if (plot.type === "socio") socios.push(sprite);
  }

  return { byStatus, socios };
})();

const BASE_STATS = (() => {
  let occupied = 0;
  let partial = 0;
  let available = 0;
  let spotsOcc = 0;

  for (const plot of PLOTS) {
    if (plot.status === "occupied") occupied++;
    if (plot.status === "partial") partial++;
    if (plot.status === "available") available++;
    for (const spot of plot.spots) if (spot.occupant) spotsOcc++;
  }

  return {
    total: PLOTS.length,
    occupied,
    partial,
    available,
    occPct: Math.round((spotsOcc / (PLOTS.length * 3)) * 100),
  };
})();

function profileFor(width: number): DeviceProfile {
  if (width < 640) return { device: "mobile", tilt: 22, twist: 0, perspective: 2400, maxScale: 2.4, minScale: 0.03, fitBoost: 0.92 };
  if (width < 1024) return { device: "tablet", tilt: 28, twist: -1.5, perspective: 2000, maxScale: 2.6, minScale: 0.04, fitBoost: 0.95 };
  return { device: "desktop", tilt: 34, twist: -2, perspective: 1700, maxScale: 3, minScale: 0.05, fitBoost: 1 };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: { size?: number; color?: string; align?: CanvasTextAlign; weight?: number | string; spacing?: number } = {},
) {
  ctx.save();
  ctx.fillStyle = options.color ?? "rgba(226,232,240,.82)";
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${options.weight ?? 600} ${options.size ?? 10}px Inter, system-ui, sans-serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawChapel(ctx: CanvasRenderingContext2D, box: SectorBox) {
  const { x, y, width: w, height: h } = box;
  const cx = x + w / 2;
  const naveW = w * 0.55;
  const naveX = x + (w - naveW) / 2;
  const naveY = y + h * 0.22;
  const naveH = h * 0.55;

  ctx.save();
  roundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(30,120,80,.28)";
  ctx.strokeStyle = "rgba(110,220,150,.28)";
  ctx.fill();
  ctx.stroke();

  const g = ctx.createLinearGradient(naveX, naveY, naveX + naveW, naveY + naveH);
  g.addColorStop(0, "rgba(176,130,70,.95)");
  g.addColorStop(1, "rgba(94,67,42,.9)");
  ctx.fillStyle = g;
  ctx.strokeStyle = "rgba(250,220,160,.55)";
  ctx.lineWidth = 1;
  ctx.fillRect(naveX, naveY, naveW, naveH);
  ctx.strokeRect(naveX, naveY, naveW, naveH);

  ctx.beginPath();
  ctx.moveTo(naveX - 4, naveY);
  ctx.lineTo(naveX + naveW + 4, naveY);
  ctx.lineTo(cx, naveY - 18);
  ctx.closePath();
  ctx.fillStyle = "rgba(72,48,35,.96)";
  ctx.fill();

  ctx.fillStyle = "rgba(135,205,255,.62)";
  for (const fy of [0.25, 0.5, 0.75]) {
    ctx.fillRect(naveX + 6, naveY + naveH * fy - 6, 5, 12);
    ctx.fillRect(naveX + naveW - 11, naveY + naveH * fy - 6, 5, 12);
  }

  ctx.fillStyle = "rgba(240,220,170,.95)";
  ctx.fillRect(cx - 1, naveY - 84, 2, 14);
  ctx.fillRect(cx - 4, naveY - 79, 8, 2);
  drawText(ctx, box.sector.landmark ?? "TEMPLO", cx, y + h - 8, { size: 9, align: "center", color: "rgba(255,241,210,.95)", weight: 700 });
  ctx.restore();
}

function drawRotonda(ctx: CanvasRenderingContext2D, box: SectorBox) {
  const { x, y, width } = box;
  const cx = x + width / 2;
  const cy = y + width / 2;
  const r = width / 2;
  const bodyW = r * 0.95;
  const bodyH = r * 0.55;
  const topY = cy - bodyH * 0.15;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(39,120,80,.42)";
  ctx.strokeStyle = "rgba(125,220,150,.32)";
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 22, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(115,125,135,.78)";
  ctx.lineWidth = 14;
  ctx.stroke();

  const body = ctx.createRadialGradient(cx - 35, topY + 10, 12, cx, topY + 35, bodyW);
  body.addColorStop(0, "rgba(222,190,125,1)");
  body.addColorStop(0.58, "rgba(145,103,58,1)");
  body.addColorStop(1, "rgba(65,46,35,1)");

  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(cx + 8, cy + bodyH * 0.55 + 6, bodyW * 0.5, bodyW * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(cx - bodyW / 2, topY, bodyW, bodyH, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(40,25,18,.85)";
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, topY, bodyW / 2, bodyW * 0.42, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  const dome = ctx.createRadialGradient(cx - 35, topY - 45, 8, cx, topY, bodyW * 0.7);
  dome.addColorStop(0, "rgba(255,239,185,1)");
  dome.addColorStop(0.55, "rgba(190,145,72,1)");
  dome.addColorStop(1, "rgba(92,62,35,1)");
  ctx.fillStyle = dome;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(245,230,180,.95)";
  ctx.fillRect(cx - 1, topY - bodyW * 0.42 - 24, 2, 14);
  ctx.fillRect(cx - 4, topY - bodyW * 0.42 - 19, 8, 2);
  drawText(ctx, "CAPILLA · ROTONDA", cx, y + 22, { size: 11, align: "center", color: "rgba(230,235,245,.92)", weight: 700 });
  ctx.restore();
}

function drawBaseMap(ctx: CanvasRenderingContext2D, palette: MapPalette) {
  ctx.clearRect(0, 0, LAYOUT.totalW, LAYOUT.totalH);

  ctx.fillStyle = "rgba(68,78,90,.68)";
  ctx.fillRect(0, AVENIDA_Y, LAYOUT.totalW, AVENIDA_H);
  ctx.strokeStyle = "rgba(230,235,245,.4)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, AVENIDA_Y + AVENIDA_H / 2);
  ctx.lineTo(LAYOUT.totalW, AVENIDA_Y + AVENIDA_H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  drawText(ctx, "AVENIDA PRINCIPAL", LAYOUT.totalW / 2, AVENIDA_Y - 4, { size: 9, align: "center", color: "rgba(180,195,215,.72)", weight: 700 });

  for (const box of LAYOUT.boxes) {
    const s = box.sector;
    if (s.shape === "landmark") {
      drawChapel(ctx, box);
      continue;
    }
    if (s.shape === "rotonda") {
      drawRotonda(ctx, box);
      continue;
    }

    const bg = ctx.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height);
    bg.addColorStop(0, "rgba(30,44,70,.94)");
    bg.addColorStop(1, "rgba(18,31,50,.86)");
    roundedRect(ctx, box.x, box.y, box.width, box.height, 10);
    ctx.fillStyle = bg;
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.fill();
    ctx.stroke();
    drawText(ctx, s.id.toUpperCase(), box.x + SECTOR_PADDING_X, box.y + 18, { size: 11, color: "rgba(220,225,235,.9)", weight: 700 });
    drawText(ctx, `${s.rows}×${s.cols}`, box.x + box.width - SECTOR_PADDING_X, box.y + 18, { size: 8, align: "right", color: "rgba(170,180,195,.7)", weight: 600 });
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  for (const status of STATUS_ORDER) {
    ctx.fillStyle = palette[status];
    for (const item of PLOT_SPRITES.byStatus[status]) {
      roundedRect(ctx, item.x, item.y, CELL, CELL, 3);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.fillStyle = palette.socio;
  for (const item of PLOT_SPRITES.socios) {
    ctx.beginPath();
    ctx.arc(item.x + CELL - 3, item.y + 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function plotAtMapPoint(x: number, y: number): Plot | undefined {
  for (const box of LAYOUT.gridBoxes) {
    if (x < box.x || y < box.y || x > box.x + box.width || y > box.y + box.height) continue;
    const localX = x - box.x - SECTOR_PADDING_X;
    const localY = y - box.y - SECTOR_PADDING_TOP;
    if (localX < 0 || localY < 0) return undefined;
    const step = CELL + GAP;
    const col = Math.floor(localX / step);
    const row = Math.floor(localY / step);
    if (col < 0 || row < 0 || col >= box.sector.cols || row >= box.sector.rows) return undefined;
    if (localX - col * step > CELL || localY - row * step > CELL) return undefined;
    return PLOT_BY_ID.get(`${box.sector.id}-${row}-${col}`);
  }
  return undefined;
}

export function CemeteryMap({ selectedId, onSelect, focusId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef(0.6);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const didDragRef = useRef(false);
  const is3DRef = useRef(true);
  const [is3D, setIs3D] = useState(true);
  const [profile, setProfile] = useState<DeviceProfile>(() => profileFor(1280));
  const profileRef = useRef(profile);
  const [hover, setHover] = useState<{ plot: Plot; x: number; y: number } | null>(null);
  const notifications = useNotifications();
  const lastEvent = notifications[0];

  profileRef.current = profile;
  is3DRef.current = is3D;

  const applyTransform = useCallback((animate = false) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const p = profileRef.current;
    const tilt = is3DRef.current ? `rotateX(${p.tilt}deg) rotateZ(${p.twist}deg)` : "";
    viewport.style.transition = animate ? "transform 300ms ease" : "none";
    viewport.style.transform = `translate3d(${txRef.current}px, ${tyRef.current}px, 0) scale(${scaleRef.current}) ${tilt}`;
  }, []);

  const scheduleApply = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform(false);
    });
  }, [applyTransform]);

  const center = useCallback((animate = true) => {
    const el = containerRef.current;
    if (!el) return;
    const p = profileRef.current;
    const pad = 24;
    // Cuando hay tilt 3D, la altura proyectada se reduce ~cos(tilt)
    const tiltFactor = is3DRef.current ? Math.cos((p.tilt * Math.PI) / 180) : 1;
    const fitW = (el.clientWidth - pad) / LAYOUT.totalW;
    const fitH = (el.clientHeight - pad) / (LAYOUT.totalH * tiltFactor);
    const nextScale = Math.max(p.minScale, Math.min(Math.min(fitW, fitH) * p.fitBoost, p.maxScale));
    scaleRef.current = nextScale;
    txRef.current = (el.clientWidth - LAYOUT.totalW * nextScale) / 2;
    tyRef.current = (el.clientHeight - LAYOUT.totalH * nextScale * tiltFactor) / 2;
    applyTransform(animate);
  }, [applyTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = 1;
    canvas.width = Math.round(LAYOUT.totalW * dpr);
    canvas.height = Math.round(LAYOUT.totalH * dpr);
    canvas.style.width = `${LAYOUT.totalW}px`;
    canvas.style.height = `${LAYOUT.totalH}px`;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const styles = getComputedStyle(document.documentElement);
    const palette: MapPalette = {
      available: styles.getPropertyValue("--map-available").trim() || "rgb(34, 197, 94)",
      partial: styles.getPropertyValue("--map-partial").trim() || "rgb(245, 158, 11)",
      occupied: styles.getPropertyValue("--map-occupied").trim() || "rgb(244, 63, 94)",
      reserved: styles.getPropertyValue("--map-reserved").trim() || "rgb(148, 163, 184)",
      socio: styles.getPropertyValue("--map-socio").trim() || "rgb(14, 165, 233)",
    };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBaseMap(ctx, palette);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const next = profileFor(el.clientWidth);
      if (next.device !== profileRef.current.device) setProfile(next);
      center(false);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [center]);

  useEffect(() => {
    applyTransform(true);
  }, [is3D, profile, applyTransform]);

  useEffect(() => {
    if (!focusId) return;
    const plot = PLOT_BY_ID.get(focusId);
    if (!plot) return;
    const box = SECTOR_BOX_BY_ID.get(plot.sectorId);
    const el = containerRef.current;
    if (!box || !el) return;
    const px = box.x + SECTOR_PADDING_X + plot.col * (CELL + GAP) + CELL / 2;
    const py = box.y + SECTOR_PADDING_TOP + plot.row * (CELL + GAP) + CELL / 2;
    const nextScale = Math.min(profileRef.current.maxScale, 1.6);
    scaleRef.current = nextScale;
    txRef.current = el.clientWidth / 2 - px * nextScale;
    tyRef.current = el.clientHeight / 2 - py * nextScale;
    applyTransform(true);
  }, [focusId, applyTransform]);

  const clientToMapPoint = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left - txRef.current) / scaleRef.current,
      y: (clientY - rect.top - tyRef.current) / scaleRef.current,
      localX: clientX - rect.left,
      localY: clientY - rect.top,
    };
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const p = profileRef.current;
    const nextScale = Math.min(p.maxScale, Math.max(p.minScale, scaleRef.current * (1 - e.deltaY * 0.0015)));
    const k = nextScale / scaleRef.current;
    txRef.current = mx - (mx - txRef.current) * k;
    tyRef.current = my - (my - tyRef.current) * k;
    scaleRef.current = nextScale;
    scheduleApply();
  }, [scheduleApply]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx: txRef.current, ty: tyRef.current };
    didDragRef.current = false;
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      if (!didDragRef.current && dx * dx + dy * dy > 16) didDragRef.current = true;
      txRef.current = dragRef.current.tx + dx;
      tyRef.current = dragRef.current.ty + dy;
      scheduleApply();
      return;
    }

    const point = clientToMapPoint(e.clientX, e.clientY);
    const plot = point ? plotAtMapPoint(point.x, point.y) : undefined;
    if (!plot || !point) {
      setHover((h) => (h ? null : h));
      return;
    }
    setHover((h) => (h?.plot.id === plot.id ? h : { plot, x: point.localX, y: point.localY }));
  }, [clientToMapPoint, scheduleApply]);

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (didDragRef.current) return;
    const point = clientToMapPoint(e.clientX, e.clientY);
    const plot = point ? plotAtMapPoint(point.x, point.y) : undefined;
    if (plot) onSelect(plot);
  }, [clientToMapPoint, onSelect]);

  const zoomBy = useCallback((factor: number) => {
    const el = containerRef.current;
    const p = profileRef.current;
    const nextScale = Math.min(p.maxScale, Math.max(p.minScale, scaleRef.current * factor));
    if (el) {
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      const k = nextScale / scaleRef.current;
      txRef.current = cx - (cx - txRef.current) * k;
      tyRef.current = cy - (cy - tyRef.current) * k;
    }
    scaleRef.current = nextScale;
    applyTransform(true);
  }, [applyTransform]);

  const selectedPlot = selectedId ? PLOT_BY_ID.get(selectedId) : undefined;
  const selectedBox = selectedPlot ? SECTOR_BOX_BY_ID.get(selectedPlot.sectorId) : undefined;

  return (
    <div className="relative h-full w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_20%_10%,oklch(0.62_0.18_235/0.08),transparent_60%),radial-gradient(circle_at_80%_90%,oklch(0.42_0.12_250/0.1),transparent_60%)]">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => zoomBy(1.25)}><Plus className="h-4 w-4" /></Button>
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => zoomBy(0.8)}><Minus className="h-4 w-4" /></Button>
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => center(true)}><Locate className="h-4 w-4" /></Button>
        <Button size="icon" variant={is3D ? "default" : "secondary"} className="glass-strong h-9 w-9" onClick={() => setIs3D((v) => !v)} title={is3D ? "Vista plana" : "Vista 3D"}>
          {is3D ? <Square className="h-4 w-4" /> : <Box className="h-4 w-4" />}
        </Button>
      </div>

      <div className="glass-strong pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-4 rounded-xl px-4 py-2.5 text-xs">
        <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ocupación</div><div className="text-lg font-semibold tabular-nums text-foreground">{BASE_STATS.occPct}%</div></div>
        <div className="h-8 w-px bg-border" />
        <div className="flex gap-3">
          <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Libres</div><div className="text-sm font-medium tabular-nums text-[var(--color-success)]">{BASE_STATS.available}</div></div>
          <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Parc.</div><div className="text-sm font-medium tabular-nums text-[var(--color-warning)]">{BASE_STATS.partial}</div></div>
          <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ocup.</div><div className="text-sm font-medium tabular-nums text-destructive">{BASE_STATS.occupied}</div></div>
        </div>
        <div className="hidden h-8 w-px bg-border sm:block" />
        <div className="hidden sm:block"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vista</div><div className="text-xs font-medium capitalize text-foreground">{profile.device}</div></div>
        {lastEvent && <><div className="hidden h-8 w-px bg-border md:block" /><div className="hidden items-center gap-1.5 md:flex"><Activity className="h-3 w-3 animate-pulse text-primary" /><div className="max-w-[160px]"><div className="truncate text-xs font-medium text-foreground">{lastEvent.title}</div><div className="truncate text-[10px] text-muted-foreground">{lastEvent.description}</div></div></div></>}
      </div>

      <div className="glass-strong absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 rounded-xl px-4 py-2.5 text-xs">
        {[["available", "Disponible"], ["partial", "Parcial"], ["occupied", "Ocupada"], ["reserved", "Reservada"]].map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: statusColor(k as Plot["status"]) }} /><span className="text-muted-foreground">{label}</span></div>
        ))}
      </div>

      <div
        ref={containerRef}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current = null; }}
        onPointerLeave={() => setHover(null)}
        style={{ perspective: `${profile.perspective}px`, perspectiveOrigin: "50% 25%", boxShadow: is3D ? "inset 0 -60px 80px -40px rgba(0,0,0,.35)" : undefined }}
      >
        <div ref={viewportRef} className="absolute left-0 top-0" style={{ width: LAYOUT.totalW, height: LAYOUT.totalH, transformOrigin: "0 0", transformStyle: "preserve-3d", willChange: "transform", backfaceVisibility: "hidden" }}>
          <canvas ref={canvasRef} className="map-canvas" />
          {selectedPlot && selectedBox && (
            <div
              className="pointer-events-none absolute border-2 border-foreground"
              style={{
                width: CELL,
                height: CELL,
                left: selectedBox.x + SECTOR_PADDING_X + selectedPlot.col * (CELL + GAP),
                top: selectedBox.y + SECTOR_PADDING_TOP + selectedPlot.row * (CELL + GAP),
                borderRadius: 3,
              }}
            />
          )}
        </div>
      </div>

      {hover && (
        <div className="glass-strong pointer-events-none absolute z-20 min-w-[180px] rounded-lg border border-border px-3 py-2 text-xs shadow-lg" style={{ left: Math.min(hover.x + 14, (containerRef.current?.clientWidth ?? 0) - 200), top: Math.min(hover.y + 14, (containerRef.current?.clientHeight ?? 0) - 90) }}>
          <div className="flex items-center justify-between gap-2"><span className="font-semibold text-foreground">{hover.plot.code}</span><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hover.plot.type === "socio" ? "Socio" : "Municipal"}</span></div>
          <div className="mt-1 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: statusColor(hover.plot.status) }} /><span className="text-foreground">{statusLabel(hover.plot.status)}</span></div>
          <div className="mt-0.5 text-muted-foreground">{hover.plot.spots.filter((s) => !s.occupant).length} lugar(es) libre(s) de {hover.plot.spots.length}</div>
          {hover.plot.spots.some((s) => !s.occupant) && <div className="mt-1 text-[10px] font-medium text-primary">Click para abrir apertura</div>}
        </div>
      )}
    </div>
  );
}