'use client'
// ============================================================
// MercadoRD — Opciones del producto: tallas, colores y el stock de cada una
// Ruta: src/components/dashboard/VariantOptionsBuilder.tsx
// ============================================================
// Parte del paso "Precio y stock" de ProductForm cuando el vendor dice que su
// producto tiene opciones y la categoría usa el sistema fijo (Talla / Color).
// Las filas (`rows`) son la ÚNICA fuente de verdad: este componente solo las
// edita. Elegir o quitar una talla o un color las reconstruye
// (lib/variantRows.ts) y la tabla de abajo es el único lugar donde se escribe
// el stock. No hay un botón "Generar" aparte ni una lista de tallas marcadas
// que pueda quedar desfasada de la tabla.
// ============================================================

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { validateImageFile, uploadProductImage } from '@/lib/storage/upload'
import { PriceInput } from '@/components/dashboard/PriceInput'
import { BRAND } from '@/lib/colors'
import { SIZE_SCALES, SIZE_SCALE_ORDER, sizesInRange, scaleHasHalfSizes, sortSizes, type SizeScale } from '@/lib/productSizes'
import {
  rowSizes, rowColors, rebuildVariantRows, parseColorList, mergeColors, setColorImage, setStockForAll,
  variantRowLabel, stockOf, type VariantRow,
} from '@/lib/variantRows'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'

// Texto de cada botón del selector de tipo de talla (claves de i18n)
const SIZE_SCALE_LABEL_KEY: Record<SizeScale, keyof DashboardDict> = {
  apparel: 'sizeScaleApparel',
  footwear_us: 'sizeScaleFootwearUs',
  footwear_eu: 'sizeScaleFootwearEu',
}

interface VariantOptionsBuilderProps {
  rows: VariantRow[]
  // Mismo contrato que el setState del padre: acepta las filas nuevas o una función de las anteriores
  onRowsChange: (update: VariantRow[] | ((prev: VariantRow[]) => VariantRow[])) => void
  vendorId: string
  // Tipo de talla activo (lo decide la categoría hasta que el vendor lo cambia)
  sizeScale: SizeScale
  onSizeScaleChange: (scale: SizeScale) => void
}

const smallButtonCls =
  'text-xs font-semibold rounded-lg px-3 py-2 border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const smallButtonStyle = { background: '#fff', color: BRAND.blue, borderColor: BRAND.blue }

