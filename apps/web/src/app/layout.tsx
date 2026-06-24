import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { MobileTabBar } from '../components/shop/MobileTabBar'
import { InactivityWarning } from '../components/shop/InactivityWarning'
import { AbandonedCartTracker } from '../components/shop/AbandonedCartTracker'
import { BRAND } from '@/lib/colors'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={poppins.variable}>
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
        <MobileTabBar />
        <InactivityWarning />
        <AbandonedCartTracker />
      </body>
    </html>
  )
}
