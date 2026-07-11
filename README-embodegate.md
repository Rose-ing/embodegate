# embodegate — guía de armado del MVP

Directorio de las bodegas de Mendoza con filtros, buscador en lenguaje natural y link a Google. Proyecto independiente, pensado para **bajo costo y bajo mantenimiento**: sin servidor prendido, catálogo en archivos, hosting gratis.

> **Alcance del MVP (esta versión):** catálogo + filtros + buscador NL + link a Google + banner + Cafecito. **Sin reseñas nativas** (eso es fase 2).

---

## Stack

- **Next.js (App Router) + TypeScript** — hosting gratis en Vercel, SEO de fábrica, sin servidor que mantener.
- **Catálogo en archivo** (`data/bodegas.ts`) — única fuente de verdad. Actualizar = editar y push.
- **Tailwind** (opcional pero recomendado) para portar los estilos de la maqueta rápido.
- **Una API route** para el buscador en lenguaje natural (llama a OpenRouter con la key en el servidor; modelo gratis con fallback pago baratísimo).

No usar el stack de deMas (Express + Prisma + Postgres + Railway): es un servidor 24/7 que se paga corra o no corra gente, innecesario para un sitio casi todo de lectura.

---

## Estructura de carpetas

```
embodegate/
├─ app/
│  ├─ layout.tsx           # <head>, fuentes (Fraunces + Hanken Grotesk), metadata global SEO
│  ├─ page.tsx             # home: header + filtros + grilla (server component que pasa BODEGAS al cliente)
│  ├─ Catalogo.tsx         # 'use client' — estado de filtros, buscador, grilla de cards
│  ├─ bodega/[slug]/page.tsx  # ficha individual (SEO) — opcional para el MVP, recomendado
│  └─ api/
│     └─ search/route.ts   # POST: texto libre → JSON de filtros (OpenRouter)
├─ data/
│  └─ bodegas.ts           # el catálogo (ya armado, ver archivo aparte)
├─ public/
│  └─ bodegas/             # fotos representativas (o usar Cloudinary)
├─ .env.local              # OPENROUTER_API_KEY=...
└─ package.json
```

---

## Setup

```bash
npx create-next-app@latest embodegate --typescript --tailwind --app
cd embodegate
# copiar data/bodegas.ts al repo
echo "OPENROUTER_API_KEY=tu_key" > .env.local
```

