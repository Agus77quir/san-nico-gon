import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";

import { AppShell } from "@/components/app-shell";
import { CemeteryMap } from "@/components/cemetery-map";
import { PlotDetailPanel } from "@/components/plot-detail-panel";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PLOTS, type Plot } from "@/lib/demo-data";

export const Route = createFileRoute("/plano")({
  head: () => ({
    meta: [
      { title: "Plano interactivo · San Nicolás Renacimiento" },
      { name: "description", content: "Plano interactivo con zoom y selección de parcelas." },
    ],
  }),
  component: PlanoPage,
});

function PlanoPage() {
  const [selected, setSelected] = useState<Plot | null>(null);
  const [focusId, setFocusId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PLOTS.filter((p) => {
      if (p.code.toLowerCase().includes(q)) return true;
      if (p.holder?.fullName.toLowerCase().includes(q)) return true;
      if (p.holder?.dni.includes(q)) return true;
      if (p.type.includes(q)) return true;
      return p.spots.some(
        (s) =>
          s.occupant?.fullName.toLowerCase().includes(q) ||
          s.occupant?.dni.includes(q),
      );
    }).slice(0, 8);
  }, [query]);

  const handlePick = (plot: Plot) => {
    setSelected(plot);
    setFocusId(plot.id);
    setQuery("");
    setShowResults(false);
  };

  return (
    <AppShell
      title="Plano interactivo"
      subtitle="Zoom, arrastra y selecciona una parcela"
      actions={
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Buscar por código, fallecido, DNI o titular…"
            className="h-9 pl-9"
          />
          {showResults && results.length > 0 && (
            <div className="glass-strong absolute right-0 top-11 z-40 w-full overflow-hidden rounded-xl border border-border">
              <Command>
                <CommandList>
                  <CommandEmpty>Sin resultados</CommandEmpty>
                  <CommandGroup heading="Resultados">
                    {results.map((p) => {
                      const match = p.spots.find(
                        (s) =>
                          s.occupant?.fullName.toLowerCase().includes(query.toLowerCase()) ||
                          s.occupant?.dni.includes(query),
                      );
                      return (
                        <CommandItem
                          key={p.id}
                          value={p.code + (match?.occupant?.fullName ?? "")}
                          onSelect={() => handlePick(p)}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium">{p.code}</div>
                            <div className="text-xs text-muted-foreground">
                              {match?.occupant?.fullName ?? p.holder?.fullName ?? p.type}
                            </div>
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {p.type}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
        </div>
      }
    >
      <div className="relative flex h-full min-h-0 flex-col gap-4 lg:flex-row">
        <div className="min-h-[320px] flex-1">
          <CemeteryMap
            selectedId={selected?.id}
            onSelect={(p) => setSelected(p)}
            focusId={focusId}
          />
        </div>
        <PlotDetailPanel plot={selected} onClose={() => setSelected(null)} />
      </div>
    </AppShell>
  );
}
