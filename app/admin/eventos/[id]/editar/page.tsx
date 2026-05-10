import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { getAdminEvent } from "@/lib/admin-data";
import { requirePageRole } from "@/lib/auth";

export default async function EditEventPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["owner", "admin"]);
  const { id } = await params;
  const event = await getAdminEvent(id);

  if (!event) notFound();

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Editar evento</h1>
      </div>
      <EventForm initialEvent={event} />
    </div>
  );
}
