// ============================================================
// MercadoRD — Escalas de talla para las variantes de un producto
// Ruta: src/lib/productSizes.ts
// ============================================================
// product_variants.size es texto libre (UNIQUE por producto + talla +
// color). Estas listas son solo los atajos que ofrece el wizard del
// vendedor: los chips de "Generar combinaciones" y el <select> de cada
// fila. Cualquier otro valor ("128GB", "Grande", "40.5") sigue entrando
// por "Otra (escribir)".
//
// Los tres juegos no se solapan (ropa = letras, EE. UU. = 1 a 14,
// Europa = 35 a 47), así que un valor guardado identifica su escala sin
// ambigüedad — eso es lo que usa inferSizeScale() al editar un producto.
// ============================================================

export type SizeScale = 'apparel' | 'footwear_us' | 'footwear_eu'

// Orden en el que se muestran los botones del selector de tipo de talla
export const SIZE_SCALE_ORDER: readonly SizeScale[] = ['apparel', 'footwear_us', 'footwear_eu']

// Todos los pasos son múltiplos de 0.5, exactos en coma flotante:
// String(5.5) === '5.5' y String(6) === '6' (sin ceros de más).
function range(from: number, to: number, step: number): string[] {
  const out: string[] = []
  for (let n = from; n <= to; n += step) out.push(String(n))
  return out
}

export const SIZE_SCALES: Record<SizeScale, readonly string[]> = {
  apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  // Numeración de EE. UU. (la que más usan las marcas de tenis), de
  // media en media talla: 1, 1.5, 2 ... 14. Arranca en 1 para que también
  // se pueda vender calzado de niño ("del 1 al 5") con el selector de rango.
  footwear_us: range(1, 14, 0.5),
  // Numeración europea: 35 ... 47. Las medias tallas (40.5, 42.5) van
  // por "Otra (escribir)".
  footwear_eu: range(35, 47, 1),
}

// ¿La escala trae medias tallas (5.5, 6.5 ...)? Hoy solo calzado EE. UU.:
// el selector de rango muestra "Incluir medias tallas" únicamente ahí.
export function scaleHasHalfSizes(scale: SizeScale): boolean {
  return SIZE_SCALES[scale].some(s => s.includes('.'))
}

// Tallas de una escala entre dos extremos (inclusive), en el orden de la
// escala — para vender "del 8 al 12" sin marcar talla por talla. `from` y
// `to` pueden venir al revés. `wholeOnly` descarta las medias tallas
// (8, 9, 10 en vez de 8, 8.5, 9 ...). Un extremo que no es de la escala
// (ej. "M" en calzado) devuelve [].
export function sizesInRange(
  scale: SizeScale,
  from: string,
  to: string,
  opts: { wholeOnly?: boolean } = {},
): string[] {
  const list = SIZE_SCALES[scale]
  const a = list.indexOf(from)
  const b = list.indexOf(to)
  if (a === -1 || b === -1) return []
  const slice = list.slice(Math.min(a, b), Math.max(a, b) + 1)
  return opts.wholeOnly ? slice.filter(s => !s.includes('.')) : [...slice]
}

// Categorías (por slug) en las que lo normal es vender calzado: el
// wizard arranca con la escala de calzado de EE. UU. cuando alguna de
// la ruta elegida (Calzado → Tenis, Calzado → Botas ...) está aquí.
// "calzado-accesorios" es una categoría raíz antigua, sin subcategorías.
export const FOOTWEAR_CATEGORY_SLUGS: readonly string[] = ['calzado', 'calzado-accesorios']

// `path` es la ruta elegida en el selector de categorías, de la raíz a
// la hoja. Fuera de Calzado (Ropa & Moda y todo lo demás) la escala por
// defecto sigue siendo la de ropa, como siempre.
export function defaultSizeScaleForCategories(path: readonly { slug: string }[]): SizeScale {
  return path.some(c => FOOTWEAR_CATEGORY_SLUGS.includes(c.slug)) ? 'footwear_us' : 'apparel'
}

// Al editar: si las tallas ya guardadas coinciden con UNA sola escala,
// esa es la que se muestra (así unos tenis publicados en Ropa & Moda con
// tallas 8, 9, 10 no aparecen como "Otra"); las que no estén en la lista
// (ej. 40.5) siguen saliendo como "Otra". Si no coincide ninguna ("128GB",
// "Grande", sin tallas) o coinciden dos a la vez (ropa y calzado mezclados)
// devuelve null: manda la categoría.
export function inferSizeScale(sizes: readonly (string | null | undefined)[]): SizeScale | null {
  const used = sizes.map(s => (s ?? '').trim()).filter(Boolean)
  const matching = SIZE_SCALE_ORDER.filter(scale => used.some(s => SIZE_SCALES[scale].includes(s)))
  return matching.length === 1 ? matching[0] : null
}
