import { useState, useMemo } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Plot } from "@/lib/demo-data";

interface Props {
  plot: Plot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
}

export function ApertureDialog({ plot, open, onOpenChange, onConfirm }: Props) {
  const freeSpots = useMemo(
    () => plot.spots.filter((s) => !s.occupant),
    [plot],
  );

  const [spotIndex, setSpotIndex] = useState<string>(
    String(freeSpots[0]?.index ?? 1),
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [operator, setOperator] = useState("");
  const [deceasedName, setDeceasedName] = useState("");
  const [deceasedDni, setDeceasedDni] = useState("");
  const [notes, setNotes] = useState("");
  const [witness, setWitness] = useState(false);
  const [reportFiled, setReportFiled] = useState(true);

  const handleConfirm = () => {
    if (!deceasedName.trim()) {
      toast.error("Ingresá el nombre del fallecido");
      return;
    }
    const spot = plot.spots.find((s) => s.index === Number(spotIndex));
    if (spot) {
      spot.occupant = {
        fullName: deceasedName.trim(),
        dni: deceasedDni.trim() || "—",
        birthDate: "—",
        deathDate: date,
        notes: notes.trim() || undefined,
      };
      const occCount = plot.spots.filter((s) => s.occupant).length;
      plot.status =
        occCount === 0 ? "available" : occCount === 3 ? "occupied" : "partial";
    }
    toast.success(`Apertura registrada en ${plot.code}`, {
      description: `Lugar ${spotIndex} — ${date}`,
    });
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" />
            Apertura de parcela {plot.code}
          </DialogTitle>
          <DialogDescription>
            Registrá la apertura del lugar disponible e indicá el ocupante.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="spot">Lugar disponible</Label>
              <Select value={spotIndex} onValueChange={setSpotIndex}>
                <SelectTrigger id="spot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {freeSpots.map((s) => (
                    <SelectItem key={s.index} value={String(s.index)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha de apertura</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del fallecido</Label>
              <Input
                id="name"
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                placeholder="Nombre y apellido"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                value={deceasedDni}
                onChange={(e) => setDeceasedDni(e.target.value)}
                placeholder="00000000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="operator">Brindado por (operador)</Label>
            <Input
              id="operator"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Nombre del personal interviniente"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles del acto de apertura…"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/40 p-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={witness}
                onCheckedChange={(v) => setWitness(Boolean(v))}
              />
              Presencia de familiar / testigo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={reportFiled}
                onCheckedChange={(v) => setReportFiled(Boolean(v))}
              />
              Acta archivada
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-gradient-brand text-primary-foreground"
          >
            Confirmar apertura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
