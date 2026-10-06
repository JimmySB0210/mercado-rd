# Tipografía oficial de MercadoRD — Especificación UI

Quiero establecer Inter como la tipografía oficial de MercadoRD en toda la aplicación.

NO cambies de fuente entre páginas ni componentes.
NO uses Arial, Roboto, Poppins, Montserrat ni otras fuentes como reemplazo.
Si Inter ya está disponible en el proyecto, reutilízala. Si no está disponible, intégrala correctamente de la forma compatible con la arquitectura actual.

## 1. Fuente principal

```
font-family:
"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Inter será utilizada en:

- Marketplace
- Home
- Header
- Categorías
- Product cards
- Product detail
- Tiendas
- Dashboard
- Configuración
- Nuevo producto
- Pedidos
- Chat
- Checkout
- Formularios
- Admin

## 2. Pesos oficiales

**400 — Regular.** Para textos normales, descripciones, ayudas, textos secundarios y placeholders.

**500 — Medium.** Para labels, navegación, filtros, información secundaria importante, metadata, categorías y estados.

**600 — SemiBold.** Para botones, títulos pequeños, nombres de productos, nombres de tiendas, encabezados de tarjetas, navegación importante y enlaces importantes.

**700 — Bold.** Para títulos principales, encabezados de sección, precios, métricas principales, nombres destacados y CTA importantes.

**800 — ExtraBold.** USAR CON MODERACIÓN. Solo para H1 principales, números/métricas extremadamente importantes, hero headings y elementos de máxima jerarquía. No utilizar 800 indiscriminadamente.

## 3. Escala tipográfica

| Nivel | Tamaño | Line-height | Peso | Uso |
|---|---|---|---|---|
| H1 | 32px | 1.2 | 700 | Títulos principales de páginas, dashboard, páginas principales |
| H1 HERO | 40px | 1.1 | 700/800 | Desktop únicamente |
| H2 | 24px | 1.25 | 700 | Títulos de secciones, bloques principales |
| H3 | 20px | 1.3 | 600/700 | Tarjetas, subsecciones, encabezados secundarios |
| H4 | 16px | 1.4 | 600 | Títulos pequeños, grupos de formularios, labels importantes |
| BODY | 15px | 1.5 | 400 | Texto corrido |
| BODY SMALL | 13px | 1.45 | 400/500 | Texto secundario |
| CAPTION / META | 12px | 1.4 | 400/500 | Caption y metadata |

## 4. Precios

Los precios son uno de los elementos más importantes de MercadoRD.

- Precio principal de producto, desktop: 28px, line-height 1.2, 700.
- Precio principal de producto, mobile: 24px, line-height 1.2, 700.
- Precio muy destacado / detalle de producto: 32px, line-height 1.15, 700.

No utilizar 800 automáticamente para todos los precios. Los precios deben tener mucha jerarquía visual sin parecer exagerados. Ejemplo: `RD$1,200` debe destacar claramente más que "ITBIS incluido", "39 disponibles" o "Envío...".

## 5. Dashboard

El dashboard debe sentirse como un producto SaaS moderno, limpio y profesional.

- Título principal: 28px, 700.
- Subtítulo: 15px, 400.
- Título de tarjeta: 16px, 600.
- Métrica principal: 28px, 700.
- Etiqueta de métrica: 12px, 500, uppercase, letter-spacing 0.02em.
- Dato secundario: 13px, 400/500.
- Botones: 14px, 600.
- Links: 14px, 600.

No utilizar títulos enormes que generen espacios verticales innecesarios.

## 6. Formularios

- Labels: 14px, 600.
- Texto dentro de inputs: 14px, 400/500.
- Placeholder: 14px, 400.
- Texto de ayuda: 12px, 400.
- Títulos de sección: 18px, 700.
- Descripción de sección: 13px, 400.
- Mensajes de error: 13px, 500/600.
- Mensajes de éxito: 13px, 500/600.

Los formularios deben sentirse compactos y profesionales. Evitar grandes espacios verticales entre label → input → ayuda.

## 7. Botones

- Primary button: 14px, 600.
- Secondary button: 14px, 600.
- Small button: 13px, 600.
- CTA principal: 15px, 600.

Nunca usar 700/800 en todos los botones. El peso debe ayudar a jerarquizar el botón, no hacerlo visualmente pesado.

## 8. Product cards

- Nombre del producto: 15px, 600, line-height 1.35.
- Precio: 20px, 700.
- Precio anterior: 13px, 400, tachado.
- Rating: 13px, 500.
- Nombre del vendedor: 13px, 500/600.
- Información secundaria: 12px, 400/500.
- Badge: 11px, 600.

Ejemplos de badges: MÁS VENDIDO, OFERTA, ENVÍO GRATIS, NUEVO. Los badges deben ser compactos y no dominar la tarjeta.

## 9. Header / Navbar

- Navegación: 14px, 500.
- Elemento activo: 14px, 600.
- Buscador: 14px, 400.
- Texto de ubicación: 13px, 500.
- Acciones: 13/14px, 500/600.

No utilizar Bold en todos los elementos del header.

## 10. Mobile

En mobile reducir tamaños de forma controlada.

- H1: 24px, 700.
- H2: 20px, 700.
- H3: 17px, 600/700.
- Body: 14px, 400.
- Precio: 24px, 700.
- Botones: 14px, 600.
- Labels: 13px, 600.

No hacer simplemente un "scale down" general. Cada componente debe conservar su jerarquía.

## 11. Consistencia

NO crear tamaños arbitrarios como 17px en una página, 18px en otra, 19px en otra o 21px en otra si cumplen la misma función. Utilizar una escala tipográfica consistente. Si un componente necesita un tamaño diferente por razones reales de diseño, justificarlo y mantenerlo como excepción reutilizable.

## 12. Jerarquía visual

H1 / Hero → H2 → H3 → precio / información principal → body → metadata → caption.

El usuario debe poder escanear una pantalla rápidamente sin encontrarse con bloques de texto del mismo peso visual.

## 13. Identidad visual

Esta especificación NO significa llenar la interfaz de texto grande y Bold. MercadoRD debe sentirse moderno, comercial, limpio, confiable, dinámico y similar a un marketplace grande, pero manteniendo una identidad propia dominicana.

Priorizar jerarquía + contraste + espaciado correcto por encima de simplemente aumentar font-size/font-weight.

## 14. Implementación

1. Revisar cómo está cargada actualmente la fuente.
2. Identificar si ya existe un sistema de tipografía/tokens.
3. Reutilizar tokens existentes cuando sea posible.
4. No duplicar estilos innecesariamente.
5. Si existen clases/tokens tipográficos globales, centralizar esta escala ahí.
6. No modificar lógica de negocio.
7. No modificar Supabase, RLS, RPCs, auth, checkout, inventario ni APIs.

Después: ejecutar `tsc --noEmit`, verificar desktop y mobile, revisar que no haya overflow, y comprobar visualmente dashboard, marketplace y formularios.

No rediseñar la interfaz completa al aplicar esta especificación. Primero establecer un sistema tipográfico consistente y después aplicarlo cuidadosamente a los componentes existentes.

---

## Decisiones aprobadas (fase 0)

Estas decisiones precisan la spec anterior para la implementación:

- **14 vs 15:** los controles (botones, labels, inputs, nav, links) se quedan en 14px. Solo los párrafos y descripciones pasan a 15px, caso por caso en la fase de componentes. Ante la duda, 14px.
- **Tamaños sobre 32:** token `display` de 40px para el H1 hero (solo desktop; 32px en móvil). Los 36/40/48 que sean títulos pasan a `display` o a H1 32, según su rol. Los emojis usan tamaño de ícono, fuera de la escala de texto.
- **Precios:** tarjeta 20/700. Precio anterior 13/400 tachado. Listados 28 en desktop y 24 en móvil, 700. Detalle de producto 32, line-height 1.15, 700. Métrica del dashboard 28/700. Los 22 y 26 observados se resuelven a 24 o 28 según el rol.
- **Logo:** el subtítulo "De República Dominicana" usa Inter. El wordmark "MercadoRD" (Playfair Display) no se toca.
- **Georgia del hero:** se reemplaza por Inter. Si la variable no carga itálica, se quita la cursiva en vez de dejar que el navegador la sintetice. `monospace` se mantiene para códigos e IDs.
- **Pesos:** 900 pasa a 800 como piso mecánico. En cada bloque de implementación, los textos bajan a 700 salvo H1/hero y métricas extremas, que la spec autoriza a 800. Ver la regla vigente abajo: el 800 no se habilita en la carga de Inter hasta el final de la fase 3.

## Decisiones aprobadas (bloques de la fase 3)

### Excepciones reutilizables

- **Subtítulo del hero móvil en caption (12px).** El banner móvil del hero mide 112px de alto fijo, con H1 de 24px en 2 líneas. Con 14px el subtítulo no cabe y se colapsa, así que queda en `--text-caption` con `--leading-caption`. Excepción a la regla de párrafos móviles en 14px. Reutilizable para cualquier banner compacto de altura fija.
- **Tablets (641 a 1009px):** el hero compacto sigue usando el H1 de 32px del token de escritorio, porque el breakpoint de los tokens móviles es 640px. Aprobado.
- **Títulos largos en tarjetas angostas:** token `--text-title-long` (24px, sin override móvil), usado solo en el H1 de `/vendor/register`. Ahí el título ocupa 3 líneas en H1 (32px) dentro de una tarjeta angosta; en H2 (24px) ocupa 2. Aprobado por Jimmy.
- **Badges:** token `--text-badge` (11px), definido por la spec §8.
- **Móvil H3 (17px) y body (14px):** overrides de los tokens existentes en el media query de 640px.

### Reglas vigentes

- **Peso 800:** la carga de Inter sigue en 400 a 700. El 800 se habilita al final de la fase 3, cuando no quede ningún 800 o 900 sin revisar, y solo si un elemento autorizado lo necesita. Esto reemplaza la instrucción anterior de habilitarlo por bloque.
- **Emojis y tamaños de ícono** (22, 40, 48 px): fuera de la escala de texto, sin tokenizar.
- **Cursiva:** next/font 14.2 no declara itálica para Inter. El Georgia del hero se reemplazó por Inter sin cursiva.
- **Hero de escritorio (≥1010px): altura por rango.** Dos reglas, con el mismo contenido en ES, EN y FR. Medido con margen mínimo de 12px arriba y abajo, sin recortes ni solapes, y sin scroll horizontal.
  - **≥1280px, altura 200px:** titular de 40px en una línea, en una columna de texto de 850px. El kicker va en el bloque de la derecha, sobre la bandera. CTA y perks van en una fila debajo del subtítulo, de 2 líneas. Medido: 31px arriba y abajo.
  - **1010 a 1279px, altura 260px:** titular de 40px en dos líneas, en una columna de 580px. El kicker va arriba del titular y los perks debajo del CTA. Medido: 19px arriba y 14px abajo, igual en ES, EN y FR.
  - **Límite entre rangos:** al cruzar 1280px la altura baja de 260 a 200px. Es un salto fijo de 60px, sin scroll horizontal.
  - **Móvil y tablet (hasta 1009px):** sin cambios. El banner mide 112px a 390px de ancho y 271px a 899px.
  - **Promos de escritorio:** la altura mínima de 260px se aplica solo en móvil. En escritorio la altura la da el contenedor. No hay promos activas para probarlo con datos reales.

### Pendientes

- Ninguno de hero. Lo de altura del hero queda resuelto arriba.

## Barrido final de tamaños (fase 3)

### Clases Tailwind de la escala de px (excepción documentada, sin migrar)

- `text-xs`, `text-sm`, `text-base`, `text-xl` y `text-2xl` son equivalentes aceptados para 12, 14, 16, 20 y 24 px. Mantienen la misma escala de px; el interlineado difiere en menos de 1 px. No se migran.
- Regla: el código nuevo usa los tokens (`--text-*`, `text-caption`, `text-small`, `text-ui`, `text-h1`…); las clases de arriba se conservan en el código existente.

### Excepciones (no son texto de interfaz; no se tokenizan)

- **Emojis** como contenido (🛒, 📦, 🔍, 💬, ⭐, 🇩🇴, ⚠️, 🔞, 📊, 🏪, 🤝, 💡…) en tamaños de 18 a 48 px.
- **Íconos** en contenedores de tamaño fijo (16 a 26 px), incluida la X de cierre y la flecha `→`.
- **Marcas ✓** de casillas (10 a 11 px) y chevrones `›`.
- **SVG de recharts:** ticks y tooltip de `RevenueChart`. El SVG necesita valores numéricos.
- **Wordmark "MercadoRD":** props `fontSize` de `Logo` y el texto de marca en login, registro, recuperar, restablecer y `/vendor/register`. Es identidad, no tipografía de interfaz.
- **Placeholders de logo** (inicial de avatar y logo de vendedor sin imagen).
- **Contador de la barra móvil** (8 px dentro de un círculo de 15 px en `MobileTabBar`).

### Pendiente (no verificado)

- **Onboarding de vendor, pasos 1 a 6:** sin verificar en pantalla. No hay cuenta sin vendedor para recorrerlos; las cuentas demo son de vendedor. Pendiente de una cuenta de prueba de Jimmy. Solo se revisó el código y la pantalla inicial de `/vendor/register`.
