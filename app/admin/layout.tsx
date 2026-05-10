import { AdminShell } from "@/components/layout/admin-shell";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requirePageRole(["owner", "admin", "staff"]);

  return (
    <AdminShell fullName={profile.full_name} role={profile.role}>
      {children}
    </AdminShell>
  );
}
