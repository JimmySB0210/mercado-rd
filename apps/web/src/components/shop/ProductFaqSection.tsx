// ============================================================
// MercadoRD — Preguntas frecuentes del vendedor (página de producto)
// Ruta: src/components/shop/ProductFaqSection.tsx
// ============================================================
// Server Component. Dos fuentes: (1) automática — si el vendor tiene
// vendor_business_types, "¿Qué tipo de negocio es X?" con las
// etiquetas reales; (2) sus vendor_faqs activas, en acordeón. Si no
// hay ninguna de las dos, la sección entera no se renderiza.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { ProductFaqAccordion, type FaqViewModel } from '@/components/shop/ProductFaqAccordion'

interface Props {
  vendorId: string
  vendorName: string
}

export async function ProductFaqSection({ vendorId, vendorName }: Props) {
  const supabase = createPublicClient()

  const [businessTypesRes, faqsRes] = await Promise.all([
    supabase.from('vendor_business_types').select('business_type').eq('vendor_id', vendorId),
    supabase.from('vendor_faqs').select('id, question, answer').eq('vendor_id', vendorId).eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  const businessTypes = (businessTypesRes.data ?? []).map(r => r.business_type)
  const faqs: FaqViewModel[] = faqsRes.data ?? []

  if (businessTypes.length === 0 && faqs.length === 0) return null

  return <ProductFaqAccordion vendorName={vendorName} businessTypes={businessTypes} faqs={faqs} />
}
