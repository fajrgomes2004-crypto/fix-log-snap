import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ImageIcon,
  LoaderCircle,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Maintenance = Tables<"maintenance_records"> & { photos: string[] };

const maintenanceSchema = z.object({
  title: z.string().trim().min(2, "Informe um título.").max(120),
  equipment: z.string().trim().min(2, "Informe o equipamento.").max(120),
  maintenanceDate: z.string().date("Informe uma data válida."),
  description: z.string().trim().min(5, "Descreva o serviço realizado.").max(4000),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registro de Manutenção | Histórico de Serviços" },
      { name: "description", content: "Registre manutenções com fotos e consulte o histórico de equipamentos rapidamente." },
      { property: "og:title", content: "Registro de Manutenção" },
      { property: "og:description", content: "Histórico simples e organizado de serviços realizados em máquinas e equipamentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  async function loadRecords() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("maintenance_records")
      .select("*")
      .order("maintenance_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    const hydrated = await Promise.all(
      (data ?? []).map(async (record) => {
        const signed = await Promise.all(
          record.photo_urls.map(async (path) => {
            const { data: signedData } = await supabase.storage
              .from("maintenance-photos")
              .createSignedUrl(path, 3600);
            return signedData?.signedUrl;
          }),
        );
        return { ...record, photos: signed.filter((url): url is string => Boolean(url)) };
      }),
    );
    setRecords(hydrated);
    setLoading(false);
  }

  useEffect(() => { void loadRecords(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return records;
    return records.filter((record) =>
      `${record.title} ${record.equipment} ${record.description}`.toLocaleLowerCase("pt-BR").includes(normalized),
    );
  }, [query, records]);

  return (
    <main className="min-h-screen bg-background pb-24 sm:pb-12">
      <header className="border-b border-border bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                <Wrench className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-primary">Controle de serviços</p>
                <h1 className="truncate text-xl font-bold sm:text-2xl">Registro de Manutenção</h1>
              </div>
            </div>
            <Button className="hidden h-11 sm:inline-flex" onClick={() => setFormOpen(true)}>
              <Plus /> Nova manutenção
            </Button>
          </div>
          <div className="mt-7 grid gap-4 border-t border-background/15 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm text-background/65">Histórico da operação</p>
              <p className="mt-1 text-3xl font-bold">{records.length.toString().padStart(2, "0")} <span className="text-base font-medium text-background/60">registros</span></p>
            </div>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value.slice(0, 120))}
                className="h-11 border-background/15 bg-background pl-10 text-foreground placeholder:text-muted-foreground"
                placeholder="Buscar equipamento ou serviço..."
                aria-label="Buscar manutenções"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10" aria-labelledby="history-title">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Linha do tempo</p>
            <h2 id="history-title" className="mt-1 text-2xl font-bold">Serviços realizados</h2>
          </div>
          {query && <span className="text-sm text-muted-foreground">{filtered.length} encontrado(s)</span>}
        </div>

        {loading ? (
          <div className="grid place-items-center border-y border-border py-20 text-muted-foreground">
            <LoaderCircle className="mb-3 size-6 animate-spin text-primary" />
            Carregando histórico...
          </div>
        ) : loadError ? (
          <div className="border-y border-border py-16 text-center">
            <h3 className="font-bold">Não foi possível carregar o histórico</h3>
            <p className="mt-1 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
            <Button variant="outline" className="mt-5" onClick={() => void loadRecords()}>Tentar novamente</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-y border-border py-16 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-md bg-secondary text-muted-foreground"><Wrench /></div>
            <h3 className="mt-4 font-bold">{query ? "Nenhum registro encontrado" : "Ainda não há manutenções"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{query ? "Tente buscar por outro termo." : "Registre o primeiro serviço realizado."}</p>
            {!query && <Button className="mt-5" onClick={() => setFormOpen(true)}><Plus /> Nova manutenção</Button>}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((record) => (
              <article key={record.id} className="overflow-hidden rounded-md border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                {record.photos.length > 0 && (
                  <button type="button" onClick={() => setLightbox({ images: record.photos, index: 0 })} className="group relative block aspect-[16/8] w-full cursor-zoom-in overflow-hidden bg-muted text-left">
                    <img src={record.photos[0]} alt={`Foto de ${record.title}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
                    {record.photos.length > 1 && <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-foreground/85 px-2.5 py-1.5 text-xs font-bold text-background"><ImageIcon className="size-3.5" /> {record.photos.length} fotos</span>}
                  </button>
                )}
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold uppercase text-primary">{record.equipment}</p>
                      <h3 className="mt-1 text-xl font-bold leading-tight">{record.title}</h3>
                    </div>
                    <time className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground" dateTime={record.maintenance_date}>
                      <CalendarDays className="size-4" /> {formatDate(record.maintenance_date)}
                    </time>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{record.description}</p>
                  {record.photos.length > 1 && (
                    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                      {record.photos.slice(1).map((photo, index) => (
                        <button key={photo} type="button" className="size-16 shrink-0 overflow-hidden rounded-md border border-border" onClick={() => setLightbox({ images: record.photos, index: index + 1 })} aria-label={`Abrir foto ${index + 2}`}>
                          <img src={photo} alt="" className="size-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Button className="fixed bottom-4 left-4 right-4 z-30 h-12 shadow-lg sm:hidden" onClick={() => setFormOpen(true)}>
        <Plus /> Nova manutenção
      </Button>

      <MaintenanceForm open={formOpen} onOpenChange={setFormOpen} onSaved={loadRecords} />
      <Lightbox state={lightbox} onChange={setLightbox} />
    </main>
  );
}

function MaintenanceForm({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => Promise<void> }) {
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => () => files.forEach(({ preview }) => URL.revokeObjectURL(preview)), [files]);

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    const valid = chosen.filter((file) => file.type.startsWith("image/") && file.size <= 8 * 1024 * 1024);
    if (valid.length !== chosen.length) toast.error("Use imagens JPG, PNG ou WEBP de até 8 MB.");
    const room = Math.max(0, 6 - files.length);
    if (valid.length > room) toast.error("Você pode anexar até 6 fotos.");
    setFiles((current) => [...current, ...valid.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((current) => {
      URL.revokeObjectURL(current[index]?.preview ?? "");
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = maintenanceSchema.safeParse({
      title: data.get("title"), equipment: data.get("equipment"),
      maintenanceDate: data.get("maintenanceDate"), description: data.get("description"),
    });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => { nextErrors[String(issue.path[0])] = issue.message; });
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const uploaded: string[] = [];
    for (const { file } of files) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("maintenance-photos").upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        setSubmitting(false);
        toast.error("Não foi possível enviar uma das fotos.");
        return;
      }
      uploaded.push(path);
    }
    const { error } = await supabase.from("maintenance_records").insert({
      title: parsed.data.title, equipment: parsed.data.equipment,
      maintenance_date: parsed.data.maintenanceDate, description: parsed.data.description,
      photo_urls: uploaded,
    });
    setSubmitting(false);
    if (error) { toast.error("Não foi possível salvar a manutenção."); return; }
    files.forEach(({ preview }) => URL.revokeObjectURL(preview));
    setFiles([]);
    formRef.current?.reset();
    onOpenChange(false);
    toast.success("Manutenção registrada com sucesso.");
    await onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="inset-x-0 bottom-0 top-auto max-h-[94dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-lg border-x-0 border-b-0 p-0 sm:left-1/2 sm:top-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border">
        <DialogHeader className="border-b border-border px-5 py-5 text-left sm:px-7">
          <DialogTitle className="text-xl">Nova manutenção</DialogTitle>
          <DialogDescription>Preencha os dados do serviço realizado.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-5 px-5 py-6 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Título do serviço" name="title" error={errors.title} placeholder="Ex: Troca da correia" maxLength={120} />
            <Field label="Equipamento ou máquina" name="equipment" error={errors.equipment} placeholder="Ex: Compressor 02" maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenanceDate">Data da manutenção</Label>
            <Input id="maintenanceDate" name="maintenanceDate" type="date" defaultValue={today} max={today} className="h-11" aria-invalid={Boolean(errors.maintenanceDate)} />
            {errors.maintenanceDate && <p className="text-xs text-destructive">{errors.maintenanceDate}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição detalhada</Label>
            <Textarea id="description" name="description" maxLength={4000} rows={5} placeholder="Descreva o problema, o serviço executado, peças trocadas e testes realizados..." aria-invalid={Boolean(errors.description)} />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label htmlFor="photos">Fotos</Label><span className="text-xs text-muted-foreground">{files.length}/6</span></div>
            <label htmlFor="photos" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-muted/40 px-4 text-center transition-colors hover:bg-muted">
              <Camera className="mb-2 size-6 text-primary" />
              <span className="text-sm font-semibold">Adicionar fotos</span>
              <span className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP · até 8 MB</span>
              <input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseFiles} className="sr-only" />
            </label>
            {files.length > 0 && <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{files.map(({ file, preview }, index) => (
              <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <img src={preview} alt={`Pré-visualização ${index + 1}`} className="size-full object-cover" />
                <Button type="button" size="icon" variant="secondary" className="absolute right-1 top-1 size-7" onClick={() => removeFile(index)} aria-label={`Remover foto ${index + 1}`}><X /></Button>
              </div>
            ))}</div>}
          </div>
          <div className="sticky bottom-0 flex gap-3 border-t border-border bg-background py-4 sm:justify-end">
            <Button type="button" variant="outline" className="h-11 flex-1 sm:flex-none" disabled={submitting} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="h-11 flex-1 sm:min-w-40 sm:flex-none" disabled={submitting}>
              {submitting ? <><LoaderCircle className="animate-spin" /> Salvando...</> : "Salvar manutenção"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, name, error, placeholder, maxLength }: { label: string; name: string; error?: string; placeholder: string; maxLength: number }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} placeholder={placeholder} maxLength={maxLength} className="h-11" aria-invalid={Boolean(error)} />{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

function Lightbox({ state, onChange }: { state: { images: string[]; index: number } | null; onChange: (state: { images: string[]; index: number } | null) => void }) {
  if (!state) return null;
  const previous = () => onChange({ ...state, index: (state.index - 1 + state.images.length) % state.images.length });
  const next = () => onChange({ ...state, index: (state.index + 1) % state.images.length });
  return (
    <Dialog open onOpenChange={(open) => !open && onChange(null)}>
      <DialogContent className="max-w-5xl border-0 bg-foreground p-2 text-background sm:rounded-md [&>button]:bg-background/10 [&>button]:text-background">
        <DialogTitle className="sr-only">Foto da manutenção</DialogTitle>
        <DialogDescription className="sr-only">Visualização ampliada da foto selecionada.</DialogDescription>
        <div className="relative flex h-[75dvh] items-center justify-center">
          <img src={state.images[state.index]} alt={`Foto ${state.index + 1} de ${state.images.length}`} className="max-h-full max-w-full object-contain" />
          {state.images.length > 1 && <>
            <Button size="icon" variant="secondary" className="absolute left-2 size-11" onClick={previous} aria-label="Foto anterior"><ArrowLeft /></Button>
            <Button size="icon" variant="secondary" className="absolute right-2 size-11" onClick={next} aria-label="Próxima foto"><ArrowRight /></Button>
            <span className="absolute bottom-2 rounded-md bg-background/10 px-3 py-1 text-xs">{state.index + 1} / {state.images.length}</span>
          </>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
