'use client'
// ============================================================
// MercadoRD — ProductCard
// Ruta: src/components/product/ProductCard.tsx
// ============================================================
// Fix: el botón de WhatsApp (un <a>) estaba anidado dentro del
// <Link> principal (que también renderiza un <a>), lo cual es
// HTML inválido (<a> dentro de <a>) y causaba un error de
// hidratación. Ahora el WhatsApp CTA vive como hermano del
// Link, fuera de él, envueltos ambos en un <div> contenedor.
// ============================================================

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { formatPrice, discountPercent, type ProductWithVendor } from '@/types/database.types'
import type { Product as CartProduct } from '@/types'
import { WishlistButton } from '@/components/shop/WishlistButton'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useShippingRateForCurrentProvince } from '@/lib/hooks/useShippingRate'
import { useCartStore } from '@/lib/store/cart'
import { useLocationStore } from '@/lib/store/location'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'

// Mismas 4 columnas que product_pricing_tiers en la BD — ver
// PricingTiersSection.tsx (editor del vendor) y producto/[id]/page.tsx
// (fetch original, sin consumidor hasta ahora).
export interface ProductCardPricingTier {
  id: string
  min_quantity: number
  max_quantity: number | null
  price_rdp: number
  unit_label: string
}

interface Props {
  product: ProductWithVendor
  // Si el que renderiza la tarjeta ya verificó (con una sola consulta
  // batched a product_variants, no una por tarjeta) que este producto
  // tiene variantes activas — undefined significa "todavía no se sabe"
  // (la consulta sigue en vuelo): mientras tanto la tarjeta NUNCA ofrece
  // agregar directo (para no arriesgarse a una línea sin talla/color),
  // pero muestra un botón "verificando" en vez de saltar directo a "no
  // se puede" — ver isCheckingVariants más abajo. Ver
  // HomeProductSection/FeaturedProductsGrid/etc.
  hasVariants?: boolean
  // "Más vendido" relativo a la lista donde se está renderizando esta
  // tarjeta (el sold_count más alto DEL GRID ACTUAL, nunca un ranking
  // global de la plataforma que no existe) — lo calcula el padre sobre
  // el array completo, una tarjeta sola no puede saberlo de sí misma.
  isBestSeller?: boolean
  // Filas reales de product_pricing_tiers para ESTE producto (batched
  // por el padre, igual que hasVariants) — undefined/[] es "no tiene
  // tramos configurados": la tarjeta cae al precio simple de siempre,
  // nunca inventa un tramo. Con filas, reemplaza esa línea de precio
  // por la tabla de tramos — el resto de la tarjeta (imagen, badge,
  // CTA de carrito a product.price_rdp) no cambia.
  pricingTiers?: ProductCardPricingTier[]
  // De dónde viene el clic — hoy solo lo manda /proveedores (Productos)
  // como "proveedores", para que la página de producto sepa mostrar la
  // tabla de tramos como precio principal sin banner (ver
  // producto/[id]/page.tsx). Sin este prop, los links quedan igual que
  // siempre en cualquier otro lugar donde se usa esta tarjeta.
  origin?: string
}

// Mismo umbral real que ya usa todo el sitio (cart/page.tsx,
// checkout/page.tsx, FreeShippingBadge.tsx)
const FREE_SHIPPING_THRESHOLD_RDP = 250000 // RD$2,500

// "Nuevo" — mismo criterio en todos lados donde se muestre: publicado
// hace 14 días o menos. published_at (no created_at) porque no se mueve
// si el vendor dejó el producto en borrador semanas antes de publicarlo.
const NEW_BADGE_WINDOW_DAYS = 14

function isRecentlyPublished(publishedAt: string | null | undefined): boolean {
  if (!publishedAt) return false
  const days = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000
  return days >= 0 && days <= NEW_BADGE_WINDOW_DAYS
}

