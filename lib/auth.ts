import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
};

export type AuthContext = {
  user: User;
  profile: Profile;
};

export function isAdminRole(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function isStaffRole(role?: string | null) {
  return role === "owner" || role === "admin" || role === "staff";
}

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return { user, profile: profile as Profile };
}

export async function requireApiRole(roles: UserRole[]) {
  const context = await getCurrentAuthContext();

  if (!context) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 })
    };
  }

  if (!roles.includes(context.profile.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 })
    };
  }

  return { ok: true as const, context };
}

export async function requirePageRole(roles: UserRole[]) {
  const context = await getCurrentAuthContext();

  if (!context) {
    redirect("/login");
  }

  if (!roles.includes(context.profile.role)) {
    redirect("/admin/checkin");
  }

  return context;
}
