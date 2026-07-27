// ============================================================
// MercadoRD — Footer
// Ruta: src/components/shop/Footer.tsx
// ============================================================

import { BRAND } from '@/lib/colors'

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
              <FooterLink href="/vendor/register">Vender en MercadoRD</FooterLink>
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
