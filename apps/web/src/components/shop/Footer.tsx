// ============================================================
// MercadoRD — Footer
// Ruta: src/components/shop/Footer.tsx
// ============================================================

import { Instagram, Facebook } from 'lucide-react'
import { BRAND } from '@/lib/colors'

// Lucide no incluye los logos de marca de X/Twitter ni TikTok — SVGs inline
function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function TikTokIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="hover:text-white transition-colors"
      style={{ color: '#B0B8C4' }}
    >
      {children}
    </a>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a
        href={href}
        // hover:text-[#FFC107] — Tailwind necesita el literal en build time,
        // debe coincidir con BRAND.gold en lib/colors.ts
        className="hover:text-[#FFC107] hover:underline transition-colors"
        style={{ color: '#B0B8C4', textDecoration: 'none', fontSize: 13 }}
      >
        {children}
      </a>
    </li>
  )
}

export function Footer() {
  return (
    <footer style={{ background: '#0a1628', color: '#fff', marginTop: 'auto' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* MercadoRD */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>
              <span style={{ color: '#fff' }}>Mercado</span>
              <span style={{ color: BRAND.red }}>RD</span>
            </div>
            <p style={{ color: '#B0B8C4', fontSize: 13, lineHeight: 1.6, maxWidth: 240 }}>
              El marketplace dominicano para comprar y vender en las 32 provincias 🇩🇴
            </p>
            <div className="flex items-center gap-4" style={{ marginTop: 16 }}>
              <SocialLink href="#" label="Instagram">
                <Instagram size={20} />
              </SocialLink>
              <SocialLink href="#" label="Facebook">
                <Facebook size={20} />
              </SocialLink>
              <SocialLink href="#" label="X (Twitter)">
                <XIcon size={20} />
              </SocialLink>
              <SocialLink href="#" label="TikTok">
                <TikTokIcon size={20} />
              </SocialLink>
            </div>
          </div>

          {/* Comprar */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Comprar
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
              <FooterLink href="/categorias">Todas las categorías</FooterLink>
              <FooterLink href="/tiendas">Todas las tiendas</FooterLink>
              <FooterLink href="/perfil/favoritos">Favoritos</FooterLink>
              <FooterLink href="/perfil/pedidos">Mis pedidos</FooterLink>
            </ul>
          </div>

          {/* Vender */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Vender
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
              <FooterLink href="/dashboard">Mi tienda</FooterLink>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Ayuda
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
              <FooterLink href="/soporte">Centro de soporte</FooterLink>
              <FooterLink href="/terminos">Términos y condiciones</FooterLink>
              <FooterLink href="/privacidad">Política de privacidad</FooterLink>
            </ul>
          </div>

        </div>

        {/* Barra inferior */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 32, paddingTop: 20 }}
        >
          <p style={{ color: '#8A93A3', fontSize: 12, margin: 0 }}>
            © 2026 MercadoRD. Todos los derechos reservados.
          </p>
          <p style={{ color: '#8A93A3', fontSize: 12, margin: 0 }}>
            Pagos seguros con Visa, Mastercard y Azul
          </p>
        </div>
      </div>
    </footer>
  )
}
