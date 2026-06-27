// Supabase generated types placeholder.
// Regenerate with:
//   supabase gen types typescript --local > src/integrations/supabase/types.ts
// (requires Supabase CLI installed and `supabase start` running locally).
//
// Until generated, we declare a minimal Database shape covering the
// admin schema created in supabase/migrations/ so TypeScript compiles.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminAppRole = 'superadmin' | 'manager' | 'viewer';

export interface Database {
  public: {
    Tables: Record<string, never>;
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
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['admin']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: AdminAppRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: AdminAppRole;
          created_at?: string;
        };
        Update: Partial<Database['admin']['Tables']['user_roles']['Insert']>;
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
        Insert: {
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
        };
        Update: Partial<Database['admin']['Tables']['audit_log']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      is_superadmin: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      is_manager_or_above: {
        Args: { _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AdminAppRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
