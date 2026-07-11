// Parser de búsqueda en lenguaje natural, vía OpenRouter.
// Recibe { q }, devuelve el JSON de filtros que el cliente aplica con la
// misma lógica de Catalogo.tsx.
//
// Estrategia de costo: el primer modelo es GRATIS; si su proveedor está
// saturado o falla, OpenRouter cae solo al siguiente (Llama 3.1 8B,
// ~US$0.02/M tokens: fracciones de centavo por búsqueda). Si todo falla,
// devolvemos { error } con 200 y el cliente usa su intérprete local.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS = [
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct",
];

const SYSTEM = `Sos un parser de búsqueda para un directorio de bodegas de Mendoza, Argentina.
Convertí el texto del usuario (español rioplatense, puede traer lunfardo) en un JSON con EXACTAMENTE estas claves:
{"zona":"lujan"|"maipu"|"uco"|"chacras"|"este"|"sur"|null,"planes":array de ["visita","degustacion","almuerzo","picnic","actividades"],"precio_max":número en pesos o null,"vista":true|false|null,"orden":"rating"|"price-asc"|"price-desc"|null}
"lucas"/"luca"/"mil"/"mangos"/"k" multiplican por mil (50 lucas = 50000). "barato"/"sin gastar una fortuna"/"económico" => orden "price-asc". "linda vista"/"con vista"/"paisaje" => vista true. "sin vista" => vista false. Valle de Uco incluye Tunuyán, Tupungato, Gualtallary, Altamira. Respondé SOLO el JSON, sin texto ni backticks.`;

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "no_key" }, { status: 200 });
  }

  let q: unknown;
  try {
    ({ q } = await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 200 });
  }
  if (typeof q !== "string" || !q.trim()) {
    return Response.json({ error: "empty" }, { status: 200 });
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Opcionales de OpenRouter: identifican la app en sus rankings.
        "HTTP-Referer": "https://embodegate.com",
        "X-Title": "embodegate",
      },
      body: JSON.stringify({
        models: MODELS, // primero el gratis; OpenRouter hace el fallback solo
        max_tokens: 300,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: q.slice(0, 500) },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return Response.json({ error: "upstream_" + res.status }, { status: 200 });
    }
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    return Response.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch {
    return Response.json({ error: "parse_failed" }, { status: 200 });
  }
}
