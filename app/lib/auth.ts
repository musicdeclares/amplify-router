import { createClient } from "@supabase/supabase-js";
import { Database } from "@/app/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type UserRole = "admin" | "staff" | "artist";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  artistId: string | null;
}

// Create a Supabase client for auth operations (uses anon key + user session)
export function createAuthClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Sign in with email and password
export async function signIn(
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = createAuthClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return { user: null, error: authError?.message || "Sign in failed" };
  }

  // Fetch user role from router_users table
  const { data: routerUser, error: userError } = (await supabase
    .from("router_users")
    .select("role, artist_id, enabled")
    .eq("id", authData.user.id)
    .single()) as {
    data: { role: string; artist_id: string | null; enabled: boolean } | null;
    error: unknown;
  };

  if (userError || !routerUser) {
    return { user: null, error: "User not found in router system" };
  }

  if (!routerUser.enabled) {
    await supabase.auth.signOut();
    return { user: null, error: "Account is deactivated" };
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email!,
      role: routerUser.role as UserRole,
      artistId: routerUser.artist_id,
    },
    error: null,
  };
}

// Sign out
export async function signOut(): Promise<void> {
  const supabase = createAuthClient();
  await supabase.auth.signOut();
}

// Get current session
export async function getSession(): Promise<AuthUser | null> {
  const supabase = createAuthClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return null;
  }

  // Fetch user role from router_users table
  const { data: routerUser, error: userError } = (await supabase
    .from("router_users")
    .select("role, artist_id, enabled")
    .eq("id", session.user.id)
    .single()) as {
    data: { role: string; artist_id: string | null; enabled: boolean } | null;
    error: unknown;
  };

  if (userError || !routerUser || !routerUser.enabled) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    role: routerUser.role as UserRole,
    artistId: routerUser.artist_id,
  };
}

// Request password reset
export async function resetPassword(
  email: string,
): Promise<{ error: string | null }> {
  const supabase = createAuthClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Update password (after reset)
export async function updatePassword(
  newPassword: string,
): Promise<{ error: string | null }> {
  const supabase = createAuthClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Check if user has required role
export function hasRole(
  user: AuthUser | null,
  requiredRoles: UserRole[],
): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

// Check if user is staff (admin or staff)
export function isStaff(user: AuthUser | null): boolean {
  return user?.role === "admin" || user?.role === "staff";
}

// Check if user can access artist-specific data
export function canAccessArtist(
  user: AuthUser | null,
  artistId: string,
): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  return user.artistId === artistId;
}
