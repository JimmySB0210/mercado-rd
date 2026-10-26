'use client'
// ============================================================
// MercadoRD — Productos del pedido en el checkout
// Ruta: src/components/checkout/CheckoutOrderItems.tsx
// ============================================================
// Solo muestra lo que ya viene del carrito y de la cotización del servidor
// (quote_cart): imagen, nombre completo (sin cortar), variante, cantidad,
// total de la línea, tienda y los problemas de stock. No calcula precios: el
// total de cada línea es el que devolvió el servidor. En pantallas chicas el
// bloque se puede plegar; en escritorio siempre está desplegado.
// ============================================================

import Image from 'next/image'
import { AlertTriangle, ChevronDown, ShoppingCart } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { formatRdp } from '@/lib/formatRdp'
import { lineProblem, type QuoteLine } from '@/lib/cart/quote'
import type { CartItem } from '@/types'

interface Props {
  items: CartItem[]
  // quote.lines (índice a índice con items) cuando la cotización ya está lista.
  lines: QuoteLine[] | undefined
  // Total ya formateado para el encabezado plegado; null mientras no se conoce.
  totalText: string | null
  // Dónde se edita el pedido: /cart, o la página del producto en «Comprar ahora».
  backHref: string
  isExpress: boolean
  open: boolean
  onToggle: () => void
}

const MAX_ROWS_BEFORE_SCROLL = 4

export function CheckoutOrderItems({ items, lines, totalText, backHref, isExpress, open, onToggle }: Props) {
  const { t } = useTranslation('checkout')
  const count = items.length
  const countText = count === 1 ? t('orderItemsCountOne', { count }) : t('orderItemsCountOther', { count })
  // En escritorio, con más de 4 productos la lista se recorre dentro de su tarjeta (así el total y el botón no quedan
  // muy abajo). En una columna (≤ 960 px) el resumen ya se pliega y la lista se muestra completa.
  const scrollList = !useIsMobile(961) && count > MAX_ROWS_BEFORE_SCROLL

  return (
    <section className="ck-card ck-items" data-open={open} data-scroll={scrollList} aria-labelledby="ck-summary-title">
      <div className="ck-card-head">
        <span className="ck-card-icon" aria-hidden="true"><ShoppingCart size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id="ck-summary-title" className="ck-card-title">{t('orderSummaryHeading')}</h2>
          <p className="ck-card-sub">
            {countText}
            {totalText && <span className="ck-items-total-inline"> · {totalText}</span>}
          </p>
        </div>
        {!isExpress && (
          <a href={backHref} className="ck-link ck-items-edit-desktop">{t('editCart')}</a>
        )}
        <button
          type="button"
          className="ck-items-toggle"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="ck-items-body"
        >
          {open ? t('summaryHide') : t('summaryShow')}
          <ChevronDown size={16} aria-hidden="true" className="ck-items-chevron" />
        </button>
      </div>

      <div id="ck-items-body" className="ck-items-body">
        <ul className="ck-item-list" {...(scrollList ? { tabIndex: 0, 'aria-label': t('orderItemsListLabel') } : {})}>
          {items.map((item, index) => {
            const line = lines?.find(l => l.index === index)
            const problem = lineProblem(line)
            const vendorName = item.product.vendor?.business_name
            const details = item.variant_label
              ?? [
                item.selected_size ? t('sizeLabel', { value: item.selected_size }) : null,
                item.selected_color ? t('colorLabel', { value: item.selected_color }) : null,
              ].filter(Boolean).join(' · ')
            const image = item.product.images?.[0]
            return (
              <li key={`${item.product.id}-${item.variant_id ?? `${item.selected_size}-${item.selected_color}`}`} className="ck-item">
                <div className="ck-item-img">
                  {image ? (
                    <Image src={image} alt="" fill className="object-cover" sizes="64px" />
                  ) : (
                    <span aria-hidden="true" style={{ fontSize: 22 }}>📦</span>
                  )}
                </div>
                <div className="ck-item-info">
                  <p className="ck-item-name">{item.product.name}</p>
                  {details && <p className="ck-item-meta">{details}</p>}
                  <p className="ck-item-meta">
                    {item.quantity === 1
                      ? t('quantityLabelOne', { count: item.quantity })
                      : t('quantityLabelOther', { count: item.quantity })}
                  </p>
                  {vendorName && <p className="ck-item-meta">{t('soldBy', { name: vendorName })}</p>}
                  {problem && (
                    <p className="ck-item-problem">
                      <AlertTriangle size={13} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>
                        {problem === 'unavailable' || (line?.available_quantity ?? 0) <= 0
                          ? t('lineUnavailable')
                          : t('onlyNLeft', { count: line?.available_quantity ?? 0 })}
                      </span>
                    </p>
                  )}
                  <a
                    href={`/producto/${item.product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ck-pill-link"
                  >
                    {t('viewProduct')}
                    <span className="sr-only"> {t('opensInNewTab')}</span>
                  </a>
                </div>
                <div className="ck-item-price">
                  <span className="ck-item-total">{line?.line_total_rdp != null ? formatRdp(line.line_total_rdp) : '—'}</span>
                  {item.quantity > 1 && line?.unit_price_rdp != null && (
                    <span className="ck-item-unit">{t('unitPriceEach', { price: formatRdp(line.unit_price_rdp) })}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {!isExpress && (
          <a href={backHref} className="ck-link ck-items-edit-mobile">{t('editCart')}</a>
        )}
      </div>
    </section>
  )
}
