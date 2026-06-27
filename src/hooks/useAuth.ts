import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAdminProfile } from "@/actions/get-admin-profile";

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

async function fetchAdminProfile(): Promise<AdminProfile | null> {
  const data = await getAdminProfile();
  if (!data) return null;
  return {
    ...data,
    role: (data.role as AdminRole | null) ?? null,
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
    queryFn: () => (user ? fetchAdminProfile() : Promise.resolve(null)),
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
  const isManagerOrAbove = isAdmin && (profile.role === "superadmin" || profile.role === "manager");

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
