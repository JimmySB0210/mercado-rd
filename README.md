# 🇩🇴 MercadoRD — El marketplace dominicano

Plataforma de comercio electrónico para República Dominicana. Conecta vendedores locales con compradores de las 32 provincias.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Web | Next.js 14 (App Router) + TypeScript |
| Mobile | React Native + Expo SDK 51 |
| Base de datos | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth |
| Pagos | Azul (RD) + CardNet |
| Notificaciones | WhatsApp Business API |
| Deploy web | Vercel |
| Deploy mobile | Expo EAS |

---

## 🚀 Configuración inicial (Mac M1)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/mercado-rd.git
cd mercado-rd
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example apps/web/.env.local
```

Abre `apps/web/.env.local` y completa con tus claves de Supabase, Azul y WhatsApp.

### 4. Correr en desarrollo

```bash
# Web
npm run dev:web

# Mobile (en otra terminal)
npm run dev:mobile
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🗄️ Base de datos (Supabase)

### Opción A — Supabase Cloud (recomendado)

1. Crea cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto llamado `mercadord`
3. Ve a **SQL Editor** y ejecuta el archivo `supabase/migrations/001_initial_schema.sql`
4. Copia las claves de **Settings → API** a tu `.env.local`

### Opción B — Supabase local

```bash
# Instalar Supabase CLI
brew install supabase/tap/supabase

# Iniciar base de datos local
supabase start

# Aplicar migraciones
supabase db reset
```

---

## 🌐 Deploy en Vercel (web)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel

# Configurar variables de entorno en Vercel Dashboard
# vercel.com → Tu proyecto → Settings → Environment Variables
```

---

## 📱 Build de la app móvil

```bash
# Instalar EAS CLI
npm i -g eas-cli

# Login en Expo
eas login

# Configurar proyecto
cd apps/mobile
eas build:configure

# Build para iOS (requiere cuenta Apple Developer $99/año)
eas build --platform ios

# Build para Android (requiere cuenta Google Play $25 único pago)
eas build --platform android
```

---

## 💳 Pagos con Azul

1. Solicita acceso de desarrollador en [azul.com.do](https://azul.com.do)
2. Usa el ambiente de **pruebas** con tarjeta `4111 1111 1111 1111`
3. Agrega tus credenciales al `.env.local`
4. En producción, cambia la URL en `src/lib/payments/azul.ts`

---

## 💬 WhatsApp Business API

1. Crea app en [developers.facebook.com](https://developers.facebook.com)
2. Activa WhatsApp Business API
3. Crea los templates en español (requieren aprobación de Meta ~24h)
4. Agrega `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_ID` al `.env.local`

---

## 📁 Estructura del proyecto

```
mercado-rd/
├── apps/
│   ├── web/                  # Next.js — sitio web principal
│   │   └── src/
│   │       ├── app/          # Rutas (App Router)
│   │       ├── components/   # Componentes React
│   │       ├── lib/          # Supabase, pagos, WhatsApp, store
│   │       ├── hooks/        # Custom hooks
│   │       └── types/        # TypeScript types
│   └── mobile/               # React Native + Expo
│       └── src/
│           ├── screens/      # Pantallas de la app
│           ├── components/   # Componentes nativos
│           ├── hooks/        # Hooks de la app
│           └── lib/          # Supabase client, store
├── supabase/
│   ├── migrations/           # SQL migrations
│   └── functions/            # Edge Functions (WhatsApp, etc.)
├── .env.example              # Plantilla de variables de entorno
└── package.json              # Monorepo root
```

---

## 🤝 Contribuir

1. Crea un branch: `git checkout -b feature/nueva-funcionalidad`
2. Haz tus cambios
3. Commit: `git commit -m "feat: descripción del cambio"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request en GitHub

---

Hecho con 🇩🇴 en República Dominicana
