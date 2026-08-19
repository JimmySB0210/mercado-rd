import './globals.css'
import type { Metadata } from 'next'
import { Poppins, Plus_Jakarta_Sans, Inter, Playfair_Display, Manrope } from 'next/font/google'
import { MobileTabBar } from '../components/shop/MobileTabBar'
import { Footer } from '../components/shop/Footer'
import { InactivityWarning } from '../components/shop/InactivityWarning'
import { AbandonedCartTracker } from '../components/shop/AbandonedCartTracker'
import { BRAND } from '@/lib/colors'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

// Sistema de diseño "Caribe Premium Minimal" (Fase 1 — fundación): estas
// dos fuentes quedan disponibles como variables CSS (--font-plus-jakarta-sans,
// --font-inter) para que lib/design-tokens.css pueda referenciarlas, pero
// TODAVÍA no se aplican a ningún elemento — Poppins sigue siendo la fuente
// activa en <body> hasta que empiece la Fase 2.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

// Wordmark "MercadoRD" — serif elegante para el logo (Navbar, Footer,
// sidebar del dashboard), separado de --font-heading (ahora Manrope,
// ver más abajo — sigue usándose para títulos grandes de página/precio).
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair-display',
  display: 'swap',
})

// Nueva tipografía del sistema — --font-heading y --font-body en
// globals.css apuntan aquí ahora. Plus Jakarta Sans e Inter se dejan
// cargados (arriba) pero sin uso mientras no haga falta revertir.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const SITE_TITLE = 'MercadoRD — El marketplace dominicano'
const SITE_DESCRIPTION = 'Compra y vende en República Dominicana. Miles de productos, tiendas y vendedores verificados en todo el país.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'MercadoRD',
    locale: 'es_DO',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'MercadoRD' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MercadoRD',
  },
  themeColor: '#0D47A1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${poppins.variable} ${plusJakartaSans.variable} ${inter.variable} ${playfairDisplay.variable} ${manrope.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className="pb-20 md-860:pb-0"
        style={{
          margin: 0,
          padding: 0,
          fontFamily: 'var(--font-poppins), sans-serif',
          background: '#F5F7FA',
          '--brand-red': BRAND.red,
          '--brand-blue': BRAND.blue,
        } as React.CSSProperties}
      >
        {children}
        <Footer />
        <MobileTabBar />
        <InactivityWarning />
        <AbandonedCartTracker />
      </body>
    </html>
  )
}
