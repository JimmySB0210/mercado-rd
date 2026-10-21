// ============================================================
// MercadoRD — i18n: namespace "support" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/support.ts
// ============================================================
// Cubre app/soporte (SoporteContent.tsx) completo, incluyendo el mensaje
// que se arma dinámicamente para WhatsApp (nunca queda en español fijo
// si el idioma activo es otro). Los 9 tipos de problema del <select> y
// las 12 tarjetas usan su key de este diccionario como valor
// interno/identificador (no el texto en español) — así el componente
// nunca compara ni guarda texto traducible como estado.
// ============================================================

export const support = {
  breadcrumbHome: 'Inicio',
  breadcrumbCurrent: 'Soporte',

  // Títulos de tarjeta que coinciden con estos textos (se reutilizan)
  categoryNotAsDescribedTitle: 'Diferencias con la descripción',
  categoryHiddenChargesTitle: 'Cargos ocultos',

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
  issueSellerProblem: 'Tengo un problema con un vendedor',
  issueAccountProblem: 'Problemas con mi cuenta',
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

  // ── Rediseño de app/soporte (SoporteContent) ──
  supportSubtitle: 'Estamos aquí para ayudarte. Selecciona el tema de tu consulta o contáctanos directamente.',
  supportBannerTitle: '¿Necesitas ayuda?',
  supportBannerText: 'Nuestro equipo de soporte está listo para asistirte.',
  supportSearchPlaceholder: 'Buscar un tema, pedido o problema...',
  supportSearchAria: 'Buscar en Soporte',
  supportSearchButton: 'Buscar',
  supportQuickAccessTitle: 'Accesos rápidos',
  supportCardOrdersTitle: 'Mis pedidos',
  supportCardOrdersText: 'Consulta el estado de tus pedidos, seguimiento y entregas.',
  supportCardReturnsTitle: 'Devoluciones y disputas',
  supportCardReturnsText: 'Solicita una devolución o presenta una disputa si lo necesitas.',
  supportCardPaymentsTitle: 'Pagos y seguridad',
  supportCardPaymentsText: 'Resuelve dudas sobre pagos, métodos de pago y seguridad.',
  supportCardAccountTitle: 'Mi cuenta',
  supportCardAccountText: 'Revisa tus datos y gestiona tu contraseña y la seguridad de tu cuenta.',
  supportCardNotReceivedText: 'Tu pedido no ha llegado en la fecha estimada o no se ha entregado.',
  supportCardDamagedTitle: 'Producto dañado o incorrecto',
  supportCardDamagedText: 'Recibiste un producto en mal estado o diferente al que solicitaste.',
  supportCardMissingItemTitle: 'Falta un artículo',
  supportCardMissingItemText: 'Tu pedido llegó incompleto o falta algún producto.',
  supportCardNotAsDescribedText: 'El producto no es como se mostraba en la publicación.',
  supportCardSellerText: 'No recibes respuesta, hay un conflicto o necesitas ayuda con un vendedor.',
  supportCardHiddenChargesText: 'Viste un cobro que no aparecía antes de pagar.',
  supportCardAccountProblemText: 'Tienes dificultades para acceder, actualizar o gestionar tu cuenta.',
  supportCardDisputeTitle: 'Quiero presentar una disputa',
  supportCardDisputeText: 'Necesitas abrir un caso para resolver una situación con una compra.',
  supportWhatHappenedTitle: 'Cuéntanos qué ocurrió',
  supportWhatHappenedText: 'Elige el motivo que más se parezca a tu situación.',
  supportFormTitle: 'Envía tu consulta por WhatsApp',
  supportFormText: 'Completa los datos y se abrirá WhatsApp con tu mensaje listo para enviar.',
  supportNoResultsTitle: 'No encontramos resultados para "{query}"',
  supportNoResultsHint: 'Prueba con otras palabras o escríbenos directamente.',
  supportPanelTitle: '¿Necesitas ayuda personalizada?',
  supportPanelText: 'Nuestro equipo de soporte está listo para ayudarte.',
  supportPanelWhatsappButton: 'Contactar por WhatsApp',
  supportPanelWhatsappHint: 'Completa el formulario y se abrirá WhatsApp',
  supportPanelDisputesButton: 'Ver mis disputas',
  supportScheduleTitle: 'Horario de atención',
  supportScheduleText: 'Lunes a sábado · 9:00 a. m. – 6:00 p. m.',
  supportConfidentialNotice: 'Tus datos y reclamaciones se tratan de forma confidencial.',
  supportFaqTitle: 'Preguntas frecuentes',
  supportFaqText: 'Aquí encontrarás respuestas a las dudas más comunes.',
  supportFaqViewAll: 'Ver todas',
  supportBottomTitle: '¿Necesitas ayuda con algo más?',
  supportBottomText: 'Si no encontraste la respuesta a tu consulta, puedes contactar directamente con nuestro equipo de soporte.',
  // ── Centro de ayuda (app/centro-ayuda) ──
  helpCenterBreadcrumbCurrent: 'Centro de ayuda',
  helpCenterTitle: 'Centro de ayuda',
  helpCenterHowCanWeHelpTitle: '¿En qué podemos ayudarte?',
  helpCenterSubtitle: 'Encuentra respuestas sobre compras, ventas, pedidos y seguridad en MercadoRD.',
  helpCenterSearchPlaceholder: '¿Qué necesitas saber? Busca una pregunta o tema...',
  helpCenterSearchAria: 'Buscar artículos de ayuda',
  helpCenterClearSearchAria: 'Limpiar búsqueda',
  helpCenterCategoriesNavAria: 'Categorías del centro de ayuda',
  helpCenterArticleCountOne: '1 artículo',
  helpCenterArticleCountMany: '{count} artículos',
  helpCenterResultsOne: '1 resultado para "{query}"',
  helpCenterResultsMany: '{count} resultados para "{query}"',
  helpCenterNoResultsTitle: 'No encontramos artículos para "{query}"',
  helpCenterNoResultsHint: 'Prueba con otras palabras o explora las categorías.',
  helpCenterClearSearchButton: 'Ver todos los artículos',
  helpCenterEmpty: 'Todavía no hay artículos publicados.',
  helpCenterLoadError: 'No pudimos cargar el centro de ayuda. Intenta de nuevo en unos minutos.',
  helpCenterSpanishOnlyNotice: 'Por ahora los artículos del centro de ayuda están disponibles solo en español.',
  helpCenterStillNeedHelpTitle: '¿No encontraste lo que buscabas?',
  helpCenterStillNeedHelpText: 'Si necesitas ayuda con un pedido o tienes un problema, nuestro equipo puede orientarte.',
  helpCenterContactSupportCta: 'Contactar con soporte',
  helpCategoryComprar: 'Comprar',
  helpCategoryVender: 'Vender',
  helpCategoryPagar: 'Pagos',
  helpCategoryEnviar: 'Envíos',
  helpCategoryDevoluciones: 'Devoluciones',
  helpCategoryReembolsos: 'Reembolsos',
  helpCategoryDisputas: 'Disputas',
  helpCategorySeguridad: 'Seguridad',
  helpCategoryContacto: 'Contacto',
  helpCategoryPedidos: 'Pedidos',
  helpCategoryCuenta: 'Cuenta y privacidad',
  helpCategoryDevolucionesReembolsos: 'Devoluciones y reembolsos',
  helpCenterAboutTitle: 'Sobre MercadoRD',
  helpCenterAboutLink: 'Ver más sobre MercadoRD',
  // ── Acerca de MercadoRD (app/acerca-de) ──
  aboutBreadcrumbCurrent: 'Acerca de',
  aboutPageTitle: 'Acerca de MercadoRD',
  aboutPageSubtitle: 'El marketplace dominicano hecho para conectar compradores y vendedores de todo el país.',
  aboutSpanishOnlyNotice: 'Por ahora el contenido de esta página está disponible solo en español.',
  aboutLoadError: 'No pudimos cargar esta página. Intenta de nuevo en unos minutos.',
  aboutEmpty: 'Todavía no hay contenido publicado.',
}

export type SupportDict = typeof support
