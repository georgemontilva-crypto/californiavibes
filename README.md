# California Vibes — Premium Botanicals

Tienda de la marca (CBG Flower, Pre-Rolls y Disposables, 6 cepas cada una) con
carrito, checkout, pedidos, reportes de laboratorio y un panel para manejarlo
todo. El botón **LAB REPORTS** del menú abre la carpeta de Dropbox con todos los
COA (el link se cambia en `/admin/store`).

| Ruta | Qué es |
|---|---|
| `/` | Home: atardecer con los 3 formatos (o el video destacado), selector de cepa, formatos, reels, lab reports y preguntas |
| `/products` | Todos los productos, con filtro por formato y por cepa, y botón Add |
| `/products/:slug` | Un producto: foto, precio, cantidad, Add to cart, facts, reporte y otros formatos de la misma cepa |
| `/checkout` | Datos de envío, pago (tarjeta con Authorize.net o "pago por email") y resumen |
| `/order/:number` | Confirmación del pedido |
| `/lab-reports` | Reportes subidos desde el panel, por producto, más el botón a Dropbox |
| `/about` | About Us |
| `/contact` | Contact Us: formulario + datos de la empresa |
| `/admin` | Panel: pedidos, productos y precios, lab reports, videos, mensajes, ajustes de tienda, contacto, admins |

El sitio pide confirmar 21+ en la primera visita (se recuerda en el dispositivo).

## Stack

React 19 + Vite + wouter · tRPC 11 + Express · Drizzle ORM + MySQL ·
Cloudflare R2 · Tailwind 4 · Authorize.net (Accept.js) · Resend · Railway.
Tipografías autoalojadas (Anton, Kaushan Script y Manrope), sin Google Fonts.

## Diseño

Sale de los empaques: atardecer con sol de franjas y palmeras negras, la franja
holográfica arcoíris del frasco, el logo en script con degradado, el loto y el
texto de etiqueta en dorado. Cada cepa tiene **su color** (el de su pouch):
cada producto guarda `accentColor` y la página lo toma por la variable CSS
`--accent`.

---

## Variables de entorno

| Variable | Para qué | Obligatoria |
|---|---|---|
| `DATABASE_URL` | MySQL. En Railway: `${{MySQL.MYSQL_URL}}` | Sí |
| `JWT_SECRET` | Firma de la sesión del admin. Larga y aleatoria | Sí |
| `ADMIN_SETUP_TOKEN` | Secreto para crear el **primer** admin. Borrarla después | Sí, al inicio |
| `SEED_CATALOG` | `true` carga los 18 productos al arrancar. Borrarla después | Solo la primera vez |
| `R2_ACCOUNT_ID` | Cloudflare R2 | Para subir archivos |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 | Para subir archivos |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | Para subir archivos |
| `R2_BUCKET` | Nombre del bucket | Para subir archivos |
| `R2_PUBLIC_URL` | URL pública del bucket, sin barra final | Para subir archivos |
| `AUTHNET_API_LOGIN_ID` | Authorize.net: API Login ID | Para cobrar con tarjeta |
| `AUTHNET_TRANSACTION_KEY` | Authorize.net: Transaction Key | Para cobrar con tarjeta |
| `AUTHNET_CLIENT_KEY` | Authorize.net: Public Client Key | Para cobrar con tarjeta |
| `AUTHNET_ENV` | `production` (o `sandbox` para pruebas) | Para cobrar con tarjeta |
| `RESEND_API_KEY` | Emails de pedidos y de contacto | No |
| `RESEND_FROM_EMAIL` | Remitente en un dominio verificado en Resend | No |
| `CONTACT_TO_EMAIL` | A dónde llegan los avisos de pedidos y mensajes | No |
| `PORT` | Lo inyecta Railway | No |

Sin las de R2 el sitio funciona igual; lo único que no se puede es **subir**
archivos (los reportes se pueden enlazar por URL mientras tanto).

Sin las de Resend los mensajes y pedidos se guardan y se ven en el panel;
simplemente no llega email (ni al cliente ni a ustedes).

**Pagos:** sin las cuatro `AUTHNET_…` la tienda igual recibe pedidos, en estado
"Awaiting payment", y ustedes coordinan el pago por email. Con ellas, el
checkout muestra el formulario de tarjeta y cobra en el momento (la tarjeta va
directo de navegador a Authorize.net, nunca pasa por el servidor). El Public
Client Key se genera en Authorize.net → Account → Security Settings → Manage
Public Client Key.

---

## Desplegar en Railway

