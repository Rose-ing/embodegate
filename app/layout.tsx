import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Fuentes de la maqueta, self-hosteadas por next/font (sin requests a Google).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://embodegate.com"),
  title: {
    default: "Bodegas de Mendoza — embodegate",
    template: "%s — embodegate",
  },
  description:
    "El directorio de las bodegas de Mendoza: filtrá por zona, plan, vista y presupuesto, o pedímelo en lenguaje natural y te muestro las que valen la pena.",
  keywords: [
    "bodegas Mendoza",
    "turismo del vino",
    "Valle de Uco",
    "Luján de Cuyo",
    "Maipú",
    "degustación",
    "almuerzo en bodega",
  ],
  openGraph: {
    title: "Bodegas de Mendoza — embodegate",
    description:
      "Filtrá por zona, plan, vista y presupuesto. Buscá en lenguaje natural y elegí a cuál vas.",
    url: "https://embodegate.com",
    siteName: "embodegate",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
