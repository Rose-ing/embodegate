// data/bodegas.ts
// ─────────────────────────────────────────────────────────────────────────
// Catálogo de embodegate. Esta es la ÚNICA fuente de verdad del MVP.
// Actualizar una bodega = editar este archivo y hacer push. No hay base de datos.
//
// Qué NO va acá (a propósito):
//  - El rating y las reseñas de Google: no se guardan (términos de Google).
//    Solo guardamos placeId, que es gratis y permanente, para armar el link.
//  - Reseñas nativas de la comunidad: son fase 2 (Supabase), no van en el MVP.
//
// Estrategia de carga: cobertura vs profundidad.
//  - Las ~230 bodegas van listadas con lo mínimo (detalleCargado: false).
//  - Solo las más buscadas se cargan a fondo (precios, planes, vista, foto).
// ─────────────────────────────────────────────────────────────────────────

export type Zona = "lujan" | "maipu" | "uco" | "chacras" | "este" | "sur";

export const ZONA_LABEL: Record<Zona, string> = {
  lujan: "Luján de Cuyo",
  maipu: "Maipú",
  uco: "Valle de Uco",
  chacras: "Chacras de Coria",
  este: "Zona Este",
  sur: "Zona Sur",
};

export type Plan = "visita" | "degustacion" | "almuerzo" | "picnic" | "actividades";

export const PLAN_LABEL: Record<Plan, string> = {
  visita: "Visita",
  degustacion: "Degustación",
  almuerzo: "Almuerzo",
  picnic: "Picnic",
  actividades: "Actividades",
};

export interface Bodega {
  slug: string;                 // URL SEO: /bodega/catena-zapata
  nombre: string;
  zona: Zona;
  ubicacion: string;            // texto legible para mostrar
  placeId: string | null;       // Google place_id (gratis, permanente). null = usar query por nombre
  pop: number;                  // 0-100, proxy de "más buscada" → orden por defecto
  vista: number | null;         // research: qué tan linda la vista (0-5). null = NO tiene vista
  descripcion: string;
  imagen: string | null;        // URL de la foto representativa. null = placeholder por gradiente
  imagenCredito?: string | null; // atribución de la foto (autor + licencia CC), se muestra en la ficha
  // precio "desde" por persona en ARS para cada plan. null = la bodega NO ofrece ese plan.
  planes: Partial<Record<Plan, number | null>>;
  detalleCargado: boolean;      // true = research a fondo. false = solo cobertura base
}

// Link a la ficha de Google. Si hay placeId lo usa; si no, cae al query por nombre.
export function googleMapsUrl(b: Bodega): string {
  const base = "https://www.google.com/maps/search/?api=1&query=";
  const q = encodeURIComponent(`${b.nombre} bodega ${b.ubicacion}`);
  return b.placeId ? `${base}${q}&query_place_id=${b.placeId}` : `${base}${q}`;
}

// Precio "desde" general (el plan más barato que ofrece). null si no tiene precios.
export function precioDesde(b: Bodega): number | null {
  const vals = Object.values(b.planes).filter((v): v is number => typeof v === "number");
  return vals.length ? Math.min(...vals) : null;
}

// Gradientes de respaldo (de la maqueta) para cuando la bodega no tiene foto.
const PHOTO_GRADS: [string, string][] = [
  ["#6A1B47", "#9C3A6E"],
  ["#6F7741", "#9BA45F"],
  ["#BE8419", "#E0A93B"],
  ["#54123A", "#7E2A59"],
  ["#4A5230", "#7B8550"],
];

// CSS background para la card/hero: usa la imagen si hay, si no un gradiente estable por slug.
export function bodegaBg(b: Bodega): string {
  if (b.imagen) return `url('${b.imagen}')`;
  let h = 0;
  for (let i = 0; i < b.slug.length; i++) h = (h * 31 + b.slug.charCodeAt(i)) >>> 0;
  const [a, c] = PHOTO_GRADS[h % PHOTO_GRADS.length];
  return `linear-gradient(135deg, ${a}, ${c})`;
}

// ─────────────────────────────────────────────────────────────────────────
// SEED — 12 bodegas reales cargadas a fondo. Completá las ~230 restantes con
// detalleCargado: false (nombre, zona, ubicacion, placeId) desde el listado de
// la Dirección de Turismo de Mendoza / Wines of Argentina.
// ─────────────────────────────────────────────────────────────────────────