1. **New Project → Deploy from GitHub repo** → `georgemontilva-crypto/californiavibes`.
2. En el mismo proyecto: **New → Database → MySQL**.
3. En el servicio web, pestaña **Variables**, crear:
   - `DATABASE_URL` = `${{MySQL.MYSQL_URL}}`
   - `JWT_SECRET` = una cadena larga y aleatoria
   - `ADMIN_SETUP_TOKEN` = otra cadena larga y aleatoria (apúntala, se usa en el paso 6)
   - `SEED_CATALOG` = `true`
   - las cinco `R2_…`
4. Esperar el deploy. En los logs debe salir:
   `[Migrations] Database is up to date.` y `[Seed] Done. 18 product(s) added.`
5. **Settings → Networking → Generate Domain** (o conectar el dominio propio).
6. Abrir `https://TU-DOMINIO/admin/login`, pegar el `ADMIN_SETUP_TOKEN` y crear
   la cuenta de admin.
7. Volver a **Variables** y **borrar** `ADMIN_SETUP_TOKEN` y `SEED_CATALOG`.

Las migraciones se aplican solas en cada arranque (`server/migrate.ts`); no hay
que correr nada a mano contra la base.

### CORS del bucket de R2 (necesario para los videos)

Los PDF y las fotos suben aunque el bucket no tenga CORS (pasan por el servidor
como respaldo, hasta 30 MB). Los videos de más de 30 MB solo pueden subir
directo del navegador a R2, y para eso el bucket tiene que permitirlo.

Cloudflare → R2 → el bucket → **Settings → CORS Policy → Edit**, y pegar
(cambiando el dominio):

```json
[
  {
    "AllowedOrigins": ["https://TU-DOMINIO", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Conecta el dominio propio del bucket **antes** de subir archivos de producción:
las URLs se guardan completas en la base. Si `R2_PUBLIC_URL` cambia después, el
botón **Repair file links** de `/admin/lab-reports` las reescribe.

---

## Uso del panel

- **Orders**: cada pedido con productos, cliente, dirección y pago. Cambia el
  estado (Paid, Shipped…) y pon el número de tracking; al pasarlo a *Shipped* se
  le manda email al cliente (si Resend está configurado).
- **Products**: nombre, formato, color, **precio**, precio tachado, stock,
  descripción, facts y foto. Los precios que vienen cargados son **de ejemplo**.
- **Lab Reports**: elegir el producto y subir el PDF. Sale en la página del
  producto y en `/lab-reports`.
- **Videos**: clips verticales (9:16) en MP4. El marcado con estrella sale en el
  hero del Home; los demás, en la sección "Catch the vibes".
- **Store settings**: link del botón LAB REPORTS (Dropbox), envío fijo, envío
  gratis desde, y estados a los que no se envía.
- **Messages** / **Contact details** / **Admin users**: igual que siempre.

---

## Desarrollo local

```bash
pnpm install
cp .env.example .env      # y rellenar
pnpm dev                  # http://localhost:3000
```

```bash
pnpm check                # tsc --noEmit
pnpm test                 # vitest
pnpm build                # cliente + bundle del servidor
pnpm seed                 # carga los 18 productos (necesita DATABASE_URL)
```

### Cambiar el esquema

**No uses `drizzle-kit push`**: compara el esquema vivo contra `schema.ts` y
ofrece truncar tablas cuando ve una diferencia que no sabe reconciliar.

```bash
# 1. editar drizzle/schema.ts
# 2. generar el SQL
DATABASE_URL="mysql://x:y@localhost:3306/z" npx drizzle-kit generate --name descripcion_del_cambio
# 3. commitear el .sql generado junto con el cambio de schema.ts
```

El siguiente deploy lo aplica solo.

---

## Dónde está cada cosa

| | |
|---|---|
| `client/public/products/` | Las 18 fotos de producto (recortadas, fondo transparente) |
| `client/src/components/Logo.tsx` | Loto, logo en script y palmeras (SVG) |
| `client/src/index.css` | Sistema visual: atardecer, holográfico, dorado, botones |
| `client/src/lib/cart.tsx` | Carrito (en el navegador) |
| `server/routers/store.ts` | Checkout, pedidos y ajustes de tienda |
| `server/payments.ts` | Authorize.net |
| `shared/lines.ts` | Los tres formatos: orden y textos |
| `shared/store.ts` | Dinero, envío, estados de EE. UU. |
| `server/seed.ts` | Los 18 productos: nombre, color, precio de ejemplo, facts |
| `drizzle/schema.ts` | Tablas |
