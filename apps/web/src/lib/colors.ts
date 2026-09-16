// ============================================================
// MercadoRD — Paleta oficial de marca
// ============================================================
// Fuente única de verdad para color en TODO el sitio, junto con
// :root en app/globals.css (que tiene el set completo, incluyendo los
// tonos que no tienen equivalente acá: --color-blue-deep,
// --color-blue-dark, --color-blue-bright, --color-yellow-cta,
// --color-bg-main, --color-bg-cream, --color-purple-deep,
// --color-purple-bright, --color-orange, --color-green).
//
// BRAND.blue/BRAND.red se mantienen como valores JS (no var() de CSS)
// porque cascan a cientos de usos sitewide vía `style={{color: BRAND.blue}}`
// y vía `--brand-blue`/`--brand-red` (CSS vars puestas en runtime desde
// estos mismos valores en layout.tsx y en los <main> de login/register/
// recuperar-password/restablecer-password) — deben tener EXACTAMENTE el
// mismo valor que --color-primary y --brand-red respectivamente en
// globals.css. Si cambias uno, cambia el otro.
export const BRAND = {
  blue:  '#0458B4', // = --color-primary (globals.css)
  red:   '#D2282D', // = --brand-red (mismo valor que alimenta la CSS var)
  bg:    '#FBFCFD', // = --color-bg-main (globals.css)
  dark:  '#131A18', // = --color-text-primary (globals.css)
  gray:  '#3D5361', // = --color-text-secondary (globals.css)
  green: '#00A86B', // = --color-green (globals.css)
} as const;
