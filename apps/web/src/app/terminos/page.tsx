// ============================================================
// MercadoRD — Términos de Servicio
// Ruta: src/app/terminos/page.tsx
// ============================================================
// AVISO: este es un borrador base generado para acelerar el
// lanzamiento. Antes de operar con dinero real (pagos en vivo),
// debe ser revisado por un abogado dominicano familiarizado con
// la Ley 358-05 (Protección al Consumidor), la Ley 126-02
// (Comercio Electrónico) y la Ley 53-07 (Crímenes de Alta
// Tecnología). No constituye asesoría legal.
// ============================================================

import { Navbar } from '@/components/shop/Navbar'

export const metadata = {
  title: 'Términos de Servicio | MercadoRD',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos de Servicio</h1>
        <p className="text-sm text-gray-400 mb-8">Última actualización: 21 de junio de 2026</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
          <strong>Documento en revisión.</strong> Este es un borrador inicial. Si tienes dudas sobre tus derechos como comprador o vendedor, contáctanos.
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Aceptación de los términos</h2>
            <p>
              Al crear una cuenta, comprar, o vender productos en MercadoRD (&ldquo;la Plataforma&rdquo;), aceptas estos
              Términos de Servicio en su totalidad. Si no estás de acuerdo, no debes usar la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Qué es MercadoRD</h2>
            <p>
              MercadoRD es un marketplace que conecta a vendedores independientes (&ldquo;Vendedores&rdquo;) con compradores
              (&ldquo;Compradores&rdquo;) en República Dominicana. MercadoRD facilita la conexión, el procesamiento de pagos
              y la logística, pero <strong>no es el vendedor</strong> de los productos listados — cada Vendedor es responsable
              de sus propios productos, descripciones, precios e inventario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Cuentas de usuario</h2>
            <p>
              Debes proporcionar información veraz al registrarte. Eres responsable de mantener la confidencialidad de tu
              contraseña y de toda actividad realizada bajo tu cuenta. Debes ser mayor de 18 años para registrarte como
              Vendedor; los menores de edad pueden comprar solo bajo supervisión de un adulto responsable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Obligaciones de los Vendedores</h2>
            <p>Al registrar una tienda en MercadoRD, te comprometes a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Publicar información veraz sobre tus productos (descripción, precio, disponibilidad).</li>
              <li>Cumplir con los pedidos confirmados dentro de los plazos de entrega informados.</li>
              <li>No vender productos ilegales, falsificados, peligrosos o prohibidos por la legislación dominicana.</li>
              <li>Responder a las consultas de los Compradores de forma razonable.</li>
              <li>Cumplir con tus obligaciones fiscales correspondientes ante la DGII por las ventas realizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Pagos y comisiones</h2>
            <p>
              Los pagos realizados a través de la Plataforma se procesan mediante proveedores de pago certificados
              (Azul, CardNet). MercadoRD puede cobrar una comisión por transacción a los Vendedores, según el plan
              contratado (Free o Pro). Los precios mostrados a los Compradores incluyen el ITBIS aplicable según la
              legislación dominicana vigente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Política de devoluciones y compra protegida</h2>
            <p>
              Si un producto no llega, llega dañado, o no corresponde a su descripción, el Comprador puede solicitar
              un reembolso a través del soporte de MercadoRD dentro de los 7 días posteriores a la entrega. MercadoRD
              mediará entre Comprador y Vendedor para resolver la disputa de buena fe.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Conducta prohibida</h2>
            <p>Está prohibido usar la Plataforma para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Publicar contenido falso, engañoso, difamatorio o que infrinja derechos de terceros.</li>
              <li>Intentar eludir el sistema de pagos de la Plataforma para evadir comisiones.</li>
              <li>Acosar, amenazar o discriminar a otros usuarios.</li>
              <li>Usar bots o scraping automatizado sin autorización expresa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Limitación de responsabilidad</h2>
            <p>
              MercadoRD actúa como intermediario tecnológico. En la máxima medida permitida por la ley dominicana,
              MercadoRD no será responsable por daños indirectos derivados de transacciones entre Compradores y
              Vendedores, salvo en los casos cubiertos explícitamente por la política de compra protegida.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Suspensión de cuentas</h2>
            <p>
              MercadoRD se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos, con
              notificación previa cuando sea razonablemente posible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Modificaciones</h2>
            <p>
              Estos términos pueden actualizarse periódicamente. Los cambios sustanciales serán notificados a los
              usuarios registrados con al menos 15 días de anticipación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">11. Ley aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de la República Dominicana. Cualquier disputa será sometida a
              los tribunales competentes de Santo Domingo, sin perjuicio de los mecanismos de protección al
              consumidor establecidos por Pro Consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">12. Contacto</h2>
            <p>
              Para preguntas sobre estos términos, contáctanos a través de los canales de soporte disponibles en
              la Plataforma.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
