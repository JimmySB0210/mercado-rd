// ============================================================
// MercadoRD — Filas de variantes (Talla × Color) del asistente de producto
// Ruta: src/lib/variantRows.ts
// ============================================================
// En el paso "Precio y stock" las filas de variantes son la ÚNICA fuente de
// verdad: las tallas y los colores que se ven como botones salen de ellas
// (rowSizes / rowColors) y elegir o quitar una talla o un color reconstruye
// las filas con rebuildVariantRows. No hay una lista de selección aparte que
// pueda quedar desfasada de la tabla ni un botón "Generar" que reemplace lo
// que ya estaba guardado.
//
// Funciones puras, sin React ni Supabase: se prueban solas.
// ============================================================

export interface VariantRow {
  size: string
  color: string
  stock: string
  price: string
  imageUrl: string | null
}

// Existencias de una fila: entero >= 0 (vacío, negativo o ilegible cuenta como
// 0). Es lo que se guarda y lo que se suma al total del producto.
export const stockOf = (row: { stock: string }): number => {
  const n = parseInt(row.stock, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

const colorKey = (color: string) => color.trim().toLowerCase()

// Clave de una combinación: la talla tal cual (sin espacios en los bordes) y
// el color sin distinguir mayúsculas — "Blanco" y "blanco" son la misma
// combinación (la BD tiene UNIQUE por producto + talla + color).
export const variantRowKey = (size: string, color: string) => `${size.trim()}|${colorKey(color)}`

// Tallas distintas de las filas, en el orden en que aparecen (sin vacías)
export function rowSizes(rows: readonly { size: string }[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of rows) {
    const size = row.size.trim()
    if (size && !seen.has(size)) {
      seen.add(size)
      out.push(size)
    }
  }
  return out
}

// Colores distintos de las filas (sin distinguir mayúsculas; se conserva la
// primera forma escrita), en el orden en que aparecen
export function rowColors(rows: readonly { color: string }[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of rows) {
    const color = row.color.trim()
    if (color && !seen.has(colorKey(color))) {
      seen.add(colorKey(color))
      out.push(color)
    }
  }
  return out
}

// "Azul, rojo,  AZUL" → ['Azul', 'rojo']: separados por coma, sin vacíos ni
// repetidos (Blanco y blanco son el mismo color)
export function parseColorList(text: string): string[] {
  return mergeColors([], text.split(','))
}

// Suma `extra` a `current` sin repetir (sin distinguir mayúsculas) ni dejar vacíos
export function mergeColors(current: readonly string[], extra: readonly string[]): string[] {
  const seen = new Set(current.map(colorKey))
  const out = [...current]
  for (const raw of extra) {
    const color = raw.trim()
    if (color && !seen.has(colorKey(color))) {
      seen.add(colorKey(color))
      out.push(color)
    }
  }
  return out
}

// Reconstruye las filas para que sean exactamente (colores × tallas):
//  - una combinación que ya existía conserva su stock, su precio y su foto;
//  - una nueva empieza vacía (stock sin escribir = 0), con la foto de su
//    color si otra fila de ese color ya la tenía;
//  - lo que se quitó desaparece, y las filas en blanco también.
// Excepción: un eje que pasa de "ninguno" a exactamente UNO (o al revés) no
// cambia lo que hay en cada fila — la talla 8 que tenía 5 pares sigue
// teniéndolos al agregar "Blanco" como único color. Con varios valores nuevos
// no se adivina a cuál le tocaban: empiezan vacíos.
// Orden: por color y, dentro de cada color, por talla.
export function rebuildVariantRows(
  prev: readonly VariantRow[],
  sizes: readonly string[],
  colors: readonly string[],
): VariantRow[] {
  const sizeList = rowSizes(sizes.map(size => ({ size })))
  const colorList = rowColors(colors.map(color => ({ color })))
  if (sizeList.length === 0 && colorList.length === 0) return []

  const byKey = new Map<string, VariantRow>()
  const imageByColor = new Map<string, string>()
  for (const row of prev) {
    const key = variantRowKey(row.size, row.color)
    if (!byKey.has(key)) byKey.set(key, row)
    const ck = colorKey(row.color)
    if (ck && row.imageUrl && !imageByColor.has(ck)) imageByColor.set(ck, row.imageUrl)
  }

  const prevSizes = rowSizes(prev)
  const prevColors = rowColors(prev)
  const sizeAxisSwaps =
    (prevSizes.length === 0 && sizeList.length === 1) || (prevSizes.length === 1 && sizeList.length === 0)
  const colorAxisSwaps =
    (prevColors.length === 0 && colorList.length === 1) || (prevColors.length === 1 && colorList.length === 0)

  const sizeAxis = sizeList.length > 0 ? sizeList : ['']
  const colorAxis = colorList.length > 0 ? colorList : ['']

  const out: VariantRow[] = []
  for (const color of colorAxis) {
    for (const size of sizeAxis) {
      let source = byKey.get(variantRowKey(size, color))
      if (!source && (sizeAxisSwaps || colorAxisSwaps)) {
        const oldSize = sizeAxisSwaps ? (size === '' ? prevSizes[0] : '') : size
        const oldColor = colorAxisSwaps ? (color === '' ? prevColors[0] : '') : color
        source = byKey.get(variantRowKey(oldSize, oldColor))
      }
      out.push({
        size,
        color,
        stock: source?.stock ?? '',
        price: source?.price ?? '',
        imageUrl: source?.imageUrl ?? imageByColor.get(colorKey(color)) ?? null,
      })
    }
  }
  return out
}

// Foto de un color: se guarda en todas las filas de ese color (al publicar se
// propaga igual, pero así la tabla y la vista previa ya la tienen)
export function setColorImage<R extends VariantRow>(rows: readonly R[], color: string, imageUrl: string | null): R[] {
  const key = colorKey(color)
  return rows.map(row => (colorKey(row.color) === key ? { ...row, imageUrl } : row))
}

// El mismo stock en todas las filas
export function setStockForAll<R extends VariantRow>(rows: readonly R[], stock: string): R[] {
  return rows.map(row => ({ ...row, stock }))
}

// Cómo se nombra una combinación en la tabla: "8 · Blanco", "8" o "Blanco"
export function variantRowLabel(row: { size: string; color: string }): string {
  const size = row.size.trim()
  const color = row.color.trim()
  return size && color ? `${size} · ${color}` : size || color
}
