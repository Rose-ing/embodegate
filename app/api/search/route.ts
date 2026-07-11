import Anthropic from "@anthropic-ai/sdk";

// Parser de búsqueda en lenguaje natural. Recibe { q }, devuelve el JSON de
// filtros que el cliente aplica con la misma lógica de Catalogo.tsx.
// Si falla (sin key, error de red, JSON inválido) devuelve { error } con 200
// para que el cliente caiga limpio al parseLocal de respaldo.

const SYSTEM = `Sos un parser de búsqueda para un directorio de bodegas de Mendoza, Argentina.
Convertí el texto del usuario (español rioplatense, puede traer lunfardo) en un JSON con EXACTAMENTE estas claves:
{"zona":"lujan"|"maipu"|"uco"|"chacras"|"este"|"sur"|null,"planes":array de ["visita","degustacion","almuerzo","picnic","actividades"],"precio_max":número en pesos o null,"vista":true|false|null,"orden":"rating"|"price-asc"|"price-desc"|null}
"lucas"/"luca"/"mil"/"mangos"/"k" multiplican por mil (50 lucas = 50000). "barato"/"sin gastar una fortuna"/"económico" => orden "price-asc". "linda vista"/"con vista"/"paisaje" => vista true. "sin vista" => vista false. Valle de Uco incluye Tunuyán, Tupungato, Gualtallary, Altamira. Respondé SOLO el JSON, sin texto ni backticks.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
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
    const anthropic = new Anthropic(); // toma ANTHROPIC_API_KEY del env
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", // barato y rápido; alcanza de sobra para parsear
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: q }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return Response.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch {
    return Response.json({ error: "parse_failed" }, { status: 200 });
  }
}
