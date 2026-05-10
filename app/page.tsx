import { AgeGatedLanding } from "@/components/home/age-gated-landing";
import { getPublishedEvents } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await getPublishedEvents();
  const nextEvent = events[0] || null;

  return <AgeGatedLanding event={nextEvent} />;
}
