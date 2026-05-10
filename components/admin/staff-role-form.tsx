"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { UserRole } from "@/lib/types";

export function StaffRoleForm({
  profile
}: {
  profile: {
    id: string;
    full_name: string | null;
    role: UserRole;
    created_at: string;
  };
}) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [role, setRole] = useState<UserRole>(profile.role);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/staff", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: profile.id,
        full_name: fullName,
        role
      })
    });
    setSaving(false);
  }

  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_180px_auto]">
      <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
      <Select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
        <option value="owner">Owner</option>
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
      </Select>
      <Button onClick={save} disabled={saving || !fullName.trim()}>
        <Save className="size-4" />
        {saving ? "Guardando" : "Guardar"}
      </Button>
    </div>
  );
}
