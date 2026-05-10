import { StaffRoleForm } from "@/components/admin/staff-role-form";
import { getStaffProfiles } from "@/lib/admin-data";
import { requirePageRole } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export default async function StaffPage() {
  await requirePageRole(["owner", "admin"]);
  const profiles = await getStaffProfiles();

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Staff</h1>
        <p className="mt-2 text-sm text-white/[0.55]">
          Creá usuarios desde Supabase Auth y luego asignales rol en profiles.
        </p>
      </div>
      <div className="grid gap-3">
        {(profiles as ProfileRow[]).map((profile) => (
          <StaffRoleForm key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
}
