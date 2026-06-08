import { useState } from "react";
import { X, User, MapPin, Phone, Mail, Home, FileText, Camera, CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApertureDialog } from "@/components/aperture-dialog";
import {
  statusColor,
  statusLabel,
  type Plot,
} from "@/lib/demo-data";

interface Props {
  plot: Plot | null;
  onClose: () => void;
}

export function PlotDetailPanel({ plot, onClose }: Props) {
  const [apertureOpen, setApertureOpen] = useState(false);
  if (!plot) {
    return (
      <aside className="glass hidden h-full w-[320px] shrink-0 flex-col items-center justify-center rounded-2xl p-8 text-center md:flex">
        <div className="rounded-full bg-accent/30 p-4">
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-foreground">
          Selecciona una parcela
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Haz clic en cualquier celda del plano para ver su información.
        </p>
      </aside>
    );
  }

  return (
    <aside className="glass flex h-full w-full shrink-0 flex-col rounded-2xl md:w-[320px]">
      {/* Header */}
      <div className="relative overflow-hidden rounded-t-2xl border-b border-border p-5">
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: `linear-gradient(135deg, ${statusColor(plot.status)}, transparent 70%)` }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Parcela
            </div>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
              {plot.code}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="border-border bg-card/50 text-foreground"
                style={{ borderColor: statusColor(plot.status) }}
              >
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: statusColor(plot.status) }}
                />
                {statusLabel(plot.status)}
              </Badge>
              <Badge variant="secondary" className="bg-accent/50">
                {plot.type === "socio" ? "Socio" : "Municipal"}
              </Badge>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-5">
          {/* Holder */}
          {plot.holder && (
            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Titular Responsable
              </h3>
              <div className="space-y-2 rounded-xl border border-border bg-card/40 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <User className="h-3.5 w-3.5 text-primary" />
                  {plot.holder.fullName}
                </div>
                <div className="text-xs text-muted-foreground">
                  DNI {plot.holder.dni}
                </div>
                <Separator className="my-1" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Home className="h-3 w-3" /> {plot.holder.address}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {plot.holder.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {plot.holder.email}
                </div>
              </div>
            </section>
          )}

          {/* Spots */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Lugares
            </h3>
            <div className="space-y-2">
              {plot.spots.map((spot) => (
                <div
                  key={spot.index}
                  className="rounded-xl border border-border bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-foreground">
                      {spot.label}
                    </div>
                    <Badge
                      variant="outline"
                      className="h-5 text-[10px]"
                      style={{
                        borderColor: spot.occupant
                          ? "var(--color-destructive)"
                          : "var(--color-success)",
                        color: spot.occupant
                          ? "var(--color-destructive)"
                          : "var(--color-success)",
                      }}
                    >
                      {spot.occupant ? "Ocupado" : "Disponible"}
                    </Badge>
                  </div>
                  {spot.occupant && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2 text-xs">
                      <div className="font-medium text-foreground">
                        {spot.occupant.fullName}
                      </div>
                      <div className="text-muted-foreground">
                        DNI {spot.occupant.dni}
                      </div>
                      <div className="text-muted-foreground">
                        {spot.occupant.birthDate} — {spot.occupant.deathDate}
                      </div>
                      {spot.occupant.notes && (
                        <div className="italic text-muted-foreground/80">
                          "{spot.occupant.notes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Documentos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-auto justify-start py-2.5">
                <Camera className="mr-2 h-3.5 w-3.5" /> Fotografías
              </Button>
              <Button variant="outline" size="sm" className="h-auto justify-start py-2.5">
                <FileText className="mr-2 h-3.5 w-3.5" /> Certificados
              </Button>
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t border-border p-4">
        {plot.spots.some((s) => !s.occupant) && (
          <Button
            onClick={() => setApertureOpen(true)}
            className="w-full bg-gradient-brand text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Abrir apertura ({plot.spots.filter((s) => !s.occupant).length} libre
            {plot.spots.filter((s) => !s.occupant).length > 1 ? "s" : ""})
          </Button>
        )}
        <Button variant="outline" className="w-full">
          Editar parcela
        </Button>
      </div>
      <ApertureDialog
        plot={plot}
        open={apertureOpen}
        onOpenChange={setApertureOpen}
      />
    </aside>
  );
}
