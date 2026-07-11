"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type Bodega,
  type Plan,
  type Zona,
  PLAN_LABEL,
  ZONA_LABEL,
  googleMapsUrl,
  bodegaBg,
} from "@/data/bodegas";

const MAX_BUDGET = 130000;

type Sort = "popular" | "rating" | "price-asc" | "price-desc";

type State = {
  zona: Zona | "todas";
  planes: Set<Plan>;
  vista: boolean; // "con linda vista" → vista >= 4
  budget: number; // MAX_BUDGET = sin límite
  sort: Sort;
};

// Lo que devuelve el parser (API o local). Mismo shape en ambos caminos.
type Parsed = {
  zona: Zona | null;
  planes: Plan[];
  precio_max: number | null;
  vista: boolean | null;
  orden: "rating" | "price-asc" | "price-desc" | null;
};

const fmt = (n: number) => (n === 0 ? "Gratis" : "$" + n.toLocaleString("es-AR"));

// ── Helpers de filtrado (idénticos a la lógica de la maqueta) ──
function precioRelevante(b: Bodega, planes: Set<Plan>): number | null {
  const off = Object.entries(b.planes).filter(([, v]) => typeof v === "number") as [Plan, number][];
  if (planes.size) {
    const sel = off.filter(([k]) => planes.has(k)).map(([, v]) => v);
    return sel.length ? Math.min(...sel) : null;
  }
  return off.length ? Math.min(...off.map(([, v]) => v)) : null;
}

function desdeGeneral(b: Bodega): number | null {
  const v = Object.values(b.planes).filter((x): x is number => typeof x === "number");
  return v.length ? Math.min(...v) : null;
}

function matches(b: Bodega, s: State): boolean {
  if (s.zona !== "todas" && b.zona !== s.zona) return false;
  if (s.planes.size && ![...s.planes].some((p) => typeof b.planes[p] === "number")) return false;
  if (s.vista && !(b.vista !== null && b.vista >= 4)) return false;
  if (s.budget < MAX_BUDGET) {
    const pr = precioRelevante(b, s.planes);
    if (pr !== null && pr > s.budget) return false;
  }
  return true;
}

// ── Parser local de respaldo (de la maqueta) ──
const ZONAS_KW: Record<Zona, string[]> = {
  lujan: ["lujan", "luján", "agrelo", "perdriel", "compuertas", "vistalba"],
  maipu: ["maipu", "maipú", "coquimbito", "chachingo", "russell"],
  uco: ["uco", "tunuyan", "tunuyán", "tupungato", "gualtallary", "altamira", "vista flores"],
  chacras: ["chacras", "coria"],
  este: ["zona este", "san martin", "san martín", "rivadavia", "junin", "junín", "santa rosa"],
  sur: ["zona sur", "san rafael", "general alvear", "valle grande"],
};
const PLANES_KW: Record<Plan, string[]> = {
  almuerzo: ["almuerzo", "almorzar", "comer", "comida", "gastronom", "cena", "cenar"],
  degustacion: ["degustaci", "cata", "catar", "probar vino", "vinos"],
  visita: ["visita", "visitar", "recorr", "tour por"],
  picnic: ["picnic", "aire libre", "tabla"],
  actividades: ["cabalgat", "caballo", "bici", "bicicleta", "actividad", "blending"],
};

function parseLocal(q: string): Parsed {
  const s = q.toLowerCase();
  const out: Parsed = { zona: null, planes: [], precio_max: null, vista: null, orden: null };
  for (const [z, kw] of Object.entries(ZONAS_KW)) {
    if (kw.some((k) => s.includes(k))) {
      out.zona = z as Zona;
      break;
    }
  }
  for (const [p, kw] of Object.entries(PLANES_KW)) {
    if (kw.some((k) => s.includes(k))) out.planes.push(p as Plan);
  }
  let m = s.match(/(\d+)\s*(k|lucas?|luca|mil|mangos?)/);
  if (m) {
    let n = parseInt(m[1]);
    if (/k|luca|mil/.test(m[2])) n *= 1000;
    out.precio_max = n;
  } else {
    m = s.match(/(\d{4,6})/);
    if (m) out.precio_max = parseInt(m[1]);
  }
  if (/sin vista/.test(s)) out.vista = false;
  else if (/(con )?vista|paisaje|cordillera|viñedo/.test(s)) out.vista = true;
  if (/barat|económic|economic|menor precio|sin gastar|fortuna|accesible/.test(s))
    out.orden = "price-asc";
  return out;
}

