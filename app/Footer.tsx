import Link from "next/link";

// Footer compartido por todas las páginas (home, fichas, legales).
export default function Footer() {
  return (
    <footer>
      <div className="wrap winner">
        <div>
          <div className="fbrand">
            em<b>bodega</b>te
          </div>
          <p className="fnote">
            Un proyecto independiente, hecho en Mendoza para que elegir bodega
            deje de ser una lotería.
          </p>
          <nav className="flinks">
            <Link href="/terminos">Términos de uso</Link>
            <span aria-hidden>·</span>
            <Link href="/privacidad">Privacidad</Link>
          </nav>
        </div>
        <a
          className="cafecito"
          href="https://cafecito.app/"
          target="_blank"
          rel="noopener"
        >
          ☕ Invitame un cafecito
        </a>
      </div>
    </footer>
  );
}