const SEED: Bodega[] = [
  {
    slug: "catena-zapata",
    nombre: "Catena Zapata",
    zona: "lujan",
    ubicacion: "Agrelo, Luján de Cuyo",
    placeId: null,
    pop: 98,
    vista: 4.6,
    descripcion: "La pirámide inspirada en Tikal y la bodega argentina más reconocida del mundo (#1 en World's Best Vineyards 2023).",
    imagen: null,
    // Precios verificados 2025-2026: degustación La Pirámide ~180k; restaurante
    // Angélica (1 estrella Michelin) menú de pasos ~158k-209k p/p, sin maridaje.
    planes: { degustacion: 180000, almuerzo: 195000 },
    detalleCargado: true,
  },
  {
    slug: "zuccardi-piedra-infinita",
    nombre: "Zuccardi Piedra Infinita",
    zona: "uco",
    ubicacion: "Paraje Altamira, Valle de Uco",
    placeId: null,
    pop: 95,
    vista: 5.0,
    descripcion: "#1 del mundo en 2019, 2020 y 2021 (World's Best Vineyards). Arquitectura de piedra y Piedra Infinita Cocina, su restaurante de altísimo nivel.",
    imagen: null,
    // degustación ~83k (paquete visita+cata 2026). Almuerzo en Piedra Infinita
    // Cocina: precio no publicado, estimado.
    planes: { degustacion: 83000, almuerzo: 150000 },
    detalleCargado: true,
  },
  {
    slug: "bodega-norton",
    nombre: "Bodega Norton",
    zona: "lujan",
    ubicacion: "Perdriel, Luján de Cuyo",
    placeId: null,
    pop: 90,
    vista: 4.5,
    descripcion: "Cava subterránea histórica, el restaurante La Vid con vista a los Andes (Guía Michelin) y el famoso blending game.",
    imagen: null,
    // Verificado 2025-2026: visita+cata ~36.5k; blending game (actividades) ~35k.
    // Se quitó "picnic": no se pudo confirmar que Norton lo ofrezca.
    planes: { visita: 36500, degustacion: 36500, almuerzo: 75000, actividades: 35000 },
    detalleCargado: true,
  },
  {
    slug: "trapiche",
    nombre: "Trapiche",
    zona: "maipu",
    ubicacion: "Coquimbito, Maipú",
    placeId: null,
    pop: 85,
    vista: 3.8,
    descripcion: "Bodega fundada en 1883; su emblemático edificio de estilo florentino (1912) fue restaurado para unir historia y vanguardia.",
    imagen: null,
    // Verificado 2025-2026: tour+cata ~36k; tour+almuerzo (Espacio Trapiche,
    // Guía Michelin, 4 pasos con maridaje) ~162k.
    planes: { visita: 36000, degustacion: 36000, almuerzo: 162000 },
    detalleCargado: true,
  },
  {
    slug: "bodega-lopez",
    nombre: "Bodega López",
    zona: "maipu",
    ubicacion: "Maipú centro",
    placeId: null,
    pop: 88,
    vista: null, // está en pleno Maipú, no tiene vista a viñedos
    descripcion: "Fundada en 1898, una clásica puerta de entrada al vino mendocino: a pasos de la estación Gutiérrez del metrotranvía.",
    imagen: null,
    // Corregido: la visita ya NO es gratis (lo fue históricamente). 2025-2026:
    // visita+cata ~23.5k; almuerzos 3/5 pasos 62k-84k.
    planes: { visita: 23500, degustacion: 23500, almuerzo: 62000 },
    detalleCargado: true,
  },
  {
    slug: "salentein",
    nombre: "Salentein",
    zona: "uco",
    ubicacion: "Tunuyán, Valle de Uco",
    placeId: null,
    pop: 82,
    vista: 4.8,
    descripcion: "Bodega-templo con el centro cultural Killka y su galería de arte propia, entre viñedos de altura.",
    imagen: null,
    // 2025-2026: visita+cata ~42k; almuerzo 3 pasos en Killka ~64k. Se quitó
    // "picnic": no figura en la oferta oficial de Salentein.
    planes: { visita: 42000, degustacion: 42000, almuerzo: 82000 },
    detalleCargado: true,
  },
  {
    slug: "casa-vigil-el-enemigo",
    nombre: "Casa Vigil — El Enemigo",
    zona: "maipu",
    ubicacion: "Chachingo, Maipú",
    placeId: null,
    pop: 92,
    vista: 4.0,
    descripcion: "La casa de Alejandro Vigil (El Enemigo). Restaurante con estrella Michelin y uno de los almuerzos más pedidos de Mendoza.",
    imagen: null,
    // Ofrece visita guiada además de la cata (verificado). Tour+cata ~35k;
    // almuerzo (3/7/9 pasos) sin precio público, estimado.
    planes: { visita: 35000, degustacion: 35000, almuerzo: 72000 },
    detalleCargado: true,
  },
  {
    slug: "susana-balbo-wines",
    nombre: "Susana Balbo Wines",
    zona: "lujan",
    ubicacion: "Agrelo, Luján de Cuyo",
    placeId: null,
    pop: 74,
    vista: 4.3,
    descripcion: "La bodega de Susana Balbo, primera enóloga graduada de Argentina. Restaurante Osadía de Crear, picnic y experiencias para crear tu propio vino.",
    imagen: null,
    // También ofrece picnic (~47k p/p) y actividades (Blend Art). 2025-2026:
    // visita+cata ~27k; almuerzo en Osadía de Crear sin precio público, estimado.
    planes: { visita: 27000, degustacion: 40000, almuerzo: 95000, picnic: 47000, actividades: 45000 },
    detalleCargado: true,
  },
  {
    slug: "bodega-septima",
    nombre: "Bodega Séptima",
    zona: "lujan",
    ubicacion: "Agrelo, Luján de Cuyo",
    placeId: null,
    pop: 78,
    vista: 4.6,
    descripcion: "Arquitectura de pirca (piedra apilada), espumantes y el espacio culinario María Codorníu con vista a los Andes. Tapeo y atardeceres.",
    imagen: null,
    // Verificado 2025: tour+cata ~27k; almuerzo (María Codorníu, 3 tiempos) ~64k.
    // Se quitó "picnic": no se pudo confirmar que Séptima lo ofrezca.
    planes: { degustacion: 27000, almuerzo: 64000 },
    detalleCargado: true,
  },
  {
    slug: "clos-de-chacras",
    nombre: "Clos de Chacras",
    zona: "chacras",
    ubicacion: "Chacras de Coria",
    placeId: null,
    pop: 70,
    vista: 3.9,
    descripcion: "Bodega familiar a 10 minutos del centro, con restaurante propio. Ideal para visitar sin auto.",
    imagen: null,
    // Corregido: NO tiene hotel boutique (los hoteles de Chacras son otros
    // negocios). Precios sin fuente oficial publicada: estimados, a confirmar.
    planes: { visita: 24000, degustacion: 24000, almuerzo: 48000 },
    detalleCargado: true,
  },
  {
    slug: "durigutti",
    nombre: "Durigutti Family Winemakers",
    zona: "lujan",
    ubicacion: "Las Compuertas, Luján de Cuyo",
    placeId: null,
    pop: 68,
    vista: 4.4,
    descripcion: "Puesto 11 en The World's Best Vineyards 2025, la mejor bodega argentina del ranking. Restaurante 5 Suelos, vino y personalidad propia.",
    imagen: null,
    // Ranking #11 verificado en theworlds50best.com. Precios sin fuente oficial
    // publicada: estimados, a confirmar.
    planes: { visita: 25000, degustacion: 42000, almuerzo: 88000 },
    detalleCargado: true,
  },
  {
    slug: "domaine-bousquet",
    nombre: "Domaine Bousquet",
    zona: "uco",
    ubicacion: "Gualtallary, Valle de Uco",
    placeId: null,
    pop: 64,
    vista: 4.7,
    descripcion: "Pioneros del vino orgánico en Gualtallary. Restaurante Gaia, picnic entre viñedos y cabalgatas con la cordillera de fondo.",
    imagen: null,
    // Verificado verano 2026: visita+cata desde ~29k; picnic y cabalgatas
    // confirmados (la cabalgata con almuerzo es premium, ~208k).
    planes: { visita: 29000, degustacion: 30000, almuerzo: 55000, picnic: 34000, actividades: 45000 },
    detalleCargado: true,
  },

];

