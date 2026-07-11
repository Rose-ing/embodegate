# embodegate — guía de armado del MVP

Directorio de las bodegas de Mendoza con filtros, buscador en lenguaje natural y link a Google. Proyecto independiente, pensado para **bajo costo y bajo mantenimiento**: sin servidor prendido, catálogo en archivos, hosting gratis.

> **Alcance del MVP (esta versión):** catálogo + filtros + buscador NL + link a Google + banner + Cafecito. **Sin reseñas nativas** (eso es fase 2).

---

## Stack

- **Next.js (App Router) + TypeScript** — hosting gratis en Vercel, SEO de fábrica, sin servidor que mantener.
- **Catálogo en archivo** (`data/bodegas.ts`) — única fuente de verdad. Actualizar = editar y push.
- **Tailwind** (opcional pero recomendado) para portar los estilos de la maqueta rápido.
- **Una API route** para el buscador en lenguaje natural (llama a Claude con la key en el servidor).

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
│     └─ search/route.ts   # POST: texto libre → JSON de filtros (Claude)
├─ data/
│  └─ bodegas.ts           # el catálogo (ya armado, ver archivo aparte)
├─ public/
│  └─ bodegas/             # fotos representativas (o usar Cloudinary)
├─ .env.local              # ANTHROPIC_API_KEY=...
└─ package.json
```

---

## Setup

```bash
npx create-next-app@latest embodegate --typescript --tailwind --app
cd embodegate
npm i @anthropic-ai/sdk
# copiar data/bodegas.ts al repo
echo "ANTHROPIC_API_KEY=tu_key" > .env.local
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

`app/api/search/route.ts` — recibe el texto, le pide a Claude que lo traduzca a filtros, devuelve JSON. El cliente aplica esos filtros con la misma lógica de arriba.

```ts
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic(); // toma ANTHROPIC_API_KEY del env

const SYSTEM = `Sos un parser de búsqueda para un directorio de bodegas de Mendoza, Argentina.
Convertí el texto del usuario (español rioplatense, puede traer lunfardo) en un JSON con EXACTAMENTE estas claves:
{"zona":"lujan"|"maipu"|"uco"|"chacras"|"este"|"sur"|null,"planes":array de ["visita","degustacion","almuerzo","picnic","actividades"],"precio_max":número en pesos o null,"vista":true|false|null,"orden":"rating"|"price-asc"|"price-desc"|null}
"lucas"/"luca"/"mil"/"mangos"/"k" multiplican por mil (50 lucas = 50000). "barato"/"sin gastar una fortuna"/"económico" => orden "price-asc". "linda vista"/"con vista"/"paisaje" => vista true. "sin vista" => vista false. Valle de Uco incluye Tunuyán, Tupungato, Gualtallary, Altamira. Respondé SOLO el JSON, sin texto ni backticks.`;

export async function POST(req: Request) {
  const { q } = await req.json();
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", // barato y rápido; alcanza de sobra para parsear
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: q }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("");
    return Response.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch {
    return Response.json({ error: "parse_failed" }, { status: 200 });
  }
}
```

Mantené el **intérprete local** de la maqueta (`parseLocal`) como fallback en el cliente: si la API falla o tarda, igual filtra. Así el buscador nunca queda colgado.

> Costo: con Haiku, cada búsqueda son fracciones de centavo. Se puede cachear en memoria las queries repetidas si querés bajarlo a casi nada.

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

1. Push a GitHub → importar en **Vercel** (free). Cargá `ANTHROPIC_API_KEY` en las env vars de Vercel.
2. Apuntá **embodegate.com** a Vercel (registro del dominio + DNS).
3. **Monetización:**
   - Tu link de **Cafecito** en el header y footer (ya está en la maqueta).
   - **Google AdSense** en el slot "Espacio destacado" (rinde poco con tráfico de nicho — esperalo modesto).
   - El mejor ingreso a futuro: vender ese mismo slot a una bodega/agencia que quiera destacarse.
4. Términos de Uso + Política de Privacidad públicas (las pide Google para usar la Places API / Maps).

---

## Roadmap (después del lanzamiento)

- **Reseñas nativas (fase 2):** Supabase (Postgres + login con Google + storage de fotos). El formulario con dimensiones estandarizadas (vista con "sin vista", calidad-precio, servicio, comida, precio real pagado, cómo llegó, idiomas) ya está diseñado en la maqueta. Cada bodega ofrece para reseñar solo sus propios planes.
- **Rating de comunidad** en las cards, al lado del de Google, cuando haya reseñas.
- **Fotos de usuarios** vía Cloudinary.
