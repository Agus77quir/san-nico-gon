import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Printer,
  FileDown,
  Trash2,
  Pencil,
  Save,
  X,
  ArrowLeft,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AGENCIAS, downloadPlanillaBlancoPDF } from "@/lib/planilla-blanco-pdf";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import {
  emptySolicitud,
  loadAll,
  remove,
  upsert,
  type Solicitud,
} from "@/lib/servicios-store";
import { downloadSolicitudPDF } from "@/lib/servicio-pdf";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Solicitudes de Servicio · San Nicolás Renacimiento" },
      {
        name: "description",
        content:
          "Gestión de solicitudes de servicio fúnebre: alta, búsqueda, impresión y PDF.",
      },
    ],
  }),
  component: ServiciosPage,
});

function ServiciosPage() {
  const [list, setList] = useState<Solicitud[]>([]);
  const [editing, setEditing] = useState<Solicitud | null>(null);
  const [planillaOpen, setPlanillaOpen] = useState(false);
  const [agencia, setAgencia] = useState<string>(AGENCIAS[0]);

  // filters
  const [qFactura, setQFactura] = useState("");
  const [qFamiliar, setQFamiliar] = useState("");
  const [qSocio, setQSocio] = useState("");
  const [qFecha, setQFecha] = useState("");
  const [qBrindado, setQBrindado] = useState("");

  useEffect(() => {
    setList(loadAll());
  }, []);

  const filtered = useMemo(() => {
    return list.filter((s) => {
      if (qFactura && !s.numeroFactura.toLowerCase().includes(qFactura.toLowerCase())) return false;
      if (qFamiliar) {
        const t = qFamiliar.toLowerCase();
        if (
          !s.extintoNombre.toLowerCase().includes(t) &&
          !s.firmanteNombre.toLowerCase().includes(t)
        )
          return false;
      }
      if (qSocio) {
        const t = qSocio.toLowerCase();
        if (
          !s.numeroSocio.toLowerCase().includes(t) &&
          !s.socioNombre.toLowerCase().includes(t)
        )
          return false;
      }
      if (qFecha && s.fecha !== qFecha) return false;
      if (qBrindado && !s.brindadoPor.toLowerCase().includes(qBrindado.toLowerCase())) return false;
      return true;
    });
  }, [list, qFactura, qFamiliar, qSocio, qFecha, qBrindado]);

  const refresh = () => setList(loadAll());

  if (editing) {
    return (
      <SolicitudEditor
        value={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          refresh();
          setEditing(null);
          toast.success("Solicitud guardada");
        }}
      />
    );
  }

  return (
    <AppShell
      title="Solicitudes de Servicio"
      subtitle={`${filtered.length} de ${list.length} registros`}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPlanillaOpen(true)}
          >
            <FileText className="mr-2 h-4 w-4" /> Planilla en blanco
          </Button>
          <Button
            onClick={() => setEditing(emptySolicitud())}
            className="bg-gradient-brand text-primary-foreground hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva solicitud
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" /> Filtros de búsqueda
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterField label="Factura" value={qFactura} onChange={setQFactura} placeholder="0001-..." />
            <FilterField label="Familiar / extinto" value={qFamiliar} onChange={setQFamiliar} placeholder="Nombre" />
            <FilterField label="Socio" value={qSocio} onChange={setQSocio} placeholder="N° o nombre" />
            <FilterField label="Fecha" value={qFecha} onChange={setQFecha} type="date" />
            <FilterField label="Brindado por" value={qBrindado} onChange={setQBrindado} placeholder="Operador" />
          </div>
        </div>

        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Factura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Socio</TableHead>
                <TableHead>Extinto / Familiar</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Brindado por</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="border-border">
                  <TableCell className="font-medium">{s.numeroFactura || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.fecha}</TableCell>
                  <TableCell>
                    <div className="text-sm">{s.socioNombre || "—"}</div>
                    <div className="text-xs text-muted-foreground">N° {s.numeroSocio || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{s.extintoNombre || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      Firmante: {s.firmanteNombre || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.tipoServicio ? (
                      <Badge variant="outline" className="border-border">
                        Servicio {s.tipoServicio}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.brindadoPor || "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Editar" onClick={() => setEditing(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="PDF" onClick={() => downloadSolicitudPDF(s)}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Eliminar"
                        onClick={() => {
                          if (confirm("¿Eliminar esta solicitud?")) {
                            remove(s.id);
                            refresh();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No se encontraron solicitudes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}

function FilterField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}

/* --------------------------- Editor ---------------------------- */

function SolicitudEditor({
  value,
  onCancel,
  onSaved,
}: {
  value: Solicitud;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [s, setS] = useState<Solicitud>(value);

  const set = <K extends keyof Solicitud>(k: K, v: Solicitud[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    upsert(s);
    onSaved();
  };

  return (
    <AppShell
      title={`Solicitud ${s.numeroFactura || "nueva"}`}
      subtitle={s.fecha}
      actions={
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadSolicitudPDF(s)}>
            <FileDown className="mr-1 h-4 w-4" /> PDF
          </Button>
          <Button
            size="sm"
            onClick={save}
            className="bg-gradient-brand text-primary-foreground hover:opacity-90"
          >
            <Save className="mr-1 h-4 w-4" /> Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-5 print:space-y-3">
        {/* Cabecera */}
        <Section title="Cabecera">
          <Grid>
            <Field label="N° Factura"><Input value={s.numeroFactura} onChange={(e) => set("numeroFactura", e.target.value)} /></Field>
            <Field label="N° Socio"><Input value={s.numeroSocio} onChange={(e) => set("numeroSocio", e.target.value)} /></Field>
            <Field label="Fecha"><Input type="date" value={s.fecha} onChange={(e) => set("fecha", e.target.value)} /></Field>
            <Field label="Ciudad"><Input value={s.ciudad} onChange={(e) => set("ciudad", e.target.value)} /></Field>
            <Field label="Brindado por (operador)"><Input value={s.brindadoPor} onChange={(e) => set("brindadoPor", e.target.value)} placeholder="Nombre de quien brindó el servicio" /></Field>
            <Field label="Socio"><Input value={s.socioNombre} onChange={(e) => set("socioNombre", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Firmante */}
        <Section title="Firmante">
          <Grid>
            <Field label="Nombre y apellido"><Input value={s.firmanteNombre} onChange={(e) => set("firmanteNombre", e.target.value)} /></Field>
            <Field label="DNI"><Input value={s.firmanteDni} onChange={(e) => set("firmanteDni", e.target.value)} /></Field>
            <Field label="Parentesco"><Input value={s.firmanteParentesco} onChange={(e) => set("firmanteParentesco", e.target.value)} /></Field>
            <Field label="Domicilio"><Input value={s.firmanteDomicilio} onChange={(e) => set("firmanteDomicilio", e.target.value)} /></Field>
            <Field label="Barrio"><Input value={s.firmanteBarrio} onChange={(e) => set("firmanteBarrio", e.target.value)} /></Field>
            <Field label="Localidad"><Input value={s.firmanteLocalidad} onChange={(e) => set("firmanteLocalidad", e.target.value)} /></Field>
            <Field label="Provincia"><Input value={s.firmanteProvincia} onChange={(e) => set("firmanteProvincia", e.target.value)} /></Field>
            <Field label="Teléfono"><Input value={s.firmanteTelefono} onChange={(e) => set("firmanteTelefono", e.target.value)} /></Field>
            <Field label="Celular"><Input value={s.firmanteCelular} onChange={(e) => set("firmanteCelular", e.target.value)} /></Field>
            <Field label="Domicilio de trabajo"><Input value={s.firmanteDomicilioTrabajo} onChange={(e) => set("firmanteDomicilioTrabajo", e.target.value)} /></Field>
            <Field label="Lugar de trabajo"><Input value={s.firmanteLugarTrabajo} onChange={(e) => set("firmanteLugarTrabajo", e.target.value)} /></Field>
            <Field label="E-Mail"><Input type="email" value={s.firmanteEmail} onChange={(e) => set("firmanteEmail", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Extinto */}
        <Section title="Datos del extinto">
          <Grid>
            <Field label="Nombre y apellido"><Input value={s.extintoNombre} onChange={(e) => set("extintoNombre", e.target.value)} /></Field>
            <Field label="L.E. / L.C. / D.N.I."><Input value={s.extintoDni} onChange={(e) => set("extintoDni", e.target.value)} /></Field>
            <Field label="Parentesco"><Input value={s.extintoParentesco} onChange={(e) => set("extintoParentesco", e.target.value)} /></Field>
            <Field label="Fecha de nacimiento"><Input type="date" value={s.extintoFechaNac} onChange={(e) => set("extintoFechaNac", e.target.value)} /></Field>
            <Field label="Sexo">
              <Select value={s.extintoSexo || undefined} onValueChange={(v) => set("extintoSexo", v as Solicitud["extintoSexo"])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Grid>
        </Section>

        {/* Establecimiento médico */}
        <Section title="Datos del establecimiento médico">
          <div className="mb-3 flex flex-wrap gap-4">
            <SiNoCheck label="Hospital" value={s.hospital} onChange={(v) => set("hospital", v)} />
            <SiNoCheck label="Clínica" value={s.clinica} onChange={(v) => set("clinica", v)} />
            <SiNoCheck label="Sanatorio" value={s.sanatorio} onChange={(v) => set("sanatorio", v)} />
          </div>
          <Grid>
            <Field label="Nombre"><Input value={s.establecimientoNombre} onChange={(e) => set("establecimientoNombre", e.target.value)} /></Field>
            <Field label="Domicilio" wide><Input value={s.establecimientoDomicilio} onChange={(e) => set("establecimientoDomicilio", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Socios - Jubilados */}
        <Section title="Socios — Jubilados — Pensionados">
          <Grid>
            <Field label="Obra social o seguro de vida"><Input value={s.obraSocial} onChange={(e) => set("obraSocial", e.target.value)} /></Field>
            <Field label="Mutual"><Input value={s.mutual} onChange={(e) => set("mutual", e.target.value)} /></Field>
            <Field label="Otros"><Input value={s.otrosSeguro} onChange={(e) => set("otrosSeguro", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Velatorio */}
        <Section title="Datos del velatorio">
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <Field label="Sala velatoria">
              <Select value={s.salaVelatoria || undefined} onValueChange={(v) => set("salaVelatoria", v as Solicitud["salaVelatoria"])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar sala" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Sala 1</SelectItem>
                  <SelectItem value="2">Sala 2</SelectItem>
                  <SelectItem value="3">Sala 3</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo de servicio">
              <Select value={s.tipoServicio || undefined} onValueChange={(v) => set("tipoServicio", v as Solicitud["tipoServicio"])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Servicio A (incluye Suite – Buffet)</SelectItem>
                  <SelectItem value="B">Servicio B</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Grid>
            <Field label="Domicilio" wide><Input value={s.velatorioDomicilio} onChange={(e) => set("velatorioDomicilio", e.target.value)} /></Field>
            <Field label="Barrio"><Input value={s.velatorioBarrio} onChange={(e) => set("velatorioBarrio", e.target.value)} /></Field>
            <Field label="Hora"><Input type="time" value={s.velatorioHora} onChange={(e) => set("velatorioHora", e.target.value)} /></Field>
            <Field label="Teléfono"><Input value={s.velatorioTelefono} onChange={(e) => set("velatorioTelefono", e.target.value)} /></Field>
            <Field label="Localidad"><Input value={s.velatorioLocalidad} onChange={(e) => set("velatorioLocalidad", e.target.value)} /></Field>
            <Field label="Provincia"><Input value={s.velatorioProvincia} onChange={(e) => set("velatorioProvincia", e.target.value)} /></Field>
            <Field label="Importe"><Input value={s.importe} onChange={(e) => set("importe", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Religioso */}
        <Section title="Servicio religioso">
          <Grid>
            <Field label="Día"><Input type="date" value={s.religiosoDia} onChange={(e) => set("religiosoDia", e.target.value)} /></Field>
            <Field label="Hora"><Input type="time" value={s.religiosoHora} onChange={(e) => set("religiosoHora", e.target.value)} /></Field>
            <Field label="Lugar" wide><Input value={s.religiosoLugar} onChange={(e) => set("religiosoLugar", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Inhumación */}
        <Section title="Servicio de inhumación">
          <Grid>
            <Field label="Cementerio">
              <Select value={s.cementerio || undefined} onValueChange={(v) => set("cementerio", v as Solicitud["cementerio"])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RENACIMIENTO">Parque Renacimiento</SelectItem>
                  <SelectItem value="EL_SALVADOR">El Salvador</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {s.cementerio === "OTRO" && (
              <Field label="Otro cementerio"><Input value={s.cementerioOtro} onChange={(e) => set("cementerioOtro", e.target.value)} /></Field>
            )}
            <Field label="Localidad"><Input value={s.cementerioLocalidad} onChange={(e) => set("cementerioLocalidad", e.target.value)} /></Field>
            <Field label="Día"><Input type="date" value={s.inhumacionDia} onChange={(e) => set("inhumacionDia", e.target.value)} /></Field>
            <Field label="Hora"><Input type="time" value={s.inhumacionHora} onChange={(e) => set("inhumacionHora", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Servicio de calle */}
        <Section title="Datos servicio de calle">
          <div className="space-y-4">
            <CalleRow label="Coche fúnebre" siNo={s.cocheFunebre} onSiNo={(v) => set("cocheFunebre", v)}
              unidad={s.cocheFunebreUnidad} onUnidad={(v) => set("cocheFunebreUnidad", v)}
              km={s.cocheFunebreKm} onKm={(v) => set("cocheFunebreKm", v)} />
            <CalleRow label="Portacoronas" unidad={s.portacoronasUnidad} onUnidad={(v) => set("portacoronasUnidad", v)}
              km={s.portacoronasKm} onKm={(v) => set("portacoronasKm", v)} />
            <CalleRow label="Coche acompañante" unidad={s.cocheAcompUnidad} onUnidad={(v) => set("cocheAcompUnidad", v)}
              km={s.cocheAcompKm} onKm={(v) => set("cocheAcompKm", v)} />
            <CalleRow label="Furgón sanitario" siNo={s.furgonSanitario} onSiNo={(v) => set("furgonSanitario", v)}
              unidad={s.furgonUnidad} onUnidad={(v) => set("furgonUnidad", v)}
              km={s.furgonKm} onKm={(v) => set("furgonKm", v)} />
          </div>
        </Section>

        {/* Elementos */}
        <Section title="Elementos utilizados">
          <Grid>
            <Field label="Velas"><Input value={s.velas} onChange={(e) => set("velas", e.target.value)} /></Field>
            <Field label="Estaño"><Input value={s.estano} onChange={(e) => set("estano", e.target.value)} /></Field>
            <Field label="Formol"><Input value={s.formol} onChange={(e) => set("formol", e.target.value)} /></Field>
            <Field label="Código capilla ardiente"><Input value={s.codigoCapilla} onChange={(e) => set("codigoCapilla", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Traslados */}
        <Section title="Traslados">
          <Grid>
            <Field label="Lugar desde"><Input value={s.lugarDesde} onChange={(e) => set("lugarDesde", e.target.value)} /></Field>
            <Field label="Lugar hasta"><Input value={s.lugarHasta} onChange={(e) => set("lugarHasta", e.target.value)} /></Field>
            <Field label="Hora de salida"><Input type="time" value={s.horaSalida} onChange={(e) => set("horaSalida", e.target.value)} /></Field>
            <Field label="Hora de llegada"><Input type="time" value={s.horaLlegada} onChange={(e) => set("horaLlegada", e.target.value)} /></Field>
            <Field label="Empresa que realiza el traslado">
              <Select value={s.empresaTraslado || undefined} onValueChange={(v) => set("empresaTraslado", v as Solicitud["empresaTraslado"])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OMBU">OMBU</SelectItem>
                  <SelectItem value="OTROS">Otros</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nombre empresa (si otros)"><Input value={s.empresaTrasladoNombre} onChange={(e) => set("empresaTrasladoNombre", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Personal */}
        <Section title="Personal interviniente">
          <div className="space-y-3">
            {s.personal.map((p, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
                <Field label={`Apellido y nombre #${i + 1}`}>
                  <Input value={p.nombre} onChange={(e) => {
                    const arr = [...s.personal]; arr[i] = { ...arr[i], nombre: e.target.value }; set("personal", arr);
                  }} />
                </Field>
                <Field label="Desde">
                  <Input type="time" value={p.desde} onChange={(e) => {
                    const arr = [...s.personal]; arr[i] = { ...arr[i], desde: e.target.value }; set("personal", arr);
                  }} />
                </Field>
                <Field label="Hasta">
                  <Input type="time" value={p.hasta} onChange={(e) => {
                    const arr = [...s.personal]; arr[i] = { ...arr[i], hasta: e.target.value }; set("personal", arr);
                  }} />
                </Field>
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => set("personal", [...s.personal, { nombre: "", desde: "", hasta: "" }])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Agregar
              </Button>
              {s.personal.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => set("personal", s.personal.slice(0, -1))}>
                  <X className="mr-1 h-3.5 w-3.5" /> Quitar último
                </Button>
              )}
            </div>
          </div>
        </Section>

        {/* Ataúd */}
        <Section title="Tipo de ataúd adquirido">
          <Grid>
            <Field label="Ataúd"><Input value={s.ataud} onChange={(e) => set("ataud", e.target.value)} /></Field>
            <Field label="Código"><Input value={s.ataudCodigo} onChange={(e) => set("ataudCodigo", e.target.value)} /></Field>
            <Field label="Proveedor" wide><Input value={s.proveedor} onChange={(e) => set("proveedor", e.target.value)} /></Field>
          </Grid>
        </Section>

        {/* Observaciones */}
        <Section title="Observaciones especiales">
          <Textarea
            rows={4}
            value={s.observaciones}
            onChange={(e) => set("observaciones", e.target.value)}
            placeholder="Notas adicionales del servicio…"
          />
        </Section>

        <div className="flex justify-end gap-2 pt-2 print:hidden">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={save} className="bg-gradient-brand text-primary-foreground hover:opacity-90">
            <Save className="mr-1 h-4 w-4" /> Guardar solicitud
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

/* helpers */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gradient-brand">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-2" : ""}>
      <Label className="mb-1.5 block text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SiNoCheck({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "SI" | "NO" | "";
  onChange: (v: "SI" | "NO" | "") => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <label className="flex items-center gap-1.5 text-xs">
        <Checkbox checked={value === "SI"} onCheckedChange={(c) => onChange(c ? "SI" : "")} />
        SI
      </label>
      <label className="flex items-center gap-1.5 text-xs">
        <Checkbox checked={value === "NO"} onCheckedChange={(c) => onChange(c ? "NO" : "")} />
        NO
      </label>
    </div>
  );
}

function CalleRow({
  label,
  siNo,
  onSiNo,
  unidad,
  onUnidad,
  km,
  onKm,
}: {
  label: string;
  siNo?: "SI" | "NO" | "";
  onSiNo?: (v: "SI" | "NO" | "") => void;
  unidad: string;
  onUnidad: (v: string) => void;
  km: string;
  onKm: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {onSiNo && siNo !== undefined && (
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={siNo === "SI"} onCheckedChange={(c) => onSiNo(c ? "SI" : "")} /> SI
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={siNo === "NO"} onCheckedChange={(c) => onSiNo(c ? "NO" : "")} /> NO
            </label>
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Unidad utilizada (1-12)">
          <Select value={unidad || undefined} onValueChange={onUnidad}>
            <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => (
                <SelectItem key={n} value={n}>Unidad {n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Km recorridos (aproximado)">
          <Input value={km} onChange={(e) => onKm(e.target.value)} placeholder="Ej. 12" />
        </Field>
      </div>
    </div>
  );
}
