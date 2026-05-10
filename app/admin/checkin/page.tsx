import { CheckinClient } from "@/components/checkin/checkin-client";
import { getAdminEvents } from "@/lib/admin-data";

export default async function CheckinPage() {
  const events = await getAdminEvents();

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Puerta</p>
        <h1 className="mt-2 text-3xl font-black">Check-in QR</h1>
      </div>
      <CheckinClient events={events.map((event) => ({ id: event.id, name: event.name }))} />
    </div>
  );
}
