import { useEffect, useRef, useState, type WheelEvent, type PointerEvent } from "react";
import { Minus, Plus, Locate } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLOTS, SECTORS, statusColor, statusLabel, type Plot } from "@/lib/demo-data";

interface Props {
  selectedId?: string;
  onSelect: (plot: Plot) => void;
  focusId?: string;
}

const CELL = 26;
const GAP = 4;
const SECTOR_PADDING = 28;
const SECTOR_GAP = 60;

interface LaidOutSector {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const LAYOUT = (() => {
  // 2x2 layout of sectors
  const sectors: LaidOutSector[] = [];
  let rowY = 0;
  let rowHeight = 0;
  let colX = 0;
  const perRow = 2;
  SECTORS.forEach((s, i) => {
    const w = s.cols * (CELL + GAP) - GAP + SECTOR_PADDING * 2;
    const h = s.rows * (CELL + GAP) - GAP + SECTOR_PADDING * 2 + 24;
    if (i % perRow === 0 && i !== 0) {
      rowY += rowHeight + SECTOR_GAP;
      rowHeight = 0;
      colX = 0;
    }
    sectors.push({ id: s.id, name: s.name, x: colX, y: rowY, width: w, height: h });
    colX += w + SECTOR_GAP;
    rowHeight = Math.max(rowHeight, h);
  });
  const totalW = Math.max(...sectors.map((s) => s.x + s.width));
  const totalH = Math.max(...sectors.map((s) => s.y + s.height));
  return { sectors, totalW, totalH };
})();

export function CemeteryMap({ selectedId, onSelect, focusId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.9);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const [hover, setHover] = useState<{ plot: Plot; x: number; y: number } | null>(null);

  const center = () => {
    const el = containerRef.current;
    if (!el) return;
    const { clientWidth, clientHeight } = el;
    const s = Math.min(
      (clientWidth - 80) / LAYOUT.totalW,
      (clientHeight - 80) / LAYOUT.totalH,
      1.2,
    );
    setScale(Math.max(0.4, s));
    setTx((clientWidth - LAYOUT.totalW * s) / 2);
    setTy((clientHeight - LAYOUT.totalH * s) / 2);
  };

  useEffect(() => {
    center();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus on a plot when requested (from search)
  useEffect(() => {
    if (!focusId) return;
    const plot = PLOTS.find((p) => p.id === focusId);
    if (!plot) return;
    const sector = LAYOUT.sectors.find((s) => s.id === plot.sectorId);
    if (!sector) return;
    const el = containerRef.current;
    if (!el) return;
    const px = sector.x + SECTOR_PADDING + plot.col * (CELL + GAP) + CELL / 2;
    const py = sector.y + SECTOR_PADDING + 24 + plot.row * (CELL + GAP) + CELL / 2;
    const newScale = 1.4;
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
    const newScale = Math.min(2.5, Math.max(0.3, scale * (1 + delta)));
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
      {/* Grid backdrop */}
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
        <Button
          size="icon"
          variant="secondary"
          className="glass-strong h-9 w-9"
          onClick={() => setScale((s) => Math.min(2.5, s * 1.2))}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="glass-strong h-9 w-9"
          onClick={() => setScale((s) => Math.max(0.3, s / 1.2))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="glass-strong h-9 w-9"
          onClick={center}
        >
          <Locate className="h-4 w-4" />
        </Button>
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
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: statusColor(k as Plot["status"]) }}
            />
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
      >
        <svg
          width={LAYOUT.totalW}
          height={LAYOUT.totalH}
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: dragRef.current ? "none" : "transform 250ms ease",
          }}
        >
          {LAYOUT.sectors.map((sector) => {
            const meta = SECTORS.find((s) => s.id === sector.id)!;
            const plots = PLOTS.filter((p) => p.sectorId === sector.id);
            return (
              <g key={sector.id} transform={`translate(${sector.x},${sector.y})`}>
                <rect
                  x={0}
                  y={0}
                  width={sector.width}
                  height={sector.height}
                  rx={14}
                  fill="oklch(0.22 0.03 250 / 0.5)"
                  stroke="oklch(1 0 0 / 0.08)"
                />
                <text
                  x={SECTOR_PADDING}
                  y={20}
                  fill="oklch(0.85 0.01 240)"
                  fontSize={12}
                  fontWeight={600}
                  style={{ letterSpacing: "0.05em" }}
                >
                  {meta.name.toUpperCase()}
                </text>
                {plots.map((p) => {
                  const x = SECTOR_PADDING + p.col * (CELL + GAP);
                  const y = SECTOR_PADDING + 24 + p.row * (CELL + GAP);
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
                        setHover({
                          plot: p,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
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
                      <rect
                        width={CELL}
                        height={CELL}
                        rx={4}
                        fill={statusColor(p.status)}
                        opacity={isSelected ? 1 : 0.82}
                        stroke={isSelected ? "white" : "oklch(1 0 0 / 0.1)"}
                        strokeWidth={isSelected ? 2 : 1}
                      >
                        <title>{`${p.code} — ${p.type === "socio" ? "Socio" : "Municipal"}`}</title>
                      </rect>
                      {p.type === "socio" && (
                        <circle
                          cx={CELL - 4}
                          cy={4}
                          r={2.5}
                          fill="oklch(0.72 0.18 235)"
                          stroke="white"
                          strokeWidth={0.5}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
