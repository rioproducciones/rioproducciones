import { ManualSearch } from "@/components/checkin/manual-search";
import { getAdminEvents } from "@/lib/admin-data";

export default async function ManualCheckinPage() {
  const events = await getAdminEvents();

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Puerta</p>
        <h1 className="mt-2 text-3xl font-black">Búsqueda manual</h1>
      </div>
      <ManualSearch events={events.map((event) => ({ id: event.id, name: event.name }))} />
    </div>
  );
}
