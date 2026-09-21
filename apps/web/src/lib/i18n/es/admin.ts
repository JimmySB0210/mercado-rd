// ============================================================
// MercadoRD — i18n: namespace "admin" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/admin.ts
// ============================================================
// Cubre app/admin/**, components/admin/** y AdminSidebar.tsx.
//
// Los badges/chips de tipo de negocio, servicios, tiempo de
// producción, personalización, cliente objetivo y nivel de
// verificación en /admin/proveedores YA se traducen vía el
// namespace "vendorOptions" — no se duplican aquí.
//
// Los 2 mensajes de validación de imagen (invalidImageType,
// imageTooLarge) replican localmente la lógica de
// validateImageFile() en lib/storage/upload.ts usando las
// constantes ya exportadas (ALLOWED_IMAGE_TYPES,
// MAX_IMAGE_SIZE_BYTES) — esa función también la usan
// ProductForm.tsx y LogoSection.tsx (fuera de este alcance, y
// todavía sin traducir ahí) y no se toca.
// ============================================================

export const admin = {
  // Genérico
  restrictedAccessTitle: 'Acceso restringido',
  restrictedAccessMessage: 'Esta sección es solo para administradores de MercadoRD.',
  backToHomeLink: 'Volver al inicio',
  unitsFallback: 'unidades',
  yesValue: 'Sí',
  noValue: 'No',
  savingButton: 'Guardando...',
  cancelButton: 'Cancelar',
  editButton: 'Editar',
  deleteButton: 'Eliminar',
  tableHeaderStore: 'Tienda',
  tableHeaderProvince: 'Provincia',
  tableHeaderProducts: 'Productos',
  tableHeaderPlan: 'Plan',
  vendorsTableTitle: 'Vendors ({count})',

  // app/admin/page.tsx
  dashboardTitle: 'Vista general del marketplace',
  dashboardSubtitle: 'Métricas globales de MercadoRD',
  kpiRevenue: 'Ingresos totales',
  kpiRevenueSub: '{amount} este mes',
  kpiOrders: 'Pedidos totales',
  kpiOrdersSub: '{count} este mes',
  kpiVendors: 'Vendors activos',
  kpiVendorsSub: '{count} verificados',
  kpiProducts: 'Productos',
  kpiProductsSub: '{count} activos',
  kpiUsers: 'Usuarios registrados',
  kpiUsersSub: 'compradores + vendors',
  paymentsByMethodTitle: 'Pagos por método ({count})',
  paymentsByStatusTitle: 'Pagos por estado',
  noPaymentsYet: 'Aún no hay pagos registrados.',
  paymentSingular: 'pago',
  paymentPlural: 'pagos',
  openDisputesTitle: 'Disputas abiertas ({count})',
  noOpenDisputes: 'No hay disputas abiertas ni en revisión. 🎉',
  abandonedCartsTitle: 'Carritos abandonados 🛒',
  unrecoveredLabel: 'Sin recuperar',
  potentialLostValueLabel: 'Valor potencial perdido',
  noAbandonedCarts: 'No hay carritos abandonados sin recuperar. 🎉',
  tableHeaderSales: 'Ventas',
  tableHeaderVerified: 'Verificado',
  levelOneFallback: 'Nivel 1',
  viewDetailLink: 'Ver detalle →',
  recentOrdersTitle: 'Órdenes recientes',

  paymentMethod: {
    azul: 'Azul',
    cardnet: 'CardNet',
    transfer: 'Transferencia',
    cash: 'Efectivo',
  },
  paymentStatus: {
    pending: 'Pendiente',
    approved: 'Aprobado',
    declined: 'Rechazado',
    refunded: 'Reembolsado',
  },
  orderStatus: {
    pending: '⏳ Pendiente',
    confirmed: '✅ Confirmado',
    preparing: '📦 Preparando',
    shipped: '🚚 Enviado',
    delivered: '✔️ Entregado',
    cancelled: '❌ Cancelado',
  },

  // app/admin/proveedores/page.tsx
  verificationPageTitle: 'Verificación de proveedores',
  verificationPageSubtitle: 'Revisa la información del wizard y asigna el nivel de confianza de cada vendor',
  noVendorsMatchFilters: 'Ningún vendor coincide con estos filtros.',
  onboardingIncomplete: '⏳ Onboarding incompleto',
  viewPublicStoreLink: 'Ver tienda pública ↗',
  verificationLevelSectionLabel: 'Nivel de verificación',
  onboardingLabel: 'Onboarding',
  onboardingComplete: '✅ Completo',
  onboardingStep: '⏳ Paso {step}',
  contactSectionLabel: 'Contacto',
  noContactData: 'Sin datos de contacto.',
  businessTypesSectionLabel: 'Tipos de negocio',
  categoriesSectionLabel: 'Categorías',
  physicalPresenceSectionLabel: 'Presencia física',
  hasPhysicalStore: 'Tienda física',
  hasWarehouse: 'Almacén',
  hasWorkshop: 'Taller',
  manufacturingStatusSectionLabel: 'Estado de fabricación',
  productionTimeLabel: '⏱️ Tiempo de producción:',
  privateLabelLabel: '🏷️ Marca privada:',
  customizationLabel: '🎨 Personalización:',
  servicesSectionLabel: 'Servicios',
  minOrderQuantityLabel: 'Cantidad mínima de compra',
  targetCustomersSectionLabel: 'Clientes que atiende',
  emptyNote: 'Sin datos.',

  // components/admin/VendorVerificationFilters.tsx
  allLevelsOption: 'Todos los niveles',
  allBusinessTypesOption: 'Todos los tipos de negocio',
  levelOptionLabel: 'Nivel {level} — {label}',

  // components/admin/VerificationLevelControl.tsx
  levelButtonPrefix: 'Nivel {level}',
  changeLevelPrompt: 'Cambiar de "{from}" a "{to}".',
  internalNotePromptLabel: 'Nota interna (opcional):',
  levelUpdateFailed: 'No se pudo actualizar el nivel. Intenta de nuevo.',

  // app/admin/promociones/page.tsx
  bannersPageTitle: 'Banners promocionales',
  bannersPageSubtitle: 'Diapositivas del carrusel en el home, después de la de marca de MercadoRD',

  // components/admin/BrandBannerToggle.tsx
  brandBannerToggleLabel: 'Mostrar banner de marca de MercadoRD',
  brandBannerToggleSub: 'Si lo desactivas, el carrusel del home empieza directo con los banners promocionales.',
  brandBannerToggleError: 'No se pudo actualizar. Intenta de nuevo.',
  brandDesktopImageLabel: 'Imagen de fondo del banner de bienvenida (opcional)',
  brandDesktopImageHint: 'Reemplaza la foto del modelo en desktop. Si no subes nada, se usa la imagen por defecto.',
  brandMobileImageLabel: 'Imagen de fondo para mobile (opcional)',
  brandMobileImageHint: 'Fondo detrás del texto en la versión mobile. Si no subes nada, se queda solo el degradado.',
  brandImageRemoveButton: 'Quitar imagen',
  brandImageUploadFailed: 'No se pudo subir la imagen. Intenta de nuevo.',
  brandImageUpdateFailed: 'La imagen se subió, pero no se pudo guardar. Intenta de nuevo.',

  // components/admin/PromoCardImages.tsx — fotos de los 3 banners
  // pequeños del home (PromoBannersRow.tsx), mismo mecanismo que el
  // banner de marca (site_settings + bucket 'banners')
  promoCardImagesTitle: 'Fotos de los 3 banners pequeños',
  promoCardImagesSub: 'Reemplazan el ícono y el degradado de color por una foto real. Si no subes nada, se queda el diseño actual.',
  promoCardSellImageLabel: '"Vende tus productos en MercadoRD" (opcional)',
  promoCardSellImageHint: 'Foto de venta/comercio. Si no subes nada, se usa el ícono con degradado azul.',
  promoCardShippingImageLabel: '"Envíos confiables y rápidos" (opcional)',
  promoCardShippingImageHint: 'Foto de envíos/paquetes. Si no subes nada, se usa el ícono con fondo claro.',
  promoCardOffersImageLabel: '"Ofertas especiales" (opcional)',
  promoCardOffersImageHint: 'Foto de ofertas. Si no subes nada, se usa el ícono con degradado morado.',

  // components/admin/PromoBannerManager.tsx
  currentBannersTitle: 'Banners actuales ({count})',
  editBannerTitle: 'Editar banner',
  createBannerTitle: 'Crear banner nuevo',

  // components/admin/PromoBannerList.tsx
  noTitleFallback: 'Sin título',
  orderLabel: 'Orden: {order}',
  activeBadge: 'Activo',
  inactiveBadge: 'Inactivo',
  expiredBadge: '⏱️ Expirado',
  moveUpTitle: 'Subir',
  moveDownTitle: 'Bajar',
  activateButton: 'Activar',
  deactivateButton: 'Desactivar',
  deleteBannerConfirm: '¿Eliminar el banner "{title}"? Esta acción no se puede deshacer.',
  noBannersYet: 'Todavía no hay banners promocionales. Crea el primero abajo.',
  untitledBannerAlt: 'Banner promocional',

  // components/admin/PromoBannerForm.tsx
  desktopImageLabel: 'Imagen para desktop',
  mobileImageLabel: 'Imagen para mobile (vertical, opcional)',
  keepCurrentImageHint: 'Deja el campo vacío para conservar la imagen actual.',
  keepCurrentMobileImageHintEdit: 'Deja el campo vacío para conservar la imagen actual (o la de desktop, si nunca subiste una).',
  keepCurrentMobileImageHintCreate: 'Si no subes una, se usa la imagen de desktop también en mobile.',
  previewAlt: 'Vista previa',
  previewMobileAlt: 'Vista previa mobile',
  titleFieldLabel: 'Título (opcional)',
  titlePlaceholder: 'Ej. Ofertas de temporada',
  subtitleFieldLabel: 'Subtítulo (opcional)',
  subtitlePlaceholder: 'Ej. Hasta 30% off',
  linkFieldLabel: 'Link de destino (opcional)',
  linkPlaceholder: '/categoria/ropa, /tienda/xxx o https://...',
  orderFieldLabel: 'Orden',
  expiresOnLabelEdit: 'Expira el (opcional)',
  expiresInLabelCreate: 'Expira en (días, opcional)',
  expiresInPlaceholder: 'Ej. 7 — vacío = sin expiración',
  clearExpirationHint: 'Vacía este campo para quitar la expiración.',
  autoHideHint: 'El banner se deja de mostrar automáticamente al pasar esta fecha.',
  selectAtLeastOneImage: 'Selecciona al menos una imagen (desktop o mobile)',
  imageUploadFailed: 'No se pudo subir la imagen',
  mobileImageUploadFailed: 'No se pudo subir la imagen para mobile',
  saveBannerFailed: 'No se pudo guardar el banner',
  createBannerFailed: 'No se pudo crear el banner',
  saveChangesButton: 'Guardar cambios',
  addBannerButton: '+ Agregar banner',
  invalidImageType: 'Solo se permiten imágenes JPG, PNG o WebP',
  imageTooLarge: 'La imagen no puede superar 5MB',

  // components/admin/DisputeAdminRow.tsx
  saveButton: 'Guardar',
  saveFailedGeneric: 'No se pudo guardar. Intenta de nuevo.',
  resolutionNotePlaceholder: 'Nota de resolución (opcional)',
  disputeReason: {
    not_received: 'No recibió el pedido',
    not_as_described: 'No es como se describe',
    damaged: 'Llegó dañado',
    wrong_item: 'Producto equivocado',
    refund_request: 'Solicita reembolso',
    other: 'Otro',
  },
  disputeStatusOption: {
    open: 'Abierta',
    reviewing: 'En revisión',
    resolved: 'Resuelta',
    closed: 'Cerrada',
  },

  // app/admin/auditoria/page.tsx
  auditPageTitle: 'Bitácora de auditoría',
  auditPageSubtitle: 'Eventos del sistema, más recientes primero',
  auditTableTitle: 'Eventos ({count})',
  noAuditLogsMatchFilters: 'Ningún evento coincide con estos filtros.',
  allEventTypesOption: 'Todos los tipos de evento',
  dateFromLabel: 'Desde',
  dateToLabel: 'Hasta',
  auditActorLabel: 'Actor:',
  auditTargetLabel: 'Destino:',
  auditMetadataLabel: 'Ver metadata',
  systemActorFallback: 'Sistema',
  unknownActorFallback: 'Usuario desconocido',

  // app/admin/moderacion/page.tsx
  moderationPageTitle: 'Moderación de contenido',
  moderationPageSubtitle: 'Términos marcados y contenido pendiente de revisión',

  // components/admin/ContentFlagTermsManager.tsx
  flagTermsTitle: 'Términos marcados ({count})',
  flagTermPlaceholder: 'Término a marcar',
  flagCategoryPlaceholder: 'Categoría (opcional)',
  addTermButton: '+ Agregar término',
  noFlagTermsYet: 'Todavía no hay términos configurados.',
  deleteTermConfirm: '¿Quitar el término "{term}"? Esta acción no se puede deshacer.',
  addTermFailed: 'No se pudo agregar el término. Intenta de nuevo.',
  termRequiredError: 'Escribe un término',

  // components/admin/FlaggedContentQueue.tsx
  flaggedQueueTitle: 'Contenido sin revisar ({count})',
  noFlaggedContent: 'No hay contenido pendiente de revisión. 🎉',
  flaggedTypeProduct: 'Producto',
  flaggedTypeMessage: 'Mensaje de chat',
  matchedTermsLabel: 'Términos: {terms}',
  viewContentLink: 'Ver contenido →',
  markReviewedButton: 'Marcar como revisado',
  markReviewedFailed: 'No se pudo marcar como revisado. Intenta de nuevo.',
  deletedContentFallback: '(contenido no encontrado — puede haber sido eliminado)',

  // components/admin/AdminSidebar.tsx
  navOverview: 'Resumen',
  navProviders: 'Proveedores',
  navPromotions: 'Promociones',
  navModeration: 'Moderación',
  navAudit: 'Auditoría',
  navHelpCenter: 'Centro de ayuda',
  adminPanelLabel: '🛡️ Panel de administración',
  backToVendorPanelLink: '← Mi panel de vendedor',
  openMenuAria: 'Abrir menú del panel',
  closeMenuAria: 'Cerrar menú',
  // components/admin/HelpArticle*.tsx — Centro de ayuda
  helpPageTitle: 'Centro de ayuda',
  helpPageSubtitle: 'Artículos que se muestran en /centro-ayuda. Despublicar un artículo lo oculta al instante del sitio, pero no lo borra.',
  helpArticlesTitle: 'Artículos ({count})',
  helpAllCategoriesFilter: 'Todas',
  helpNoArticlesYet: 'Todavía no hay artículos. Crea el primero abajo.',
  helpNoArticlesInCategory: 'No hay artículos en esta categoría.',
  helpPublishedBadge: 'Publicado',
  helpUnpublishedBadge: 'Despublicado',
  helpPublishButton: 'Publicar',
  helpUnpublishButton: 'Despublicar',
  helpViewOnSiteLink: 'Ver en el sitio',
  helpCreateArticleTitle: 'Nuevo artículo',
  helpEditArticleTitle: 'Editar artículo',
  helpCategoryFieldLabel: 'Categoría',
  helpTitleFieldLabel: 'Título',
  helpTitlePlaceholder: 'Ej.: Cómo abrir una disputa',
  helpSlugFieldLabel: 'Slug (parte final del enlace)',
  helpSlugHint: 'Solo minúsculas, números y guiones. Cambiarlo rompe los enlaces directos que ya se hayan compartido.',
  helpContentFieldLabel: 'Contenido',
  helpContentHint: 'Texto plano. Separa los párrafos con una línea en blanco.',
  helpContentPlaceholder: 'Escribe la respuesta…',
  helpOrderFieldLabel: 'Orden',
  helpOrderHint: 'Posición dentro de su categoría (1 = primero).',
  helpPublishedFieldLabel: 'Publicado (visible para todos en el sitio)',
  helpAddArticleButton: 'Crear artículo',
  helpTitleRequired: 'El título es obligatorio.',
  helpContentRequired: 'El contenido es obligatorio.',
  helpSlugInvalid: 'El slug solo puede tener minúsculas, números y guiones (sin espacios ni acentos).',
  helpSlugTaken: 'Ya existe otro artículo con ese slug. Elige uno distinto.',
  helpSaveFailed: 'No se pudo guardar el artículo.',
  helpCreateFailed: 'No se pudo crear el artículo.',
  helpMoveFailed: 'No se pudo cambiar el orden. Se recargó la lista.',
  helpToggleFailed: 'No se pudo cambiar el estado de publicación.',
  helpSavedNotice: 'Cambios guardados.',
  helpCreatedNotice: 'Artículo creado.',
}

export type AdminDict = typeof admin
