create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  event_date timestamptz not null,
  location text,
  cover_image_url text,
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  price integer not null check (price >= 0),
  currency text not null default 'UYU',
  stock integer not null check (stock >= 0),
  sold_count integer not null default 0 check (sold_count >= 0),
  max_per_order integer not null default 10 check (max_per_order > 0),
  is_active boolean not null default true,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id),
  buyer_name text not null,
  buyer_lastname text,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_document text,
  total_amount integer not null check (total_amount >= 0),
  currency text not null default 'UYU',
  payment_provider text not null check (payment_provider in ('mercadopago', 'paypal', 'apple_pay', 'crypto')) default 'mercadopago',
  payment_status text not null check (payment_status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'expired')) default 'pending',
  mercadopago_payment_id text,
  mercadopago_preference_id text,
  external_reference text unique,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_type_id uuid references public.ticket_types(id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  subtotal integer not null check (subtotal >= 0)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_type_id uuid references public.ticket_types(id),
  buyer_name text not null,
  buyer_lastname text,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_document text,
  qr_token text unique not null,
  status text not null check (status in ('pending_payment', 'valid', 'used', 'cancelled', 'refunded', 'blocked')) default 'pending_payment',
  used_at timestamptz,
  used_by uuid references auth.users(id),
  blocked_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id),
  event_id uuid references public.events(id),
  scanned_by uuid references auth.users(id),
  scan_result text not null check (scan_result in ('valid', 'used', 'invalid', 'wrong_event', 'blocked', 'cancelled', 'refunded')),
  scan_message text,
  gate_name text,
  device_info text,
  scanned_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text,
  external_id text,
  payload jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_tickets_qr_token on public.tickets(qr_token);
create index if not exists idx_tickets_event_status on public.tickets(event_id, status);
create index if not exists idx_orders_external_reference on public.orders(external_reference);
create index if not exists idx_orders_mercadopago_payment_id on public.orders(mercadopago_payment_id);
create index if not exists idx_checkins_event_id on public.checkins(event_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_ticket_types_event_id on public.ticket_types(event_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('owner', 'admin'), false)
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('owner', 'admin', 'staff'), false)
$$;

