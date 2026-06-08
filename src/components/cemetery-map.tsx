import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
  type PointerEvent,
} from "react";
import { Minus, Plus, Locate, Box, Square, Activity } from "lucide-react";

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
const TEMPLO_W = 180;
const TEMPLO_H = 230;
const ROTONDA_SIZE = 280;
const AVENIDA_Y = 250;
const AVENIDA_H = 18;

interface SectorBox {
  sector: Sector;
  x: number;
  y: number;
  width: number;
  height: number;
}

function boxFor(s: Sector): SectorBox {
  if (s.shape === "landmark") {
    return { sector: s, x: s.x, y: s.y, width: TEMPLO_W, height: TEMPLO_H };
  }
  if (s.shape === "rotonda") {
    return { sector: s, x: s.x, y: s.y, width: ROTONDA_SIZE, height: ROTONDA_SIZE };
  }
  const width = s.cols * (CELL + GAP) - GAP + SECTOR_PADDING_X * 2;
  const height = s.rows * (CELL + GAP) - GAP + SECTOR_PADDING_TOP + SECTOR_PADDING_BOTTOM;
  return { sector: s, x: s.x, y: s.y, width, height };
}

const LAYOUT = (() => {
  const boxes = SECTORS.map(boxFor);
  const totalW = Math.max(...boxes.map((b) => b.x + b.width)) + 40;
  const totalH = Math.max(...boxes.map((b) => b.y + b.height)) + 40;
  return { boxes, totalW, totalH };
})();

function sectorBoxById(id: string): SectorBox | undefined {
  return LAYOUT.boxes.find((b) => b.sector.id === id);
}

type Device = "mobile" | "tablet" | "desktop";

interface DeviceProfile {
  device: Device;
  tilt: number; // grados rotateX
  twist: number; // grados rotateZ
  perspective: number;
  maxScale: number;
  minScale: number;
  fitBoost: number;
}

function profileFor(width: number): DeviceProfile {
  if (width < 640) {
    return { device: "mobile", tilt: 26, twist: 0, perspective: 2200, maxScale: 2.4, minScale: 0.2, fitBoost: 1.0 };
  }
  if (width < 1024) {
    return { device: "tablet", tilt: 32, twist: -1.5, perspective: 1900, maxScale: 2.6, minScale: 0.25, fitBoost: 1.05 };
  }
  return { device: "desktop", tilt: 38, twist: -2, perspective: 1600, maxScale: 3, minScale: 0.3, fitBoost: 1.1 };
}

