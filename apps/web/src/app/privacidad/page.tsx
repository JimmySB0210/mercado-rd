// ============================================================
// MercadoRD — Política de Privacidad
// Ruta: src/app/privacidad/page.tsx
// ============================================================
// AVISO: borrador base. Antes de operar con datos reales de
// pago a escala, revisar con un abogado dominicano la
// conformidad con la Ley 172-13 (Protección de Datos
// Personales) y la Ley 126-02 (Comercio Electrónico).
// No constituye asesoría legal.
// ============================================================

import { Navbar } from '@/components/shop/Navbar'

export const metadata = {
  title: 'Política de Privacidad | MercadoRD',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-400 mb-8">Última actualización: 21 de junio de 2026</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
          <strong>Documento en revisión.</strong> Este es un borrador inicial conforme a la Ley 172-13 de Protección de Datos Personales de República Dominicana.
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Qué datos recopilamos</h2>
            <p>Para operar la Plataforma, recopilamos los siguientes datos cuando te registras o realizas una compra:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico, número de teléfono.</li>
              <li><strong>Datos de envío:</strong> dirección de entrega, provincia.</li>
              <li><strong>Datos de pago:</strong> procesados directamente por nuestros proveedores certificados (Azul, CardNet) — MercadoRD <strong>no almacena</strong> números completos de tarjeta de crédito/débito en sus propios servidores.</li>
              <li><strong>Datos de uso:</strong> historial de compras, productos vistos, búsquedas realizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Para qué usamos tus datos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Procesar y entregar tus pedidos.</li>
              <li>Comunicarnos contigo sobre el estado de tus compras (incluyendo notificaciones por WhatsApp).</li>
              <li>Prevenir fraude y proteger la seguridad de la Plataforma.</li>
              <li>Mejorar la experiencia de búsqueda y recomendaciones de productos.</li>
              <li>Cumplir con obligaciones legales y fiscales aplicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Con quién compartimos tus datos</h2>
            <p>Compartimos datos limitados con:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Vendedores:</strong> nombre, teléfono y dirección de entrega de tus pedidos, únicamente para poder completarlos.</li>
              <li><strong>Procesadores de pago:</strong> Azul y CardNet, para autorizar transacciones.</li>
              <li><strong>Proveedores de infraestructura:</strong> Supabase (base de datos) y Vercel (hosting), bajo sus respectivos acuerdos de procesamiento de datos.</li>
              <li><strong>Meta (WhatsApp Business):</strong> tu número de teléfono, exclusivamente para enviarte notificaciones de tus pedidos.</li>
            </ul>
            <p>No vendemos tus datos personales a terceros con fines publicitarios.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Tus derechos (Ley 172-13)</h2>
            <p>Como titular de tus datos, tienes derecho a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Acceso:</strong> solicitar una copia de los datos que tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados.</li>
              <li><strong>Cancelación:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Oposición:</strong> oponerte a ciertos usos de tus datos.</li>
            </ul>
            <p>Puedes ejercer estos derechos contactándonos a través de los canales de soporte de la Plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Seguridad de los datos</h2>
            <p>
              Implementamos medidas técnicas razonables para proteger tus datos, incluyendo cifrado en tránsito,
              controles de acceso basados en roles (Row Level Security), y autenticación segura. Sin embargo, ningún
              sistema es 100% infalible, y no podemos garantizar seguridad absoluta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa, y por el período adicional requerido por
              obligaciones legales o fiscales (por ejemplo, registros de transacciones para fines tributarios).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Cookies</h2>
            <p>
              Usamos almacenamiento local del navegador (no cookies de terceros con fines publicitarios) para
              mantener tu sesión iniciada, recordar tu carrito de compras y tu provincia preferida.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Menores de edad</h2>
            <p>
              MercadoRD no está dirigido a menores de 18 años para fines de venta. Si descubrimos que hemos
              recopilado datos de un menor sin consentimiento de un adulto responsable, eliminaremos esa información.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios sustanciales a través
              de la Plataforma o por correo electrónico.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Contacto</h2>
            <p>
              Para ejercer tus derechos o resolver dudas sobre el manejo de tus datos, contáctanos a través de los
              canales de soporte disponibles en la Plataforma.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
