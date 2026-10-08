# Limpieza de datos demo para el lanzamiento

`cleanup-demo-data.sql` borra las tiendas, los productos, los pedidos, los chats y las cuentas demo, y conserva las tablas de referencia (categorías, provincias, tarifas de envío, artículos de ayuda, etc.) y las cuentas de la lista `conservar`.

No es una migración y no va en `supabase/migrations/`: allí se ejecutaría al reconstruir una base nueva. Se ejecuta a mano, una sola vez, el día del lanzamiento.

## Pasos

1. **Respaldo antes de ejecutar.** Desde la Terminal: `supabase db dump`. El plan gratuito de Supabase no hace respaldos automáticos.
2. **Ensayo.** Ejecutar el script tal cual (con `dry_run := true`) y leer el mensaje. Debe decir **"ENSAYO COMPLETO"**. En modo ensayo el script termina con un error a propósito, así que no cambia nada.
3. **Ejecución real.** Cambiar `dry_run := true` a `false` y ejecutar.
4. **Vaciar Storage** desde el panel de Supabase: imágenes de productos, logos y documentos de verificación. El script no borra archivos.
5. **Comprobar** el home, `/tiendas` y `/proveedores` sin datos, y que el login del admin funciona.

## No ejecutar si ya hay clientes reales

El script lo detecta y aborta si encuentra cuentas con actividad fuera de las listas `borrar` y `conservar`, pero eso no es una excusa para no revisarlo antes.
