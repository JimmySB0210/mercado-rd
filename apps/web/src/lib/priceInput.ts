// ============================================================
// MercadoRD — Precios escritos a mano (campo "Precio" del vendedor)
// Ruta: src/lib/priceInput.ts
// ============================================================
// Un vendedor dominicano escribe "5.495" o "5,495" para decir cinco mil
// cuatrocientos noventa y cinco pesos. Con <input type="number"> el
// navegador no deja teclear la coma y el punto se leía como decimal:
// "5.495" se guardaba como RD$5.50 (550 centavos) y la ficha mostraba
// "RD$6". Estas funciones leen lo escrito como lo escribiría una
// persona; los precios siguen guardándose en centavos (enteros).
//
// Reglas (la coma y el punto valen igual):
//   - "5495", "5,495", "5.495", "RD$ 5 495"        → 5495
//   - un solo separador seguido de EXACTAMENTE 3 dígitos, con 1 a 3
//     dígitos delante (sin cero inicial)            → miles: "12.500" = 12500
//   - un solo separador seguido de 1 o 2 dígitos    → decimales: "5.5", "5,50"
//   - varios separadores iguales                    → miles: "1.250.000" = 1250000
//   - punto y coma juntos: manda el ÚLTIMO como decimal ("1,250.50", "1.250,50")
//   - más de 2 decimales se recortan; "0.500" es 0.50 (el cero inicial manda)
// ============================================================

const MAX_RAW_LENGTH = 14

// Lo que se deja en el campo mientras se escribe: solo dígitos, '.' y ','
// (se quita "RD$", espacios, letras, signos). No decide nada todavía.
export function sanitizePriceInput(raw: string): string {
  return (raw ?? '').replace(/[^0-9.,]/g, '').slice(0, MAX_RAW_LENGTH)
}

// Texto canónico del precio: solo dígitos y, si hace falta, un '.' con
// hasta 2 decimales ("5495", "5495.5", "0.50"). '' si no hay ningún número.
export function normalizePriceInput(raw: string): string {
  const s = sanitizePriceInput(raw)
  if (!/\d/.test(s)) return ''

  const seps: { index: number; char: string }[] = []
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '.' || s[i] === ',') seps.push({ index: i, char: s[i] })
  }

  let integerPart: string
  let decimalPart = ''
  let keepTrailingPoint = false

  if (seps.length === 0) {
    integerPart = s
  } else {
    const last = seps[seps.length - 1]
    const kinds = new Set(seps.map(x => x.char))
    const before = s.slice(0, last.index).replace(/[.,]/g, '')
    const after = s.slice(last.index + 1)

    if (kinds.size > 1) {
      // Punto y coma a la vez: el último separador es el decimal
      integerPart = before
      decimalPart = after.slice(0, 2)
      keepTrailingPoint = after === ''
    } else if (seps.length > 1) {
      // Varios iguales: separadores de miles
      integerPart = before + after
    } else if (after === '') {
      // "5." — la persona aún está escribiendo los decimales
      integerPart = before
      keepTrailingPoint = true
    } else if (after.length === 3 && before.length >= 1 && before.length <= 3 && !before.startsWith('0')) {
      // "5.495" / "12,500" — miles
      integerPart = before + after
    } else {
      integerPart = before
      decimalPart = after.slice(0, 2)
    }
  }

  integerPart = integerPart.replace(/^0+(?=\d)/, '')
  if (integerPart === '') integerPart = '0'
  if (decimalPart) return `${integerPart}.${decimalPart}`
  return keepTrailingPoint ? `${integerPart}.` : integerPart
}

// Lo escrito → centavos enteros (sin errores de coma flotante), o null si
// no hay un número. "5.495" → 549500; "5495.5" → 549550; "" → null.
export function priceInputToCents(raw: string): number | null {
  const normalized = normalizePriceInput(raw)
  if (normalized === '') return null
  const [integer, decimals = ''] = normalized.replace(/\.$/, '').split('.')
  const cents = Number(integer) * 100 + Number(decimals.padEnd(2, '0').slice(0, 2) || '0')
  return Number.isFinite(cents) ? cents : null
}
