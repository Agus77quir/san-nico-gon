import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLOTS, statusColor, statusLabel } from "@/lib/demo-data";

export const Route = createFileRoute("/parcelas")({
  head: () => ({
    meta: [
      { title: "Parcelas · San Nicolás Renacimiento" },
      { name: "description", content: "Listado completo de parcelas del cementerio." },
    ],
  }),
  component: ParcelasPage,
});

function ParcelasPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "municipal" | "socio">("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PLOTS.filter((p) => {
      if (tab !== "all" && p.type !== tab) return false;
      if (!query) return true;
      return (
        p.code.toLowerCase().includes(query) ||
        p.holder?.fullName.toLowerCase().includes(query) ||
        p.spots.some((s) => s.occupant?.fullName.toLowerCase().includes(query))
      );
    });
  }, [q, tab]);

  return (
    <AppShell
      title="Parcelas"
      subtitle={`${filtered.length} de ${PLOTS.length}`}
      actions={
        <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Nueva parcela
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="glass">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="municipal">Municipales</TabsTrigger>
              <TabsTrigger value="socio">De socios</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar parcela, titular, fallecido…"
              className="h-9 pl-9"
            />
          </div>
        </div>

        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead className="text-right">Ocupación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((p) => {
                const occ = p.spots.filter((s) => s.occupant).length;
                return (
                  <TableRow key={p.id} className="border-border">
                    <TableCell className="font-medium">{p.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-accent/40">
                        {p.type === "socio" ? "Socio" : "Municipal"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: statusColor(p.status) }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {statusLabel(p.status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.sectorId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.holder?.fullName ?? <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {occ}/3
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > 100 && (
            <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
              Mostrando primeras 100 de {filtered.length} parcelas
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