// Factory para las bodegas de cobertura base: completa los campos vacíos del
// mínimo viable para no repetir `imagen: null, planes: {}, …` en cada una.
function cobertura(
  slug: string,
  nombre: string,
  zona: Zona,
  ubicacion: string,
  pop: number
): Bodega {
  return {
    slug,
    nombre,
    zona,
    ubicacion,
    placeId: null,
    pop,
    vista: null,
    descripcion: "",
    imagen: null,
    planes: {},
    detalleCargado: false,
  };
}

// Listado de cobertura (nombre real + zona + ubicación). El `pop` es un proxy
// aproximado de "más buscada"; ajustar cuando haya datos reales de búsqueda.
// El catálogo público es BODEGAS = [ ...SEED, ...COBERTURA ] (ver abajo).
const COBERTURA: Bodega[] = [
  // ── Luján de Cuyo ──
  cobertura("lagarde", "Bodega Lagarde", "lujan", "Mayor Drummond, Luján de Cuyo", 60),
  cobertura("luigi-bosca", "Luigi Bosca", "lujan", "Mayor Drummond, Luján de Cuyo", 62),
  cobertura("achaval-ferrer", "Achaval-Ferrer", "lujan", "Perdriel, Luján de Cuyo", 58),
  cobertura("alta-vista", "Alta Vista", "lujan", "Chacras de Coria, Luján de Cuyo", 52),
  cobertura("ruca-malen", "Bodega Ruca Malen", "lujan", "Agrelo, Luján de Cuyo", 61),
  cobertura("vistalba", "Bodega Vistalba", "lujan", "Vistalba, Luján de Cuyo", 59),
  cobertura("renacer", "Bodega Renacer", "lujan", "Perdriel, Luján de Cuyo", 46),
  cobertura("mendel", "Mendel Wines", "lujan", "Mayor Drummond, Luján de Cuyo", 48),
  cobertura("kaiken", "Kaiken Wines", "lujan", "Vistalba, Luján de Cuyo", 54),
  cobertura("tapiz", "Bodega Tapiz", "lujan", "Agrelo, Luján de Cuyo", 47),
  cobertura("nieto-senetiner", "Nieto Senetiner", "lujan", "Vistalba, Luján de Cuyo", 51),
  cobertura("chandon", "Bodegas Chandon", "lujan", "Agrelo, Luján de Cuyo", 63),
  cobertura("pulenta-estate", "Pulenta Estate", "lujan", "Agrelo, Luján de Cuyo", 53),
  cobertura("melipal", "Bodega Melipal", "lujan", "Agrelo, Luján de Cuyo", 44),
  cobertura("cheval-des-andes", "Cheval des Andes", "lujan", "Las Compuertas, Luján de Cuyo", 56),
  cobertura("terrazas-de-los-andes", "Terrazas de los Andes", "lujan", "Perdriel, Luján de Cuyo", 55),
  cobertura("sophenia", "Finca Sophenia", "uco", "Gualtallary, Tupungato", 40),
  cobertura("carmelo-patti", "Carmelo Patti", "lujan", "Mayor Drummond, Luján de Cuyo", 45),
  cobertura("alfa-crux", "Bodega Alfa Crux", "uco", "El Cepillo, San Carlos", 38),

  // ── Maipú ──
  cobertura("familia-zuccardi", "Familia Zuccardi (Maipú)", "maipu", "Fray Luis Beltrán, Maipú", 57),
  cobertura("rutini", "Bodega Rutini", "maipu", "Coquimbito, Maipú", 60),
  cobertura("tempus-alba", "Tempus Alba", "maipu", "Coquimbito, Maipú", 49),
  cobertura("don-arturo", "Bodega Don Arturo", "maipu", "Maipú", 36),
  cobertura("di-tommaso", "Bodega Di Tommaso", "maipu", "Russell, Maipú", 47),
  cobertura("la-rural", "Bodega La Rural", "maipu", "Coquimbito, Maipú", 50),
  cobertura("familia-cecchin", "Familia Cecchin", "maipu", "Russell, Maipú", 41),
  cobertura("viña-el-cerno", "Viña El Cerno", "maipu", "Coquimbito, Maipú", 39),
  cobertura("carinae", "Bodega Carinae", "maipu", "Cruz de Piedra, Maipú", 42),
  cobertura("trivento", "Bodega Trivento", "maipu", "Russell, Maipú", 52),
  cobertura("santa-julia", "Santa Julia", "maipu", "Fray Luis Beltrán, Maipú", 48),

  // ── Valle de Uco ──
  cobertura("the-vines", "The Vines of Mendoza", "uco", "Vista Flores, Tunuyán", 56),
  cobertura("monteviejo", "Bodega Monteviejo", "uco", "Vista Flores, Tunuyán", 54),
  cobertura("andeluna", "Andeluna Cellars", "uco", "Gualtallary, Tupungato", 55),
  cobertura("gimenez-riili", "Gimenez Riili", "uco", "Vista Flores, Tunuyán", 47),
  cobertura("la-azul", "Bodega La Azul", "uco", "Tupungato", 45),
  cobertura("atamisque", "Bodega Atamisque", "uco", "San José, Tupungato", 53),
  cobertura("corazon-del-sol", "Corazón del Sol", "uco", "Los Chacayes, Tunuyán", 43),
  cobertura("clos-de-los-siete", "Clos de los Siete", "uco", "Vista Flores, Tunuyán", 50),
  cobertura("la-consulta", "Finca La Celia", "uco", "La Consulta, San Carlos", 46),
  cobertura("zorzal", "Bodega Zorzal", "uco", "Gualtallary, Tupungato", 49),
  cobertura("super-uco", "SuperUco", "uco", "Los Chacayes, Tunuyán", 44),
  cobertura("piedra-negra", "Piedra Negra (Lurton)", "uco", "Vista Flores, Tunuyán", 48),
  cobertura("rosell-boher", "Rosell Boher Lodge", "uco", "Tupungato", 42),
  cobertura("casa-de-uco", "Casa de Uco", "uco", "Tunuyán", 51),
  cobertura("alpamanta", "Alpamanta Estate", "lujan", "Ugarteche, Luján de Cuyo", 38),

  // ── Chacras de Coria ──
  cobertura("finca-decero", "Finca Decero", "lujan", "Agrelo, Luján de Cuyo", 40),
  cobertura("club-tapiz", "Club Tapiz", "maipu", "Russell, Maipú", 41),

  // ── Zona Este (San Martín, Rivadavia, Junín, Santa Rosa) ──
  cobertura("cuarto-dominio", "Cuarto Dominio", "este", "San Martín", 28),
  cobertura("don-cristobal", "Bodega Don Cristóbal", "este", "Junín", 26),
  cobertura("bodega-furlotti", "Bodega Furlotti", "este", "Rivadavia", 24),
  cobertura("la-abeja", "Bodega La Abeja", "este", "Santa Rosa", 22),

  // ── Zona Sur (San Rafael, General Alvear) ──
  cobertura("bianchi", "Bodega Valentín Bianchi", "sur", "San Rafael", 45),
  cobertura("suter", "Bodega Suter", "sur", "San Rafael", 30),
  cobertura("jean-rivier", "Bodega Jean Rivier", "sur", "San Rafael", 29),
  cobertura("goldenwine", "Goldenwine", "sur", "San Rafael", 25),
  cobertura("algodon-wine-estates", "Algodon Wine Estates", "sur", "General Alvear", 27),

  // ── Luján de Cuyo (ampliación julio 2026) ──
  cobertura("vina-cobos", "Viña Cobos", "lujan", "Perdriel, Luján de Cuyo", 42),
  cobertura("bodega-weinert", "Bodega y Cavas de Weinert", "lujan", "Carrodilla, Luján de Cuyo", 38),
  cobertura("dona-paula", "Bodega Doña Paula", "lujan", "Ugarteche, Luján de Cuyo", 38),
  cobertura("bodega-cruzat", "Bodega Cruzat", "lujan", "Perdriel, Luján de Cuyo", 36),
  cobertura("fabre-montmayou", "Fabre Montmayou", "lujan", "Vistalba, Luján de Cuyo", 34),
  cobertura("casarena", "Casarena Bodega y Viñedos", "lujan", "Perdriel, Luján de Cuyo", 33),
  cobertura("riccitelli-wines", "Matías Riccitelli Wines", "lujan", "Las Compuertas, Luján de Cuyo", 33),
  cobertura("bodega-bressia", "Bressia Casa de Bodega", "lujan", "Agrelo, Luján de Cuyo", 32),
  cobertura("dante-robino", "Bodega Dante Robino", "lujan", "Perdriel, Luján de Cuyo", 31),
  cobertura("belasco-de-baquedano", "Bodega Belasco de Baquedano", "lujan", "Agrelo, Luján de Cuyo", 29),
  cobertura("piattelli-vineyards", "Piattelli Vineyards", "lujan", "Agrelo, Luján de Cuyo", 28),
  cobertura("bodega-chakana", "Bodega Chakana", "lujan", "Agrelo, Luján de Cuyo", 26),
  cobertura("bodega-benegas", "Bodega Benegas", "lujan", "Mayor Drummond, Luján de Cuyo", 26),
  cobertura("matervini", "Matervini", "lujan", "Perdriel, Luján de Cuyo", 26),
  cobertura("bodega-sottano", "Bodega Sottano", "lujan", "Perdriel, Luján de Cuyo", 25),
  cobertura("bodega-budeguer", "Bodega Budeguer", "lujan", "Agrelo, Luján de Cuyo", 24),
  cobertura("maal-wines", "MAAL Wines", "lujan", "Las Compuertas, Luján de Cuyo", 24),
  cobertura("finca-la-anita", "Finca La Anita", "lujan", "Agrelo, Luján de Cuyo", 24),
  cobertura("ojo-de-agua", "Ojo de Agua - Dieter Meier", "lujan", "Agrelo, Luján de Cuyo", 23),
  cobertura("bodega-krontiras", "Bodega Krontiras", "lujan", "Perdriel, Luján de Cuyo", 22),
  cobertura("anaia-wines", "Anaia Wines", "lujan", "Agrelo, Luján de Cuyo", 22),
  cobertura("bodega-lamadrid", "Lamadrid Estate Wines", "lujan", "Vistalba, Luján de Cuyo", 22),
  cobertura("bodega-foster-lorca", "Bodega Foster Lorca", "lujan", "Mayor Drummond, Luján de Cuyo", 22),
  cobertura("bodegas-huarpe", "Huarpe Wines", "lujan", "Agrelo, Luján de Cuyo", 21),
  cobertura("bodega-dolium", "Bodega Dolium", "lujan", "Agrelo, Luján de Cuyo", 21),
  cobertura("bodega-caelum", "Bodega Caelum", "lujan", "Agrelo, Luján de Cuyo", 21),
  cobertura("bodega-san-huberto", "Bodega San Huberto", "lujan", "Vistalba, Luján de Cuyo", 20),
  cobertura("bodega-trapezio", "Bodega Trapezio", "lujan", "Agrelo, Luján de Cuyo", 19),
  cobertura("marchiori-barraud", "Marchiori & Barraud", "lujan", "Perdriel, Luján de Cuyo", 19),
  cobertura("familia-cassone", "Bodega Familia Cassone", "lujan", "Mayor Drummond, Luján de Cuyo", 19),
  cobertura("martino-wines", "Martino Wines", "lujan", "Mayor Drummond, Luján de Cuyo", 18),
  cobertura("sur-de-los-andes", "Sur de los Andes", "lujan", "Las Compuertas, Luján de Cuyo", 18),
  cobertura("monte-quieto", "Bodega Monte Quieto", "lujan", "Agrelo, Luján de Cuyo", 18),
  cobertura("bodega-bonfanti", "Bonfanti Wines", "lujan", "Perdriel, Luján de Cuyo", 18),
  cobertura("bodega-cabrini", "Bodega Cabrini", "lujan", "Perdriel, Luján de Cuyo", 17),
  cobertura("vina-alicia", "Viña Alicia", "lujan", "Mayor Drummond, Luján de Cuyo", 17),
  cobertura("familia-blanco", "Bodega Familia Blanco", "lujan", "Ugarteche, Luján de Cuyo", 17),
  cobertura("tierras-altas-vargas-arizu", "Tierras Altas - Familia Vargas Arizu", "lujan", "Carrodilla, Luján de Cuyo", 17),
  cobertura("finca-bandini", "Finca Bandini", "lujan", "Las Compuertas, Luján de Cuyo", 16),
  cobertura("otero-ramos", "Bodega Otero Ramos", "lujan", "Mayor Drummond, Luján de Cuyo", 16),
  cobertura("hacienda-del-plata", "Hacienda del Plata", "lujan", "Mayor Drummond, Luján de Cuyo", 15),
  cobertura("bodega-filosofos", "Bodega Filósofos", "lujan", "Carrodilla, Luján de Cuyo", 15),
  cobertura("la-pequena-bodega", "La Pequeña Bodega", "lujan", "La Puntilla, Luján de Cuyo", 15),
  cobertura("bodega-andalhue", "Bodega Andalhue", "lujan", "Ugarteche, Luján de Cuyo", 15),
  cobertura("familia-adrover", "Bodega Familia Adrover", "lujan", "Perdriel, Luján de Cuyo", 15),
  cobertura("miguel-minni", "Bodega Miguel Minni", "lujan", "Perdriel, Luján de Cuyo", 15),

  // ── Chacras de Coria (ampliación julio 2026) ──
  cobertura("bodega-viamonte", "Bodega Viamonte", "chacras", "Chacras de Coria, Luján de Cuyo", 24),
  cobertura("pulmary", "Pulmary Organic Wines", "chacras", "Chacras de Coria, Luján de Cuyo", 17),

  // ── Maipú (ampliación julio 2026) ──
  cobertura("finca-flichman", "Finca Flichman", "maipu", "Barrancas, Maipú", 30),
  cobertura("pascual-toso", "Bodegas y Viñedos Pascual Toso", "maipu", "Barrancas, Maipú", 28),
  cobertura("bodega-argento", "Bodega Argento", "maipu", "Cruz de Piedra, Maipú", 28),
  cobertura("antigal-winery", "Antigal Winery & Estates", "maipu", "Russell, Maipú", 27),
  cobertura("bodega-giol", "Bodega Giol", "maipu", "General Gutiérrez, Maipú", 21),
  cobertura("mi-terruno", "Bodega Mi Terruño", "maipu", "San Roque, Maipú", 19),
  cobertura("bodega-don-bosco", "Bodega Don Bosco", "maipu", "Rodeo del Medio, Maipú", 19),
  cobertura("vistandes", "Bodega Vistandes", "maipu", "Cruz de Piedra, Maipú", 19),
  cobertura("mevi", "MEVI Bodega Boutique", "maipu", "Coquimbito, Maipú", 18),
  cobertura("domaine-st-diego", "Domaine St. Diego", "maipu", "Lunlunta, Maipú", 17),
  cobertura("bodega-sin-fin", "Bodega Sin Fin", "maipu", "Russell, Maipú", 16),
  cobertura("bodega-baudron", "Bodega Baudron", "maipu", "Ciudad de Maipú, Maipú", 16),
  cobertura("domiciano-de-barrancas", "Domiciano de Barrancas", "maipu", "Barrancas, Maipú", 16),
  cobertura("tapaus", "Tapaus Destilería y Bodega", "maipu", "Lunlunta, Maipú", 15),
  cobertura("bodega-florio", "Bodega Florio", "maipu", "Cruz de Piedra, Maipú", 15),
  cobertura("cavas-del-conde", "Cavas del Conde", "maipu", "Coquimbito, Maipú", 15),
  cobertura("bodega-cavagnaro", "Bodega Cavagnaro", "maipu", "Coquimbito, Maipú", 15),
  cobertura("conalbi-grinberg", "Casa Vinícola Conalbi Grinberg", "maipu", "Russell, Maipú", 15),
  cobertura("stocco-de-viani", "Bodega Stocco de Viani", "maipu", "Russell, Maipú", 15),
  cobertura("corazon-de-lunlunta", "Corazón de Lunlunta", "maipu", "Lunlunta, Maipú", 15),

  // ── Valle de Uco (ampliación julio 2026) ──
  cobertura("diamandes", "Bodega DiamAndes", "uco", "Vista Flores, Tunuyán", 28),
  cobertura("enzo-bianchi", "Bodega Enzo Bianchi", "uco", "Los Chacayes, Tunuyán", 27),
  cobertura("altos-las-hormigas", "Altos Las Hormigas", "uco", "Paraje Altamira, San Carlos", 25),
  cobertura("flechas-de-los-andes", "Flechas de los Andes", "uco", "Vista Flores, Tunuyán", 24),
  cobertura("masi-tupungato", "Masi Tupungato", "uco", "La Arboleda, Tupungato", 23),
  cobertura("cuvelier-los-andes", "Cuvelier Los Andes", "uco", "Vista Flores, Tunuyán", 22),
  cobertura("casa-petrini", "Casa Petrini", "uco", "Tupungato, Valle de Uco", 22),
  cobertura("rolland-wines", "Rolland Wines (Mariflor)", "uco", "Vista Flores, Tunuyán", 21),
  cobertura("antucura", "Bodega Antucura", "uco", "Vista Flores, Tunuyán", 21),
  cobertura("altocedro", "Bodega Altocedro", "uco", "La Consulta, San Carlos", 21),
  cobertura("alpasion", "Bodega Alpasión", "uco", "Los Chacayes, Tunuyán", 20),
  cobertura("huentala-wines", "Huentala Wines", "uco", "Gualtallary, Tupungato", 19),
  cobertura("bodegas-riglos", "Bodegas Riglos (Finca Las Divas)", "uco", "Gualtallary, Tupungato", 19),
  cobertura("finca-ferrer", "Finca Ferrer", "uco", "Gualtallary, Tupungato", 19),
  cobertura("passionate-wine", "Passionate Wine", "uco", "Tupungato, Valle de Uco", 19),
  cobertura("per-se", "PerSe Bodega", "uco", "Gualtallary, Tupungato", 19),
  cobertura("ernesto-catena-vineyards", "Ernesto Catena Vineyards", "uco", "Vista Flores, Tunuyán", 18),
  cobertura("estancia-ancon", "Estancia Ancón (Château d'Ancon)", "uco", "San José, Tupungato", 18),
  cobertura("solo-contigo", "Bodega Solo Contigo", "uco", "Los Chacayes, Tunuyán", 17),
  cobertura("callejon-del-crimen", "Callejón del Crimen", "uco", "Vista Flores, Tunuyán", 17),
  cobertura("michelini-i-mufatto", "Michelini i Mufatto", "uco", "Tupungato, Valle de Uco", 17),
  cobertura("finca-suarez", "Finca Suarez", "uco", "Paraje Altamira, San Carlos", 17),
  cobertura("tupungato-winelands", "Tupungato Winelands", "uco", "Gualtallary, Tupungato", 17),
  cobertura("gen-del-alma", "Gen del Alma", "uco", "Los Chacayes, Tunuyán", 16),
  cobertura("ver-sacrum", "Ver Sacrum Wines", "uco", "Los Chacayes, Tunuyán", 16),
  cobertura("finca-abril", "Finca Abril", "uco", "Eugenio Bustos, San Carlos", 16),
  cobertura("escala-humana", "Escala Humana Wines", "uco", "Gualtallary, Tupungato", 16),
  cobertura("familia-mayol", "Bodega Familia Mayol", "uco", "Tupungato, Valle de Uco", 16),
  cobertura("bodega-chacayes", "Bodega Chacayes", "uco", "Los Chacayes, Tunuyán", 16),
  cobertura("blanchard-y-lurton", "Blanchard y Lurton", "uco", "Los Chacayes, Tunuyán", 15),
  cobertura("onofri-wines", "Onofri Wines", "uco", "Los Chacayes, Tunuyán", 15),
  cobertura("bodega-teho", "Bodega Teho", "uco", "Los Chacayes, Tunuyán", 15),
  cobertura("la-vigilia", "Bodega La Vigilia", "uco", "Los Chacayes, Tunuyán", 15),
  cobertura("stella-crinita", "Stella Crinita", "uco", "Vista Flores, Tunuyán", 15),
  cobertura("benvenuto-de-la-serna", "Bodega Benvenuto de la Serna", "uco", "Vista Flores, Tunuyán", 15),
  cobertura("los-parrales", "Bodega Los Parrales", "uco", "Vista Flores, Tunuyán", 15),
  cobertura("bodega-hinojosa", "Bodega Hinojosa", "uco", "Ciudad de Tunuyán, Tunuyán", 15),
  cobertura("la-igriega", "Bodega La Igriega", "uco", "Paraje Altamira, San Carlos", 15),
  cobertura("bodega-aconquija", "Bodega Aconquija", "uco", "La Consulta, San Carlos", 15),
  cobertura("bodega-fapes", "Bodegas y Viñedos Fapes", "uco", "La Consulta, San Carlos", 15),
  cobertura("cooperativa-san-carlos-sud", "Cooperativa San Carlos Sud", "uco", "La Consulta, San Carlos", 15),
  cobertura("familia-giaquinta", "Bodega Familia Giaquinta", "uco", "La Arboleda, Tupungato", 15),
  cobertura("bodega-altus", "Bodega Altus", "uco", "Gualtallary, Tupungato", 15),

  // ── Zona Este (ampliación julio 2026) ──
  cobertura("bodega-los-haroldos", "Bodega Los Haroldos", "este", "San Martín, Mendoza", 28),
  cobertura("bodegas-crotta", "Bodegas Crotta", "este", "Palmira, San Martín", 26),
  cobertura("tittarelli-wines", "Tittarelli Wines", "este", "La Libertad, Rivadavia", 24),
  cobertura("bodega-familia-fantelli", "Bodega Familia Fantelli", "este", "Santa Rosa, Mendoza", 20),
  cobertura("bodega-niven", "Bodega Niven", "este", "Junín, Mendoza", 18),
  cobertura("raices-de-junin", "Bodega Raíces de Junín", "este", "Junín, Mendoza", 16),
  cobertura("santos-lugares-wines", "Santos Lugares Wines", "este", "Junín, Mendoza", 14),
  cobertura("bodega-divendres", "Bodega Divendres", "este", "Junín, Mendoza", 12),
  cobertura("santa-faustina-winery", "Santa Faustina Winery", "este", "Junín, Mendoza", 12),
  cobertura("bodega-aleph", "Bodega Aleph", "este", "Los Barriales, Junín", 12),

  // ── Zona Sur (ampliación julio 2026) ──
  cobertura("bodega-goyenechea", "Bodega Goyenechea", "sur", "Villa Atuel, San Rafael", 32),
  cobertura("bodega-alfredo-roca", "Bodega Alfredo Roca", "sur", "Cañada Seca, San Rafael", 30),
  cobertura("bodega-iaccarini", "Bodega Iaccarini", "sur", "Las Paredes, San Rafael", 26),
  cobertura("bodega-labiano", "Bodega Labiano", "sur", "Rama Caída, San Rafael", 26),
  cobertura("bodega-murville", "Bodega Murville", "sur", "Las Paredes, San Rafael", 24),
  cobertura("la-vieja-bodega", "La Vieja Bodega (Serra)", "sur", "Rama Caída, San Rafael", 22),
  cobertura("chaglasian-winery", "Chaglasian Winery & Vineyards", "sur", "Las Paredes, San Rafael", 22),
  cobertura("bodega-jorge-rubio", "Bodega Jorge Rubio", "sur", "General Alvear, Mendoza", 22),
  cobertura("terra-lombarda", "Bodega Terra Lombarda", "sur", "Rama Caída, San Rafael", 20),
  cobertura("bodega-limbo", "Bodega Limbo", "sur", "Cuadro Benegas, San Rafael", 20),
  cobertura("bodega-faraon", "Bodega Faraón", "sur", "General Alvear, Mendoza", 20),
  cobertura("bodega-lavaque", "Bodega Lavaque", "sur", "San Rafael, Mendoza", 18),
  cobertura("bodega-tornaghi", "Bodega Tornaghi", "sur", "Ciudad, San Rafael", 18),
  cobertura("simonassi-lyon", "Bodega Simonassi Lyon", "sur", "San Rafael, Mendoza", 16),
  cobertura("chayee-bourras", "Bodega Chayee Bourras", "sur", "San Rafael, Mendoza", 16),
  cobertura("bodega-boutique-ibarra", "Bodega Boutique Ibarra", "sur", "Rama Caída, San Rafael", 16),
  cobertura("finca-el-nevado", "Finca El Nevado", "sur", "Rama Caída, San Rafael", 14),
  cobertura("bodega-secreto", "Bodega Secreto", "sur", "Las Paredes, San Rafael", 14),
  cobertura("bodega-ultima-frontera", "Bodega Última Frontera", "sur", "Las Paredes, San Rafael", 14),
  cobertura("bodega-haarth", "Bodega Haarth", "sur", "Villa Atuel, San Rafael", 14),
  cobertura("finca-ivonne", "Finca Ivonne", "sur", "Real del Padre, San Rafael", 14),
  cobertura("epsilon-cru", "Bodega Epsilon Cru", "sur", "Las Paredes, San Rafael", 12),
  cobertura("la-mansa-wine-estates", "La Mansa Wine Estates", "sur", "Cuadro Nacional, San Rafael", 12),
  cobertura("bodega-bournett", "Bodega Bournett", "sur", "Cuadro Nacional, San Rafael", 12),
  cobertura("bodega-etnia", "Bodega Etnia", "sur", "Rama Caída, San Rafael", 12),
  cobertura("argana-wine", "Argana Wine", "sur", "Atuel Norte, San Rafael", 12),
  cobertura("bodega-fow", "Bodega FOW & Restó", "sur", "Cuadro Benegas, San Rafael", 12),
  cobertura("finca-amakaik", "Finca Amakaik", "sur", "Cañada Seca, San Rafael", 12),
  cobertura("gloria-galvagno-estate", "Gloria Galvagno Estate", "sur", "Monte Comán, San Rafael", 12),
  cobertura("viejas-cepas", "Bodega Viejas Cepas", "sur", "Bowen, General Alvear", 12),
];

// ─────────────────────────────────────────────────────────────────────────
// Catálogo público: las 12 cargadas a fondo + la cobertura base.
// Esta es la lista que consume toda la app (home, fichas, sitemap).
// ─────────────────────────────────────────────────────────────────────────
export const BODEGAS: Bodega[] = [...SEED, ...COBERTURA];
