import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
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
import { getSetting, upsertSetting, type JsonValue } from "@/actions/settings";

type Field =
  | {
      kind: "text";
      name: string;
      label: string;
      placeholder?: string;
      description?: string;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      placeholder?: string;
      description?: string;
      rows?: number;
    }
  | {
      kind: "number";
      name: string;
      label: string;
      placeholder?: string;
      description?: string;
    }
  | {
      kind: "url";
      name: string;
      label: string;
      placeholder?: string;
      description?: string;
    }
  | {
      kind: "email";
      name: string;
      label: string;
      placeholder?: string;
      description?: string;
    }
  | {
      kind: "boolean";
      name: string;
      label: string;
      description?: string;
    };

interface Props {
  settingKey: string;
  title: string;
  fields: Field[];
  schema: z.ZodObject<z.ZodRawShape>;
}

type AnyValues = Record<string, unknown>;

export function SettingsEditor({ settingKey, title, fields, schema }: Props) {
  const queryClient = useQueryClient();

  const settingQuery = useQuery({
    queryKey: ["site-setting", settingKey],
    queryFn: () => getSetting({ data: { key: settingKey } }),
  });

  const defaults: AnyValues = {};
  for (const f of fields) defaults[f.name] = f.kind === "boolean" ? false : "";

  const form = useForm<AnyValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const v = settingQuery.data?.setting?.value;
    if (v && typeof v === "object") {
      const next: AnyValues = { ...defaults };
      for (const f of fields) {
        const raw = (v as Record<string, unknown>)[f.name];
        if (f.kind === "boolean") next[f.name] = raw === true;
        else if (typeof raw === "string") next[f.name] = raw;
        else next[f.name] = defaults[f.name];
      }
      form.reset(next);
    }
  }, [settingQuery.data, form, fields]);
  const saveMutation = useMutation({
    mutationFn: (values: AnyValues) =>
      upsertSetting({
        data: { key: settingKey, value: values as unknown as JsonValue },
      }),
    onSuccess: () => {
      toast.success(`${title} guardado`);
      queryClient.invalidateQueries({ queryKey: ["site-setting", settingKey] });
    },
    onError: (err: Error) => toast.error("Error al guardar", { description: err.message }),
  });

  const renderField = (f: Field) => {
    if (f.kind === "textarea") {
      return (
        <FormField
          key={f.name}
          control={form.control as never}
          name={f.name}
          render={({ field: cf }) => (
            <FormItem>
              <FormLabel>{f.label}</FormLabel>
              <FormControl>
                <Textarea placeholder={f.placeholder} rows={f.rows ?? 4} {...cf} />
              </FormControl>
              {f.description && <FormDescription>{f.description}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }
    if (f.kind === "boolean") {
      return (
        <FormField
          key={f.name}
          control={form.control as never}
          name={f.name}
          render={({ field: cf }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2">
              <div>
                <FormLabel>{f.label}</FormLabel>
                {f.description && <FormDescription>{f.description}</FormDescription>}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!cf.value}
                onClick={() => cf.onChange(!cf.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  cf.value ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    cf.value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </FormItem>
          )}
        />
      );
    }
    const inputType =
      f.kind === "number"
        ? "number"
        : f.kind === "url"
          ? "url"
          : f.kind === "email"
            ? "email"
            : "text";
    return (
      <FormField
        key={f.name}
        control={form.control as never}
        name={f.name}
        render={({ field: cf }) => (
          <FormItem>
            <FormLabel>{f.label}</FormLabel>
            <FormControl>
              <Input type={inputType} placeholder={f.placeholder} {...cf} />
            </FormControl>
            {f.description && <FormDescription>{f.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const isConfigured = !!settingQuery.data?.setting;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <StatusBadge label="Configurado" tone="success" />
        ) : (
          <StatusBadge label="Usando defaults" tone="warning" />
        )}
        {settingQuery.data?.setting?.updated_at && (
          <span className="text-xs text-muted-foreground">
            Actualizado{" "}
            {new Date(settingQuery.data.setting.updated_at).toLocaleDateString("es-MX", {
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
          className="space-y-4 max-w-2xl"
        >
          {fields.map((f) => (
            <div key={f.name}>{renderField(f)}</div>
          ))}
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </Button>
        </form>
      </Form>
    </div>
  );
}
