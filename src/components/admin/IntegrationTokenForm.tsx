import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  getIntegration,
  upsertIntegration,
  deleteIntegration,
  type Integration,
  type JsonValue,
} from "@/actions/integrations";

const formSchema = z.object({
  app_id: z.string().trim().max(120).optional(),
  app_secret: z.string().trim().max(200).optional(),
  access_token: z.string().trim().max(500).optional(),
  page_id: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface Props {
  provider: string;
  title: string;
  description?: string;
  fields?: Array<"app_id" | "app_secret" | "access_token" | "page_id" | "notes">;
  docsUrl?: string;
}

export function IntegrationTokenForm({
  provider,
  title,
  description,
  fields = ["app_id", "app_secret", "access_token", "page_id", "notes"],
  docsUrl,
}: Props) {
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const integrationQuery = useQuery({
    queryKey: ["integration", provider],
    queryFn: async (): Promise<Integration | null> => {
      const result = await getIntegration({ data: { provider } });
      return result.integration ?? null;
    },
  });

  const integration: Integration | null = integrationQuery.data ?? null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { app_id: "", app_secret: "", access_token: "", page_id: "", notes: "" },
  });

  useEffect(() => {
    const v = integration?.value;
    if (v && typeof v === "object") {
      form.reset({
        app_id: typeof v.app_id === "string" ? v.app_id : "",
        app_secret: typeof v.app_secret === "string" ? v.app_secret : "",
        access_token: typeof v.access_token === "string" ? v.access_token : "",
        page_id: typeof v.page_id === "string" ? v.page_id : "",
        notes: typeof v.notes === "string" ? v.notes : "",
      });
    }
  }, [integration, form]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: Record<string, string> = {};
      for (const key of fields) {
        const v = values[key as keyof FormValues];
        if (typeof v === "string" && v.trim()) payload[key] = v.trim();
      }
      return upsertIntegration({
        data: { provider, value: payload as unknown as Record<string, JsonValue> },
      });
    },
    onSuccess: () => {
      toast.success(`${title} guardado`);
      queryClient.invalidateQueries({ queryKey: ["integration", provider] });
    },
    onError: (err: Error) => toast.error("Error al guardar", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteIntegration({ data: { provider } }),
    onSuccess: () => {
      toast.success(`${title} eliminado`);
      queryClient.invalidateQueries({ queryKey: ["integration", provider] });
      form.reset();
      setConfirmDelete(false);
    },
    onError: (err: Error) => toast.error("Error al eliminar", { description: err.message }),
  });

  const toggleShow = (key: string) => setShowSecrets((s) => ({ ...s, [key]: !s[key] }));

  const renderField = (
    key: "app_id" | "app_secret" | "access_token" | "page_id" | "notes",
    label: string,
    placeholder: string,
    description?: string,
  ) => {
    const isSecret = key === "app_secret" || key === "access_token";
    const isArea = key === "notes";
    return (
      <FormField
        key={key}
        control={form.control}
        name={key}
        render={({ field: f }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
              {isSecret && (
                <button
                  type="button"
                  onClick={() => toggleShow(key)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showSecrets[key] ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Mostrar
                    </>
                  )}
                </button>
              )}
            </div>
            <FormControl>
              {isArea ? (
                <Textarea placeholder={placeholder} rows={3} {...f} />
              ) : (
                <Input
                  type={isSecret && !showSecrets[key] ? "password" : "text"}
                  placeholder={placeholder}
                  autoComplete="off"
                  {...f}
                />
              )}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const isConfigured = !!integration;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <StatusBadge label="Configurado" tone="success" />
        ) : (
          <StatusBadge label="Sin configurar" tone="warning" />
        )}
        {integration?.updated_at && (
          <span className="text-xs text-muted-foreground">
            Actualizado{" "}
            {new Date(integration.updated_at).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })}
          </span>
        )}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutateAsync(values))}
          className="space-y-4 max-w-xl"
        >
          {fields.includes("app_id") && renderField("app_id", "App ID", "1234567890")}
          {fields.includes("app_secret") &&
            renderField(
              "app_secret",
              "App Secret",
              "abcdef123456…",
              "Se guarda cifrado en la base de datos.",
            )}
          {fields.includes("access_token") &&
            renderField(
              "access_token",
              "Access Token",
              "EAA...",
              "Token de larga duración o de sistema.",
            )}
          {fields.includes("page_id") && renderField("page_id", "Page ID", "9876543210")}
          {fields.includes("notes") &&
            renderField("notes", "Notas internas", "Información adicional para el equipo.")}

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
            {isConfigured && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Documentación ↗
              </a>
            )}
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Eliminar ${title}`}
        description="Esto borrará la configuración. La integración dejará de funcionar hasta que vuelvas a configurarla."
        confirmLabel="Eliminar"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
      />
    </div>
  );
}

export function IntegrationPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
