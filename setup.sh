#!/bin/bash
# ═══════════════════════════════════════════════════════════
# MercadoRD — Script de inicialización para Mac M1
# Uso: chmod +x setup.sh && ./setup.sh
# ═══════════════════════════════════════════════════════════

set -e  # Detener si hay error

echo ""
echo "🇩🇴 MercadoRD — Configuración inicial"
echo "════════════════════════════════════════"
echo ""

# ─── 1. Verificar requisitos ─────────────────────────────────
echo "✅ Verificando requisitos..."

command -v node  >/dev/null || { echo "❌ Node.js no encontrado. Instala desde nodejs.org"; exit 1; }
command -v git   >/dev/null || { echo "❌ Git no encontrado. Instala desde git-scm.com";   exit 1; }
command -v npm   >/dev/null || { echo "❌ npm no encontrado.";                              exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Necesitas Node.js 18+. Versión actual: $(node -v)"
  exit 1
fi

echo "   Node.js: $(node -v) ✓"
echo "   npm:     $(npm -v) ✓"
echo "   Git:     $(git --version | cut -d' ' -f3) ✓"
echo ""

# ─── 2. Instalar dependencias ────────────────────────────────
echo "📦 Instalando dependencias..."
npm install
echo ""

# ─── 3. Configurar .env.local ────────────────────────────────
if [ ! -f "apps/web/.env.local" ]; then
  cp .env.example apps/web/.env.local
  echo "📄 Creado apps/web/.env.local desde .env.example"
  echo "   ⚠️  Edita apps/web/.env.local con tus claves de Supabase"
else
  echo "📄 apps/web/.env.local ya existe — no sobreescrito"
fi
echo ""

# ─── 4. Inicializar git ───────────────────────────────────────
if [ ! -d ".git" ]; then
  echo "🔧 Inicializando repositorio Git..."
  git init
  git add .
  git commit -m "feat: MercadoRD — setup inicial del proyecto"
  echo "   ✅ Repositorio Git creado con commit inicial"
  echo ""
  echo "   Próximo paso — conectar con GitHub:"
  echo "   1. Ve a github.com y crea un repo llamado 'mercado-rd'"
  echo "   2. Copia la URL del repo (ej: https://github.com/tuusuario/mercado-rd.git)"
  echo "   3. Ejecuta:"
  echo "      git remote add origin TU_URL_DE_GITHUB"
  echo "      git push -u origin main"
else
  echo "✅ Repositorio Git ya inicializado"
fi
echo ""

# ─── 5. Verificar Supabase CLI (opcional) ────────────────────
if command -v supabase >/dev/null; then
  echo "🐘 Supabase CLI detectado: $(supabase --version)"
else
  echo "💡 Tip: instala Supabase CLI para desarrollo local:"
  echo "   brew install supabase/tap/supabase"
fi
echo ""

echo "════════════════════════════════════════"
echo "🎉 ¡Listo! Para correr la app web:"
echo ""
echo "   npm run dev:web"
echo ""
echo "   Luego abre: http://localhost:3000"
echo "════════════════════════════════════════"
echo ""
