import { EventForm } from "@/components/admin/event-form";
import { requirePageRole } from "@/lib/auth";

export default async function NewEventPage() {
  await requirePageRole(["owner", "admin"]);

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Nuevo evento</h1>
      </div>
      <EventForm />
    </div>
  );
}
