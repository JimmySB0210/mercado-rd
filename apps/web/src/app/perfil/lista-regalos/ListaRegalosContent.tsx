'use client'
// ============================================================
// MercadoRD — Contenido traducido de /perfil/lista-regalos
// Ruta: src/app/perfil/lista-regalos/ListaRegalosContent.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation.
// Este componente recibe la lista/items/provincias ya resueltos como
// props y se encarga de crear la lista, buscar productos, agregarlos
// con prioridad, y mostrar el enlace público para compartir.
// ============================================================

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Copy, Check, Search, Trash2, Gift } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { validateText, validateProvince } from '@/lib/validation'
import { formatPrice } from '@/types/database.types'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'
import { BRAND } from '@/lib/colors'

type Priority = 1 | 2 | 3

interface GiftListRow {
  id: string
  display_name: string
  share_slug: string
  delivery_address: string
  province_id: number
  is_active: boolean
  expires_at: string | null
}

interface GiftListItemRow {
  id: string
  priority: Priority
  purchased_by: string | null
  purchased_at: string | null
  product: { id: string; name: string; images: string[] | null; price_rdp: number; compare_rdp: number | null }
}

interface ProvinceRow {
  id: number
  name: string
}

interface SearchResult {
  id: string
  name: string
  images: string[] | null
  price_rdp: number
}

interface Props {
  list: GiftListRow | null
  items: GiftListItemRow[]
  provinces: ProvinceRow[]
  pendingProductId: string | null
}