export function ProductCard({ product, hasVariants, isBestSeller, pricingTiers, origin }: Props) {
  const { t } = useTranslation('products')
  const addItem = useCartStore(s => s.addItem)
  const selectedProvince = useLocationStore(s => s.province)
  const [imgSrc, setImgSrc] = useState(product.images?.[0] ?? PLACEHOLDER_PRODUCT_IMAGE)
  const [added, setAdded] = useState(false)
  const productHref = `/producto/${product.id}${origin ? `?origen=${origin}` : ''}`
  const hasDiscount = product.compare_rdp && product.compare_rdp > product.price_rdp
  const discount = hasDiscount
    ? discountPercent(product.price_rdp, product.compare_rdp!)
    : null
  const isNew = isRecentlyPublished(product.published_at)
  const isLowStock = product.stock > 0 && product.stock <= 5
  const isLocal = !!selectedProvince && product.province?.id === selectedProvince.id

  // sizes/colors (sistema viejo) se conocen de entrada, sin esperar red
  // — si el producto ya trae alguno, no hace falta ni preguntar por
  // product_variants, seguro necesita elegir algo.
  const legacyNeedsVariant = product.sizes.length > 0 || product.colors.length > 0
  // Mientras hasVariants todavía no llegó (consulta batched a
  // product_variants en vuelo) Y el producto no tiene ya un motivo
  // conocido para bloquear la compra directa, el estado real es
  // "verificando", no "no se puede" — antes caía directo a "Ver tienda"
  // apenas se montaba la tarjeta, y en listas con muchas secciones (cada
  // una con su propia consulta) ese parpadeo podía durar varios
  // segundos y parecer que al producto simplemente le faltaba el botón.
  const isCheckingVariants = hasVariants === undefined && !legacyNeedsVariant
  // Solo se ofrece "Agregar al carrito" directo cuando ya se confirmó
  // que no hay variantes activas (product_variants) ni sizes/colors del
  // sistema viejo — cualquiera de los dos significa que hace falta
  // elegir algo antes de comprar, y esa selección solo existe en la
  // página de producto (ProductActions).
  const canAddDirectly = hasVariants === false && !legacyNeedsVariant && product.stock > 0
  // Producto que exige elegir color/talla/etc. antes de comprar — la tarjeta
  // no puede agregarlo directo, así que ofrece "Ver opciones →" hacia la
  // página de producto, donde ya existe esa selección (ProductActions).
  const needsOptions = hasVariants === true || legacyNeedsVariant

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canAddDirectly || added) return
    // Mismo cast que ya usan los demás call sites entre ProductWithVendor
    // (vendor: Pick<...>) y Product (vendor?: Vendor completo) — son dos
    // formas del mismo producto real, no dos productos distintos.
    addItem(product as unknown as CartProduct, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // Info de envío — Fase 2A Batch 3. Sin provincia seleccionada
  // (rate === undefined) no se muestra nada, no se adivina.
  const shippingRate = useShippingRateForCurrentProvince()
  const qualifiesFreeShipping = product.price_rdp >= FREE_SHIPPING_THRESHOLD_RDP
  const showShippingInfo = shippingRate !== undefined && (qualifiesFreeShipping || shippingRate !== null)

  // Un solo badge por tarjeta, no varios apilados — mismo patrón que la
  // referencia visual (cada tarjeta muestra exactamente uno). Prioridad:
  // descuento real > últimas unidades > más vendido (de esta lista) >
  // nuevo > envío gratis > local. Cada color comunica el tipo de
  // beneficio en vez de un solo naranja para todo. Nunca se inventa un
  // badge sin el dato real detrás.
  const badge = discount
    ? { label: `-${discount}%`, bg: 'var(--brand-red)' }
    : isLowStock
      ? { label: t('stockLeftBadge', { count: product.stock }), bg: 'var(--color-orange)' }
      : isBestSeller
        ? { label: t('bestSellerBadge'), bg: 'var(--color-orange)' }
        : isNew
          ? { label: t('newBadge'), bg: 'var(--color-purple-bright)' }
          : qualifiesFreeShipping
            ? { label: t('cardFreeShipping'), bg: 'var(--color-green)' }
            : isLocal
              ? { label: t('localBadge'), bg: 'var(--color-primary)' }
              : null

  // Alturas parejas (desde 641px) — antes cada tarjeta medía lo que le
  // salía según su contenido (título de 1 o 2 líneas, con o sin botón), y
  // en una misma fila unas terminaban 50-100px más cortas que otras.
  // Ahora: la tarjeta es una columna que llena su celda (h-full), el
  // título reserva 2 líneas, y el CTA queda anclado abajo con 84px
  // reservados (botón 36 + separación 8 + "Ver tienda" 28 + pb-3 12) en
  // TODOS los estados — comprar, verificando, ver opciones — así que
  // resolver la consulta de variantes no mueve nada.
  // Todo va con min-[641px]: (no sm:, que arranca en 640 y se pisaría con
  // el max-width:640px del masonry) porque bajo 640px el home usa
  // .grid-products como columnas escalonadas (globals.css) a propósito:
  // ahí la tarjeta conserva su alto natural.
  return (
    <div
      className="relative group overflow-hidden bg-[var(--color-card-bg)] [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-0.5 min-[641px]:flex min-[641px]:flex-col min-[641px]:h-full"
      style={{ borderRadius: 'var(--radius-card)', transition: 'box-shadow var(--transition-base), transform var(--transition-base)' }}
    >
      {/* Hermano del Link, no anidado dentro — mismo motivo que el CTA de WhatsApp */}
      <WishlistButton productId={product.id} />

      <Link href={productHref} className="block">
        {/* Imagen */}
        <div
          className="relative aspect-square overflow-hidden bg-gray-50"
          style={{ borderRadius: 'var(--radius-product-image) var(--radius-product-image) 0 0' }}
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc(PLACEHOLDER_PRODUCT_IMAGE)}
          />
          {/* Un solo badge — ver prioridad calculada arriba (`badge`) */}
          {badge && (
            <span
              className="absolute top-2 left-2 text-white text-xs font-bold px-2.5 py-1"
              style={{ background: badge.bg, borderRadius: 'var(--radius-pill)' }}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Info — orden pedido explícitamente: rating → vendedor → nombre → precio → envío */}
        <div className="p-3 pb-0">
          {/* Rating — siempre visible, aunque no haya reseñas todavía
              (rating_avg es null cuando rating_count es 0 — se
              recalculan juntos vía trigger, nunca uno sin el otro) */}
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {product.rating_count > 0
              ? <>⭐ {product.rating_avg!.toFixed(1)} ({product.rating_count})</>
              : t('cardNoRatingsYet')}
          </p>

          {/* Vendor */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{product.vendor?.business_name}</span>
            {product.vendor?.is_verified && (
              <svg
                className="w-3 h-3 flex-shrink-0"
                style={{ color: 'var(--brand-blue)' }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Nombre — min-h de 2 líneas (2 × leading-snug 1.375em) */}
          <p
            className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug min-[641px]:min-h-[2.75em]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {product.name}
          </p>

          {/* Precio — tabla de tramos cuando el producto los tiene
              configurados (product_pricing_tiers real, nunca inventado);
              si no, el precio simple de siempre (rojo con descuento real,
              azul de marca en cualquier otro caso). */}
          {pricingTiers && pricingTiers.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {t('pricingTiersTitle')}
              </p>
              <div className="space-y-0.5">
                {pricingTiers.map(tier => (
                  <div key={tier.id} className="flex items-baseline justify-between gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {tier.max_quantity !== null
                        ? t('pricingTiersRangeBetween', { min: tier.min_quantity, max: tier.max_quantity, unit: tier.unit_label })
                        : t('pricingTiersRangeAndUp', { min: tier.min_quantity, unit: tier.unit_label })}
                    </span>
                    <span
                      className="text-sm font-extrabold"
                      style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}
                    >
                      {formatPrice(tier.price_rdp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className="text-xl font-extrabold"
                style={{ color: hasDiscount ? 'var(--brand-red)' : 'var(--color-primary)', fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}
              >
                {formatPrice(product.price_rdp)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.compare_rdp!)}
                </span>
              )}
            </div>
          )}

          {/* Envío — solo con provincia seleccionada, nunca adivinado */}
          {showShippingInfo && (
            <p
              className="text-xs mt-1"
              style={{ color: qualifiesFreeShipping ? 'var(--color-green)' : 'var(--color-text-secondary)', fontWeight: qualifiesFreeShipping ? 600 : 400 }}
            >
              🚚 {qualifiesFreeShipping ? t('cardFreeShipping') : t('cardShippingFrom', { amount: (shippingRate! / 100).toLocaleString('es-DO') })}
            </p>
          )}
        </div>
      </Link>

      {/* CTA — fuera del Link, como hermanos, para evitar <a>/<button> dentro de <a>.
          Desde 641px: anclado abajo (mt-auto) con 84px reservados. */}
      <div className="px-3 pb-3 min-[641px]:mt-auto min-[641px]:min-h-[84px]">
        {canAddDirectly ? (
          <>
            {/* Compra directa es el camino principal cuando el producto lo
                permite — "descubro → evalúo → agrego al carrito", no
                "pregunto por WhatsApp primero". */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-1.5 w-full text-white text-xs font-semibold py-2.5 transition-colors"
              style={{
                background: added ? 'var(--color-green)' : 'var(--color-primary)',
                borderRadius: 'var(--radius-control)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {added ? (
                <>
                  <Check size={14} /> {t('addedToCart')}
                </>
              ) : (
                <>
                  <ShoppingCart size={14} /> {t('addToCart')}
                </>
              )}
            </button>

            {/* Ver tienda — fila secundaria compacta, nunca más
                protagónica que comprar. WhatsApp se quitó de la tarjeta
                a pedido explícito (sigue en la página del producto,
                ProductActions.tsx, sin tocar). */}
            {product.vendor?.id && (
              <Link
                href={`/tienda/${product.vendor.id}`}
                className="block text-center text-xs font-medium py-1.5 mt-2 hover:underline truncate"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('viewStore')}
              </Link>
            )}
          </>
        ) : isCheckingVariants ? (
          // Mismo tamaño/forma que el botón real para que no haya salto
          // de layout cuando resuelva — deshabilitado y apagado para que
          // se lea como "un momento", no como "ya se decidió que no".
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-2.5"
            style={{
              background: 'var(--color-divider)',
              color: 'var(--color-text-tertiary)',
              borderRadius: 'var(--radius-control)',
              border: 'none',
              cursor: 'wait',
            }}
          >
            <ShoppingCart size={14} /> {t('addToCart')}
          </button>
        ) : (
          <>
            {/* Con variantes no se puede agregar directo — este botón lleva
                a la página del producto, donde ya está el flujo real de
                elegir color/talla. Ocupa el mismo espacio (36px) que
                "Agregar al carrito" en las demás tarjetas. Solo desde
                641px: bajo eso la tarjeta se queda como estaba (masonry). */}
            {needsOptions && (
              <Link
                href={productHref}
                className="hidden min-[641px]:flex items-center justify-center w-full h-9 text-xs font-semibold transition-colors hover:bg-[var(--color-primary-subtle)]"
                style={{
                  color: 'var(--color-primary)',
                  border: '1.5px solid var(--color-primary)',
                  borderRadius: 'var(--radius-control)',
                }}
              >
                {t('viewOptionsCta')}
              </Link>
            )}

            {/* WhatsApp se quitó de la tarjeta a pedido explícito (sigue
                en la página del producto, ProductActions.tsx, sin
                tocar). Bajo 641px queda como siempre (azul, alineado a la
                izquierda); desde 641px toma el mismo estilo que "Ver
                tienda" de la rama de compra directa, para que ambas
                tarjetas se vean como un mismo par. */}
            {product.vendor?.id && (
              <Link
                href={`/tienda/${product.vendor.id}`}
                className="block text-xs font-medium mb-2 hover:underline text-[color:var(--brand-blue)] min-[641px]:mb-0 min-[641px]:mt-2 min-[641px]:py-1.5 min-[641px]:text-center min-[641px]:truncate min-[641px]:text-[color:var(--color-text-secondary)]"
              >
                {t('viewStore')}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
