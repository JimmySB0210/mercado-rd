import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { MobileTabBar } from '../components/shop/MobileTabBar'
import { Footer } from '../components/shop/Footer'
import { InactivityWarning } from '../components/shop/InactivityWarning'
import { AbandonedCartTracker } from '../components/shop/AbandonedCartTracker'
import { BRAND } from '@/lib/colors'

// Inter es la única fuente de interfaz. Pesos 400–700 estáticos; 800 y 900 se
// muestran como 700. Sin cursiva: next/font 14.2 no la declara para Inter.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

// Wordmark "MercadoRD", único uso: --font-logo en Logo.tsx.
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair-display',
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
  themeColor: BRAND.blue,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className="pb-20 md-860:pb-0"
        style={{
          margin: 0,
          padding: 0,
          fontFamily: 'var(--font-body)',
          background: '#FAFBFC',
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
