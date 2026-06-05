import type { Metadata } from 'next';
import { Barlow_Condensed, Barlow, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800', '900'],
  variable: '--font-barlow-condensed',
});

const barlow = Barlow({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600'],
  variable: '--font-barlow',
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title:       'MercadoRD — El marketplace dominicano',
  description: 'Compra y vende en República Dominicana. Miles de productos de negocios locales con envío a las 32 provincias.',
  keywords:    ['marketplace', 'república dominicana', 'comprar', 'vender', 'RD'],
  openGraph: {
    title:       'MercadoRD',
    description: 'El marketplace de todos los dominicanos',
    url:         'https://mercadord.com.do',
    siteName:    'MercadoRD',
    locale:      'es_DO',
    type:        'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${barlow.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-surface-bg text-ink antialiased">
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
