import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase para el navegador (las reseñas son 100% client-side:
// el sitio sigue siendo estático y gratis de hostear).
//
// Si las env vars no están configuradas devuelve null y la UI muestra el
// teaser de "reseñas próximamente" — así el sitio funciona igual sin Supabase.
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase renovó sus claves: los proyectos nuevos entregan una
  // "publishable key" (sb_publishable_...) en lugar de la anon key (JWT).
  // Cumplen el mismo rol (pública + RLS); aceptamos cualquiera de las dos.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

// Una reseña como vive en la tabla `resenas` (ver supabase/schema.sql).
export interface Resena {
  id: string;
  bodega_slug: string;
  user_id: string;
  user_nombre: string | null;
  plan: "visita" | "degustacion" | "almuerzo" | "picnic" | "actividades";
  vista: number | null; // null = "sin vista a viñedos"
  sin_vista: boolean;
  calidad_precio: number; // 1-5
  servicio: number; // 1-5
  comida: number | null; // 1-5, solo si aplica
  precio_pagado: number | null; // ARS por persona
  como_llego: "auto" | "tour" | "bus" | "bici" | "otro" | null;
  comentario: string | null;
  fotos: string[];
  created_at: string;
}
