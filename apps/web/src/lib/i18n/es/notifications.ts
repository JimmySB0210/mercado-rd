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
}

export type NotificationsDict = typeof notifications
