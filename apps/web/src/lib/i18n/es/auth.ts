// ============================================================
// MercadoRD — i18n: namespace "auth" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/auth.ts
// ============================================================
// Texto de app/login/page.tsx y app/register/page.tsx: formulario,
// login social (solo Google — Facebook está deshabilitado temporalmente,
// pendiente verificación empresarial con Meta), banner de inactividad,
// pantalla de "revisa tu correo", y los mensajes de error de Supabase
// Auth que el código ya intercepta y traduce a español (no los que
// pasan tal cual desde Supabase — esos son de un sistema externo).
// ============================================================

export const auth = {
  // Encabezados
  subtitleLogin: 'Inicia sesión en tu cuenta',
  subtitleRegister: 'Crea tu cuenta gratis',

  // Banner de sesión cerrada por inactividad (login)
  inactivityBanner: 'Tu sesión cerró automáticamente por inactividad. Inicia sesión de nuevo para continuar.',

  // Login social
  continueWithGoogle: 'Continuar con Google',
  connecting: 'Conectando...',
  orContinueWith: 'o continúa con',

  // Campos compartidos
  emailLabel: 'Correo electrónico',
  emailPlaceholder: 'tucorreo@ejemplo.com',
  passwordLabel: 'Contraseña',
  passwordPlaceholder: '••••••••',

  // Login
  loginButton: 'Iniciar sesión',
  loggingIn: 'Iniciando sesión...',
  noAccountYet: '¿No tienes cuenta?',
  registerFreeLink: 'Regístrate gratis',
  demoAccountsTitle: 'Cuentas de prueba:',

  // Registro
  fullNameLabel: 'Nombre completo',
  fullNamePlaceholder: 'Tu nombre y apellido',
  phoneLabel: 'Teléfono',
  phoneOptional: '(opcional)',
  phonePlaceholder: '809-555-0000',
  registerPasswordPlaceholder: 'Mínimo 6 caracteres',
  confirmPasswordLabel: 'Confirmar contraseña',
  confirmPasswordPlaceholder: 'Repite tu contraseña',
  acceptTermsPrefix: 'Acepto los',
  termsOfServiceLink: 'Términos de Servicio',
  andConnector: 'y la',
  privacyPolicyLink: 'Política de Privacidad',
  createAccountButton: 'Crear cuenta',
  creatingAccount: 'Creando cuenta...',
  alreadyHaveAccount: '¿Ya tienes cuenta?',
  loginLink: 'Inicia sesión',

  // Pantalla "revisa tu correo"
  accountCreatedTitle: '¡Cuenta creada!',
  checkEmailPrefix: 'Revisa tu correo',
  checkEmailSuffix: 'para confirmar tu cuenta, luego inicia sesión.',
  goToLoginLink: 'Ir a iniciar sesión',

  // Errores interceptados de Supabase Auth (+ validación propia)
  invalidCredentials: 'Email o contraseña incorrectos',
  genericLoginError: 'Error al iniciar sesión',
  googleSignInErrorLogin: 'No se pudo iniciar sesión. Intenta de nuevo.',
  googleSignInErrorRegister: 'No se pudo continuar. Intenta de nuevo.',
  passwordMismatch: 'Las contraseñas no coinciden',
  passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
  mustAcceptTerms: 'Debes aceptar los Términos de Servicio y la Política de Privacidad',
  completeCaptcha: 'Completa la verificación de seguridad',
  captchaFailed: 'Verificación de seguridad fallida. Intenta de nuevo.',
  emailAlreadyRegistered: 'Este correo ya está registrado',
}

export type AuthDict = typeof auth
