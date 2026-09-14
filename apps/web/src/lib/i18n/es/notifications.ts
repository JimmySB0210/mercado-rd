// ============================================================
// MercadoRD — i18n: namespace "notifications" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/notifications.ts
// ============================================================
// Plantillas para notificaciones generadas por triggers de Postgres
// (create_notification): cada fila de notifications ya trae un
// title/body fijos en español (respaldo) y, para los tipos migrados,
// un jsonb `data` con los valores crudos (ej. product_name,
// current_stock, threshold para low_stock). NotificationBell interpola
// la plantilla de abajo con `data` cuando el `type` de la notificación
// tiene entrada aquí; si no la tiene (tipo sin migrar todavía), muestra
// el title/body guardado tal cual.
//
// Por eso este namespace NO pasa por useTranslation()/NAMESPACES: ese
// hook, ante una key faltante, devuelve la key literal como texto
// visible — acá el respaldo correcto ante un tipo faltante es el
// title/body ya guardado en la fila, no una key. NotificationBell
// importa los 3 diccionarios directo y decide el respaldo él mismo.
//
// Cada tipo migrado agrega una key con el mismo nombre exacto que
// notifications.type en la base de datos. low_stock es el primero y
// sirve de referencia para el resto.
// ============================================================

export const notifications = {
  low_stock: {
    title: '⚠️ Stock bajo',
    body: '{product_name} tiene solo {current_stock} unidades restantes (tu alerta estaba configurada en {threshold}).',
  },
  price_drop: {
    title: '🎉 ¡Bajó de precio!',
    body: '{product_name} ahora cuesta RD${new_price_rdp} (antes RD${old_price_rdp}) — ahorras RD${savings_rdp}',
  },
  back_in_stock: {
    title: '📦 ¡Ya está disponible!',
    body: '{product_name}, que guardaste en favoritos, ya está disponible de nuevo — quedan {current_stock} unidades.',
  },
  order_confirmed: {
    title: '¡Pedido confirmado! 🎉',
    body: 'Tu pedido {order_short_id} fue confirmado y está siendo preparado.',
  },
  order_shipped: {
    title: 'Tu pedido está en camino 🚚',
    body: 'Tu pedido {order_short_id} fue enviado y llegará pronto.',
  },
  order_delivered: {
    title: '¡Pedido entregado! ✅',
    body: 'Tu pedido {order_short_id} fue entregado. ¿Todo bien? Deja tu reseña.',
  },
  new_order: {
    title: '¡Nuevo pedido recibido! 🛒',
    body: 'Tienes un nuevo pedido {order_short_id} esperando confirmación.',
  },
  quote_requested: {
    title: 'Nueva solicitud de cotización 💰',
    body: 'Te pidieron cotizar {quantity} unidades',
  },
  quote_responded: {
    title: '{vendor_business_name} te envió un precio 💰',
    body: 'Nuevo precio: RD${price_rdp} por unidad',
  },
  quote_accepted: {
    title: '¡Cotización aceptada! 🎉',
    body: 'El comprador aceptó tu precio y generó un pedido',
  },
  // El chat genérico tiene 2 títulos posibles según quién escribe —
  // no es un simple placeholder, cambia la estructura entera de la
  // frase. NotificationBell elige title vs titleFromVendor según
  // data.is_from_vendor antes de interpolar.
  new_message: {
    title: 'Nuevo mensaje de un comprador 💬',
    titleFromVendor: '{vendor_business_name} te respondió 💬',
    body: '{message_preview}',
  },
  review_received: {
    title: 'Nueva reseña recibida ⭐',
    body: 'Recibiste una reseña de {rating} estrellas en "{product_name}".',
  },
  gift_purchased: {
    title: '🎁 ¡Alguien te compró un regalo!',
    body: '{buyer_name} te compró "{product_name}" de tu lista de regalos.',
  },
  // verification_level llega crudo (2/3/4/otro) — NotificationBell lo
  // resuelve contra vendorOptions.verificationLevel (mismo diccionario
  // que usa el resto del sitio) y lo pasa como level_label, para no
  // traducir "Fabricante verificado" de nuevo en un lugar aparte.
  verification_update: {
    title: '¡Tu nivel de verificación cambió!',
    body: 'Tu tienda ahora tiene el estado: {level_label}',
  },
  // La misma notificación tiene textos distintos para el vendor (title/
  // body, el caso base) y el admin (titleAdmin/bodyAdmin) — mismo patrón
  // que titleFromVendor en new_message. NotificationBell elige según
  // data.recipient_role.
  dispute_opened: {
    title: 'Nueva disputa abierta ⚠️',
    body: 'Un comprador abrió una disputa sobre el pedido {order_short_id}. Revisa los detalles.',
    titleAdmin: 'Nueva disputa para revisar ⚠️',
    bodyAdmin: 'Se abrió una disputa sobre el pedido {order_short_id}. Requiere tu atención.',
  },
  // 3 escenarios bajo un solo type (scenario: normal/recipient/gift).
  // El cuerpo se arma en 3 partes — NotificationBell concatena
  // giftPrefix (si scenario=gift) + body + recipientSuffix interpolado
  // (si scenario=recipient) — no es una sola interpolación simple.
  delivery_otp: {
    title: '🔐 Tu código de entrega',
    titleGift: '🎁 ¡Tienes un regalo en camino!',
    body: 'Tu código para confirmar la entrega es: {otp_code}. Compártelo con el repartidor SOLO cuando tengas el producto en tus manos.',
    giftPrefix: '¡Tienes un regalo en camino! ',
    recipientSuffix: ' Recuerda compartir este código con {recipient_name}, quien recibirá el pedido.',
  },
}

export type NotificationsDict = typeof notifications
