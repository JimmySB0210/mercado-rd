#!/usr/bin/env node
// ============================================================
// MercadoRD — Chequeo: toda página pública debe incluir <Navbar />
// Ruta: scripts/check-navbar.js
// ============================================================
// No hay layout.tsx compartido bajo app/ que inyecte <Navbar />
// automáticamente — cada page.tsx la importa y renderiza a mano. Este
// script es la red de seguridad de bajo riesgo en vez de mover 23
// archivos a un route group: recorre todo page.tsx bajo src/app,
// excluye las categorías con chrome propio (admin, dashboard,
// ProductForm sin chrome, auth, coming-soon) y falla si alguna de las
// páginas públicas restantes no contiene el string '<Navbar'.
//
// Limitación conocida y aceptada: solo mira el contenido del propio
// page.tsx, no sigue componentes hijos. Hoy las 23 páginas públicas
// renderizan <Navbar /> directamente, así que esto no da falsos
// negativos — si una página futura la renderiza solo indirectamente
// (vía un *Content.tsx), este chequeo la marcaría como faltante y
// habría que decidir entonces si ajustar el script o la página.
// ============================================================

const fs = require('fs')
const path = require('path')

const APP_DIR = path.join(__dirname, '..', 'src', 'app')

// Prefijos de ruta (relativos a src/app/) con chrome propio — no
// necesitan <Navbar />.
const EXCLUDED_PREFIXES = [
  'admin/',      // AdminSidebar
  'dashboard/',  // DashboardSidebar (o, en los 2 casos de ProductForm, sin chrome alguno)
]

// Páginas individuales sin chrome de sitio, a propósito.
const EXCLUDED_FILES = new Set([
  'login/page.tsx',
  'register/page.tsx',
  'recuperar-password/page.tsx',
  'restablecer-password/page.tsx',
  'vendor/register/page.tsx',
  'coming-soon/page.tsx',
])

function findPageFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findPageFiles(fullPath))
    } else if (entry.isFile() && entry.name === 'page.tsx') {
      results.push(fullPath)
    }
  }
  return results
}

function isExcluded(relativePath) {
  if (EXCLUDED_FILES.has(relativePath)) return true
  return EXCLUDED_PREFIXES.some(prefix => relativePath.startsWith(prefix))
}

function main() {
  const allPages = findPageFiles(APP_DIR)
  const checked = []
  const missing = []

  for (const absPath of allPages) {
    const relativePath = path.relative(APP_DIR, absPath).split(path.sep).join('/')
    if (isExcluded(relativePath)) continue

    checked.push(relativePath)
    const content = fs.readFileSync(absPath, 'utf8')
    if (!content.includes('<Navbar')) {
      missing.push(relativePath)
    }
  }

  console.log(`[check-navbar] ${allPages.length} page.tsx encontrados, ${checked.length} requieren <Navbar />, ${allPages.length - checked.length} excluidos.`)

  if (missing.length > 0) {
    console.error('\n[check-navbar] FALLÓ — a las siguientes páginas les falta <Navbar />:')
    for (const file of missing) console.error(`  - src/app/${file}`)
    console.error('\nSi la página realmente no debe tener Navbar (tiene su propio chrome), agrégala a EXCLUDED_PREFIXES o EXCLUDED_FILES en scripts/check-navbar.js.')
    process.exit(1)
  }

  console.log('[check-navbar] OK — todas las páginas públicas incluyen <Navbar />.')
}

main()
