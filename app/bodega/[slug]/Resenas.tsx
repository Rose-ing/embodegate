"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, type Resena } from "@/lib/supabase";
import { type Plan, PLAN_LABEL } from "@/data/bodegas";

const PLANES_TODOS = Object.keys(PLAN_LABEL) as Plan[];
const COMO_LLEGO_LABEL: Record<string, string> = {
  auto: "En auto",
  tour: "Con tour",
  bus: "Bus Vitivinícola",
  bici: "En bici",
  otro: "Otro",
};
const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

// Sección de reseñas de la comunidad en la ficha. 100% client-side sobre
// Supabase; si el proyecto no está configurado (sin env vars) muestra el
// teaser y la ficha sigue funcionando igual.
export default function Resenas({
  slug,
  planesOfrecidos,
}: {
  slug: string;
  planesOfrecidos: Plan[];
}) {
  const supabase = getSupabase();
  const [resenas, setResenas] = useState<Resena[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const cargar = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("resenas")
      .select("*")
      .eq("bodega_slug", slug)
      .order("created_at", { ascending: false });
    setResenas((data as Resena[]) ?? []);
  }, [supabase, slug]);

  useEffect(() => {
    if (!supabase) return;
    cargar();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, cargar]);

  const stats = useMemo(() => {
    if (!resenas || resenas.length === 0) return null;
    const avg = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    return {
      n: resenas.length,
      calidadPrecio: avg(resenas.map((r) => r.calidad_precio)),
      servicio: avg(resenas.map((r) => r.servicio)),
      comida: avg(resenas.map((r) => r.comida).filter((x): x is number => x !== null)),
      vista: avg(resenas.map((r) => r.vista).filter((x): x is number => x !== null)),
    };
  }, [resenas]);

  // Sin Supabase configurado: el teaser de siempre.
  if (!supabase) {
    return (
      <section className="resenas">
        <p className="secttl">Reseñas de la comunidad</p>
        <div className="rteaser">
          Las reseñas de la comunidad están llegando. Mientras tanto, mirá las
          reseñas reales en Google con el botón de abajo.
        </div>
      </section>
    );
  }

  async function login() {
    await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  }

  async function borrar(id: string) {
    await supabase!.from("resenas").delete().eq("id", id);
    cargar();
  }

  return (
    <section className="resenas">
      <p className="secttl">
        Reseñas de la comunidad{stats ? ` (${stats.n})` : ""}
      </p>

      {stats && (
        <div className="dimgrid">
          <Prom label="Calidad-precio" v={stats.calidadPrecio} />
          <Prom label="Servicio" v={stats.servicio} />
          {stats.comida !== null && <Prom label="Comida" v={stats.comida} />}
          {stats.vista !== null && <Prom label="Vista (comunidad)" v={stats.vista} />}
        </div>
      )}

      {resenas === null ? (
        <p className="rmuted">Cargando reseñas…</p>
      ) : resenas.length === 0 ? (
        <p className="rmuted">
          Todavía no hay reseñas de esta bodega. ¡Sé quien estrena!
        </p>
      ) : (
        <div className="rlist">
          {resenas.map((r) => (
            <article key={r.id} className="ritem">
              <header>
                <b>{r.user_nombre || "Alguien de la comunidad"}</b>
                <span className="rplan">{PLAN_LABEL[r.plan]}</span>
                <time>{new Date(r.created_at).toLocaleDateString("es-AR")}</time>
              </header>
              <div className="rdims">
                <span>Calidad-precio <b>{r.calidad_precio}</b>/5</span>
                <span>Servicio <b>{r.servicio}</b>/5</span>
                {r.comida !== null && <span>Comida <b>{r.comida}</b>/5</span>}
                {r.sin_vista ? (
                  <span>Sin vista a viñedos</span>
                ) : r.vista !== null ? (
                  <span>Vista <b>{r.vista}</b>/5</span>
                ) : null}
                {r.precio_pagado !== null && (
                  <span>Pagó <b>{fmt(r.precio_pagado)}</b> p/p</span>
                )}
                {r.como_llego && <span>{COMO_LLEGO_LABEL[r.como_llego]}</span>}
              </div>
              {r.comentario && <p className="rtexto">{r.comentario}</p>}
              {r.fotos.length > 0 && (
                <div className="rfotos">
                  {r.fotos.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={f} href={f} target="_blank" rel="noopener">
                      <img src={f} alt="Foto de la reseña" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
              {user?.id === r.user_id && (
                <button className="rborrar" onClick={() => borrar(r.id)}>
                  Borrar mi reseña
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {!user ? (
        <button className="btn primary rlogin" onClick={login}>
          Ingresá con Google para dejar tu reseña
        </button>
      ) : formOpen ? (
        <FormResena
          slug={slug}
          user={user}
          planesOfrecidos={planesOfrecidos.length ? planesOfrecidos : PLANES_TODOS}
          onDone={() => {
            setFormOpen(false);
            cargar();
          }}
          onCancel={() => setFormOpen(false)}
        />
      ) : (
        <button className="btn primary rlogin" onClick={() => setFormOpen(true)}>
          Escribir mi reseña
        </button>
      )}
    </section>
  );
}

function Prom({ label, v }: { label: string; v: number | null }) {
  if (v === null) return null;
  return (
    <div className="dimcard">
      <div className="dl">{label}</div>
      <div className="dv">
        {v.toFixed(1)}
        <span className="of">/5</span>
      </div>
    </div>
  );
}

function Estrellas({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="estrellas" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} de 5`}
          className={n <= value ? "on" : ""}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function FormResena({
  slug,
  user,
  planesOfrecidos,
  onDone,
  onCancel,
}: {
  slug: string;
  user: User;
  planesOfrecidos: Plan[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const supabase = getSupabase()!;
  const [plan, setPlan] = useState<Plan>(planesOfrecidos[0]);
  const [vista, setVista] = useState(0); // 0 = sin calificar
  const [sinVista, setSinVista] = useState(false);
  const [calidadPrecio, setCalidadPrecio] = useState(0);
  const [servicio, setServicio] = useState(0);
  const [comida, setComida] = useState(0);
  const [precioPagado, setPrecioPagado] = useState("");
  const [comoLlego, setComoLlego] = useState("");
  const [comentario, setComentario] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [estado, setEstado] = useState<"idle" | "enviando" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const valido = calidadPrecio > 0 && servicio > 0 && (sinVista || vista > 0);

  async function enviar() {
    if (!valido) return;
    setEstado("enviando");
    setErrorMsg("");
    try {
      // 1. Fotos (hasta 3, cada una < 5 MB) al bucket, en la carpeta del usuario.
      const fotos: string[] = [];
      for (const f of archivos.slice(0, 3)) {
        const ext = f.name.split(".").pop() || "jpg";
        const path = `${user.id}/${slug}-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("resenas").upload(path, f);
        if (error) throw error;
        fotos.push(supabase.storage.from("resenas").getPublicUrl(path).data.publicUrl);
      }
      // 2. La reseña. upsert: si ya reseñó este plan, la pisa.
      const { error } = await supabase.from("resenas").upsert(
        {
          bodega_slug: slug,
          user_id: user.id,
          user_nombre:
            (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            null,
          plan,
          vista: sinVista ? null : vista,
          sin_vista: sinVista,
          calidad_precio: calidadPrecio,
          servicio,
          comida: comida > 0 ? comida : null,
          precio_pagado: precioPagado ? parseInt(precioPagado, 10) : null,
          como_llego: comoLlego || null,
          comentario: comentario.trim() || null,
          fotos,
        },
        { onConflict: "bodega_slug,user_id,plan" }
      );
      if (error) throw error;
      onDone();
    } catch (e) {
      setEstado("error");
      setErrorMsg(e instanceof Error ? e.message : "No se pudo enviar. Probá de nuevo.");
      return;
    }
    setEstado("idle");
  }

  return (
    <div className="rform">
      <p className="rformttl">Tu reseña</p>

      <label className="rcampo">
        <span>¿Qué hiciste?</span>
        <select value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
          {planesOfrecidos.map((p) => (
            <option key={p} value={p}>
              {PLAN_LABEL[p]}
            </option>
          ))}
        </select>
      </label>

      <div className="rcampo">
        <span>La vista</span>
        {!sinVista && <Estrellas value={vista} onChange={setVista} />}
        <label className="rcheck">
          <input
            type="checkbox"
            checked={sinVista}
            onChange={(e) => setSinVista(e.target.checked)}
          />
          Sin vista a viñedos
        </label>
      </div>

      <div className="rcampo">
        <span>Calidad-precio</span>
        <Estrellas value={calidadPrecio} onChange={setCalidadPrecio} />
      </div>

      <div className="rcampo">
        <span>Servicio</span>
        <Estrellas value={servicio} onChange={setServicio} />
      </div>

      <div className="rcampo">
        <span>Comida (si aplica)</span>
        <Estrellas value={comida} onChange={setComida} />
      </div>

      <label className="rcampo">
        <span>¿Cuánto pagaste por persona? (opcional)</span>
        <input
          type="number"
          min={0}
          step={1000}
          placeholder="En pesos"
          value={precioPagado}
          onChange={(e) => setPrecioPagado(e.target.value)}
        />
      </label>

      <label className="rcampo">
        <span>¿Cómo llegaste? (opcional)</span>
        <select value={comoLlego} onChange={(e) => setComoLlego(e.target.value)}>
          <option value="">—</option>
          {Object.entries(COMO_LLEGO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <label className="rcampo">
        <span>Contanos cómo fue (opcional)</span>
        <textarea
          rows={4}
          maxLength={2000}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Qué probaste, qué vale la pena, qué mejorarías…"
        />
      </label>

      <label className="rcampo">
        <span>Fotos (hasta 3, opcional)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setArchivos([...(e.target.files ?? [])].slice(0, 3))}
        />
      </label>

      {estado === "error" && <p className="rerror">{errorMsg}</p>}

      <div className="racciones">
        <button
          className="btn primary"
          disabled={!valido || estado === "enviando"}
          onClick={enviar}
        >
          {estado === "enviando" ? "Enviando…" : "Publicar reseña"}
        </button>
        <button className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
