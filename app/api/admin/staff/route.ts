import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  role: z.enum(["owner", "admin", "staff"])
});

export async function PATCH(request: Request) {
  const auth = await requireApiRole(["owner", "admin"]);

  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      role: parsed.data.role
    })
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
