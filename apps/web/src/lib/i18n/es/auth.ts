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

  // Registro
  fullNameLabel: 'Nombre completo',
  fullNamePlaceholder: 'Tu nombre y apellido',
  phoneLabel: 'Teléfono',
  phoneOptional: '(opcional)',
  phonePlaceholder: '809-555-1234',
  registerPasswordPlaceholder: 'Mínimo 8 caracteres',
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
  passwordRequirementsHint: 'Mínimo 8 caracteres, con mayúscula, minúscula y número.',
  passwordRequirementsError: 'La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula y número.',
  mustAcceptTerms: 'Debes aceptar los Términos de Servicio y la Política de Privacidad',
  completeCaptcha: 'Completa la verificación de seguridad',
  captchaFailed: 'Verificación de seguridad fallida. Intenta de nuevo.',
  captchaLoadError: 'No se pudo cargar la verificación de seguridad. Recarga la página o prueba con otro navegador.',
  emailAlreadyRegistered: 'Este correo ya está registrado',

  // Recuperar contraseña — app/login/page.tsx (link + banner de éxito)
  forgotPasswordLink: '¿Olvidaste tu contraseña?',
  passwordResetSuccessBanner: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',

  // app/recuperar-password/page.tsx
  forgotPasswordSubtitle: 'Recupera tu contraseña',
  forgotPasswordInstructions: 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.',
  sendResetLinkButton: 'Enviar enlace de recuperación',
  sendingResetLink: 'Enviando...',
  resetLinkSentTitle: '¡Revisa tu correo!',
  resetLinkSentPrefix: 'Si hay una cuenta con',
  resetLinkSentSuffix: ', te enviamos un enlace para restablecer tu contraseña.',
  resetLinkLatestNote: 'Si pides varios correos, solo funciona el último.',
  useAnotherEmailLink: 'Usar otro correo',
  resetLinkError: 'No se pudo enviar el enlace. Intenta de nuevo.',
  googleUsersNote: 'Si te registraste con Google, no necesitas contraseña — usa el botón "Continuar con Google" en su lugar.',

  // app/restablecer-password/page.tsx
  resetPasswordSubtitle: 'Crea una nueva contraseña',
  resetPasswordButton: 'Restablecer contraseña',
  resettingPassword: 'Restableciendo...',
  passwordResetFailed: 'No se pudo actualizar la contraseña. Intenta de nuevo.',
  passwordSameAsOld: 'La nueva contraseña debe ser distinta a la actual.',
  resetLinkChecking: 'Verificando el enlace...',
  resetLinkInvalidTitle: 'Este enlace no se puede usar',
  resetLinkInvalidBody: 'Ya se usó, venció o lo reemplazó un correo más nuevo.',
  resetLinkInvalidHelp: 'Pide un enlace nuevo y abre el último correo que recibas.',
  requestNewLinkButton: 'Pedir un nuevo enlace',

  // Reenviar correo — components/auth/ResendEmailButton.tsx, usado en
  // recuperar-password, register y login (cuenta sin confirmar)
  emailNotArrivingTip: '¿No llega? Revisa spam o promociones y confirma que escribiste bien tu correo.',
  resendEmailButton: 'Reenviar correo',
  resendEmailWait: 'Reenviar en {time}',
  resendingEmail: 'Reenviando...',
  resendEmailSent: 'Listo, te enviamos el correo de nuevo.',
  resendEmailFailed: 'No se pudo reenviar el correo. Intenta de nuevo.',
  emailRateLimited: 'Pediste varios correos seguidos. Espera un momento e inténtalo de nuevo.',
  emailNotConfirmedMessage: 'Aún no confirmas tu correo ({email}). Abre el enlace que te enviamos al registrarte o pide uno nuevo aquí.',
}

export type AuthDict = typeof auth
