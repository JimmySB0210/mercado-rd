import './globals.css';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'MercadoRD — El marketplace dominicano',
  description: 'Compra y vende en República Dominicana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body style={{margin:0,padding:0,fontFamily:'var(--font-poppins), sans-serif',background:'#F5F7FA'}}>
        {children}
      </body>
    </html>
  );
}
