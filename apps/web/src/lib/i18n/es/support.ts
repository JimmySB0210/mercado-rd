// ============================================================
// MercadoRD — i18n: namespace "support" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/support.ts
// ============================================================
// Cubre app/soporte/page.tsx completo, incluyendo el mensaje que se
// arma dinámicamente para WhatsApp (nunca queda en español fijo si
// el idioma activo es otro). Los 7 tipos de problema del <select> y
// las 5 tarjetas de categoría usan su key de este diccionario como
// valor interno/identificador (no el texto en español) — así el
// componente nunca compara ni guarda texto traducible como estado.
// ============================================================

export const support = {
  breadcrumbHome: 'Inicio',
  breadcrumbCurrent: 'Soporte',
  pageTitle: 'Soporte al cliente',
  pageSubtitle: 'Cuéntanos qué pasó y te ayudamos por WhatsApp.',
  whatIsYourProblemLabel: '¿Cuál es tu problema?',

  // Tarjetas — las primeras 4 llevan a /perfil/pedidos con el motivo
  // resuelto (DisputeModal lo trae pre-seleccionado vía query param)
  categoryDamagedTitle: 'Productos dañados o rotos',
  categoryWrongItemTitle: 'Pedidos incompletos o erróneos',
  categoryNotAsDescribedTitle: 'Diferencias con la descripción',
  categoryDisputeTitle: 'Presentar una disputa comercial',
  categoryHiddenChargesTitle: 'Cargos ocultos',

  scheduleBanner: 'Respondemos de lunes a sábado, 9am–6pm. Tiempo de respuesta: menos de 2 horas en horario hábil.',

  // Formulario
  fullNameLabel: 'Nombre completo',
  fullNamePlaceholder: 'Tu nombre completo',
  fullNameRequiredError: 'Escribe tu nombre completo.',
  orderNumberLabel: 'Número de orden',
  orderNumberOptionalSuffix: '(opcional)',
  orderNumberPlaceholder: '#RD-XXXXXXXX',
  issueTypeLabel: 'Tipo de problema',
  descriptionLabel: 'Descripción del problema',
  descriptionPlaceholder: 'Cuéntanos con detalle qué pasó (mínimo {min} caracteres)',
  descriptionCounter: '{count}/{min} caracteres mínimos',
  descriptionRequiredError: 'Describe tu problema con al menos {min} caracteres.',
  submitButton: 'Enviar por WhatsApp',

  // Tipos de problema del <select> — el value real que guarda el
  // estado es la key (ej. "issueNotReceived"), nunca este texto
  issueNotReceived: 'No recibí mi pedido',
  issueDamaged: 'El producto llegó dañado',
  issueCancelOrder: 'Quiero cancelar mi pedido',
  issuePaymentProblem: 'Problema con el pago',
  issueHiddenCharges: 'Cargos ocultos en mi pedido',
  issueProductQuestion: 'Tengo una pregunta sobre un producto',
  issueOther: 'Otro',

  // Mensaje armado para WhatsApp — se concatena en código
  // (handleSubmit), no solo texto mostrado en JSX
  whatsappGreeting: 'Hola MercadoRD, necesito ayuda 🛒',
  whatsappNameLabel: 'Nombre',
  whatsappOrderLabel: 'Orden',
  whatsappNoOrderNumber: 'Sin número de orden',
  whatsappIssueLabel: 'Problema',
  whatsappDescriptionLabel: 'Descripción',
}

export type SupportDict = typeof support
