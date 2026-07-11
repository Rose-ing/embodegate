import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../Footer";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Política de privacidad de embodegate: qué datos se procesan y cómo.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <>
      <div className="wrap topbar">
        <Link href="/" className="brandmini">
          em<b>bodega</b>te
        </Link>
      </div>

      <div className="wrap">
        <article className="legal">
          <h1>Política de privacidad</h1>
          <p className="ldate">Última actualización: julio de 2026</p>

          <h2>1. Sin cuentas ni registro</h2>
          <p>
            embodegate no requiere registro y no pide datos personales para
            usarse. No almacenamos perfiles de usuarios.
          </p>

          <h2>2. Búsquedas en lenguaje natural</h2>
          <p>
            Cuando usás el buscador, el texto que escribís se envía a nuestro
            servidor y se procesa con la API de Anthropic (Claude) únicamente
            para traducirlo a filtros de búsqueda. No lo asociamos a tu
            identidad ni lo usamos con otros fines. Evitá incluir datos
            personales en tus búsquedas.
          </p>

          <h2>3. Cookies y analítica</h2>
          <p>
            El sitio funciona sin cookies propias de seguimiento. Si en el
            futuro se incorporan servicios de publicidad (por ejemplo, Google
            AdSense) o analítica, estos pueden usar cookies propias según sus
            políticas; esta página se actualizará para reflejarlo.
          </p>

          <h2>4. Enlaces externos</h2>
          <p>
            Los enlaces a Google Maps y a sitios de bodegas te llevan a
            plataformas de terceros con sus propias políticas de privacidad,
            que te recomendamos revisar.
          </p>

          <h2>5. Alojamiento</h2>
          <p>
            El sitio se aloja en infraestructura de terceros (Vercel), que
            puede registrar datos técnicos estándar (como dirección IP y logs
            de acceso) para operar el servicio.
          </p>

          <h2>6. Tus derechos</h2>
          <p>
            Si tenés cualquier consulta sobre datos personales, escribí a{" "}
            <a href="mailto:hola@embodegate.com">hola@embodegate.com</a> y la
            respondemos a la brevedad.
          </p>

          <p>
            <Link href="/" className="backlink">
              ← Volver al catálogo
            </Link>
          </p>
        </article>
      </div>

      <Footer />
    </>
  );
}