export function VariantOptionsBuilder({ rows, onRowsChange, vendorId, sizeScale, onSizeScaleChange }: VariantOptionsBuilderProps) {
  const { t } = useTranslation('dashboard')

  const selectedSizes = rowSizes(rows)
  const selectedColors = rowColors(rows)

  // Cambia las tallas y/o los colores: las filas se reconstruyen a partir de
  // las que ya había, así las combinaciones que siguen existiendo conservan su
  // stock, su precio y su foto.
  const updateOptions = (change: (sizes: string[], colors: string[]) => { sizes: string[]; colors: string[] }) => {
    onRowsChange(prev => {
      const next = change(rowSizes(prev), rowColors(prev))
      return rebuildVariantRows(prev, sortSizes(next.sizes), next.colors)
    })
  }

  // ─── Tallas ──────────────────────────────────────────────────────────
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [includeHalfSizes, setIncludeHalfSizes] = useState(() => rows.some(row => row.size.includes('.')))
  const [customSizeDraft, setCustomSizeDraft] = useState('')

  // Sin "medias tallas" solo se ofrecen (y se agregan) las enteras — "del 5 al
  // 14" son 10 tallas, no 19 —, tanto en el rango como en los botones. Solo el
  // calzado de EE. UU. tiene medias tallas; en ropa y en calzado europeo la
  // casilla no aparece.
  const scaleOffersHalfSizes = scaleHasHalfSizes(sizeScale)
  const wholeSizesOnly = scaleOffersHalfSizes && !includeHalfSizes
  const sizeButtons: readonly string[] = wholeSizesOnly ? SIZE_SCALES[sizeScale].filter(s => !s.includes('.')) : SIZE_SCALES[sizeScale]
  // Una talla elegida que no tiene botón (media talla con la casilla apagada,
  // "128GB", una talla de otra escala) sale aparte para poder quitarla.
  const extraSizes = selectedSizes.filter(s => !sizeButtons.includes(s))
  // Un extremo del rango que ya no existe (cambió la escala o se quitaron las
  // medias tallas) cuenta como "sin elegir".
  const rangeFromValue = sizeButtons.includes(rangeFrom) ? rangeFrom : ''
  const rangeToValue = sizeButtons.includes(rangeTo) ? rangeTo : ''

  const toggleSize = (size: string) =>
    updateOptions((sizes, colors) => ({
      sizes: sizes.includes(size) ? sizes.filter(s => s !== size) : [...sizes, size],
      colors,
    }))

  // El calzado se vende "del 8 al 12": se agregan todas las tallas del tramo de
  // una vez (se suman a las ya elegidas)
  const addSizeRange = () => {
    if (!rangeFromValue || !rangeToValue) return
    const inRange = sizesInRange(sizeScale, rangeFromValue, rangeToValue, { wholeOnly: wholeSizesOnly })
    updateOptions((sizes, colors) => ({ sizes: [...sizes, ...inRange.filter(s => !sizes.includes(s))], colors }))
  }

  const clearSizes = () => updateOptions((_sizes, colors) => ({ sizes: [], colors }))

  const handleHalfSizesToggle = (checked: boolean) => {
    setIncludeHalfSizes(checked)
    if (!checked) {
      // Sin medias tallas los extremos del rango son enteros ("7.5" → "7")
      const whole = (s: string) => s.split('.')[0]
      setRangeFrom(whole)
      setRangeTo(whole)
    }
  }

  // Otra talla o medida que no tiene botón ("128GB", "Grande", "40.5")
  const addCustomSize = () => {
    const size = customSizeDraft.trim()
    setCustomSizeDraft('')
    if (!size) return
    updateOptions((sizes, colors) => ({ sizes: sizes.includes(size) ? sizes : [...sizes, size], colors }))
  }

  // ─── Colores ─────────────────────────────────────────────────────────
  // Se escriben uno a uno (o varios separados por coma) y quedan como
  // etiquetas; "Blanco" y "blanco" son el mismo color.
  const [colorDraft, setColorDraft] = useState('')
  const [uploadingColor, setUploadingColor] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const addColorsFromDraft = () => {
    const typed = parseColorList(colorDraft)
    setColorDraft('')
    if (typed.length === 0) return
    updateOptions((sizes, colors) => ({ sizes, colors: mergeColors(colors, typed) }))
  }

  const removeColor = (color: string) =>
    updateOptions((sizes, colors) => ({
      sizes,
      colors: colors.filter(c => c.toLowerCase() !== color.toLowerCase()),
    }))

  // La foto es del COLOR, no de cada fila: se guarda en todas las filas de ese
  // color (al guardar, ProductForm además la propaga a las que no la tengan)
  const colorImage = (color: string) =>
    rows.find(row => row.imageUrl && row.color.trim().toLowerCase() === color.toLowerCase())?.imageUrl ?? null

  const handleColorImageSelect = async (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setImageError(validationError)
      return
    }
    setImageError(null)
    setUploadingColor(color)

    const { url, error: uploadError } = await uploadProductImage(file, vendorId)

    if (uploadError || !url) {
      console.error('[handleColorImageSelect]', uploadError)
      setImageError(t('imageUploadError'))
      setUploadingColor(null)
      return
    }

    onRowsChange(prev => setColorImage(prev, color, url))
    setUploadingColor(null)
  }

  const removeColorImage = (color: string) => onRowsChange(prev => setColorImage(prev, color, null))

  // ─── Tabla: una fila por combinación, aquí se escribe el stock ───────
  const [bulkStockText, setBulkStockText] = useState('')
  // El precio propio de cada opción se esconde hasta que hace falta (o hasta
  // que alguna fila ya tiene uno)
  const [priceColumnOpen, setPriceColumnOpen] = useState(false)
  const showPriceColumn = priceColumnOpen || rows.some(row => row.price.trim() !== '')
  const tableColumns = showPriceColumn ? 'sm:grid-cols-[minmax(0,1fr)_6rem_9rem_2rem]' : 'sm:grid-cols-[minmax(0,1fr)_6rem_2rem]'

  const updateRow = (index: number, field: 'stock' | 'price', value: string) => {
    onRowsChange(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const removeRow = (index: number) => onRowsChange(prev => prev.filter((_, i) => i !== index))

  // "Poner el mismo stock en todas": atajo para no escribir el número fila por fila
  const applyStockToAll = () => {
    if (bulkStockText.trim() === '') return
    const stock = String(stockOf({ stock: bulkStockText }))
    onRowsChange(prev => setStockForAll(prev, stock))
  }

  return (
    <div className="space-y-5">
      {/* Tallas */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-700">{t('variantsGenerateSizesLabel')}</h3>

        {/* Tipo de talla — arranca según la categoría (Calzado → tenis, lo demás
            → ropa) y el vendor puede cambiarlo: unos tenis publicados en Ropa &
            Moda también necesitan tallas de calzado. */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">{t('sizeScaleLabel')}</label>
          <div
            role="group"
            aria-label={t('sizeScaleLabel')}
            className="inline-flex flex-wrap gap-1 p-1 rounded-xl border border-gray-200"
          >
            {SIZE_SCALE_ORDER.map(scale => {
              const isActive = sizeScale === scale
              return (
                <button
                  key={scale}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSizeScaleChange(scale)}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
                  style={{
                    background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                    color: isActive ? BRAND.blue : BRAND.gray,
                  }}
                >
                  {t(SIZE_SCALE_LABEL_KEY[scale])}
                </button>
              )
            })}
          </div>
        </div>

        {/* Rango */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">{t('variantsRangeLabel')}</label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={t('variantsRangeFrom')}
              value={rangeFromValue}
              onChange={e => setRangeFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
            >
              <option value="" disabled>{t('variantsRangeFrom')}</option>
              {sizeButtons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label={t('variantsRangeTo')}
              value={rangeToValue}
              onChange={e => setRangeTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
            >
              <option value="" disabled>{t('variantsRangeTo')}</option>
              {sizeButtons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSizeRange}
              disabled={!rangeFromValue || !rangeToValue}
              className={smallButtonCls}
              style={smallButtonStyle}
            >
              {t('variantsRangeAddButton')}
            </button>
          </div>
          {scaleOffersHalfSizes && (
            <label className="inline-flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHalfSizes}
                onChange={e => handleHalfSizesToggle(e.target.checked)}
              />
              {t('variantsRangeHalfSizes')}
            </label>
          )}
        </div>

        {/* Botones de talla: lo elegido se ve azul y se quita con otro clic */}
        <div role="group" aria-label={t('variantsGenerateSizesLabel')} className="flex flex-wrap gap-2">
          {sizeButtons.map(size => {
            const isSelected = selectedSizes.includes(size)
            return (
              <button
                key={size}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSize(size)}
                className="text-xs font-semibold rounded-lg px-3 py-1.5 border cursor-pointer transition-colors"
                style={{
                  background: isSelected ? BRAND.blue : '#fff',
                  color: isSelected ? '#fff' : BRAND.dark,
                  borderColor: isSelected ? BRAND.blue : '#E5E7EB',
                }}
              >
                {size}
              </button>
            )
          })}
          {extraSizes.map(size => (
            <button
              key={`extra-${size}`}
              type="button"
              aria-pressed
              aria-label={t('optionRemoveAria', { name: size })}
              onClick={() => toggleSize(size)}
              className="text-xs font-semibold rounded-lg px-3 py-1.5 border cursor-pointer transition-colors"
              style={{ background: BRAND.blue, color: '#fff', borderColor: BRAND.blue }}
            >
              {size} ×
            </button>
          ))}
        </div>
        {selectedSizes.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{t('variantsGenerateSelectedCount', { count: selectedSizes.length })}</span>
            <button
              type="button"
              onClick={clearSizes}
              className="text-xs font-semibold bg-transparent border-none cursor-pointer p-0"
              style={{ color: BRAND.blue }}
            >
              {t('variantsGenerateClearSizes')}
            </button>
          </div>
        )}

        {/* Otra talla o medida que no tiene botón */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('optionsCustomSizeLabel')}</label>
          <div className="flex items-center gap-2">
            <input
              value={customSizeDraft}
              onChange={e => setCustomSizeDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomSize()
                }
              }}
              placeholder={t('sizeOtherPlaceholder')}
              className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={addCustomSize}
              disabled={!customSizeDraft.trim()}
              className={smallButtonCls}
              style={smallButtonStyle}
            >
              {t('optionsAddButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Colores */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-700">{t('variantsGenerateColorsLabel')}</h3>
        {selectedColors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedColors.map(color => {
              const image = colorImage(color)
              return (
                <span
                  key={color.toLowerCase()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-1.5 pr-2.5 text-xs font-semibold text-gray-800"
                >
                  {image ? (
                    <span className="relative flex-shrink-0" style={{ width: 24, height: 24 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt={color} className="w-full h-full rounded-full object-cover border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeColorImage(color)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center leading-none"
                        style={{ fontSize: 'var(--text-badge)' }}
                        aria-label={t('removeImageAria')}
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <label
                      className="flex-shrink-0 rounded-full border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      style={{ width: 24, height: 24, fontSize: 'var(--text-badge)' }}
                      title={t('uploadColorPhotoTitle')}
                    >
                      {uploadingColor === color ? '…' : '📷'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleColorImageSelect(color, e)}
                        className="hidden"
                        disabled={uploadingColor === color}
                      />
                    </label>
                  )}
                  {color}
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    aria-label={t('optionRemoveAria', { name: color })}
                    className="bg-transparent border-none cursor-pointer p-0 leading-none text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={colorDraft}
            onChange={e => setColorDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addColorsFromDraft()
              }
            }}
            onBlur={addColorsFromDraft}
            aria-label={t('variantsGenerateColorsLabel')}
            placeholder={t('variantsGenerateColorsPlaceholder')}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={addColorsFromDraft}
            disabled={!colorDraft.trim()}
            className={smallButtonCls}
            style={smallButtonStyle}
          >
            {t('optionsAddButton')}
          </button>
        </div>
        {imageError && <p className="text-small font-medium text-red-600">{imageError}</p>}
      </div>

      {/* Una fila por combinación: aquí (y solo aquí) se escribe el stock */}
      {rows.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-gray-700">{t('optionsCombinationsHeading')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('optionsCombinationsHint')}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('optionsApplyStockLabel')}</label>
              <input
                type="number"
                min="0"
                value={bulkStockText}
                onChange={e => setBulkStockText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyStockToAll()
                  }
                }}
                placeholder={t('variantsGenerateStockPlaceholder')}
                className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              type="button"
              onClick={applyStockToAll}
              disabled={bulkStockText.trim() === ''}
              className={smallButtonCls}
              style={smallButtonStyle}
            >
              {t('optionsApplyStockButton')}
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div
              className={`hidden sm:grid gap-2 px-3 py-2 bg-gray-50 text-badge font-semibold text-gray-500 uppercase tracking-wide ${tableColumns}`}
            >
              <span>{t('optionsOptionColumn')}</span>
              <span>{t('variantStockLabel')}</span>
              {showPriceColumn && <span>{t('variantPriceLabel')}</span>}
              <span />
            </div>
            {rows.map((row, i) => {
              const label = variantRowLabel(row)
              return (
                <div
                  key={`${row.size}|${row.color}`}
                  className={`grid grid-cols-[minmax(0,1fr)_2rem] gap-2 items-center px-3 py-2 border-t border-gray-100 ${tableColumns}`}
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-gray-800" title={label}>{label}</span>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label={t('optionRemoveAria', { name: label })}
                    className="sm:order-last w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors bg-white cursor-pointer"
                  >
                    ×
                  </button>
                  <div className="col-span-2 flex gap-2 sm:contents">
                    <input
                      type="number"
                      min="0"
                      aria-label={t('optionStockAria', { option: label })}
                      value={row.stock}
                      onChange={e => updateRow(i, 'stock', e.target.value)}
                      placeholder="0"
                      className="w-24 sm:w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    {showPriceColumn && (
                      <PriceInput
                        ariaLabel={t('optionPriceAria', { option: label })}
                        value={row.price}
                        onChange={price => updateRow(i, 'price', price)}
                        placeholder={t('variantPricePlaceholder')}
                        className="flex-1 sm:w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {!showPriceColumn && (
            <button
              type="button"
              onClick={() => setPriceColumnOpen(true)}
              className="text-xs font-semibold bg-transparent border-none cursor-pointer p-0"
              style={{ color: BRAND.blue }}
            >
              {t('optionsPriceToggle')}
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">{t('optionsEmptyHint')}</p>
      )}
    </div>
  )
}
