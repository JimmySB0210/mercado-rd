import './globals.css';

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
    <html lang="es">
      <body style={{margin:0,padding:0,fontFamily:'sans-serif'}}>
        {children}
      </body>
    </html>
  );
}