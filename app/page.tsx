import { BODEGAS } from "@/data/bodegas";
import Catalogo from "./Catalogo";
import Footer from "./Footer";

// Server Component: arma el chrome estático y le pasa el catálogo al cliente.
export default function Home() {
  return (
    <>
      <header>
        <div className="wrap herorow">
          <h1 className="brand">
            em<b>bodega</b>te
          </h1>
          <a
            className="cafecito"
            href="https://cafecito.app/"
            target="_blank"
            rel="noopener"
          >
            ☕ Invitame un cafecito
          </a>
        </div>
        <div className="wrap">
          <p className="lede">
            Todas las bodegas de Mendoza — pedímelo como te salga y te filtro
            las que valen la pena.
          </p>
        </div>
      </header>

      <Catalogo bodegas={BODEGAS} />

      <Footer />
    </>
  );
}
