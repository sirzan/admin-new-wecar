export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AdminAppRole = "superadmin" | "manager" | "viewer";

// ── Admin schema ──────────────────────────────────────────────

export interface AdminUserInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUserRoleInsert {
  user_id: string;
  role: AdminAppRole;
  created_at?: string;
}

export interface AdminAuditLogInsert {
  id?: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  payload?: Json | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

// ── Public schema types ───────────────────────────────────────

export interface CarBrandRow {
  id: string;
  name: string;
  created_at: string;
}

export interface CarModelRow {
  id: string;
  brand_id: string;
  name: string;
  created_at: string;
}

export interface CarVersionRow {
  id: string;
  model_id: string;
  name: string;
  years: string | null;
  created_at: string;
}

export interface CarStatusRow {
  id: string;
  name: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  is_agency: boolean | null;
  didit_session_id: string | null;
  didit_status: string | null;
  didit_verified_at: string | null;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface CarRow {
  id: string;
  owner_id: string | null;
  year: number | null;
  km: number | null;
  price: number | null;
  previous_price: number | null;
  city: string | null;
  color: string | null;
  featured: boolean | null;
  transmission: string | null;
  fuel: string | null;
  body: string | null;
  description: string | null;
  image: string | null;
  gallery: string[];
  created_at: string;
  updated_at: string;
  status_id: string | null;
  brand_id: string | null;
  model_id: string | null;
  version_id: string | null;
}

export interface PlanRow {
  id: string;
  key_name: string;
  name: string;
  price: number;
  duration: string;
  duration_weeks: number;
  max_cars: number;
  highlight: boolean;
  features: Json;
  created_at: string;
  commission_rate: number;
}

export interface FinancieraRow {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  logo: string;
  color: string;
  tasa_min: number;
  tasa_max: number;
  cat_min: number;
  cat_max: number;
  enganche_pct: number;
  plazo_max: number;
  score_min: number | null;
  destacado: boolean;
  aplica_para: string | null;
  contacto: string | null;
  notas: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface AdvertisementRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  placement: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingRow {
  key: string;
  value: Json;
  updated_at: string;
  updated_by: string | null;
}

export interface CarReportRow {
  id: string;
  car_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  car_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  created_at: string;
}

export interface CreditApplicationRow {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  monthly_income: number;
  car_price: number | null;
  down_payment: number | null;
  term_months: number | null;
  monthly_estimate: number | null;
  status: string;
  created_at: string;
  car_id: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_year: number | null;
}

// ── Database type map ─────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      car_brands: {
        Row: CarBrandRow;
        Insert: { name: string };
        Update: Partial<{ name: string }>;
        Relationships: [];
      };
      car_models: {
        Row: CarModelRow;
        Insert: { brand_id: string; name: string };
        Update: Partial<{ brand_id: string; name: string }>;
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey";
            columns: ["brand_id"];
            referencedRelation: "car_brands";
            referencedColumns: ["id"];
          },
        ];
      };
      car_versions: {
        Row: CarVersionRow;
        Insert: { model_id: string; name: string; years?: string | null };
        Update: Partial<{ model_id: string; name: string; years: string | null }>;
        Relationships: [
          {
            foreignKeyName: "car_versions_model_id_fkey";
            columns: ["model_id"];
            referencedRelation: "car_models";
            referencedColumns: ["id"];
          },
        ];
      };
      car_statuses: {
        Row: CarStatusRow;
        Insert: { name: string; label: string; sort_order?: number };
        Update: Partial<{ name: string; label: string; sort_order: number }>;
        Relationships: [];
      };
      cars: {
        Row: CarRow;
        Insert: Record<string, never>;
        Update: Partial<CarRow>;
        Relationships: [
          {
            foreignKeyName: "cars_brand_id_fkey";
            columns: ["brand_id"];
            referencedRelation: "car_brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cars_model_id_fkey";
            columns: ["model_id"];
            referencedRelation: "car_models";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cars_version_id_fkey";
            columns: ["version_id"];
            referencedRelation: "car_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cars_status_id_fkey";
            columns: ["status_id"];
            referencedRelation: "car_statuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cars_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
        };
        Update: Partial<ProfileRow>;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: { user_id: string; role: string };
        Update: Partial<{ role: string }>;
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: PlanRow;
        Insert: {
          key_name: string;
          name: string;
          price: number;
          duration: string;
          duration_weeks: number;
          max_cars: number;
          highlight?: boolean;
          features?: Json;
        };
        Update: Partial<PlanRow>;
        Relationships: [];
      };
      financieras: {
        Row: FinancieraRow;
        Insert: {
          slug: string;
          nombre: string;
          tipo: string;
          logo: string;
          color: string;
          tasa_min: number;
          tasa_max: number;
          cat_min: number;
          cat_max: number;
          enganche_pct: number;
          plazo_max: number;
          score_min?: number | null;
          destacado?: boolean;
          aplica_para?: string | null;
          contacto?: string | null;
          notas?: string | null;
          orden?: number;
          activo?: boolean;
        };
        Update: Partial<FinancieraRow>;
        Relationships: [];
      };
      advertisements: {
        Row: AdvertisementRow;
        Insert: {
          slug: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          placement: string;
          status?: string;
          starts_at?: string | null;
          ends_at?: string | null;
          sort_order?: number;
        };
        Update: Partial<AdvertisementRow>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettingRow;
        Insert: { key: string; value: Json; updated_by?: string | null };
        Update: Partial<{ value: Json; updated_by: string | null }>;
        Relationships: [];
      };
      car_reports: {
        Row: CarReportRow;
        Insert: { car_id: string; reporter_id: string; reason: string; details?: string | null };
        Update: Partial<{ status: string; resolved_at: string | null }>;
        Relationships: [
          {
            foreignKeyName: "car_reports_car_id_fkey";
            columns: ["car_id"];
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Record<string, never>;
        Update: Partial<SubscriptionRow>;
        Relationships: [];
      };
      credit_applications: {
        Row: CreditApplicationRow;
        Insert: Record<string, never>;
        Update: Partial<CreditApplicationRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  admin: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: AdminUserInsert;
        Update: Partial<AdminUserInsert>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: AdminAppRole;
          created_at: string;
        };
        Insert: AdminUserRoleInsert;
        Update: Partial<AdminUserRoleInsert>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          resource: string;
          resource_id: string | null;
          payload: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: AdminAuditLogInsert;
        Update: Partial<AdminAuditLogInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_superadmin: { Args: { _user_id: string }; Returns: boolean };
      is_manager_or_above: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: AdminAppRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
