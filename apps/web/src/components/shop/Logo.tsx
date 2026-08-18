// ============================================================
// MercadoRD — Wordmark del logo
// Ruta: src/components/shop/Logo.tsx
// ============================================================
// Serif elegante (--font-logo, Playfair Display) + subtítulo en
// versalitas — reemplaza el wordmark sans-serif de dos tonos que
// usaban Navbar/Footer/DashboardSidebar antes. `variant="white"` es
// para fondos oscuros (Footer, sidebar del dashboard); "navy" (default)
// es para fondos claros (Navbar).
// ============================================================

interface LogoProps {
  variant?: 'navy' | 'white'
  fontSize?: number
}

export function Logo({ variant = 'navy', fontSize = 26 }: LogoProps) {
  const color = variant === 'white' ? '#fff' : 'var(--color-primary)'

  return (
    <div style={{ lineHeight: 1.2 }}>
      <div style={{ fontFamily: 'var(--font-logo)', fontWeight: 700, fontSize, color }}>
        MercadoRD
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: Math.max(8, Math.round(fontSize * 0.32)),
          color, opacity: variant === 'white' ? 0.75 : 0.65, letterSpacing: '0.12em', textTransform: 'uppercase',
          marginTop: 1, whiteSpace: 'nowrap',
        }}
      >
        De República Dominicana
      </div>
    </div>
  )
}