La maqueta `embodegate.html` es la **referencia visual y de comportamiento**: la paleta (malbec #6A1B47, oliva, ámbar), las fuentes, las cards, el modal y la lógica de filtros ya están resueltos ahí. Portar, no reinventar.

---

## La lógica de filtrado (cliente)

Vive en `Catalogo.tsx`. Es la misma de la maqueta. El estado:

```ts
type State = {
  zona: Zona | "todas";
  planes: Set<Plan>;
  vista: boolean;        // "con linda vista" → vista >= 4
  budget: number;        // MAX = sin límite
  sort: "popular" | "rating" | "price-asc" | "price-desc";
};
```

Una bodega entra si: coincide zona, ofrece al menos uno de los planes marcados, su `vista >= 4` si el filtro está activo, y su precio relevante ≤ presupuesto. Orden por defecto: `pop` descendente (más buscadas primero). En el MVP `sort: "rating"` puede quedar como alias de `pop` hasta que haya reseñas.

**En las cards del MVP** (sin reseñas todavía): imagen, nombre, zona, `vista` (research), planes, precio desde, y el botón **"Ver reseñas en Google ↗"** (`googleMapsUrl(b)`). No se muestra número de comunidad porque todavía no existe; el de Google va como link, no como número guardado.

---

## El buscador en lenguaje natural

`app/api/search/route.ts` — recibe el texto, se lo manda a **OpenRouter** (fetch directo, sin SDK) para traducirlo a filtros, devuelve JSON. El cliente aplica esos filtros con la misma lógica de arriba. Ver el archivo para el prompt completo.

Cadena de modelos (OpenRouter hace el fallback automáticamente con el parámetro `models`):

1. `qwen/qwen3-next-80b-a3b-instruct:free` — gratis.
2. `meta-llama/llama-3.1-8b-instruct` — ~US$0.02/M tokens; solo se usa si el gratis está saturado. Fracciones de centavo por búsqueda.

Mantené el **intérprete local** de la maqueta (`parseLocal`) como fallback en el cliente: si la API falla o tarda, igual filtra. Así el buscador nunca queda colgado.

---

## SEO (importante — es de donde va a venir el tráfico)

- Cada bodega con su ruta `/bodega/[slug]` y `generateMetadata` (título, descripción, og:image).
- `metadata` global en `layout.tsx`: título tipo "Bodegas de Mendoza — embodegate", descripción, idioma es-AR.
- Generar un `sitemap.xml` (Next lo soporta nativo con `app/sitemap.ts`) listando todas las bodegas.
- Texto real en cada ficha: la `descripcion` ayuda a rankear para "bodega X Mendoza".

---

## Datos: cómo llegar a las 230

1. **Cobertura primero.** Sacá el listado de la Dirección de Turismo de Mendoza / Wines of Argentina. Cargá cada bodega con lo mínimo: `nombre`, `zona`, `ubicacion`, `placeId` (opcional), `detalleCargado: false`.
2. **place_id (opcional, gratis).** El SKU "IDs Only" de Google no se cobra. Una pasada de script con la Places API te trae los place_id sin costo, y los podés guardar para siempre.
3. **Profundidad después.** Solo en las ~25 más buscadas cargás precios, planes, `vista` y foto, y poné `detalleCargado: true`. El resto queda abajo en el orden por `pop` y nadie nota nada.

La frecuencia de actualización: las top, cada 2-3 semanas; el resto, cuando puedas. No te esclavices con las 230.

---

## Deploy

1. Push a GitHub → importar en **Vercel** (free). Cargá `OPENROUTER_API_KEY` en las env vars de Vercel.
2. Apuntá **embodegate.com** a Vercel (registro del dominio + DNS).
3. **Monetización:**
   - Tu link de **Cafecito** en el header y footer (ya está en la maqueta).
   - **Google AdSense** en el slot "Espacio destacado" (rinde poco con tráfico de nicho — esperalo modesto).
   - El mejor ingreso a futuro: vender ese mismo slot a una bodega/agencia que quiera destacarse.
4. Términos de Uso + Política de Privacidad públicas (las pide Google para usar la Places API / Maps).

---

## Fase 2: reseñas nativas (implementada, requiere configurar Supabase)

El código ya está: `app/bodega/[slug]/Resenas.tsx` (client-side puro, el sitio
sigue siendo estático) + `supabase/schema.sql`. Sin configurar, las fichas
muestran un teaser y nada se rompe. Para activarlas:

1. Crear un proyecto gratis en [supabase.com](https://supabase.com).
2. Correr `supabase/schema.sql` en el SQL Editor (crea la tabla `resenas` con
   RLS y el bucket de fotos).
3. Authentication → Providers → habilitar **Google** (client id/secret de
   Google Cloud Console) y agregar el dominio en Redirect URLs.
4. En `.env.local` y en Vercel:
   `NEXT_PUBLIC_SUPABASE_URL=...` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
   (la anon key es pública por diseño; la seguridad la da RLS).

El formulario tiene las dimensiones de la maqueta: plan (solo los que la
bodega ofrece), vista con "sin vista a viñedos", calidad-precio, servicio,
comida, precio real pagado, cómo llegó, comentario y hasta 3 fotos. Una
reseña por usuario/bodega/plan (upsert).

## Roadmap (después de fase 2)

- **Rating de comunidad en las cards** de la home, al lado del link a Google
  (requiere agregación: vista materializada en Supabase o fetch batcheado).
- **Moderación**: hoy el borrado es solo del autor; sumar reporte + revisión.