create or replace function public.increment_ticket_type_sold_count(p_ticket_type_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ticket_types
  set sold_count = sold_count + p_quantity
  where id = p_ticket_type_id;
end;
$$;

create or replace function public.confirm_ticket_checkin(
  p_token text,
  p_event_id uuid,
  p_staff_id uuid,
  p_gate_name text default null,
  p_device_info text default null
)
returns table (
  ticket_id uuid,
  event_id uuid,
  ticket_status text,
  used_at timestamptz,
  buyer_name text,
  buyer_lastname text,
  buyer_email text,
  buyer_phone text,
  buyer_document text,
  ticket_type_name text,
  event_name text,
  scan_result text,
  scan_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_ticket public.tickets%rowtype;
  found_ticket record;
  result_value text;
  message_value text;
begin
  update public.tickets t
  set status = 'used',
      used_at = now(),
      used_by = p_staff_id
  where t.qr_token = p_token
    and t.event_id = p_event_id
    and t.status = 'valid'
  returning * into updated_ticket;

  if found then
    insert into public.checkins (
      ticket_id,
      event_id,
      scanned_by,
      scan_result,
      scan_message,
      gate_name,
      device_info
    )
    values (
      updated_ticket.id,
      updated_ticket.event_id,
      p_staff_id,
      'valid',
      'Ingreso confirmado',
      p_gate_name,
      p_device_info
    );

    return query
      select
        updated_ticket.id,
        updated_ticket.event_id,
        updated_ticket.status,
        updated_ticket.used_at,
        updated_ticket.buyer_name,
        updated_ticket.buyer_lastname,
        updated_ticket.buyer_email,
        updated_ticket.buyer_phone,
        updated_ticket.buyer_document,
        tt.name,
        e.name,
        'valid'::text,
        'Ingreso confirmado'::text
      from public.ticket_types tt
      join public.events e on e.id = updated_ticket.event_id
      where tt.id = updated_ticket.ticket_type_id;
    return;
  end if;

  select
    t.*,
    tt.name as ticket_type_name,
    e.name as event_name
  into found_ticket
  from public.tickets t
  left join public.ticket_types tt on tt.id = t.ticket_type_id
  left join public.events e on e.id = t.event_id
  where t.qr_token = p_token
  limit 1;

  if not found then
    insert into public.checkins (
      event_id,
      scanned_by,
      scan_result,
      scan_message,
      gate_name,
      device_info
    )
    values (
      p_event_id,
      p_staff_id,
      'invalid',
      'QR inválido',
      p_gate_name,
      p_device_info
    );
    return;
  end if;

  if found_ticket.event_id <> p_event_id then
    result_value := 'wrong_event';
    message_value := 'Entrada no válida para este evento';
  elsif found_ticket.status = 'used' then
    result_value := 'used';
    message_value := 'Entrada ya utilizada';
  elsif found_ticket.status in ('blocked', 'cancelled', 'refunded') then
    result_value := found_ticket.status;
    message_value := 'Entrada no habilitada';
  else
    result_value := 'invalid';
    message_value := 'Entrada no habilitada';
  end if;

  insert into public.checkins (
    ticket_id,
    event_id,
    scanned_by,
    scan_result,
    scan_message,
    gate_name,
    device_info
  )
  values (
    found_ticket.id,
    p_event_id,
    p_staff_id,
    result_value,
    message_value,
    p_gate_name,
    p_device_info
  );

  return query
    select
      found_ticket.id,
      found_ticket.event_id,
      found_ticket.status,
      found_ticket.used_at,
      found_ticket.buyer_name,
      found_ticket.buyer_lastname,
      found_ticket.buyer_email,
      found_ticket.buyer_phone,
      found_ticket.buyer_document,
      found_ticket.ticket_type_name,
      found_ticket.event_name,
      result_value,
      message_value;
end;
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tickets enable row level security;
alter table public.checkins enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "profiles readable by owner or self" on public.profiles;
create policy "profiles readable by owner or self"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles manageable by admins" on public.profiles;
create policy "profiles manageable by admins"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "published events are public" on public.events;
create policy "published events are public"
on public.events for select
to anon, authenticated
using (status = 'published' or public.is_staff());

drop policy if exists "events manageable by admins" on public.events;
create policy "events manageable by admins"
on public.events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active ticket types are public" on public.ticket_types;
create policy "active ticket types are public"
on public.ticket_types for select
to anon, authenticated
using (
  public.is_staff()
  or (
    is_active = true
    and exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and e.status = 'published'
    )
  )
);

drop policy if exists "ticket types manageable by admins" on public.ticket_types;
create policy "ticket types manageable by admins"
on public.ticket_types for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders readable by admins" on public.orders;
create policy "orders readable by admins"
on public.orders for select
to authenticated
using (public.is_admin());

drop policy if exists "orders manageable by admins" on public.orders;
create policy "orders manageable by admins"
on public.orders for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order items readable by admins" on public.order_items;
create policy "order items readable by admins"
on public.order_items for select
to authenticated
using (public.is_admin());

drop policy if exists "order items manageable by admins" on public.order_items;
create policy "order items manageable by admins"
on public.order_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tickets readable by staff" on public.tickets;
create policy "tickets readable by staff"
on public.tickets for select
to authenticated
using (public.is_staff());

drop policy if exists "tickets manageable by admins" on public.tickets;
create policy "tickets manageable by admins"
on public.tickets for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "checkins readable by staff" on public.checkins;
create policy "checkins readable by staff"
on public.checkins for select
to authenticated
using (public.is_staff());

drop policy if exists "checkins insertable by staff" on public.checkins;
create policy "checkins insertable by staff"
on public.checkins for insert
to authenticated
with check (public.is_staff());

drop policy if exists "payment events readable by admins" on public.payment_events;
create policy "payment events readable by admins"
on public.payment_events for select
to authenticated
using (public.is_admin());

grant execute on function public.confirm_ticket_checkin(text, uuid, uuid, text, text) to service_role;
grant execute on function public.increment_ticket_type_sold_count(uuid, integer) to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'checkins'
  ) then
    alter publication supabase_realtime add table public.checkins;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
