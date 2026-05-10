import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type DashboardCheckin = {
  id: string;
  scan_result: string;
  scan_message: string | null;
  scanned_at: string;
  gate_name: string | null;
  events?: { name: string } | null;
  tickets?: {
    buyer_name: string;
    buyer_lastname: string | null;
    buyer_email: string;
    ticket_types?: { name: string } | null;
  } | null;
};

export type DashboardData = {
  totalSold: number;
  currency: string;
  approvedOrders: number;
  soldTickets: number;
  usedTickets: number;
  pendingEntry: number;
  salesByType: Array<{
    id: string;
    name: string;
    count: number;
    amount: number;
    currency: string;
  }>;
  lastCheckins: DashboardCheckin[];
  repeatedAlerts: DashboardCheckin[];
};

export async function getAdminEvents() {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select(
      `
      *,
      ticket_types (
        id,
        name,
        price,
        currency,
        stock,
        sold_count,
        is_active
      )
    `
    )
    .order("event_date", { ascending: false });

  return data || [];
}

export async function getAdminEvent(eventId: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select(
      `
      *,
      ticket_types (
        id,
        event_id,
        name,
        description,
        price,
        currency,
        stock,
        sold_count,
        max_per_order,
        is_active,
        sale_starts_at,
        sale_ends_at,
        created_at
      )
    `
    )
    .eq("id", eventId)
    .maybeSingle();

  return data;
}

export async function getAdminTickets(eventId?: string) {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("tickets")
    .select(
      `
      *,
      events ( name ),
      ticket_types ( name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data } = await query;
  return data || [];
}

export async function getStaffProfiles() {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdminClient();

  const [ordersResult, ticketsResult, ticketTypesResult, checkinsResult] = await Promise.all([
    supabase.from("orders").select("id,total_amount,currency,payment_status,created_at"),
    supabase.from("tickets").select("id,status,event_id,ticket_type_id,created_at"),
    supabase.from("ticket_types").select("id,name,event_id,price,currency"),
    supabase
      .from("checkins")
      .select(
        `
        id,
        scan_result,
        scan_message,
        scanned_at,
        gate_name,
        events ( name ),
        tickets (
          buyer_name,
          buyer_lastname,
          buyer_email,
          ticket_types ( name )
        )
      `
      )
      .order("scanned_at", { ascending: false })
      .limit(30)
  ]);

  const approvedOrders = (ordersResult.data || []).filter(
    (order) => order.payment_status === "approved"
  );
  const tickets = ticketsResult.data || [];
  const ticketTypes = ticketTypesResult.data || [];
  const totalSold = approvedOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const usedTickets = tickets.filter((ticket) => ticket.status === "used").length;
  const soldTickets = tickets.filter((ticket) => ticket.status !== "pending_payment").length;
  const pendingEntry = tickets.filter((ticket) => ticket.status === "valid").length;

  const salesByType = ticketTypes.map((ticketType) => {
    const count = tickets.filter(
      (ticket) =>
        ticket.ticket_type_id === ticketType.id &&
        ["valid", "used"].includes(ticket.status)
    ).length;

    return {
      id: ticketType.id,
      name: ticketType.name,
      count,
      amount: count * ticketType.price,
      currency: ticketType.currency
    };
  });

  type RawCheckin = {
    id: string;
    scan_result: string;
    scan_message: string | null;
    scanned_at: string;
    gate_name: string | null;
    events?: { name: string } | { name: string }[] | null;
    tickets?:
      | {
          buyer_name: string;
          buyer_lastname: string | null;
          buyer_email: string;
          ticket_types?: { name: string } | { name: string }[] | null;
        }
      | Array<{
          buyer_name: string;
          buyer_lastname: string | null;
          buyer_email: string;
          ticket_types?: { name: string } | { name: string }[] | null;
        }>
      | null;
  };

  const lastCheckins: DashboardCheckin[] = ((checkinsResult.data || []) as unknown as RawCheckin[]).map(
    (checkin) => {
      const ticket = Array.isArray(checkin.tickets) ? checkin.tickets[0] || null : checkin.tickets;
      const ticketType = Array.isArray(ticket?.ticket_types)
        ? ticket.ticket_types[0] || null
        : ticket?.ticket_types || null;

      return {
        id: checkin.id,
        scan_result: checkin.scan_result,
        scan_message: checkin.scan_message,
        scanned_at: checkin.scanned_at,
        gate_name: checkin.gate_name,
        events: Array.isArray(checkin.events) ? checkin.events[0] || null : checkin.events || null,
        tickets: ticket
          ? {
              buyer_name: ticket.buyer_name,
              buyer_lastname: ticket.buyer_lastname,
              buyer_email: ticket.buyer_email,
              ticket_types: ticketType
            }
          : null
      };
    }
  );

  return {
    totalSold,
    currency: String(approvedOrders[0]?.currency || "UYU"),
    approvedOrders: approvedOrders.length,
    soldTickets,
    usedTickets,
    pendingEntry,
    salesByType,
    lastCheckins,
    repeatedAlerts: lastCheckins.filter((checkin) => checkin.scan_result === "used")
  };
}
