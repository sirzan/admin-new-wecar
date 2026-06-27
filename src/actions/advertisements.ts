import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const AdSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  cta_label: z.string().nullable(),
  cta_url: z.string().nullable(),
  placement: z.string(),
  status: z.string(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  impressions: z.number(),
  clicks: z.number(),
  sort_order: z.number(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const AdListSchema = z.object({ advertisements: z.array(AdSchema) });
const AdItemSchema = z.object({ advertisement: AdSchema });

const STATUSES = ["draft", "active", "paused", "archived"] as const;
const PLACEMENTS = [
  "home_hero",
  "home_inline",
  "search_inline",
  "detail_sidebar",
  "global_top",
] as const;

const AdBaseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
  title: z.string().min(2).max(120),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  cta_label: z.string().max(40).nullable().optional(),
  cta_url: z.string().url().nullable().optional(),
  placement: z.enum(PLACEMENTS),
  status: z.enum(STATUSES).default("draft"),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  sort_order: z.number().int().default(0),
});

async function actorEmailOrThrow(): Promise<string> {
  const { getServerSession } = await import("@/server/auth.server");
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) throw new Error("Not authenticated");
  return email.toLowerCase();
}

export const listAdvertisements = createServerFn({ method: "GET" })
  .validator(z.object({ status: z.enum(STATUSES).optional() }).optional())
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    let query = supabaseAdmin.from("advertisements").select("*").order("sort_order");
    if (data?.status) query = query.eq("status", data.status);
    const { data: ads, error } = await query;
    if (error) throw error;
    return AdListSchema.parse({ advertisements: ads ?? [] });
  });

export const createAdvertisement = createServerFn({ method: "POST" })
  .validator(AdBaseSchema)
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const { data: ad, error } = await supabaseAdmin
      .from("advertisements")
      .insert({ ...data, created_by: undefined })
      .select("*")
      .single();
    if (error) throw error;
    return AdItemSchema.parse({ advertisement: ad });
  });

const AdUpdateSchema = AdBaseSchema.partial().extend({ id: z.string().uuid() });

export const updateAdvertisement = createServerFn({ method: "POST" })
  .validator(AdUpdateSchema)
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const { id, ...updates } = data;
    const { data: ad, error } = await supabaseAdmin
      .from("advertisements")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!ad) throw new Error("Advertisement not found");
    return AdItemSchema.parse({ advertisement: ad });
  });

export const deleteAdvertisement = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const { error } = await supabaseAdmin.from("advertisements").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export type Advertisement = z.infer<typeof AdSchema>;
