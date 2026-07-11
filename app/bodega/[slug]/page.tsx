import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "../../Footer";
import Resenas from "./Resenas";
import {
  type Plan,
  BODEGAS,
  PLAN_LABEL,
  ZONA_LABEL,
  googleMapsUrl,
  precioDesde,
  bodegaBg,
} from "@/data/bodegas";

const fmt = (n: number) => (n === 0 ? "Gratis" : "$" + n.toLocaleString("es-AR"));
const stars = (n: number) =>
  "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));

function getBodega(slug: string) {
  return BODEGAS.find((b) => b.slug === slug);
}

// Pre-renderiza una ruta estática por cada bodega (SEO + hosting gratis sin servidor).
export function generateStaticParams() {
  return BODEGAS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = getBodega(slug);
  if (!b) return { title: "Bodega no encontrada" };

  const desde = precioDesde(b);
  const description =
    b.descripcion +
    (desde !== null ? ` Desde ${fmt(desde)} por persona.` : "") +
    ` ${ZONA_LABEL[b.zona]}, Mendoza.`;

  return {
    title: `${b.nombre} — ${ZONA_LABEL[b.zona]}`,
    description,
    alternates: { canonical: `/bodega/${b.slug}` },
    openGraph: {
      title: `${b.nombre} — Bodegas de Mendoza`,
      description,
      url: `/bodega/${b.slug}`,
      type: "article",
      ...(b.imagen ? { images: [{ url: b.imagen }] } : {}),
    },
  };
}

export default async function BodegaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = getBodega(slug);
  if (!b) notFound();

  const planes = (Object.entries(b.planes) as [Plan, number | null][]).filter(
    ([, v]) => typeof v === "number"
  );

  return (
    <>
      <div className="wrap topbar">
        <Link href="/" className="brandmini">
          em<b>bodega</b>te
        </Link>
        <a className="cafecito" href="https://cafecito.app/" target="_blank" rel="noopener">
          ☕ Invitame un cafecito
        </a>
      </div>

      <div className="wrap">
        <article className="ficha">
          <Link href="/" className="backlink">
            ← Todas las bodegas
          </Link>

          <div className="fichahero" style={{ backgroundImage: bodegaBg(b) }}>
            <span className="fzone">{ZONA_LABEL[b.zona]}</span>
            <h1>{b.nombre}</h1>
            {b.imagen && b.imagenCredito && (
              <span className="fcredit">Foto: {b.imagenCredito}</span>
            )}
          </div>

          <div className="fichabody">
            <div className="fmeta">
              <span className="loc">{b.ubicacion}</span>
            </div>

            <p className="fdesc">
              {b.descripcion ||
                `Estamos terminando de cargar la ficha de ${b.nombre}. Mientras tanto, podés ver sus reseñas y ubicación reales en Google.`}
            </p>

            {b.detalleCargado ? (
              <>
                <p className="secttl">La vista (research)</p>
                <div className="dimgrid">
                  {b.vista === null ? (
                    <div className="dimcard no">
                      <div className="dl">Vista</div>
                      <div className="dv">Sin vista a viñedos</div>
                    </div>
                  ) : (
                    <div className="dimcard">
                      <div className="dl">Vista</div>
                      <div className="dv">
                        {b.vista.toFixed(1)}
                        <span className="of">/5</span>{" "}
                        <span className="stars">{stars(b.vista)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {planes.length > 0 && (
                  <>
                    <p className="secttl">Planes y precios (desde, por persona)</p>
                    <div className="planlist">
                      {planes.map(([k, v]) => (
                        <div key={k} className="prow">
                          <span className="pname">{PLAN_LABEL[k]}</span>
                          <span className={"pval" + (v === 0 ? " free" : "")}>
                            {fmt(v as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : null}

            <Resenas slug={b.slug} planesOfrecidos={planes.map(([k]) => k)} />

            <div className="factions">
              <a className="btn primary" href={googleMapsUrl(b)} target="_blank" rel="noopener">
                <span className="gg">G</span> Ver reseñas en Google ↗
              </a>
            </div>
          </div>
        </article>
      </div>

      <Footer />
    </>
  );
}
