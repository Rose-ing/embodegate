import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../Footer";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Términos y condiciones de uso de embodegate, el directorio de las bodegas de Mendoza.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <>
      <div className="wrap topbar">
        <Link href="/" className="brandmini">
          em<b>bodega</b>te
        </Link>
      </div>

      <div className="wrap">
        <article className="legal">
          <h1>Términos de uso</h1>
          <p className="ldate">Última actualización: julio de 2026</p>

          <h2>1. Qué es embodegate</h2>
          <p>
            embodegate es un directorio informativo e independiente de las
            bodegas de Mendoza, Argentina. Publicamos información de carácter
            orientativo para ayudarte a elegir qué bodega visitar: zonas,
            planes ofrecidos, rangos de precios y enlaces a fuentes externas.
            No pertenecemos a ninguna bodega ni vendemos visitas, entradas o
            paquetes turísticos.
          </p>

          <h2>2. Exactitud de la información</h2>
          <p>
            Los datos publicados (precios, planes, horarios, descripciones) se
            recopilan de fuentes públicas y se actualizan periódicamente, pero
            pueden estar desactualizados o contener errores. Los precios en
            pesos argentinos cambian con frecuencia. Antes de visitar una
            bodega, confirmá la información directamente con ella. embodegate
            no garantiza la exactitud, integridad o vigencia del contenido y no
            se hace responsable por decisiones tomadas en base a él.
          </p>

          <h2>3. Enlaces y marcas de terceros</h2>
          <p>
            Los nombres de las bodegas y sus marcas pertenecen a sus
            respectivos titulares y se usan solo con fines identificatorios e
            informativos. Los enlaces a sitios de terceros (por ejemplo, las
            fichas de Google Maps) se ofrecen como comodidad; no controlamos ni
            respondemos por su contenido.
          </p>

          <h2>4. Buscador</h2>
          <p>
            El buscador en lenguaje natural interpreta tu consulta mediante un
            modelo de inteligencia artificial y puede producir resultados
            imprecisos. Los resultados son sugerencias de filtrado, no
            recomendaciones comerciales.
          </p>

          <h2>5. Uso permitido</h2>
          <p>
            Podés usar el sitio para consulta personal y no comercial. No está
            permitido extraer el catálogo de forma masiva, ni usar el sitio de
            un modo que afecte su funcionamiento.
          </p>

          <h2>6. Publicidad y apoyo</h2>
          <p>
            El sitio puede mostrar espacios publicitarios claramente
            identificados y enlaces de apoyo voluntario (Cafecito). Lo
            publicitario nunca altera el orden orgánico del catálogo sin
            indicación expresa.
          </p>

          <h2>7. Cambios</h2>
          <p>
            Podemos modificar estos términos en cualquier momento; la versión
            vigente es la publicada en esta página. El uso del sitio implica la
            aceptación de los términos vigentes.
          </p>

          <h2>8. Contacto</h2>
          <p>
            Por consultas, correcciones de datos o pedidos de bodegas, escribí
            a{" "}
            <a href="mailto:hola@embodegate.com">hola@embodegate.com</a>.
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
