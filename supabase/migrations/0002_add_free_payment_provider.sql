alter table public.orders
drop constraint if exists orders_payment_provider_check;

alter table public.orders
add constraint orders_payment_provider_check
check (payment_provider in ('mercadopago', 'paypal', 'apple_pay', 'crypto', 'free'));
