export type UserRole = "owner" | "admin" | "staff";

export type EventStatus = "draft" | "published" | "archived";

export type PaymentProvider = "mercadopago" | "paypal" | "apple_pay" | "crypto";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "expired";

export type TicketStatus =
  | "pending_payment"
  | "valid"
  | "used"
  | "cancelled"
  | "refunded"
  | "blocked";

export type CheckinScanResult =
  | "valid"
  | "used"
  | "invalid"
  | "wrong_event"
  | "blocked"
  | "cancelled"
  | "refunded";

export type PublishedEvent = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  event_date: string;
  location: string | null;
  cover_image_url: string | null;
  status: EventStatus;
};

export type TicketType = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  sold_count: number;
  max_per_order: number;
  is_active: boolean;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
};

export type SafeTicket = {
  id: string;
  event_id: string;
  qr_token: string;
  status: TicketStatus;
  buyer_name: string;
  buyer_lastname: string | null;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string | null;
  used_at: string | null;
  event_name: string;
  ticket_type_name: string;
};
