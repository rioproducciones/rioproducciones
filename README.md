# Rio Producciones Tickets / Rio Access

MVP mobile-first para venta de entradas online con Mercado Pago Checkout Pro, QR único por ticket y control de acceso en tiempo real con Supabase.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Postgres, Auth, RLS y Realtime
- Mercado Pago Checkout Pro
- QR por ticket con token largo no enumerable
- Apple Wallet pkpass opcional para entradas QR
- Scanner mobile para staff con cámara

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí `http://localhost:3000`.

## Supabase

1. Crear proyecto en Supabase.
2. Copiar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.
3. Ejecutar la migración:

```bash
supabase db push
```

O pegar `supabase/migrations/0001_initial_schema.sql` en el SQL editor.

4. Ejecutar seed:

```bash
supabase db seed
```

O pegar `supabase/seed.sql` en el SQL editor.

5. Crear usuarios de staff/admin en Supabase Auth. Luego insertar perfil:

```sql
insert into public.profiles (id, full_name, role)
values ('AUTH_USER_ID', 'Rio Admin', 'owner');
```

Roles soportados: `owner`, `admin`, `staff`.

## Mercado Pago

1. Crear credenciales de prueba en Mercado Pago Developers.
2. Configurar `MERCADOPAGO_ACCESS_TOKEN`.
3. Configurar `NEXT_PUBLIC_SITE_URL` con la URL pública HTTPS. Para desarrollo local de webhooks usá ngrok o un túnel equivalente.
4. El backend crea la preferencia en:

```text
POST /api/payments/mercadopago/create-preference
```

5. El webhook recibe notificaciones en:

```text
POST /api/webhooks/mercadopago
```

El webhook no confía en redirects del frontend: consulta el pago real en Mercado Pago, verifica `status = approved`, marca la orden como `approved`, guarda `mercadopago_payment_id` y genera tickets.

## Probar compra

1. Entrar a `/eventos`.
2. Abrir `Rio Producciones Opening Night`.
3. Seleccionar entradas y completar datos.
4. Continuar a `/checkout/[orderId]`.
5. Pagar con Mercado Pago en modo test.
6. Volver a `/checkout/success?order_id=...`.
7. Si el webhook tarda, la pantalla muestra confirmación pendiente y permite refrescar.
8. Cuando el webhook aprueba la orden, aparecen los links a `/ticket/[token]`.

## Apple Wallet pkpass

Cada entrada puede descargarse como `.pkpass` desde:

```text
GET /api/tickets/[token]/wallet
```

El botón `Agregar a Wallet` aparece en `/ticket/[token]` cuando están configuradas las credenciales de PassKit:

- `PASSKIT_PASS_TYPE_IDENTIFIER`
- `PASSKIT_TEAM_IDENTIFIER`
- `PASSKIT_WWDR_CERT` o `PASSKIT_WWDR_CERT_PATH`
- `PASSKIT_SIGNER_CERT` o `PASSKIT_SIGNER_CERT_PATH`
- `PASSKIT_SIGNER_KEY` o `PASSKIT_SIGNER_KEY_PATH`
- `PASSKIT_SIGNER_KEY_PASSPHRASE` si la clave tiene passphrase

Los certificados deben venir del Apple Developer Program. El QR del pass usa la misma URL segura de la entrada, por lo que el check-in sigue validando contra Supabase.

## Probar check-in

1. Iniciar sesión en `/login` con un usuario con perfil `staff`, `admin` u `owner`.
2. Entrar a `/admin/checkin`.
3. Elegir evento y escanear el QR desde un celular.
4. Si la entrada es válida, confirmar ingreso.
5. El ticket pasa a `used` de forma atómica mediante `confirm_ticket_checkin`.
6. Si se escanea el mismo QR otra vez, aparece `Entrada ya utilizada`.

También existe búsqueda manual en `/admin/checkin/manual` por nombre, email, teléfono, documento o token.

## Rutas principales

- `/`
- `/eventos`
- `/evento/[slug]`
- `/checkout/[orderId]`
- `/checkout/success`
- `/checkout/failure`
- `/checkout/pending`
- `/ticket/[token]`
- `/admin`
- `/admin/eventos`
- `/admin/eventos/nuevo`
- `/admin/eventos/[id]`
- `/admin/eventos/[id]/editar`
- `/admin/eventos/[id]/tickets`
- `/admin/checkin`
- `/admin/checkin/manual`
- `/admin/staff`
- `/admin/reportes`

## Seguridad

- La service role solo se usa en server-side code.
- El cliente nunca inserta órdenes directo en Supabase.
- RLS habilitado en todas las tablas.
- Eventos publicados y tipos activos son públicos.
- Tickets no son listables públicamente.
- `/ticket/[token]` devuelve solo campos seguros desde servidor.
- Inputs validados con Zod.
- QR contiene solo URL con token, sin datos personales ni precio.

## Apple Pay futuro

La arquitectura ya reserva `payment_provider = apple_pay`, pero el botón está desactivado. Para implementarlo faltan:

- Apple Developer Merchant ID
- dominio verificado
- HTTPS
- merchant validation server-side
- procesador compatible para procesar el token de Apple Pay

## Crypto futuro

La arquitectura reserva `payment_provider = crypto`. Queda pendiente futura integración Web3 wallet / USDT.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
```
