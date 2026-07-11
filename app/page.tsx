import Link from "next/link";
import { BODEGAS } from "@/data/bodegas";
import Catalogo from "./Catalogo";
import Footer from "./Footer";

// Server Component: arma el chrome estático y le pasa el catálogo al cliente.
export default function Home() {
  return (
    <>
      <div className="wrap topbar">
        <Link className="brandmini" href="/">
          em<b>bodega</b>te
        </Link>
        <a
          className="cafecito"
          href="https://cafecito.app/"
          target="_blank"
          rel="noopener"
        >
          ☕ Invitame un cafecito
        </a>
      </div>

      <header>
        <div className="wrap">
          <h1>
            ¿A cuál <em>vas</em>?
          </h1>
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
