import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, MapPin } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLOTS } from "@/lib/demo-data";

export const Route = createFileRoute("/fallecidos")({
  head: () => ({
    meta: [
      { title: "Fallecidos · San Nicolás Renacimiento" },
      { name: "description", content: "Registro de fallecidos del cementerio." },
    ],
  }),
  component: FallecidosPage,
});

function FallecidosPage() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const out: {
      plotCode: string;
      sectorId: string;
      spotLabel: string;
      name: string;
      dni: string;
      birth: string;
      death: string;
    }[] = [];
    for (const p of PLOTS) {
      for (const s of p.spots) {
        if (s.occupant) {
          out.push({
            plotCode: p.code,
            sectorId: p.sectorId,
            spotLabel: s.label,
            name: s.occupant.fullName,
            dni: s.occupant.dni,
            birth: s.occupant.birthDate,
            death: s.occupant.deathDate,
          });
        }
      }
    }
    const query = q.trim().toLowerCase();
    return out.filter(
      (r) =>
        !query ||
        r.name.toLowerCase().includes(query) ||
        r.dni.includes(query) ||
        r.plotCode.toLowerCase().includes(query),
    );
  }, [q]);

  return (
    <AppShell
      title="Fallecidos"
      subtitle={`${rows.length} registros`}
      actions={
        <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Nuevo registro
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, DNI o parcela…"
            className="h-9 pl-9"
          />
        </div>

        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nombre y apellido</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Nacimiento</TableHead>
                <TableHead>Fallecimiento</TableHead>
                <TableHead>Ubicación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 100).map((r, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.dni}</TableCell>
                  <TableCell className="text-muted-foreground">{r.birth}</TableCell>
                  <TableCell className="text-muted-foreground">{r.death}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border">
                      <MapPin className="mr-1 h-3 w-3" />
                      {r.plotCode} · {r.spotLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > 100 && (
            <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
              Mostrando primeros 100 de {rows.length} registros
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
