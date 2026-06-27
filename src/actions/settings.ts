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

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

const SettingSchema = z.object({
  key: z.string(),
  value: JsonValueSchema.nullable().optional(),
  updated_at: z.string().optional(),
});

const SettingItemSchema = z.object({ setting: SettingSchema.nullable() });

export const getSetting = createServerFn({ method: "GET" })
  .validator(z.object({ key: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const { data: setting, error } = await supabaseAdmin
      .from("site_settings")
      .select("*")
      .eq("key", data.key)
      .maybeSingle();
    if (error) throw error;
    return SettingItemSchema.parse({ setting: setting ?? null });
  });

export const upsertSetting = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1).max(120), value: JsonValueSchema }))
  .handler(async ({ data }) => {
    const { data: setting, error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" })
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return SettingItemSchema.parse({ setting: setting ?? null });
  });

export type SiteSetting = z.infer<typeof SettingSchema>;
