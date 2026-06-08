import { useEffect, useMemo, useRef, useState, type WheelEvent, type PointerEvent } from "react";
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

export function CemeteryMap({ selectedId, onSelect, focusId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [is3D, setIs3D] = useState(true);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
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

  const center = () => {
    const el = containerRef.current;
    if (!el) return;
    const { clientWidth, clientHeight } = el;
    // Con la inclinación 3D la altura del plano se reduce ~70%, así que ajustamos al ancho
    // pero permitiendo un zoom inicial más grande y realista.
    const fitW = (clientWidth - 40) / LAYOUT.totalW;
    const fitH = (clientHeight - 40) / (LAYOUT.totalH * 0.75);
    const s = Math.min(Math.max(fitW, fitH * 0.9), 1.6);
    const finalScale = Math.max(0.35, s);
    setScale(finalScale);
    setTx((clientWidth - LAYOUT.totalW * finalScale) / 2);
    setTy((clientHeight - LAYOUT.totalH * finalScale) / 2);
  };

  useEffect(() => {
    center();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const newScale = 1.6;
    setScale(newScale);
    setTx(el.clientWidth / 2 - px * newScale);
    setTy(el.clientHeight / 2 - py * newScale);
  }, [focusId]);

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    const newScale = Math.min(3, Math.max(0.2, scale * (1 + delta)));
    const k = newScale / scale;
    setTx(mx - (mx - tx) * k);
    setTy(my - (my - ty) * k);
    setScale(newScale);
  };

  const onPointerDown = (e: PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + e.clientX - dragRef.current.x);
    setTy(dragRef.current.ty + e.clientY - dragRef.current.y);
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_20%_10%,oklch(0.62_0.18_235/0.08),transparent_60%),radial-gradient(circle_at_80%_90%,oklch(0.42_0.12_250/0.1),transparent_60%)]">
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
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => setScale((s) => Math.min(3, s * 1.2))}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={() => setScale((s) => Math.max(0.2, s / 1.2))}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="glass-strong h-9 w-9" onClick={center}>
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

      {/* Live HUD */}
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
        {lastEvent && (
          <>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-1.5">
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
        <div className="ml-2 h-4 w-px bg-border" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Plano basado en planos originales · Cementerio Parque San Nicolás Renacimiento
        </span>
      </div>

      <div
        ref={containerRef}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ perspective: "1600px", perspectiveOrigin: "50% 25%" }}
      >
        <svg
          width={LAYOUT.totalW}
          height={LAYOUT.totalH}
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale}) ${is3D ? "rotateX(38deg) rotateZ(-2deg)" : ""}`,
            transformOrigin: "0 0",
            transformStyle: "preserve-3d",
            transition: dragRef.current ? "none" : "transform 350ms ease",
            filter: is3D
              ? "drop-shadow(0 30px 45px rgba(0,0,0,0.6))"
              : "drop-shadow(0 8px 16px rgba(0,0,0,0.3))",
          }}
        >
          <defs>
            <linearGradient id="cellHi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="55%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sectorBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.26 0.04 250 / 0.88)" />
              <stop offset="100%" stopColor="oklch(0.18 0.03 250 / 0.65)" />
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
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Avenida Principal — banda horizontal */}
          <g>
            <rect
              x={0}
              y={AVENIDA_Y}
              width={LAYOUT.totalW}
              height={AVENIDA_H}
              fill="url(#avenida)"
              stroke="oklch(1 0 0 / 0.08)"
            />
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
              return (
                <g key={s.id} transform={`translate(${box.x},${box.y})`}>
                  {is3D && (
                    <rect x={4} y={6} width={box.width} height={box.height} rx={10} fill="rgba(0,0,0,0.55)" />
                  )}
                  <rect
                    width={box.width}
                    height={box.height}
                    rx={10}
                    fill="url(#temploBg)"
                    stroke="oklch(0.85 0.08 70 / 0.5)"
                  />
                  {/* cruz simbólica */}
                  <g transform={`translate(${box.width / 2},${box.height / 2})`}>
                    <rect x={-3} y={-30} width={6} height={60} rx={1} fill="oklch(0.95 0.04 70)" opacity={0.8} />
                    <rect x={-16} y={-12} width={32} height={6} rx={1} fill="oklch(0.95 0.04 70)" opacity={0.8} />
                  </g>
                  <text
                    x={box.width / 2}
                    y={box.height - 16}
                    textAnchor="middle"
                    fill="oklch(0.95 0.04 70)"
                    fontSize={11}
                    fontWeight={600}
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {s.landmark}
                  </text>
                </g>
              );
            }

            if (s.shape === "rotonda") {
              const cx = box.width / 2;
              const cy = box.height / 2;
              return (
                <g key={s.id} transform={`translate(${box.x},${box.y})`}>
                  {is3D && (
                    <circle cx={cx + 4} cy={cy + 6} r={box.width / 2} fill="rgba(0,0,0,0.55)" />
                  )}
                  <circle cx={cx} cy={cy} r={box.width / 2} fill="url(#rotondaBg)" stroke="oklch(1 0 0 / 0.18)" />
                  <circle cx={cx} cy={cy} r={box.width / 2 - 18} fill="none" stroke="oklch(1 0 0 / 0.15)" strokeDasharray="3 4" />
                  {/* sala de máquinas */}
                  <rect x={cx - 38} y={cy - 20} width={50} height={30} rx={3} fill="oklch(0.35 0.04 240 / 0.85)" stroke="oklch(1 0 0 / 0.2)" />
                  <text x={cx - 13} y={cy - 2} textAnchor="middle" fill="oklch(0.85 0.02 240)" fontSize={5}>SALA DE MÁQUINAS</text>
                  {/* cisterna */}
                  <circle cx={cx + 25} cy={cy + 25} r={18} fill="oklch(0.4 0.12 230 / 0.55)" stroke="oklch(0.7 0.15 230 / 0.5)" />
                  <text x={cx + 25} y={cy + 27} textAnchor="middle" fill="oklch(0.92 0.04 230)" fontSize={5}>CISTERNA</text>
                  <text
                    x={cx}
                    y={28}
                    textAnchor="middle"
                    fill="oklch(0.85 0.04 240)"
                    fontSize={11}
                    fontWeight={600}
                    style={{ letterSpacing: "0.25em" }}
                  >
                    S12 · ROTONDA
                  </text>
                </g>
              );
            }

            // Grid sector
            const plots = PLOTS.filter((p) => p.sectorId === s.id);
            return (
              <g key={s.id} transform={`translate(${box.x},${box.y})`}>
                {is3D && (
                  <rect x={2} y={4} width={box.width} height={box.height} rx={10} fill="rgba(0,0,0,0.45)" />
                )}
                <rect
                  width={box.width}
                  height={box.height}
                  rx={10}
                  fill="url(#sectorBg)"
                  stroke="oklch(1 0 0 / 0.12)"
                />
                <text x={SECTOR_PADDING_X} y={18} fill="oklch(0.85 0.01 240)" fontSize={11} fontWeight={700} style={{ letterSpacing: "0.1em" }}>
                  {s.id.toUpperCase()}
                </text>
                <text x={box.width - SECTOR_PADDING_X} y={18} textAnchor="end" fill="oklch(0.65 0.02 240)" fontSize={8}>
                  {s.rows}×{s.cols}
                </text>
                {/* file headers F1..Fn */}
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
                      onPointerMove={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        setHover((h) =>
                          h && h.plot.id === p.id
                            ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top }
                            : h,
                        );
                      }}
                      onPointerLeave={() => setHover((h) => (h?.plot.id === p.id ? null : h))}
                    >
                      {is3D && (
                        <rect x={1} y={3} width={CELL} height={CELL} rx={3} fill="rgba(0,0,0,0.55)" />
                      )}
                      <rect
                        width={CELL}
                        height={CELL}
                        rx={3}
                        fill={statusColor(p.status)}
                        opacity={isSelected ? 1 : 0.9}
                        stroke={isSelected ? "white" : "oklch(1 0 0 / 0.12)"}
                        strokeWidth={isSelected ? 2 : 1}
                        filter={isSelected ? "url(#glow)" : undefined}
                      >
                        <title>{`${p.code} — ${statusLabel(p.status)}`}</title>
                      </rect>
                      <rect width={CELL} height={CELL / 2} rx={3} fill="url(#cellHi)" pointerEvents="none" />
                      {p.status === "partial" && (
                        <circle cx={CELL / 2} cy={CELL / 2} r={CELL / 2} fill="none" stroke="white" strokeWidth={0.6} opacity={0.5}>
                          <animate attributeName="r" from={CELL / 4} to={CELL / 1.6} dur="1.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.7" to="0" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {p.type === "socio" && (
                        <circle cx={CELL - 3} cy={3} r={2} fill="oklch(0.72 0.18 235)" stroke="white" strokeWidth={0.5} />
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
