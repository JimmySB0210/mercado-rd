'use client'
// ============================================================
// MercadoRD — Estilos del checkout
// Ruta: src/components/checkout/CheckoutStyles.tsx
// ============================================================
// Todo con tokens de globals.css (colores, radios, sombras, tipografía); los
// únicos hex fijos son los del banner de error y del aviso ámbar, que ya
// existían en esta página. Clases con prefijo ck- para no chocar con nada.
// Puntos de corte: una columna hasta 960 px, dos columnas desde 961 px.
// ============================================================

export function CheckoutStyles() {
  return (
    <style jsx global>{`
      .ck-shell { max-width: 1120px; margin: 0 auto; padding: 16px 16px 40px; box-sizing: border-box; }
      @media (min-width: 641px) { .ck-shell { padding: 28px 24px 48px; } }
      .ck-h1 { margin: 0 0 16px; font-size: var(--text-h1); font-weight: 700; line-height: var(--leading-h1); color: var(--color-text-primary); }
      .ck-redirecting { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 0; padding: 80px 16px; font-size: var(--text-body); color: var(--color-text-secondary); }
      .ck-redirecting .ck-spinner { color: var(--color-primary); }

      /* ── Barra de progreso ── */
      .ck-steps { list-style: none; display: flex; align-items: flex-start; margin: 0 auto 20px; padding: 0; max-width: 560px; }
      .ck-step { position: relative; flex: 1 1 0; min-width: 0; display: flex; justify-content: center; }
      .ck-step::before { content: ''; position: absolute; top: 13px; right: 50%; width: 100%; height: 2px; background: var(--color-border); }
      .ck-step:first-child::before { display: none; }
      .ck-step[data-state='done']::before, .ck-step[data-state='current']::before { background: var(--color-primary); }
      .ck-step-link { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 4px; text-align: center; text-decoration: none; color: inherit; }
      a.ck-step-link:hover .ck-step-label { text-decoration: underline; }
      a.ck-step-link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; border-radius: 8px; }
      .ck-step-dot { box-sizing: border-box; width: 28px; height: 28px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: var(--text-small); font-weight: 700; background: #fff; color: var(--color-text-secondary); border: 2px solid var(--color-border); }
      .ck-step[data-state='done'] .ck-step-dot { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
      .ck-step[data-state='current'] .ck-step-dot { background: var(--color-primary); border-color: var(--color-primary); color: #fff; box-shadow: 0 0 0 4px var(--color-primary-subtle); }
      .ck-step-label { font-size: var(--text-small); font-weight: 500; line-height: 1.25; color: var(--color-text-secondary); }
      .ck-step[data-state='done'] .ck-step-label { color: var(--color-text-primary); }
      .ck-step[data-state='current'] .ck-step-label { color: var(--color-primary); font-weight: 700; }
      @media (max-width: 380px) { .ck-step-label { font-size: var(--text-caption); } }

      /* ── Rejilla de la página ── */
      .ck-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; grid-template-areas: 'items' 'main' 'totals'; }
      .ck-items { grid-area: items; }
      .ck-main { grid-area: main; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
      .ck-totals { grid-area: totals; }
      @media (min-width: 961px) {
        .ck-grid { grid-template-columns: minmax(0, 1fr) clamp(340px, 30vw, 420px); grid-template-rows: auto 1fr; gap: 20px 24px; grid-template-areas: 'main items' 'main totals'; }
      }

      /* ── Tarjetas ── */
      .ck-card { box-sizing: border-box; background: var(--color-card-bg); border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 18px; }
      @media (min-width: 641px) { .ck-card { padding: 24px; } }
      .ck-card-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
      .ck-card-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--color-primary-subtle); color: var(--color-primary); }
      .ck-card-title { margin: 0; font-size: var(--text-form-section); font-weight: 700; line-height: 1.3; color: var(--color-text-primary); }
      .ck-card-sub { margin: 2px 0 0; font-size: var(--text-small); line-height: 1.45; color: var(--color-text-secondary); }

      /* ── Campos ── */
      .ck-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 16px; }
      .ck-span-all { grid-column: 1 / -1; }
      .ck-label-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 6px; }
      .ck-label { font-size: var(--text-form-label); font-weight: 600; color: var(--color-text-primary); }
      .ck-req { color: var(--brand-red); }
      .ck-aside { font-size: var(--text-caption); color: var(--color-text-secondary); }
      .ck-hint { margin: 6px 0 0; font-size: var(--text-caption); line-height: 1.4; color: var(--color-text-secondary); }
      .ck-error { display: flex; gap: 6px; align-items: flex-start; margin: 6px 0 0; font-size: var(--text-small); font-weight: 500; line-height: 1.4; color: var(--brand-red); }
      .ck-input { display: block; box-sizing: border-box; width: 100%; min-height: 48px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-control); background: #fff; color: var(--color-text-primary); font-family: inherit; font-size: var(--text-body); line-height: 1.4; outline: none; transition: border-color var(--transition-fast); }
      .ck-input::placeholder { color: var(--color-text-secondary); opacity: 0.8; }
      .ck-input:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; border-color: var(--color-primary); }
      .ck-input[aria-invalid='true'] { border-color: var(--brand-red); }
      .ck-input:disabled { background: var(--color-divider); cursor: not-allowed; }
      .ck-input[data-empty='true'] { color: var(--color-text-secondary); }
      textarea.ck-input { min-height: 96px; resize: vertical; }
      select.ck-input { appearance: none; -webkit-appearance: none; padding-right: 40px; cursor: pointer; }
      .ck-select-wrap { position: relative; }
      .ck-select-chevron { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--color-text-secondary); }
      @media (max-width: 640px) { .ck-input { font-size: 16px; } }
      .ck-checkbox { display: flex; align-items: center; gap: 10px; min-height: 44px; cursor: pointer; font-size: var(--text-ui); color: var(--color-text-primary); }
      .ck-checkbox input { flex-shrink: 0; width: 20px; height: 20px; margin: 0; accent-color: var(--color-primary); cursor: pointer; }
      .ck-checkbox input:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
      .ck-label-spacer { visibility: hidden; }
      @media (max-width: 543px) { .ck-label-spacer { display: none; } }
      .ck-estimate { display: flex; align-items: center; gap: 10px; box-sizing: border-box; min-height: 48px; padding: 10px 14px; border-radius: var(--radius-control); background: var(--color-primary-subtle); color: var(--color-text-primary); font-size: var(--text-small); line-height: 1.4; }
      .ck-estimate svg { flex-shrink: 0; color: var(--color-primary); }

      /* ── Métodos de pago ── */
      .ck-pay-fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
      .ck-pay-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .ck-pay-tile { position: relative; display: flex; align-items: center; gap: 10px; box-sizing: border-box; min-height: 68px; padding: 12px; border: 1.5px solid var(--color-border); border-radius: var(--radius-control); background: #fff; color: var(--color-text-primary); cursor: pointer; transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast); }
      .ck-pay-tile:hover { border-color: var(--color-primary); background: var(--color-primary-subtle); }
      .ck-pay-tile[data-selected='true'] { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
      .ck-pay-tile[data-disabled='true'] { background: var(--color-divider); border-color: var(--color-divider); color: var(--color-text-secondary); cursor: not-allowed; }
      .ck-pay-tile:focus-within { outline: 2px solid var(--color-primary); outline-offset: 2px; }
      .ck-pay-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .ck-pay-tile[data-selected='true'] .ck-pay-text { padding-right: 18px; }
      .ck-pay-name { font-size: var(--text-small); font-weight: 600; line-height: 1.25; overflow-wrap: anywhere; }
      .ck-pay-hint { font-size: var(--text-caption); line-height: 1.3; }
      .ck-pay-check { position: absolute; top: 8px; right: 8px; width: 18px; height: 18px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; background: #fff; color: var(--color-primary); }
      .ck-card-form { margin-top: 16px; padding: 18px; border: 1px solid var(--color-divider); border-radius: var(--radius-control); background: var(--color-bg-main); }
      .ck-card-form-title { margin: 0 0 14px; font-size: var(--text-h4); font-weight: 700; color: var(--color-text-primary); }
      .ck-card-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 14px; }
      .ck-notice { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; padding: 12px 14px; border-radius: var(--radius-control); font-size: var(--text-small); line-height: 1.45; }
      .ck-notice svg { flex-shrink: 0; margin-top: 2px; }
      .ck-notice[data-tone='warning'] { background: #FFF8E1; border: 1px solid #FFE082; color: #5D4037; }
      .ck-notice[data-tone='info'] { background: var(--color-primary-subtle); border: 1px solid var(--color-primary-subtle); color: var(--color-text-primary); }
      .ck-card-form .ck-notice { margin-top: 14px; }

      /* ── Productos del pedido ── */
      .ck-link { color: var(--color-primary); font-size: var(--text-small); font-weight: 600; text-decoration: none; white-space: nowrap; }
      .ck-link:hover { text-decoration: underline; }
      /* Área táctil de 44 px para los enlaces chicos, sin cambiar cómo se ven */
      .ck-link, .ck-pill-link { position: relative; }
      .ck-link::after, .ck-pill-link::after { content: ''; position: absolute; left: -6px; right: -6px; top: 50%; height: 44px; transform: translateY(-50%); }
      .ck-link:focus-visible, .ck-pill-link:focus-visible, .ck-items-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: 6px; }
      .ck-items-toggle { display: none; align-items: center; gap: 4px; min-height: 44px; padding: 0 4px; background: none; border: none; cursor: pointer; font-family: inherit; font-size: var(--text-small); font-weight: 600; color: var(--color-primary); white-space: nowrap; }
      .ck-items-chevron { transition: transform var(--transition-fast); }
      .ck-items[data-open='true'] .ck-items-chevron { transform: rotate(180deg); }
      .ck-items-total-inline { display: none; font-weight: 600; color: var(--color-text-primary); }
      .ck-items-edit-mobile { display: none; }
      @media (max-width: 960px) {
        .ck-items-toggle { display: inline-flex; }
        .ck-items .ck-card-icon { display: none; }
        .ck-items-edit-desktop { display: none; }
        .ck-items-total-inline { display: inline; }
        .ck-items[data-open='false'] .ck-items-body { display: none; }
        .ck-items[data-open='false'] .ck-card-head { margin-bottom: 0; }
        .ck-items-edit-mobile { display: inline-block; margin-top: 14px; }
      }
      .ck-item-list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
      /* Escritorio con más de 4 productos: la lista tiene alto máximo y se recorre dentro de la tarjeta */
      .ck-items[data-scroll='true'] .ck-item-list { max-height: 420px; overflow-y: auto; overscroll-behavior: contain; padding-right: 8px; }
      .ck-items[data-scroll='true'] .ck-item-list:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: 6px; }
      .ck-item { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: 12px; align-items: start; padding: 14px 0; border-top: 1px solid var(--color-divider); }
      .ck-item:first-child { padding-top: 0; border-top: none; }
      .ck-item-img { position: relative; width: 64px; height: 64px; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--color-bg-main); border: 1px solid var(--color-divider); box-sizing: border-box; }
      .ck-item-info { min-width: 0; }
      .ck-item-name { margin: 0; font-size: var(--text-ui); font-weight: 600; line-height: 1.35; color: var(--color-text-primary); overflow-wrap: anywhere; }
      .ck-item-meta { margin: 2px 0 0; font-size: var(--text-caption); line-height: 1.4; color: var(--color-text-secondary); overflow-wrap: anywhere; }
      .ck-item-problem { display: flex; gap: 6px; margin: 4px 0 0; font-size: var(--text-caption); font-weight: 600; line-height: 1.4; color: var(--brand-red); }
      .ck-pill-link { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 9999px; background: var(--color-primary-subtle); color: var(--color-primary); font-size: var(--text-caption); font-weight: 600; text-decoration: none; }
      .ck-pill-link:hover { text-decoration: underline; }
      .ck-item-price { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; text-align: right; }
      .ck-item-total { font-size: var(--text-ui); font-weight: 700; color: var(--color-text-primary); white-space: nowrap; }
      .ck-item-unit { font-size: var(--text-caption); color: var(--color-text-secondary); white-space: nowrap; }
      @media (max-width: 400px) {
        .ck-item { grid-template-columns: 56px minmax(0, 1fr) auto; gap: 10px; }
        .ck-item-img { width: 56px; height: 56px; }
      }

      /* ── Cupón ── */
      .ck-coupon { margin-bottom: 18px; padding: 14px; border: 1px solid var(--color-divider); border-radius: var(--radius-control); background: var(--color-bg-main); }
      .ck-coupon-label { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: var(--text-small); font-weight: 600; color: var(--color-text-primary); }
      .ck-coupon-label svg { color: var(--color-primary); }
      .ck-coupon-row { display: flex; gap: 8px; }
      .ck-coupon-row .ck-input { flex: 1 1 auto; min-width: 0; min-height: 44px; padding-top: 9px; padding-bottom: 9px; }
      .ck-coupon-input:not(:placeholder-shown) { text-transform: uppercase; }
      .ck-btn-sm { flex-shrink: 0; min-height: 44px; padding: 0 18px; border-radius: var(--radius-control); font-family: inherit; font-size: var(--text-ui); font-weight: 600; white-space: nowrap; cursor: pointer; }
      .ck-btn-sm:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
      .ck-btn-sm[data-kind='primary'] { border: none; background: var(--color-primary); color: #fff; }
      .ck-btn-sm[data-kind='primary']:hover:not(:disabled) { background: var(--color-primary-hover); }
      .ck-btn-sm[data-kind='primary']:disabled { background: var(--color-divider); color: var(--color-text-secondary); cursor: not-allowed; }
      .ck-btn-sm[data-kind='secondary'] { border: 1px solid var(--color-border); background: #fff; color: var(--color-text-secondary); }
      .ck-coupon-ok { display: flex; gap: 6px; align-items: flex-start; margin: 8px 0 0; font-size: var(--text-small); font-weight: 600; line-height: 1.4; color: #2E7D32; }

      /* ── Desglose y total ── */
      .ck-rows { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; }
      .ck-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: var(--text-ui); color: var(--color-text-primary); }
      .ck-row dt, .ck-row dd { margin: 0; }
      .ck-row dd { text-align: right; }
      .ck-row[data-tone='discount'] { color: #2E7D32; font-weight: 600; }
      .ck-row dt { flex: 1 1 auto; min-width: 0; }
      .ck-row dd { flex: 0 0 auto; white-space: nowrap; }
      .ck-row-sub { display: block; margin-top: 2px; font-size: var(--text-caption); font-weight: 400; line-height: 1.4; color: var(--color-text-secondary); }
      .ck-strike { margin-right: 8px; color: var(--color-text-secondary); text-decoration: line-through; }
      .ck-free { display: inline-block; padding: 2px 8px; border-radius: 9999px; background: var(--color-green-subtle); color: #2E7D32; font-size: var(--text-small); font-weight: 700; }
      .ck-total { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--color-divider); }
      .ck-total-label { font-size: var(--text-h4); font-weight: 700; color: var(--color-text-primary); }
      .ck-total-amount { font-family: var(--font-heading); font-size: var(--text-h2); font-weight: 700; line-height: 1.15; letter-spacing: var(--tracking-heading); color: var(--color-primary); }

      /* ── Avisos, términos y botón principal ── */
      .ck-banner { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; padding: 12px 14px; border-radius: var(--radius-control); background: #FFF0F0; border: 1px solid #FFCDD2; color: #C62828; font-size: var(--text-small); line-height: 1.45; }
      .ck-banner-top { margin-top: 0; margin-bottom: 16px; }
      .ck-banner svg { flex-shrink: 0; margin-top: 2px; }
      .ck-banner-body { flex: 1 1 auto; min-width: 0; }
      .ck-banner-retry { flex-shrink: 0; padding: 6px 12px; border: 1px solid #FFCDD2; border-radius: 8px; background: #fff; color: #C62828; font-family: inherit; font-size: var(--text-small); font-weight: 600; cursor: pointer; white-space: nowrap; }
      .ck-terms { margin: 16px 0 12px; font-size: var(--text-caption); line-height: 1.5; color: var(--color-text-secondary); text-align: center; }
      .ck-terms a { color: var(--color-primary); text-decoration: underline; }
      .ck-cta { display: flex; align-items: center; justify-content: center; gap: 10px; box-sizing: border-box; width: 100%; min-height: 52px; padding: 14px 18px; border: none; border-radius: var(--radius-control); background: var(--color-primary); color: #fff; font-family: inherit; font-size: 16px; font-weight: 600; line-height: 1.2; cursor: pointer; box-shadow: var(--shadow-button); transition: background var(--transition-fast); }
      .ck-cta:hover:not(:disabled) { background: var(--color-primary-hover); }
      .ck-cta:focus-visible { outline: 3px solid var(--color-blue-bright); outline-offset: 2px; }
      .ck-cta:disabled { background: var(--color-divider); color: var(--color-text-secondary); box-shadow: none; cursor: not-allowed; }
      .ck-cta[data-loading='true']:disabled { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-button); cursor: progress; }
      .ck-spinner { flex-shrink: 0; width: 18px; height: 18px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 9999px; animation: ck-spin 0.8s linear infinite; }
      @keyframes ck-spin { to { transform: rotate(360deg); } }
      .ck-footnote { display: flex; gap: 8px; align-items: flex-start; margin: 12px 0 0; font-size: var(--text-caption); line-height: 1.45; color: var(--color-text-secondary); }
      .ck-footnote svg { flex-shrink: 0; margin-top: 1px; }

      @media (prefers-reduced-motion: reduce) {
        .ck-input, .ck-pay-tile, .ck-cta, .ck-items-chevron { transition: none; }
        .ck-spinner { animation-duration: 2.4s; }
      }
    `}</style>
  )
}
