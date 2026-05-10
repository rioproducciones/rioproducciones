insert into public.events (
  name,
  slug,
  description,
  event_date,
  location,
  cover_image_url,
  status
)
values (
  'Rio Producciones Opening Night',
  'rio-producciones-opening-night',
  'Una noche de apertura con sonido electrónico, visuales inmersivas y acceso digital por QR.',
  now() + interval '90 days',
  'Montevideo, Uruguay',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80',
  'published'
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  event_date = excluded.event_date,
  location = excluded.location,
  cover_image_url = excluded.cover_image_url,
  status = excluded.status
returning id;

with event_row as (
  select id from public.events where slug = 'rio-producciones-opening-night'
)
insert into public.ticket_types (
  event_id,
  name,
  description,
  price,
  currency,
  stock,
  max_per_order,
  is_active
)
select event_row.id, ticket.name, ticket.description, ticket.price, 'UYU', ticket.stock, ticket.max_per_order, true
from event_row,
  (values
    ('Early Bird', 'Cupo inicial limitado.', 800, 100, 4),
    ('General', 'Acceso general al evento.', 1200, 300, 10),
    ('VIP', 'Acceso preferencial y sector VIP.', 2500, 50, 6)
  ) as ticket(name, description, price, stock, max_per_order)
where not exists (
  select 1
  from public.ticket_types tt
  where tt.event_id = event_row.id
    and tt.name = ticket.name
);
