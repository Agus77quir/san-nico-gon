import { useEffect, useState } from "react";

export type NotificationKind = "info" | "success" | "warning" | "alert";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description?: string;
  createdAt: number;
  read: boolean;
}

type Listener = (items: AppNotification[]) => void;

const listeners = new Set<Listener>();

let items: AppNotification[] = [
  {
    id: crypto.randomUUID(),
    kind: "info",
    title: "Sistema iniciado",
    description: "San Nicolás · Renacimiento listo para operar.",
    createdAt: Date.now() - 1000 * 60 * 12,
    read: false,
  },
  {
    id: crypto.randomUUID(),
    kind: "success",
    title: "Sincronización completada",
    description: "Plano sincronizado con la base de parcelas.",
    createdAt: Date.now() - 1000 * 60 * 45,
    read: false,
  },
  {
    id: crypto.randomUUID(),
    kind: "warning",
    title: "Mantenimiento programado",
    description: "Sector B — limpieza el sábado 09:00.",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    read: true,
  },
];

function emit() {
  for (const l of listeners) l([...items]);
}

export function pushNotification(
  n: Omit<AppNotification, "id" | "createdAt" | "read">,
) {
  items = [
    { ...n, id: crypto.randomUUID(), createdAt: Date.now(), read: false },
    ...items,
  ].slice(0, 30);
  emit();
}

export function markAllRead() {
  items = items.map((i) => ({ ...i, read: true }));
  emit();
}

export function useNotifications() {
  const [list, setList] = useState<AppNotification[]>(items);
  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  return list;
}

// simulate a live activity stream
let demoStarted = false;
export function startDemoStream() {
  if (demoStarted || typeof window === "undefined") return;
  demoStarted = true;
  const samples: Array<Omit<AppNotification, "id" | "createdAt" | "read">> = [
    { kind: "info", title: "Visita registrada", description: "Familia Pérez en Sector A." },
    { kind: "success", title: "Mantenimiento finalizado", description: "Sector C limpio y listo." },
    { kind: "warning", title: "Solicitud pendiente", description: "Nueva apertura por aprobar." },
    { kind: "info", title: "Pago recibido", description: "Cuota mensual — Socio #4521." },
  ];
  let i = 0;
  setInterval(() => {
    pushNotification(samples[i % samples.length]);
    i++;
  }, 45000);
}
