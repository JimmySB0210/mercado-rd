'use client'
// ============================================================
// MercadoRD — Precios por cantidad (product_pricing_tiers)
// Ruta: src/components/vendor/PricingTiersSection.tsx
// ============================================================
// INSERT/UPDATE/DELETE van directo contra product_pricing_tiers con
// el cliente normal — RLS (product_pricing_tiers_vendor_write) ya
// restringe a productos propios del vendor autenticado. El rango de
// cantidad lo valida un trigger en la BD (validate_pricing_tier_overlap)
// que rechaza cualquier fila cuyo rango se solape con otra existente —
// este componente solo muestra el mensaje de error exacto que el
// trigger devuelve, no duplica esa validación en el cliente.
// Solo se monta en modo "editar" (necesita un product_id real).
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface TierRow {
  id: string
  min_quantity: number
  max_quantity: number | null
  price_rdp: number
  unit_label: string
}

interface TierFormValues {
  minQuantity: string
  maxQuantity: string
  price: string
  unitLabel: string
}

const EMPTY_FORM: TierFormValues = { minQuantity: '', maxQuantity: '', price: '', unitLabel: 'unidades' }

interface Props {
  productId: string
}

export function PricingTiersSection({ productId }: Props) {
  const { t } = useTranslation('dashboard')
  const supabase = createClient()

  const [tiers, setTiers] = useState<TierRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const [addingOpen, setAddingOpen] = useState(false)
  const [addForm, setAddForm] = useState<TierFormValues>(EMPTY_FORM)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSaving, setAddSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TierFormValues>(EMPTY_FORM)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('product_pricing_tiers')
      .select('id, min_quantity, max_quantity, price_rdp, unit_label')
      .eq('product_id', productId)
      .order('min_quantity', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setTiers(data ?? [])
        setLoading(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const buildPayload = (form: TierFormValues) => {
    const minQuantity = Number(form.minQuantity)
    const maxQuantity = form.maxQuantity.trim() === '' ? null : Number(form.maxQuantity)
    const priceRdp = Math.round(Number(form.price) * 100)
    if (!Number.isFinite(minQuantity) || minQuantity <= 0) return null
    if (maxQuantity !== null && (!Number.isFinite(maxQuantity) || maxQuantity < minQuantity)) return null
    if (!Number.isFinite(priceRdp) || priceRdp <= 0) return null
    return {
      min_quantity: minQuantity,
      max_quantity: maxQuantity,
      price_rdp: priceRdp,
      unit_label: form.unitLabel.trim() || 'unidades',
    }
  }

  const handleAdd = async () => {
    const payload = buildPayload(addForm)
    if (!payload) {
      setAddError(t('tierGenericError'))
      return
    }

    setAddSaving(true)
    setAddError(null)

    const { data, error: insertError } = await supabase
      .from('product_pricing_tiers')
      .insert({ product_id: productId, ...payload })
      .select('id, min_quantity, max_quantity, price_rdp, unit_label')
      .single()

    setAddSaving(false)

    if (insertError || !data) {
      // Mensaje tal cual lo manda validate_pricing_tier_overlap() en la BD
      setAddError(insertError?.message ?? t('tierGenericError'))
      return
    }

    setTiers(prev => [...prev, data].sort((a, b) => a.min_quantity - b.min_quantity))
    setAddForm(EMPTY_FORM)
    setAddingOpen(false)
  }

  const startEdit = (row: TierRow) => {
    setEditingId(row.id)
    setEditError(null)
    setEditForm({
      minQuantity: String(row.min_quantity),
      maxQuantity: row.max_quantity === null ? '' : String(row.max_quantity),
      price: (row.price_rdp / 100).toString(),
      unitLabel: row.unit_label,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const payload = buildPayload(editForm)
    if (!payload) {
      setEditError(t('tierGenericError'))
      return
    }

    setEditSaving(true)
    setEditError(null)

    const { data, error: updateError } = await supabase
      .from('product_pricing_tiers')
      .update(payload)
      .eq('id', editingId)
      .select('id, min_quantity, max_quantity, price_rdp, unit_label')
      .single()

    setEditSaving(false)

    if (updateError || !data) {
      setEditError(updateError?.message ?? t('tierGenericError'))
      return
    }

    setTiers(prev => prev.map(row => row.id === data.id ? data : row).sort((a, b) => a.min_quantity - b.min_quantity))
    setEditingId(null)
  }

  const handleRemove = async (id: string) => {
    setRemovingId(id)
    const { error: deleteError } = await supabase
      .from('product_pricing_tiers')
      .delete()
      .eq('id', id)
    setRemovingId(null)

    if (deleteError) {
      console.error('[PricingTiersSection] remove', deleteError)
      return
    }
    setTiers(prev => prev.filter(row => row.id !== id))
  }

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0"
      >
        <span className="text-sm font-semibold text-gray-700">
          {t('pricingTiersHeading')}
          {!loading && tiers.length > 0 && (
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: BRAND.blue }}>
              {tiers.length}
            </span>
          )}
        </span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pt-1 space-y-3">
          <p className="text-xs text-gray-400">{t('pricingTiersHint')}</p>

          {loading ? (
            <p className="text-xs text-gray-400">...</p>
          ) : (
            <>
              {tiers.length === 0 && !addingOpen && (
                <p className="text-xs text-gray-400">{t('pricingTiersEmptyHint')}</p>
              )}

              {tiers.map(row => (
                <div key={row.id} className="border border-gray-100 rounded-lg p-3">
                  {editingId === row.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label style={labelStyle}>{t('tierMinQuantityLabel')}</label>
                          <input type="number" min={1} step={1} value={editForm.minQuantity} onChange={e => setEditForm({ ...editForm, minQuantity: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>{t('tierMaxQuantityLabel')}</label>
                          <input type="number" min={1} step={1} placeholder={t('tierMaxQuantityPlaceholder')} value={editForm.maxQuantity} onChange={e => setEditForm({ ...editForm, maxQuantity: e.target.value })} style={inputStyle} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label style={labelStyle}>{t('tierPriceLabel')}</label>
                          <input type="number" min={0} step="0.01" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>{t('tierUnitLabel')}</label>
                          <input type="text" placeholder={t('tierUnitPlaceholder')} value={editForm.unitLabel} onChange={e => setEditForm({ ...editForm, unitLabel: e.target.value })} style={inputStyle} />
                        </div>
                      </div>
                      {editError && <p className="text-xs" style={{ color: BRAND.red }}>{editError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={handleSaveEdit} disabled={editSaving} className="flex-1 text-xs font-bold text-white rounded-md py-1.5" style={{ background: editSaving ? '#ccc' : BRAND.blue, cursor: editSaving ? 'not-allowed' : 'pointer' }}>
                          {editSaving ? t('tierSaving') : t('tierSaveButton')}
                        </button>
                        <button type="button" onClick={() => { setEditingId(null); setEditError(null) }} disabled={editSaving} className="text-xs font-semibold rounded-md py-1.5 px-3 border border-gray-200">
                          {t('tierCancelButton')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-gray-700">
                        <strong>{row.min_quantity}{row.max_quantity !== null ? `–${row.max_quantity}` : '+'} {row.unit_label}</strong>
                        {' — '}
                        {(row.price_rdp / 100).toLocaleString('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => startEdit(row)} className="text-xs font-semibold bg-transparent border-none cursor-pointer" style={{ color: BRAND.blue }}>
                          {t('tierEditButton')}
                        </button>
                        <button type="button" onClick={() => handleRemove(row.id)} disabled={removingId === row.id} className="text-xs font-semibold bg-transparent border-none cursor-pointer" style={{ color: BRAND.red }}>
                          {removingId === row.id ? t('tierRemoving') : t('tierRemoveButton')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {addingOpen ? (
                <div className="border border-gray-100 rounded-lg p-3 space-y-2" style={{ background: '#F9FAFB' }}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={labelStyle}>{t('tierMinQuantityLabel')}</label>
                      <input type="number" min={1} step={1} value={addForm.minQuantity} onChange={e => setAddForm({ ...addForm, minQuantity: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('tierMaxQuantityLabel')}</label>
                      <input type="number" min={1} step={1} placeholder={t('tierMaxQuantityPlaceholder')} value={addForm.maxQuantity} onChange={e => setAddForm({ ...addForm, maxQuantity: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={labelStyle}>{t('tierPriceLabel')}</label>
                      <input type="number" min={0} step="0.01" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('tierUnitLabel')}</label>
                      <input type="text" placeholder={t('tierUnitPlaceholder')} value={addForm.unitLabel} onChange={e => setAddForm({ ...addForm, unitLabel: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  {addError && <p className="text-xs" style={{ color: BRAND.red }}>{addError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAdd} disabled={addSaving} className="flex-1 text-xs font-bold text-white rounded-md py-1.5" style={{ background: addSaving ? '#ccc' : BRAND.blue, cursor: addSaving ? 'not-allowed' : 'pointer' }}>
                      {addSaving ? t('tierSaving') : t('tierSaveButton')}
                    </button>
                    <button type="button" onClick={() => { setAddingOpen(false); setAddError(null); setAddForm(EMPTY_FORM) }} disabled={addSaving} className="text-xs font-semibold rounded-md py-1.5 px-3 border border-gray-200">
                      {t('tierCancelButton')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingOpen(true)}
                  className="text-xs font-semibold bg-transparent border-none cursor-pointer"
                  style={{ color: BRAND.blue }}
                >
                  {t('addTierRowBtn')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
