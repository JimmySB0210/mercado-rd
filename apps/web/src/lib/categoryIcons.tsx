// ============================================================
// MercadoRD — Íconos de categoría
// Ruta: src/lib/categoryIcons.tsx
// ============================================================
// Mapea el nombre de una categoría (los 110 registros de la tabla
// `categories`, incluyendo subcategorías) a un ícono de línea de
// lucide-react, reemplazando el emoji crudo. Coincidencia por
// palabra clave sobre el nombre (sin acentos, minúsculas) — la
// primera regla que matchea gana; Package es el fallback genérico
// para cualquier categoría no cubierta explícitamente.
// ============================================================

import {
  Shirt, Car, Wheat, PawPrint, ShoppingBasket, Baby, Footprints, Smartphone,
  WashingMachine, SprayCan, Palette, Scissors, Droplet, Coffee, CupSoda, Candy,
  Croissant, Camera, Headphones, Gamepad2, Watch, Cpu, Gem, Backpack, Home,
  Armchair, UtensilsCrossed, Bath, Lightbulb, Wrench, Zap, PaintBucket, HardHat,
  Factory, BookOpen, Briefcase, Dumbbell, Sun, Shield, HeartPulse, Truck, Ruler,
  Package, Settings2, Plug, Gift, Laptop, Tv,
  type LucideIcon,
} from 'lucide-react'

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const RULES: [RegExp, LucideIcon][] = [
  // Autos / vehículos (antes que "auto" genérico haga match con otra cosa)
  [/neumatic|llanta|repuestos.*(motor|vehic)|suministros.*automotr|herramientas.*automotr|accesorios.*auto|audio.*auto/, Car],
  [/vehic|\bauto(s)?\b|\bcarro\b|\bmoto\b/, Car],

  // Agro
  [/fertilizante|semilla|riego|equipos.*agr|agricultura/, Wheat],
  [/animal|mascota|veterinar/, PawPrint],
  [/agropecuario/, Wheat],

  // Comida y bebida
  [/cafe|\bte\b/, Coffee],
  [/bebida/, CupSoda],
  [/snack|dulce/, Candy],
  [/panaderia/, Croissant],
  [/alimento|comida|enlatad|conserva|condiment|especias/, ShoppingBasket],

  // Belleza y cuidado personal
  [/cuidado.*piel|\bpiel\b/, Droplet],
  [/cuidado.*cabello|\bcabello\b/, Scissors],
  [/maquillaje/, Palette],
  [/perfum|fragan/, SprayCan],
  [/belleza|cosmetic|cuidado personal/, SprayCan],

  // Bebés y niños
  [/bebe|nin|infantil|juguete/, Baby],

  // Calzado
  [/calzado|zapato|tenis|sandalia|\bbotas?\b|sneaker/, Footprints],

  // Electrónica / tecnología
  [/laptop|computador/, Laptop],
  [/television|\btv\b/, Tv],
  [/camara/, Camera],
  [/audifono|parlante/, Headphones],
  [/videojuego/, Gamepad2],
  [/smartwatch/, Watch],
  [/componentes electronicos/, Cpu],
  [/celular|smartphone|electronica/, Smartphone],

  // Ropa
  [/ropa|camiseta|pantalon|chaqueta|vestido|traje.*bano|interior|gorra/, Shirt],

  // Accesorios de viaje/carga
  [/maleta|bolso|estuche|mochila|lonchera/, Backpack],
  [/joyeria|lentes|reloj/, Gem],

  // Hogar
  [/mueble/, Armchair],
  [/cocina|comedor/, UtensilsCrossed],
  [/\bbano\b/, Bath],
  [/iluminacion|\bluces\b/, Lightbulb],
  [/electrodomestico/, WashingMachine],
  [/decoracion|textiles.*hogar|hogar/, Home],

  // Ferretería / construcción
  [/electricidad|electrico/, Zap],
  [/pintura/, PaintBucket],
  [/construccion|bienes raices|maquinaria.*construccion/, HardHat],
  [/ferreteria|herramientas|plomeria|tornilleria/, Wrench],
  [/industrial|fabricacion|manufactur/, Factory],

  // Oficina / escolar
  [/escolar|utiles|papeleria/, BookOpen],
  [/oficina/, Briefcase],

  // Deportes / salud / varios
  [/deportes|entretenimiento|aire libre/, Dumbbell],
  [/energia renovable|solar/, Sun],
  [/seguridad/, Shield],
  [/salud|medicina/, HeartPulse],
  [/manejo de materiales|transporte|vehiculos y transporte/, Truck],
  [/instrumentos.*medicion/, Ruler],
  [/equipos y maquinaria comercial|servicios/, Settings2],
  [/equipos y suministros electricos/, Plug],
  [/regalos|manualidades|arte/, Gift],
]

export function getCategoryIcon(name: string): LucideIcon {
  const normalized = stripAccents(name.toLowerCase())
  for (const [pattern, Icon] of RULES) {
    if (pattern.test(normalized)) return Icon
  }
  return Package
}
