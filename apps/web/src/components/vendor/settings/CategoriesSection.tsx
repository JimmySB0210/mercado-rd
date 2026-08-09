'use client'
// ============================================================
// MercadoRD — Configuración, sección: Categorías
// Ruta: src/components/vendor/settings/CategoriesSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database.types'
import { CategoryMultiSelect } from '@/components/vendor/wizard/CategoryMultiSelect'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  categories: Category[]
  initialCategoryIds: number[]
}

export function CategoriesSection({ vendorId, categories, initialCategoryIds }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [categoryIds, setCategoryIds] = useState<number[]>(initialCategoryIds)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: deleteError } = await supabase.from('vendor_categories').delete().eq('vendor_id', vendorId)
    if (deleteError) {
      setSaving(false)
      console.error('[CategoriesSection]', deleteError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    if (categoryIds.length > 0) {
      const { error: insertError } = await supabase
        .from('vendor_categories')
        .insert(categoryIds.map(category_id => ({ vendor_id: vendorId, category_id })))
      if (insertError) {
        setSaving(false)
        console.error('[CategoriesSection]', insertError)
        setError('Ocurrió un error al guardar. Intenta de nuevo.')
        return
      }
    }

    setSaving(false)
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Categorías" subtitle="¿Qué categorías de productos vendes?">
      <CategoryMultiSelect categories={categories} selectedIds={categoryIds} onChange={setCategoryIds} />
      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