export default function Catalogo({ bodegas }: { bodegas: Bodega[] }) {
  const [state, setState] = useState<State>({
    zona: "todas",
    planes: new Set(),
    vista: false,
    budget: MAX_BUDGET,
    sort: "popular",
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [understood, setUnderstood] = useState<string[] | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const list = useMemo(() => {
    const filtered = bodegas.filter((b) => matches(b, state));
    filtered.sort((a, b) => {
      if (state.sort === "popular") return b.pop - a.pop;
      // En el MVP "rating" es alias de pop hasta que haya reseñas.
      if (state.sort === "rating") return b.pop - a.pop;
      const pa = precioRelevante(a, state.planes) ?? Infinity;
      const pb = precioRelevante(b, state.planes) ?? Infinity;
      return state.sort === "price-asc" ? pa - pb : pb - pa;
    });
    return filtered;
  }, [bodegas, state]);

  const hasFilters =
    state.zona !== "todas" || state.planes.size > 0 || state.vista || state.budget < MAX_BUDGET;

  function applyParsed(p: Parsed) {
    const planes = new Set<Plan>(
      Array.isArray(p.planes) ? p.planes.filter((x) => x in PLAN_LABEL) : []
    );
    const next: State = {
      zona: p.zona && p.zona in ZONA_LABEL ? p.zona : "todas",
      planes,
      vista: p.vista === true,
      budget:
        typeof p.precio_max === "number" && p.precio_max > 0
          ? Math.min(p.precio_max, MAX_BUDGET)
          : MAX_BUDGET,
      sort:
        p.orden === "price-asc" || p.orden === "price-desc" || p.orden === "rating"
          ? p.orden
          : "popular",
    };
    setState(next);
    setUnderstood(buildUnderstood(next));
  }

  function buildUnderstood(s: State): string[] | null {
    const chips: string[] = [];
    if (s.planes.size) chips.push([...s.planes].map((x) => PLAN_LABEL[x]).join(" / "));
    if (s.vista) chips.push("con vista");
    if (s.zona !== "todas") chips.push(ZONA_LABEL[s.zona]);
    if (s.budget < MAX_BUDGET) chips.push("hasta $" + s.budget.toLocaleString("es-AR"));
    if (s.sort === "price-asc") chips.push("más baratas primero");
    return chips.length ? chips : null;
  }

  async function runNL(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    let parsed: Parsed | null = null;
    try {
      const res = await Promise.race([
        fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
        }).then((r) => r.json()),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 9000)),
      ]);
      if (res && typeof res === "object" && !("error" in res)) parsed = res as Parsed;
    } catch {
      parsed = null;
    }
    // Fallback local: si la API falla o tarda, igual filtra. Nunca queda colgado.
    if (!parsed) parsed = parseLocal(q);
    applyParsed(parsed);
    setLoading(false);
  }

  function togglePlan(p: Plan) {
    setState((s) => {
      const planes = new Set(s.planes);
      if (planes.has(p)) planes.delete(p);
      else planes.add(p);
      return { ...s, planes };
    });
  }

  function clearAll() {
    setState({ zona: "todas", planes: new Set(), vista: false, budget: MAX_BUDGET, sort: "popular" });
    setUnderstood(null);
    setBudgetOpen(false);
  }

  function describeFilters(): string {
    const p: string[] = [];
    if (state.planes.size)
      p.push([...state.planes].map((x) => PLAN_LABEL[x].toLowerCase()).join(" o "));
    if (state.vista) p.push("con linda vista");
    if (state.zona !== "todas") p.push("en " + ZONA_LABEL[state.zona]);
    if (state.budget < MAX_BUDGET)
      p.push("hasta $" + state.budget.toLocaleString("es-AR") + " p/p");
    if (!p.length) return state.sort === "popular" ? "más buscadas primero" : "";
    return p.join(" · ");
  }

  const HINTS = [
    "degustación barata cerca del centro",
    "picnic con vista en Uco",
    "dónde almorzar sin gastar una fortuna",
  ];

  // El aviso va DESPUÉS de las primeras cards para no empujar el contenido.
  const AD_AFTER = 6;

  return (
    <>
      {/* ── Buscador en lenguaje natural ── */}
      <div className="wrap">
        <div className="nlbox">
          <div className="nlfield">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runNL(query);
              }}
              placeholder="Almuerzo con vista hasta 50 lucas en Uco…"
              autoComplete="off"
              aria-label="Buscá en lenguaje natural"
            />
            <button onClick={() => runNL(query)} disabled={loading}>
              {loading ? "Interpretando…" : "Buscar"}
            </button>
          </div>
          <div className="nlhints">
            <span className="lab">Probá:</span>
            {HINTS.map((h) => (
              <button
                key={h}
                className="nlhint"
                onClick={() => {
                  setQuery(h);
                  runNL(h);
                }}
              >
                {h}
              </button>
            ))}
          </div>
          <div className={"understood" + (understood ? " show" : "")}>
            {understood && (
              <>
                <span>Entendí:</span>
                {understood.map((c) => (
                  <span key={c} className="uchip">
                    {c}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Barra de filtros: una sola fila de pills, scrolleable en móvil ── */}
      <div className="filters">
        <div className="wrap">
          <div className="frow">
            <select
              className="pillsel"
              aria-label="Zona"
              value={state.zona}
              onChange={(e) =>
                setState((s) => ({ ...s, zona: e.target.value as Zona | "todas" }))
              }
            >
              <option value="todas">Todas las zonas</option>
              <option value="lujan">Luján de Cuyo</option>
              <option value="maipu">Maipú</option>
              <option value="uco">Valle de Uco</option>
              <option value="chacras">Chacras</option>
              <option value="este">Zona Este</option>
              <option value="sur">Zona Sur</option>
            </select>

            {(Object.keys(PLAN_LABEL) as Plan[]).map((p) => (
              <button
                key={p}
                className="chip plan"
                aria-pressed={state.planes.has(p)}
                onClick={() => togglePlan(p)}
              >
                {PLAN_LABEL[p]}
              </button>
            ))}

            <button
              className="chip extra"
              aria-pressed={state.vista}
              onClick={() => setState((s) => ({ ...s, vista: !s.vista }))}
            >
              ★ Con vista
            </button>

            <button
              className="chip money"
              aria-pressed={state.budget < MAX_BUDGET}
              aria-expanded={budgetOpen}
              onClick={() => setBudgetOpen((o) => !o)}
            >
              {state.budget < MAX_BUDGET
                ? "Hasta $" + state.budget.toLocaleString("es-AR")
                : "$ Presupuesto"}
            </button>

            <select
              className="pillsel sortpill"
              aria-label="Ordenar"
              value={state.sort}
              onChange={(e) => setState((s) => ({ ...s, sort: e.target.value as Sort }))}
            >
              <option value="popular">Más buscadas</option>
              <option value="rating">Mejor puntuadas</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>

            <button className="clearbtn" disabled={!hasFilters} onClick={clearAll}>
              Limpiar
            </button>
          </div>

          {budgetOpen && (
            <div className="brow">
              <input
                type="range"
                min={0}
                max={MAX_BUDGET}
                step={5000}
                value={state.budget}
                aria-label="Presupuesto máximo por persona"
                onChange={(e) => setState((s) => ({ ...s, budget: +e.target.value }))}
              />
              <span className={"bval" + (state.budget >= MAX_BUDGET ? " off" : "")}>
                {state.budget >= MAX_BUDGET
                  ? "sin límite"
                  : "hasta $" + state.budget.toLocaleString("es-AR") + " p/p"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Resultados ── */}
      <main>
        <div className="wrap">
          <div className="resultline">
            <span className="rcount">{list.length}</span>
            <span>
              {list.length === 1 ? "bodega" : "bodegas"} · {describeFilters()}
            </span>
          </div>

          <div className="grid">
            {list.length === 0 ? (
              <div className="empty">
                <h3>No hay bodegas con esos filtros</h3>
                <p>Probá subir el presupuesto o sacar algún filtro.</p>
                <button onClick={clearAll}>Limpiar filtros</button>
              </div>
            ) : (
              list.flatMap((b, i) => {
                const card = <Card key={b.slug} b={b} state={state} />;
                // El slot publicitario entra después de las primeras cards
                // (o al final si hay menos resultados).
                if (i === Math.min(AD_AFTER, list.length) - 1)
                  return [card, <AdSlot key="adslot" />];
                return [card];
              })
            )}
          </div>

          <p className="protonote">
            <b>Prototipo.</b> Los precios son orientativos y pueden cambiar; confirmá siempre
            con la bodega. El buscador usa inteligencia artificial para interpretar lo que
            escribís, con un intérprete local de respaldo. Las reseñas de la comunidad se
            están estrenando en las fichas; también tenés el link a las reseñas de Google.
          </p>
        </div>
      </main>
    </>
  );
}

function AdSlot() {
  return (
    <div className="adslot">
      <div className="adleft">
        <span className="adlabel">Espacio destacado</span>
        <span className="adtitle">Tu bodega o tu marca, acá arriba</span>
      </div>
      <button className="adcta">Quiero aparecer</button>
    </div>
  );
}

function Card({ b, state }: { b: Bodega; state: State }) {
  const desde = desdeGeneral(b);
  const offered = (Object.entries(b.planes) as [Plan, number | null][]).filter(
    ([, v]) => typeof v === "number"
  );
  const selOffered = [...state.planes].filter((p) => typeof b.planes[p] === "number");
  // Si hay planes seleccionados, mostramos el precio del más barato entre los marcados.
  const planPrice =
    selOffered.length > 0
      ? selOffered.reduce((a, c) => ((b.planes[c] as number) < (b.planes[a] as number) ? c : a))
      : null;

  return (
    // <article> con link superpuesto: un <a> no puede contener otro <a>
    // (el chip de Google es un link aparte, por encima del overlay).
    <article className="card">
      <Link
        href={`/bodega/${b.slug}`}
        className="cardlink"
        aria-label={`Ver ficha de ${b.nombre}`}
      />
      <div className="cimg" style={{ backgroundImage: bodegaBg(b) }}>
        <span className="czone">{ZONA_LABEL[b.zona]}</span>
        <span className="cname">{b.nombre}</span>
      </div>
      <div className="cbody">
        <div className="cratings">
          <a
            className="rchip g"
            href={googleMapsUrl(b)}
            target="_blank"
            rel="noopener"
          >
            <span className="star">★</span> Reseñas en Google ↗
          </a>
        </div>
        <div className="loc">{b.ubicacion}</div>
        <p className="desc">
          {b.descripcion ||
            "Ficha en preparación. Por ahora, mirá sus reseñas reales en Google."}
        </p>
        <div className="dimrow">
          {!b.detalleCargado ? (
            <span className="dimmini">Ficha en preparación</span>
          ) : b.vista === null ? (
            <span className="dimmini novista">Sin vista a viñedos</span>
          ) : (
            <span className="dimmini">
              Vista <b>{b.vista.toFixed(1)}</b>
            </span>
          )}
        </div>
        <div className="planes">
          {offered.map(([k]) => (
            <span key={k} className={"ptag" + (state.planes.has(k) ? " hit" : "")}>
              {PLAN_LABEL[k]}
            </span>
          ))}
        </div>
        <div className="pricerow">
          <div>
            <div className="from-lab">Desde</div>
            <div className={"from-val" + (desde === 0 ? " free" : "")}>
              {desde === null ? "—" : fmt(desde)}
              {desde !== null && desde !== 0 && <span className="per"> / persona</span>}
            </div>
          </div>
          {planPrice && (
            <div className="planprice">
              <div className="pl-lab">{PLAN_LABEL[planPrice]}</div>
              <div className="pl-val">{fmt(b.planes[planPrice] as number)}</div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
