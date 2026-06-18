import './globals.css'
import { Poppins } from 'next/font/google'
import { MobileTabBar } from '../components/shop/MobileTabBar'
import { BRAND } from '@/lib/colors'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata = {
  title: 'MercadoRD — El marketplace dominicano',
  description: 'Compra y vende en República Dominicana',
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
      </body>
    </html>
  )
}