export function ListaRegalosContent({ list: initialList, items: initialItems, provinces, pendingProductId }: Props) {
  const { t } = useTranslation('profile')
  const { user } = useAuth()
  const supabase = createClient()

  const [list, setList] = useState<GiftListRow | null>(initialList)
  const [items, setItems] = useState<GiftListItemRow[]>(initialItems)

  // Formulario de creación
  const [displayName, setDisplayName] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Enlace para compartir
  const [copied, setCopied] = useState(false)
  const shareUrl = list && typeof window !== 'undefined' ? `${window.location.origin}/regalo/${list.share_slug}` : ''

  // Buscador de productos
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const refreshItems = async (listId: string) => {
    const { data, error } = await supabase
      .from('gift_list_items')
      .select('id, priority, purchased_by, purchased_at, product:products(id, name, images, price_rdp, compare_rdp)')
      .eq('gift_list_id', listId)
      .order('priority')

    if (error) { console.error('[ListaRegalosContent] refreshItems', error); return }
    setItems(((data ?? []) as any[]).filter(row => row.product) as GiftListItemRow[])
  }

  const addProductToList = async (listId: string, productId: string, priority: Priority = 2) => {
    setAddingId(productId)
    const { error } = await supabase
      .from('gift_list_items')
      .insert({ gift_list_id: listId, product_id: productId, priority })

    if (error) console.error('[ListaRegalosContent] addProductToList', error)
    else await refreshItems(listId)

    setAddingId(null)
  }

  // Si llegamos aquí con ?add=productId y ya existe una lista (caso
  // borde: el usuario navegó directo con la lista ya creada), lo
  // agregamos una sola vez al montar.
  useEffect(() => {
    if (!list || !pendingProductId) return
    if (items.some(it => it.product.id === pendingProductId)) return
    addProductToList(list.id, pendingProductId, 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFormError(null)

    const nameError = validateText(displayName, t('aliasLabel'), 2, 60)
    if (nameError) { setFormError(nameError); return }

    const addressError = validateText(deliveryAddress, t('deliveryAddressLabel'), 10, 200)
    if (addressError) { setFormError(addressError); return }

    const provinceIdNum = Number(provinceId)
    const provinceError = validateProvince(provinceIdNum)
    if (provinceError) { setFormError(provinceError); return }

    setCreating(true)

    const { data: newList, error } = await supabase
      .from('gift_lists')
      .insert({
        user_id: user.id,
        display_name: displayName.trim(),
        delivery_address: deliveryAddress.trim(),
        province_id: provinceIdNum,
      })
      .select('id, display_name, share_slug, delivery_address, province_id, is_active, expires_at')
      .single()

    if (error || !newList) {
      console.error('[ListaRegalosContent] createList', error)
      setFormError(t('createListError'))
      setCreating(false)
      return
    }

    setList(newList)
    setCreating(false)

    if (pendingProductId) {
      await addProductToList(newList.id, pendingProductId, 2)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[ListaRegalosContent] copy', err)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < 2) { setResults([]); return }

    setSearching(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, images, price_rdp')
      .eq('is_active', true)
      .ilike('name', `%${trimmed}%`)
      .limit(8)

    if (error) console.error('[ListaRegalosContent] search', error)
    setResults((data ?? []) as SearchResult[])
    setSearching(false)
  }

  const handlePriorityChange = async (itemId: string, newPriority: Priority) => {
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, priority: newPriority } : it))
    const { error } = await supabase.from('gift_list_items').update({ priority: newPriority }).eq('id', itemId)
    if (error) console.error('[ListaRegalosContent] updatePriority', error)
  }

  const handleRemove = async (itemId: string) => {
    setItems(prev => prev.filter(it => it.id !== itemId))
    const { error } = await supabase.from('gift_list_items').delete().eq('id', itemId)
    if (error) console.error('[ListaRegalosContent] remove', error)
  }

  const isInList = (productId: string) => items.some(it => it.product.id === productId)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('giftListsPageTitle')}</h1>
      <p className="text-sm text-gray-400 mb-6">{t('giftListsIntro')}</p>

      {!list ? (
        <form onSubmit={handleCreateList} className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('aliasLabel')}</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={t('aliasPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ borderRadius: 'var(--radius-control)' }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('deliveryAddressLabel')}</label>
            <textarea
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder={t('deliveryAddressPlaceholder')}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderRadius: 'var(--radius-control)' }}
            />
            <p className="text-xs text-gray-400 mt-1">{t('deliveryAddressHint')}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('provinceLabel')}</label>
            <select
              value={provinceId}
              onChange={e => setProvinceId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-white"
              style={{ borderRadius: 'var(--radius-control)' }}
            >
              <option value="">{t('selectProvincePlaceholder')}</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {formError && <p className="text-sm mb-4" style={{ color: BRAND.red }}>{formError}</p>}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-60"
            style={{ background: BRAND.blue, borderRadius: 'var(--radius-control)' }}
          >
            {creating ? t('creatingButton') : t('createListButton')}
          </button>
        </form>
      ) : (
        <>
          {/* Alias + enlace para compartir */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={18} color={BRAND.blue} />
              <span className="font-medium text-gray-900">{list.display_name}</span>
            </div>
            <label className="block text-xs text-gray-400 mb-1.5">{t('shareLinkLabel')}</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-gray-50 outline-none"
                style={{ borderRadius: 'var(--radius-control)' }}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex-shrink-0"
                style={{ borderColor: BRAND.blue, color: BRAND.blue, borderRadius: 'var(--radius-control)' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t('linkCopiedButton') : t('copyLinkButton')}
              </button>
            </div>
          </div>

          {/* Buscador de productos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={15} color={BRAND.gray} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('searchProductsPlaceholder')}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: 'var(--radius-control)' }}
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 flex-shrink-0"
                style={{ background: BRAND.blue, borderRadius: 'var(--radius-control)' }}
              >
                {searching ? t('searchingButton') : t('searchButton')}
              </button>
            </form>

            {results.length === 0 && query.trim().length >= 2 && !searching && (
              <p className="text-sm text-gray-400">{t('noSearchResults')}</p>
            )}

            {results.length > 0 && (
              <div className="divide-y divide-gray-50">
                {results.map(product => {
                  const added = isInList(product.id)
                  return (
                    <div key={product.id} className="flex items-center gap-3 py-2.5">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        <Image
                          src={product.images?.[0] ?? PLACEHOLDER_PRODUCT_IMAGE}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{formatPrice(product.price_rdp)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addProductToList(list.id, product.id, 2)}
                        disabled={added || addingId === product.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border flex-shrink-0 disabled:opacity-60"
                        style={{ borderColor: added ? 'var(--color-success)' : BRAND.blue, color: added ? 'var(--color-success)' : BRAND.blue }}
                      >
                        {added ? t('addedProductButton') : t('addProductButton')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Productos en la lista */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('myGiftItemsTitle')}</h2>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎁</div>
                <p className="text-gray-500 mb-1">{t('emptyGiftItemsMessage')}</p>
                <p className="text-sm text-gray-400">{t('emptyGiftItemsHint')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map(item => {
                  const isPurchased = !!item.purchased_by
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        <Image
                          src={item.product.images?.[0] ?? PLACEHOLDER_PRODUCT_IMAGE}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{formatPrice(item.product.price_rdp)}</p>
                        {isPurchased && (
                          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-success)' }}>
                            {t('giftedItemBadge')}
                          </p>
                        )}
                      </div>
                      {!isPurchased && (
                        <>
                          <select
                            value={item.priority}
                            onChange={e => handlePriorityChange(item.id, Number(e.target.value) as Priority)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white flex-shrink-0"
                            style={{ borderRadius: 'var(--radius-control)' }}
                          >
                            <option value={1}>{t('priorityHighOption')}</option>
                            <option value={2}>{t('priorityMediumOption')}</option>
                            <option value={3}>{t('priorityLowOption')}</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            aria-label={t('removeItemButton')}
                            className="p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
                            style={{ color: BRAND.red }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}
