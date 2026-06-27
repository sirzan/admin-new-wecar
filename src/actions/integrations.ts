import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const JsonObjectSchema: z.ZodType<{ [key: string]: JsonValue }> = z.lazy(() =>
  z.record(z.string(), JsonValueSchema),
);

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    JsonObjectSchema,
  ]),
);

const IntegrationSchema = z.object({
  key: z.string(),
  value: JsonObjectSchema.nullable().optional(),
  updated_at: z.string().optional(),
});

const IntegrationItemSchema = z.object({ integration: IntegrationSchema.nullable() });

async function actorEmailOrThrow(): Promise<string> {
  const { getServerSession } = await import("@/server/auth.server");
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) throw new Error("Not authenticated");
  return email.toLowerCase();
}

export const getIntegration = createServerFn({ method: "GET" })
  .validator(z.object({ provider: z.string().min(1).max(60) }))
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const { data: integration, error } = await supabaseAdmin
      .from("site_settings")
      .select("*")
      .eq("key", `integration_${data.provider}`)
      .maybeSingle();
    if (error) throw error;
    return IntegrationItemSchema.parse({ integration: integration ?? null });
  });

export const upsertIntegration = createServerFn({ method: "POST" })
  .validator(
    z.object({
      provider: z.string().min(1).max(60),
      value: JsonObjectSchema,
    }),
  )
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const { data: integration, error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: `integration_${data.provider}`, value: data.value }, { onConflict: "key" })
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return IntegrationItemSchema.parse({ integration: integration ?? null });
  });

export const deleteIntegration = createServerFn({ method: "POST" })
  .validator(z.object({ provider: z.string().min(1).max(60) }))
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const { error } = await supabaseAdmin
      .from("site_settings")
      .delete()
      .eq("key", `integration_${data.provider}`);
    if (error) throw error;
    return { ok: true as const };
  });

export type Integration = z.infer<typeof IntegrationSchema>;
