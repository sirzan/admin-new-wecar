import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "superadmin" | "manager" | "viewer";

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  role: AdminRole | null;
}

export interface AuthState {
  session: Session | null;
  user: Session["user"] | null;
  profile: AdminProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isManagerOrAbove: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SESSION_QUERY_KEY = ["auth", "session"] as const;
const PROFILE_QUERY_KEY = ["auth", "profile"] as const;

async function fetchSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  const { data: row, error: userErr } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (userErr) throw userErr;
  if (!row) return null;

  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleErr) throw roleErr;

  return {
    id: row.id as string,
    email: row.email as string,
    full_name: (row.full_name as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    is_active: row.is_active as boolean,
    role: (roleRow?.role as AdminRole | null) ?? null,
  };
}

export function useAuth(): AuthState {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const session = sessionQuery.data ?? null;
  const user = session?.user ?? null;

  const profileQuery = useQuery({
    queryKey: [...PROFILE_QUERY_KEY, user?.id ?? "anon"],
    queryFn: () => (user ? fetchAdminProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, newSession);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const profile = profileQuery.data ?? null;
  const isAdmin = !!profile && profile.is_active && !!profile.role;
  const isSuperAdmin = isAdmin && profile.role === "superadmin";
  const isManagerOrAbove =
    isAdmin && (profile.role === "superadmin" || profile.role === "manager");

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  };

  return {
    session,
    user,
    profile,
    isAdmin,
    isSuperAdmin,
    isManagerOrAbove,
    isLoading: sessionQuery.isLoading || (!!user && profileQuery.isLoading),
    signOut,
    refresh,
  };
}
