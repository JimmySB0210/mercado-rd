'use client'
// ============================================================
// MercadoRD — Estilos del panel de administración (Centro de operaciones)
// Ruta: src/components/admin/AdminOpsStyles.tsx
// ============================================================
// Mismo método que CheckoutStyles: styled-jsx global, clases con prefijo adm-
// para no chocar con nada, y los colores/tamaños de globals.css (tokens) siempre
// que existen. Los pocos hex fijos son los tonos de estado (ámbar, rojo, verde,
// azul, gris) con contraste AA sobre su fondo, y el azul marino del menú.
//
// Responsive: el menú lateral es una columna fija desde 860 px (el mismo punto
// de corte de Navbar/MobileTabBar); por debajo, barra superior + cajón.
// Se hace con CSS (no con JavaScript) para que no haya parpadeo al cargar.
// ============================================================

export function AdminOpsStyles() {
  return (
    <style jsx global>{`
      /* ── Estructura ── */
      /* globals.css pone overflow-x: hidden en html y body: eso convierte al body en un contenedor de
         scroll y el menú y la barra con position: sticky dejan de pegarse. Solo en las páginas de /admin
         se cambia a clip (recorta igual, pero no crea contenedor de scroll). Si el navegador no entiende
         :has() la regla se ignora y el menú simplemente se desplaza con la página. */
      html:has(.adm-shell), body:has(.adm-shell) { overflow-x: clip; }
      /* El pie de página de la tienda (Comprar / Vender / Ayuda…) no pinta nada en un panel de administración. */
      body:has(.adm-shell) { padding-bottom: 0; }
      body:has(.adm-shell) > footer { display: none; }
      .adm-shell {
        --adm-bg: #f4f6f9; --adm-card: #fff; --adm-line: #e3e8ef; --adm-text: var(--color-text-primary); --adm-muted: #566573;
        --adm-side: #071d3a; --adm-side-w: 248px;
        display: grid; grid-template-columns: var(--adm-side-w) minmax(0, 1fr); min-height: 100vh;
        background: var(--adm-bg); color: var(--adm-text);
      }
      .adm-shell [data-tone='amber'] { --tone-fg: #8a4b00; --tone-bg: #fff3dc; --tone-bd: #f2d49b; --tone-ic: #c77700; }
      .adm-shell [data-tone='red']   { --tone-fg: #b42318; --tone-bg: #feecea; --tone-bd: #f5c2be; --tone-ic: #d2282d; }
      .adm-shell [data-tone='green'] { --tone-fg: #05603a; --tone-bg: #e6f6f0; --tone-bd: #b7e3d1; --tone-ic: #00a86b; }
      .adm-shell [data-tone='blue']  { --tone-fg: #03498f; --tone-bg: #e6eef8; --tone-bd: #bcd3ee; --tone-ic: #0458b4; }
      .adm-shell [data-tone='muted'] { --tone-fg: #475467; --tone-bg: #f2f4f7; --tone-bd: #e0e4ea; --tone-ic: #667585; }
      .adm-shell a:focus-visible, .adm-shell button:focus-visible, .adm-shell select:focus-visible {
        outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: 6px;
      }
      .adm-skip { position: absolute; left: -9999px; top: 8px; z-index: 300; background: #fff; color: var(--color-primary); padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: var(--text-small); }
      .adm-skip:focus { left: 8px; }
      .adm-vh { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      .adm-col-main { min-width: 0; display: flex; flex-direction: column; }
      .adm-content { min-width: 0; flex: 1; }

      /* ── Menú lateral ── */
      .adm-side { position: sticky; top: 0; height: 100vh; overflow-y: auto; background: var(--adm-side); color: #d5e0ee; }
      .adm-nav { display: flex; flex-direction: column; min-height: 100%; padding: 18px 12px 14px; }
      .adm-brand { display: flex; align-items: center; gap: 10px; padding: 2px 8px 14px; text-decoration: none; color: #fff; }
      .adm-brand-name { display: block; font-size: var(--text-h3); font-weight: 700; line-height: 1.1; }
      .adm-brand-name b { color: #ff7378; font-weight: 700; }
      .adm-brand-sub { display: block; margin-top: 3px; font-size: var(--text-caption); color: #9fb3cc; font-weight: 400; }
      .adm-nav-group { margin-top: 10px; }
      .adm-nav-title { margin: 0 10px 6px; font-size: var(--text-badge); font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #8fa6c4; }
      .adm-nav-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
      .adm-nav-link { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; color: #d5e0ee; text-decoration: none; font-size: var(--text-ui); line-height: 1.2; }
      .adm-nav-link svg { flex: 0 0 auto; opacity: 0.9; }
      .adm-nav-link:hover { background: rgba(255, 255, 255, 0.09); color: #fff; }
      .adm-nav-link[aria-current='page'] { background: var(--color-primary); color: #fff; font-weight: 600; }
      .adm-side a:focus-visible, .adm-side button:focus-visible, .adm-drawer a:focus-visible, .adm-drawer button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      .adm-nav-foot { margin-top: auto; padding-top: 14px; display: flex; flex-direction: column; gap: 12px; }
      .adm-nav-foot-sep { border-top: 1px solid rgba(255, 255, 255, 0.12); padding-top: 12px; }
      .adm-back { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; color: #d5e0ee; text-decoration: none; font-size: var(--text-small); }
      .adm-back:hover { background: rgba(255, 255, 255, 0.09); color: #fff; }

      /* ── Cajón (móvil) ── */
      .adm-drawer-backdrop { position: fixed; inset: 0; background: rgba(7, 29, 58, 0.55); z-index: 200; }
      .adm-drawer { position: absolute; top: 0; left: 0; bottom: 0; width: 290px; max-width: 86vw; background: var(--adm-side); color: #d5e0ee; overflow-y: auto; box-shadow: 8px 0 32px rgba(0, 0, 0, 0.3); }
      .adm-drawer-close { position: absolute; top: 12px; right: 10px; display: inline-flex; padding: 6px; border: 0; border-radius: 8px; background: transparent; color: #d5e0ee; cursor: pointer; }
      .adm-drawer-close:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

      /* ── Barra superior ── */
      .adm-top { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 8px 24px; background: #fff; border-bottom: 1px solid var(--adm-line); }
      .adm-menu-btn { display: none; align-items: center; justify-content: center; width: 40px; height: 40px; border: 1px solid var(--adm-line); border-radius: 10px; background: #fff; color: var(--adm-text); cursor: pointer; }
      .adm-top-brand { display: none; text-decoration: none; color: var(--adm-text); font-weight: 700; font-size: var(--text-h4); }
      .adm-top-brand b { color: var(--brand-red); font-weight: 700; }
      .adm-top-label { display: inline-flex; align-items: center; gap: 8px; color: var(--adm-muted); font-size: var(--text-small); font-weight: 600; }
      .adm-top-right { margin-left: auto; display: flex; align-items: center; gap: 18px; }
      .adm-profile { display: flex; align-items: center; gap: 10px; padding: 4px 8px; border-radius: 10px; text-decoration: none; color: inherit; }
      .adm-profile:hover { background: var(--adm-bg); }
      .adm-avatar { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary); color: #fff; font-size: var(--text-caption); font-weight: 700; flex: 0 0 auto; }
      .adm-profile-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
      .adm-profile-text strong { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-small); }
      .adm-profile-text small { font-size: var(--text-caption); color: var(--adm-muted); }

      @media (max-width: 859px) {
        .adm-shell { grid-template-columns: minmax(0, 1fr); }
        .adm-side { display: none; }
        .adm-menu-btn { display: inline-flex; }
        .adm-top-brand { display: inline-block; }
        .adm-top-label { display: none; }
        .adm-top { padding: 8px 14px; }
      }
      @media (min-width: 860px) { .adm-drawer-backdrop { display: none; } }
      @media (max-width: 560px) { .adm-profile-text { display: none; } .adm-top-right { gap: 10px; } }

      /* ── Páginas de siempre dentro del marco nuevo (promociones, moderación, auditoría, proveedores, ayuda) ── */
      .adm-legacy-page { padding: 24px; max-width: 1520px; margin: 0 auto; }
      @media (max-width: 640px) { .adm-legacy-page { padding: 16px 14px 32px; } }

      /* ── Página ── */
      .adm-page { display: flex; flex-direction: column; gap: 16px; padding: 22px 24px 40px; max-width: 1520px; margin: 0 auto; }
      @media (max-width: 640px) { .adm-page { padding: 16px 14px 32px; } }
      .adm-page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .adm-h1 { margin: 0; font-size: var(--text-h2); line-height: var(--leading-h2); font-weight: 700; color: var(--adm-text); }
      .adm-sub { margin: 4px 0 0; font-size: var(--text-ui); color: var(--adm-muted); }
      .adm-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid var(--adm-line); border-radius: 999px; background: #fff; color: var(--adm-muted); font-size: var(--text-caption); font-weight: 600; }

      /* ── Tarjetas ── */
      .adm-card { background: var(--adm-card); border: 1px solid var(--adm-line); border-radius: 12px; box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04); min-width: 0; }
      .adm-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px 0; }
      .adm-card-title { display: flex; align-items: center; gap: 8px; margin: 0; font-size: var(--text-h4); line-height: 1.3; font-weight: 700; }
      .adm-card-sub { margin: 2px 0 0; font-size: var(--text-small); color: var(--adm-muted); line-height: 1.4; }
      .adm-card-body { padding: 12px 16px 16px; }
      .adm-card-body-flush { padding: 8px 0 0; }
      .adm-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 10px 16px 14px; border-top: 1px solid #eef1f5; font-size: var(--text-caption); color: var(--adm-muted); line-height: 1.4; }
      .adm-link { display: inline-flex; align-items: center; gap: 4px; color: var(--color-primary); font-size: var(--text-small); font-weight: 600; text-decoration: none; white-space: nowrap; }
      .adm-link:hover { text-decoration: underline; }
      .adm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--adm-line); border-radius: 8px; background: #fff; color: var(--adm-text); font-size: var(--text-small); font-weight: 600; cursor: pointer; text-decoration: none; }
      .adm-btn:hover { background: var(--adm-bg); }
      .adm-btn-primary { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
      .adm-btn-primary:hover { background: var(--color-primary-hover); }

      /* ── Requiere tu atención ── */
      .adm-attn-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 16px 0; }
      .adm-attn-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: var(--text-h3); line-height: 1.25; font-weight: 700; }
      .adm-attn-total { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; background: var(--brand-red); color: #fff; font-size: var(--text-caption); font-weight: 700; }
      /* 1 columna en móvil, 2 en tablet, 3 en escritorio y 5 en pantallas muy anchas (las tarjetas llevan texto: con menos ancho se aprietan). */
      .adm-attn-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 14px 16px 16px; }
      @media (min-width: 760px) { .adm-attn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (min-width: 1200px) { .adm-attn-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (min-width: 1800px) { .adm-attn-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
      .adm-attn-card { position: relative; display: flex; align-items: center; gap: 12px; min-width: 0; padding: 12px 14px; border: 1px solid var(--adm-line); border-radius: 12px; background: #fff; color: inherit; text-decoration: none; }
      a.adm-attn-card:hover { border-color: var(--tone-bd); background: var(--tone-bg); }
      .adm-attn-card[data-tone='muted'] { background: #fafbfc; border-style: dashed; }
      .adm-attn-ic { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; background: var(--tone-bg); color: var(--tone-ic); }
      .adm-attn-body { flex: 1; min-width: 0; }
      .adm-attn-label { font-size: var(--text-small); font-weight: 600; line-height: 1.25; color: var(--adm-text); }
      .adm-attn-value { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin-top: 3px; color: var(--tone-fg); }
      .adm-attn-num { font-size: 24px; line-height: 1.1; font-weight: 700; }
      .adm-attn-unit { font-size: var(--text-small); font-weight: 600; }
      .adm-attn-text { font-size: var(--text-small); font-weight: 700; line-height: 1.3; }
      .adm-attn-hint { margin-top: 3px; font-size: var(--text-caption); color: var(--adm-muted); line-height: 1.35; }
      .adm-attn-chev { flex: 0 0 auto; color: #7a8794; }

      /* ── Indicadores ── */
      .adm-kpi-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      /* 6 tarjetas: 2 columnas en móvil y tablet, 3 en escritorio y 6 en pantallas muy anchas (3×2 y 2×3 no dejan ninguna sola en su fila). */
      .adm-kpi-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      @media (min-width: 1100px) { .adm-kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (min-width: 1800px) { .adm-kpi-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
      @media (max-width: 379px) { .adm-kpi-grid { grid-template-columns: minmax(0, 1fr); } }
      .adm-kpi { container-type: inline-size; display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; }
      .adm-kpi-top { display: flex; align-items: center; gap: 8px; font-size: var(--text-small); font-weight: 600; color: var(--adm-muted); }
      .adm-kpi-ic { flex: 0 0 auto; width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: var(--tone-bg); color: var(--tone-ic); }
      .adm-kpi-val { font-size: var(--text-metric); line-height: 1.15; font-weight: 700; letter-spacing: -0.01em; overflow-wrap: anywhere; }
      @container (max-width: 215px) { .adm-kpi-val { font-size: 22px; } }
      .adm-kpi-sub { font-size: var(--text-caption); color: var(--adm-muted); line-height: 1.4; }
      .adm-kpi-err { display: flex; align-items: flex-start; gap: 6px; font-size: var(--text-small); font-weight: 600; color: var(--tone-fg); line-height: 1.35; }

      /* ── Tablas y listas ── */
      .adm-table-wrap { overflow-x: auto; }
      .adm-table { width: 100%; border-collapse: collapse; font-size: var(--text-small); }
      .adm-table th { padding: 8px 12px; text-align: left; font-size: var(--text-caption); font-weight: 600; color: var(--adm-muted); background: #fafbfc; border-top: 1px solid #eef1f5; border-bottom: 1px solid var(--adm-line); white-space: nowrap; }
      .adm-table td { padding: 10px 12px; border-bottom: 1px solid #eef1f5; vertical-align: middle; }
      .adm-table tbody tr:last-child td { border-bottom: 0; }
      .adm-table .adm-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .adm-ref { font-weight: 700; color: var(--color-primary); white-space: nowrap; }
      .adm-strong { font-weight: 600; }
      .adm-nowrap { white-space: nowrap; }
      .adm-line2 { display: block; font-size: var(--text-caption); color: var(--adm-muted); }
      .adm-muted { color: var(--adm-muted); }
      .adm-task-kind { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
      .adm-task-kind svg { color: var(--tone-ic); flex: 0 0 auto; }
      @media (max-width: 760px) {
        .adm-table[data-stack] thead { position: absolute; left: -9999px; }
        .adm-table[data-stack] tr { display: block; padding: 10px 14px; border-bottom: 1px solid #eef1f5; }
        .adm-table[data-stack] tbody tr:last-child { border-bottom: 0; }
        .adm-table[data-stack] td { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0; border: 0; text-align: right; }
        .adm-table[data-stack] td::before { content: attr(data-label); flex: 0 0 auto; color: var(--adm-muted); font-size: var(--text-caption); font-weight: 600; text-align: left; }
        .adm-table[data-stack] td[data-label=''] { justify-content: flex-start; }
        .adm-table[data-stack] td[data-label='']::before { content: none; }
      }

      /* ── Insignias ── */
      .adm-badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border: 1px solid var(--tone-bd); border-radius: 999px; background: var(--tone-bg); color: var(--tone-fg); font-size: var(--text-caption); font-weight: 600; line-height: 1.5; white-space: nowrap; }
      .adm-badge svg { flex: 0 0 auto; }

      /* ── Actividad ── */
      .adm-feed { list-style: none; display: flex; flex-direction: column; }
      .adm-feed > li { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eef1f5; }
      .adm-feed > li:last-child { border-bottom: 0; }
      .adm-feed-ic { flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--tone-bg); color: var(--tone-ic); }
      .adm-feed-main { flex: 1; min-width: 0; }
      .adm-feed-label { display: block; font-size: var(--text-small); font-weight: 600; line-height: 1.3; color: var(--adm-text); text-decoration: none; }
      a.adm-feed-label:hover { color: var(--color-primary); text-decoration: underline; }
      .adm-feed-meta { margin-top: 1px; font-size: var(--text-caption); line-height: 1.4; color: var(--adm-muted); }
      .adm-feed-time { flex: 0 0 auto; font-size: var(--text-caption); color: var(--adm-muted); white-space: nowrap; }

      /* ── Estados: cargando / error / vacío ── */
      .adm-state { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border: 1px solid var(--tone-bd); border-radius: 10px; background: var(--tone-bg); color: var(--tone-fg); font-size: var(--text-small); line-height: 1.45; }
      .adm-state > svg { flex: 0 0 auto; margin-top: 1px; color: var(--tone-ic); }
      .adm-state-body { flex: 1; min-width: 0; }
      .adm-state strong { display: block; margin-bottom: 2px; }
      .adm-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 26px 16px; text-align: center; color: var(--adm-muted); font-size: var(--text-small); }
      .adm-empty svg { color: var(--color-green); }
      .adm-empty strong { color: var(--adm-text); font-size: var(--text-ui); }
      .adm-skel { display: block; border-radius: 8px; background: linear-gradient(90deg, #eef1f5 25%, #f7f9fb 37%, #eef1f5 63%); background-size: 400% 100%; animation: adm-shimmer 1.4s ease infinite; }
      @keyframes adm-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
      @media (prefers-reduced-motion: reduce) { .adm-skel { animation: none; } }

      /* ── Rejilla de dos columnas ── */
      .adm-cols { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
      .adm-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
      @media (max-width: 1100px) { .adm-cols { display: flex; flex-direction: column; } .adm-col { display: contents; } }

      /* ── Disputas: resumen y página ── */
      .adm-bar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: #eef1f5; }
      .adm-bar > span { display: block; height: 100%; }
      .adm-legend { list-style: none; display: grid; gap: 8px; margin-top: 12px; }
      .adm-legend > li { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: var(--text-small); }
      .adm-legend-key { display: inline-flex; align-items: center; gap: 8px; }
      .adm-swatch { width: 10px; height: 10px; border-radius: 3px; flex: 0 0 auto; }
      .adm-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
      .adm-tab { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--adm-line); border-radius: 999px; background: #fff; color: var(--adm-text); font-size: var(--text-small); font-weight: 600; text-decoration: none; }
      .adm-tab:hover { background: var(--adm-bg); }
      .adm-tab[aria-current='page'] { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
      .adm-tab-count { font-weight: 700; opacity: 0.85; }
      .adm-pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 16px; border-top: 1px solid #eef1f5; font-size: var(--text-small); color: var(--adm-muted); }
      .adm-pager-links { display: flex; gap: 8px; }
      .adm-btn[aria-disabled='true'] { opacity: 0.45; pointer-events: none; }
      .adm-note { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border: 1px solid var(--tone-bd); border-radius: 8px; background: var(--tone-bg); color: var(--tone-fg); font-size: var(--text-caption); line-height: 1.45; }
      .adm-note > svg { flex: 0 0 auto; margin-top: 1px; color: var(--tone-ic); }
      .adm-pending-list { list-style: none; display: grid; gap: 6px; }
      .adm-pending-list > li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 10px; border: 1px dashed var(--adm-line); border-radius: 8px; font-size: var(--text-small); color: var(--adm-muted); }
    `}</style>
  )
}