export function CemeteryMap({ selectedId, onSelect, focusId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Transform vive en refs — evita re-renderizar 700+ nodos en cada drag/wheel.
  const scaleRef = useRef(0.6);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [is3D, setIs3D] = useState(true);
  const is3DRef = useRef(is3D);
  is3DRef.current = is3D;

  const [profile, setProfile] = useState<DeviceProfile>(() =>
    profileFor(typeof window !== "undefined" ? window.innerWidth : 1280),
  );
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [hover, setHover] = useState<{ plot: Plot; x: number; y: number } | null>(null);

  const notifications = useNotifications();
  const liveStats = useMemo(() => {
    const spotsTotal = PLOTS.length * 3;
    const spotsOcc = PLOTS.reduce(
      (n, p) => n + p.spots.filter((s) => s.occupant).length,
      0,
    );
    return {
      total: PLOTS.length,
      occupied: PLOTS.filter((p) => p.status === "occupied").length,
      partial: PLOTS.filter((p) => p.status === "partial").length,
      available: PLOTS.filter((p) => p.status === "available").length,
      occPct: Math.round((spotsOcc / spotsTotal) * 100),
    };
  }, [notifications]);
  const lastEvent = notifications[0];

  const applyTransform = useCallback((animate = false) => {
    const svg = svgRef.current;
    if (!svg) return;
    const p = profileRef.current;
    const tilt = is3DRef.current ? `rotateX(${p.tilt}deg) rotateZ(${p.twist}deg)` : "";
    svg.style.transition = animate ? "transform 300ms ease" : "none";
    svg.style.transform = `translate3d(${txRef.current}px, ${tyRef.current}px, 0) scale(${scaleRef.current}) ${tilt}`;
  }, []);

  const scheduleApply = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform(false);
    });
  }, [applyTransform]);

  const center = useCallback(
    (animate = true) => {
      const el = containerRef.current;
      if (!el) return;
      const { clientWidth, clientHeight } = el;
      const p = profileRef.current;
      // Con tilt 3D la altura aparente se reduce; ajustamos por ancho con boost.
      const fitW = ((clientWidth - 24) / LAYOUT.totalW) * p.fitBoost;
      const fitH = (clientHeight - 24) / (LAYOUT.totalH * 0.7);
      const s = Math.min(Math.max(fitW, fitH * 0.9), p.maxScale);
      const finalScale = Math.max(p.minScale, s);
      scaleRef.current = finalScale;
      txRef.current = (clientWidth - LAYOUT.totalW * finalScale) / 2;
      tyRef.current = (clientHeight - LAYOUT.totalH * finalScale) / 2;
      applyTransform(animate);
    },
    [applyTransform],
  );

  // Inicializar y reescalar al cambiar el tamaño del contenedor.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const next = profileFor(w);
      if (next.device !== profileRef.current.device) {
        profileRef.current = next;
        setProfile(next);
      }
      center(false);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-aplicar transform cuando cambia 3D o el perfil.
  useEffect(() => {
    applyTransform(true);
  }, [is3D, profile, applyTransform]);

  // Focus en plot externo
  useEffect(() => {
    if (!focusId) return;
    const plot = PLOTS.find((p) => p.id === focusId);
    if (!plot) return;
    const box = sectorBoxById(plot.sectorId);
    if (!box) return;
    const el = containerRef.current;
    if (!el) return;
    const px = box.x + SECTOR_PADDING_X + plot.col * (CELL + GAP) + CELL / 2;
    const py = box.y + SECTOR_PADDING_TOP + plot.row * (CELL + GAP) + CELL / 2;
    const newScale = Math.min(profileRef.current.maxScale, 1.6);
    scaleRef.current = newScale;
    txRef.current = el.clientWidth / 2 - px * newScale;
    tyRef.current = el.clientHeight / 2 - py * newScale;
    applyTransform(true);
  }, [focusId, applyTransform]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      const p = profileRef.current;
      const newScale = Math.min(p.maxScale, Math.max(p.minScale, scaleRef.current * (1 + delta)));
      const k = newScale / scaleRef.current;
      txRef.current = mx - (mx - txRef.current) * k;
      tyRef.current = my - (my - tyRef.current) * k;
      scaleRef.current = newScale;
      scheduleApply();
    },
    [scheduleApply],
  );

  const onPointerDown = useCallback((e: PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx: txRef.current, ty: tyRef.current };
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;
      txRef.current = dragRef.current.tx + e.clientX - dragRef.current.x;
      tyRef.current = dragRef.current.ty + e.clientY - dragRef.current.y;
      scheduleApply();
    },
    [scheduleApply],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const el = containerRef.current;
      const p = profileRef.current;
      const newScale = Math.min(p.maxScale, Math.max(p.minScale, scaleRef.current * factor));
      if (el) {
        const cx = el.clientWidth / 2;
        const cy = el.clientHeight / 2;
        const k = newScale / scaleRef.current;
        txRef.current = cx - (cx - txRef.current) * k;
        tyRef.current = cy - (cy - tyRef.current) * k;
      }
      scaleRef.current = newScale;
      applyTransform(true);
    },
    [applyTransform],
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_20%_10%,oklch(0.62_0.18_235/0.08),transparent_60%),radial-gradient(circle_at_80%_90%,oklch(0.42_0.12_250/0.1),transparent_60%)]">
      {/* CSS para resaltar parcelas parciales sin SMIL */}
      <style>{`
        @keyframes plot-pulse { 0%,100% { opacity: .25 } 50% { opacity: .7 } }
        .plot-pulse { animation: plot-pulse 1.8s ease-in-out infinite; }
        .map-svg { will-change: transform; backface-visibility: hidden; }
      `}</style>

      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => zoomBy(1.25)}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => zoomBy(0.8)}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => center(true)}>
          <Locate className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={is3D ? "default" : "secondary"}
          className="glass-strong h-9 w-9"
          onClick={() => setIs3D((v) => !v)}
          title={is3D ? "Vista plana" : "Vista 3D"}
        >
          {is3D ? <Square className="h-4 w-4" /> : <Box className="h-4 w-4" />}
        </Button>
      </div>

      {/* HUD */}
      <div className="glass-strong pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-4 rounded-xl px-4 py-2.5 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ocupación</div>
          <div className="text-lg font-semibold tabular-nums text-foreground">{liveStats.occPct}%</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Libres</div>
            <div className="text-sm font-medium tabular-nums text-[var(--color-success)]">{liveStats.available}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Parc.</div>
            <div className="text-sm font-medium tabular-nums text-[var(--color-warning)]">{liveStats.partial}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ocup.</div>
            <div className="text-sm font-medium tabular-nums text-destructive">{liveStats.occupied}</div>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-border sm:block" />
        <div className="hidden sm:block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vista</div>
          <div className="text-xs font-medium capitalize text-foreground">{profile.device}</div>
        </div>
        {lastEvent && (
          <>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="hidden items-center gap-1.5 md:flex">
              <Activity className="h-3 w-3 animate-pulse text-primary" />
              <div className="max-w-[160px]">
                <div className="truncate text-xs font-medium text-foreground">{lastEvent.title}</div>
                <div className="truncate text-[10px] text-muted-foreground">{lastEvent.description}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="glass-strong absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 rounded-xl px-4 py-2.5 text-xs">
        {[
          ["available", "Disponible"],
          ["partial", "Parcial"],
          ["occupied", "Ocupada"],
          ["reserved", "Reservada"],
        ].map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: statusColor(k as Plot["status"]) }} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          perspective: `${profile.perspective}px`,
          perspectiveOrigin: "50% 25%",
          // Sombra global del plano hecha con box-shadow (mucho más barata que filter:drop-shadow).
          boxShadow: is3D ? "inset 0 -60px 80px -40px rgba(0,0,0,.35)" : undefined,
        }}
      >
        <svg
          ref={svgRef}
          className="map-svg"
          width={LAYOUT.totalW}
          height={LAYOUT.totalH}
          style={{
            transformOrigin: "0 0",
            transformStyle: "preserve-3d",
          }}
        >
          <defs>
            <linearGradient id="sectorBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.26 0.04 250 / 0.9)" />
              <stop offset="100%" stopColor="oklch(0.18 0.03 250 / 0.7)" />
            </linearGradient>
            <linearGradient id="avenida" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.32 0.02 240 / 0.6)" />
              <stop offset="50%" stopColor="oklch(0.45 0.03 240 / 0.7)" />
              <stop offset="100%" stopColor="oklch(0.32 0.02 240 / 0.6)" />
            </linearGradient>
            <radialGradient id="rotondaBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.38 0.05 240 / 0.9)" />
              <stop offset="100%" stopColor="oklch(0.2 0.03 250 / 0.5)" />
            </radialGradient>
            <linearGradient id="temploBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.45 0.08 70 / 0.9)" />
              <stop offset="100%" stopColor="oklch(0.28 0.05 60 / 0.7)" />
            </linearGradient>
          </defs>

          {/* Avenida Principal */}
          <g>
            <rect x={0} y={AVENIDA_Y} width={LAYOUT.totalW} height={AVENIDA_H} fill="url(#avenida)" />
            <line
              x1={0}
              x2={LAYOUT.totalW}
              y1={AVENIDA_Y + AVENIDA_H / 2}
              y2={AVENIDA_Y + AVENIDA_H / 2}
              stroke="oklch(0.85 0.05 240 / 0.4)"
              strokeWidth={0.6}
              strokeDasharray="6 6"
            />
            <text
              x={LAYOUT.totalW / 2}
              y={AVENIDA_Y - 4}
              textAnchor="middle"
              fill="oklch(0.7 0.05 240 / 0.7)"
              fontSize={9}
              style={{ letterSpacing: "0.3em" }}
            >
              AVENIDA PRINCIPAL
            </text>
          </g>

          {LAYOUT.boxes.map((box) => {
            const s = box.sector;

            if (s.shape === "landmark") {
              const w = box.width;
              const h = box.height;
              const naveW = w * 0.55;
              const naveX = (w - naveW) / 2;
              const naveY = h * 0.22;
              const naveH = h * 0.55;
              const apseR = naveW / 2;
              return (
                <g key={s.id} transform={`translate(${box.x},${box.y})`}>
                  <rect width={w} height={h} rx={14} fill="oklch(0.32 0.05 145 / 0.35)" stroke="oklch(0.7 0.1 145 / 0.3)" />
                  <rect x={w / 2 - 8} y={h - 40} width={16} height={36} fill="oklch(0.65 0.02 60 / 0.5)" />
                  {[0.15, 0.85].map((fx, i) => (
                    <g key={i}>
                      <circle cx={w * fx} cy={h * 0.18} r={7} fill="oklch(0.48 0.12 145)" />
                      <circle cx={w * fx} cy={h * 0.82} r={7} fill="oklch(0.48 0.12 145)" />
                    </g>
                  ))}
                  <rect x={naveX} y={naveY} width={naveW} height={naveH} fill="url(#temploBg)" stroke="oklch(0.9 0.06 70 / 0.6)" />
                  <polygon
                    points={`${naveX - 4},${naveY} ${naveX + naveW + 4},${naveY} ${naveX + naveW / 2},${naveY - 18}`}
                    fill="oklch(0.32 0.07 60 / 0.95)"
                  />
                  <path
                    d={`M ${naveX},${naveY + naveH} a ${apseR},${apseR * 0.55} 0 0 0 ${naveW},0`}
                    fill="url(#temploBg)"
                    stroke="oklch(0.9 0.06 70 / 0.6)"
                  />
                  {[0.25, 0.5, 0.75].map((fy) => (
                    <g key={fy}>
                      <rect x={naveX + 6} y={naveY + naveH * fy - 6} width={5} height={12} rx={2} fill="oklch(0.85 0.1 230 / 0.7)" />
                      <rect x={naveX + naveW - 11} y={naveY + naveH * fy - 6} width={5} height={12} rx={2} fill="oklch(0.85 0.1 230 / 0.7)" />
                    </g>
                  ))}
                  <rect x={w / 2 - 9} y={naveY - 46} width={18} height={32} fill="oklch(0.42 0.07 60 / 0.95)" stroke="oklch(0.85 0.06 70 / 0.6)" />
                  <polygon points={`${w / 2 - 12},${naveY - 46} ${w / 2 + 12},${naveY - 46} ${w / 2},${naveY - 64}`} fill="oklch(0.32 0.07 60)" />
                  <g transform={`translate(${w / 2},${naveY - 76})`}>
                    <rect x={-1} y={-8} width={2} height={14} fill="oklch(0.96 0.04 70)" />
                    <rect x={-4} y={-3} width={8} height={2} fill="oklch(0.96 0.04 70)" />
                  </g>
                  <rect x={w / 2 - 5} y={naveY + naveH - 14} width={10} height={14} rx={1} fill="oklch(0.22 0.04 60)" />
                  <text
                    x={w / 2}
                    y={h - 6}
                    textAnchor="middle"
                    fill="oklch(0.95 0.04 70)"
                    fontSize={9}
                    fontWeight={700}
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {s.landmark}
                  </text>
                </g>
              );
            }

            if (s.shape === "rotonda") {
              const cx = box.width / 2;
              const cy = box.height / 2;
              const R = box.width / 2;
              return (
                <g key={s.id} transform={`translate(${box.x},${box.y})`}>
                  <circle cx={cx} cy={cy} r={R} fill="oklch(0.3 0.05 145 / 0.4)" stroke="oklch(0.7 0.1 145 / 0.3)" />
                  <circle cx={cx} cy={cy} r={R - 10} fill="none" stroke="oklch(0.55 0.02 240 / 0.8)" strokeWidth={18} />
                  <circle cx={cx} cy={cy} r={R - 10} fill="none" stroke="oklch(0.85 0.04 240 / 0.5)" strokeWidth={0.6} strokeDasharray="4 5" />
                  {[0, 90, 180, 270].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1={cx + Math.cos(rad) * (R - 30)}
                        y1={cy + Math.sin(rad) * (R - 30)}
                        x2={cx + Math.cos(rad) * R}
                        y2={cy + Math.sin(rad) * R}
                        stroke="oklch(0.6 0.02 240 / 0.75)"
                        strokeWidth={10}
                      />
                    );
                  })}
                  <circle cx={cx} cy={cy} r={R - 45} fill="url(#rotondaBg)" stroke="oklch(1 0 0 / 0.18)" />
                  <rect x={cx - 42} y={cy - 26} width={50} height={32} rx={3} fill="oklch(0.38 0.04 240 / 0.95)" stroke="oklch(1 0 0 / 0.25)" />
                  <polygon points={`${cx - 44},${cy - 26} ${cx + 10},${cy - 26} ${cx - 17},${cy - 34}`} fill="oklch(0.28 0.05 60 / 0.95)" />
                  <text x={cx - 17} y={cy - 12} textAnchor="middle" fill="oklch(0.85 0.02 240)" fontSize={4.5} fontWeight={600}>SALA DE</text>
                  <text x={cx - 17} y={cy - 6} textAnchor="middle" fill="oklch(0.85 0.02 240)" fontSize={4.5} fontWeight={600}>MÁQUINAS</text>
                  <circle cx={cx + 28} cy={cy + 22} r={20} fill="oklch(0.4 0.13 230 / 0.65)" stroke="oklch(0.75 0.18 230 / 0.6)" />
                  <text x={cx + 28} y={cy + 24} textAnchor="middle" fill="oklch(0.95 0.05 230)" fontSize={5} fontWeight={600}>CISTERNA</text>
                  {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={cx + Math.cos(rad) * (R - 22)}
                        cy={cy + Math.sin(rad) * (R - 22)}
                        r={4.5}
                        fill="oklch(0.5 0.12 145)"
                      />
                    );
                  })}
                  <text
                    x={cx}
                    y={20}
                    textAnchor="middle"
                    fill="oklch(0.85 0.04 240)"
                    fontSize={10}
                    fontWeight={700}
                    style={{ letterSpacing: "0.28em" }}
                  >
                    S12 · ROTONDA
                  </text>
                </g>
              );
            }

            const plots = PLOTS.filter((p) => p.sectorId === s.id);
            return (
              <g key={s.id} transform={`translate(${box.x},${box.y})`}>
                <rect width={box.width} height={box.height} rx={10} fill="url(#sectorBg)" stroke="oklch(1 0 0 / 0.12)" />
                <text x={SECTOR_PADDING_X} y={18} fill="oklch(0.85 0.01 240)" fontSize={11} fontWeight={700} style={{ letterSpacing: "0.1em" }}>
                  {s.id.toUpperCase()}
                </text>
                <text x={box.width - SECTOR_PADDING_X} y={18} textAnchor="end" fill="oklch(0.65 0.02 240)" fontSize={8}>
                  {s.rows}×{s.cols}
                </text>
                {Array.from({ length: s.cols }).map((_, c) => (
                  <text
                    key={`fh-${c}`}
                    x={SECTOR_PADDING_X + c * (CELL + GAP) + CELL / 2}
                    y={SECTOR_PADDING_TOP - 4}
                    textAnchor="middle"
                    fill="oklch(0.55 0.02 240)"
                    fontSize={5.5}
                  >
                    F{c + 1}
                  </text>
                ))}
                {plots.map((p) => {
                  const x = SECTOR_PADDING_X + p.col * (CELL + GAP);
                  const y = SECTOR_PADDING_TOP + p.row * (CELL + GAP);
                  const isSelected = selectedId === p.id;
                  return (
                    <g
                      key={p.id}
                      transform={`translate(${x},${y})`}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(p);
                      }}
                      onPointerEnter={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        setHover({ plot: p, x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }}
                      onPointerLeave={() => setHover((h) => (h?.plot.id === p.id ? null : h))}
                    >
                      <rect
                        width={CELL}
                        height={CELL}
                        rx={3}
                        fill={statusColor(p.status)}
                        opacity={isSelected ? 1 : 0.92}
                        stroke={isSelected ? "white" : "oklch(1 0 0 / 0.12)"}
                        strokeWidth={isSelected ? 2 : 1}
                      >
                        <title>{`${p.code} — ${statusLabel(p.status)}`}</title>
                      </rect>
                      {p.status === "partial" && (
                        <rect
                          className="plot-pulse"
                          width={CELL}
                          height={CELL}
                          rx={3}
                          fill="none"
                          stroke="white"
                          strokeWidth={0.8}
                          pointerEvents="none"
                        />
                      )}
                      {p.type === "socio" && (
                        <circle cx={CELL - 3} cy={3} r={2} fill="oklch(0.72 0.18 235)" />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {hover && (
        <div
          className="glass-strong pointer-events-none absolute z-20 min-w-[180px] rounded-lg border border-border px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(hover.x + 14, (containerRef.current?.clientWidth ?? 0) - 200),
            top: Math.min(hover.y + 14, (containerRef.current?.clientHeight ?? 0) - 90),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground">{hover.plot.code}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {hover.plot.type === "socio" ? "Socio" : "Municipal"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor(hover.plot.status) }} />
            <span className="text-foreground">{statusLabel(hover.plot.status)}</span>
          </div>
          <div className="mt-0.5 text-muted-foreground">
            {hover.plot.spots.filter((s) => !s.occupant).length} lugar(es) libre(s) de {hover.plot.spots.length}
          </div>
          {hover.plot.spots.some((s) => !s.occupant) && (
            <div className="mt-1 text-[10px] font-medium text-primary">Click para abrir apertura</div>
          )}
        </div>
      )}
    </div>
  );
}
