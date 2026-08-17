'use client'
// ============================================================
// MercadoRD — Botón de favoritos (corazón)
// Ruta: src/components/shop/WishlistButton.tsx
// ============================================================
// No se anida dentro del <Link> de ProductCard — se posiciona
// como hermano absoluto sobre el contenedor exterior, para no
// repetir el bug de hidratación que causaba un elemento
// interactivo anidado dentro de otro.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  productId: string
}

export function WishlistButton({ productId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('profile')

  const [isFavorited, setIsFavorited] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setChecking(false)
        return
      }

      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()

      if (active) {
        setIsFavorited(!!data)
        setChecking(false)
      }
    }

    check()
    return () => { active = false }
  }, [productId, supabase])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)

    if (isFavorited) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (!error) setIsFavorited(false)
      else console.error('[WishlistButton] delete', error)
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: productId })

      if (!error) setIsFavorited(true)
      else console.error('[WishlistButton] insert', error)
    }

    setLoading(false)
  }

  // Evita el parpadeo del corazón mientras se confirma el estado inicial
  if (checking) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={isFavorited ? t('removeFromFavoritesAria') : t('addToFavoritesAria')}
      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white/90 hover:scale-110 disabled:opacity-60 disabled:cursor-wait border-none cursor-pointer"
      style={{ transition: 'transform var(--transition-fast), background-color var(--transition-fast)' }}
    >
      <Heart
        size={14}
        className={isFavorited ? 'text-red-500' : 'text-gray-400'}
        fill={isFavorited ? 'currentColor' : 'none'}
      />
    </button>
  )
}
