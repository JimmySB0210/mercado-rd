// ============================================================
// MercadoRD — i18n: namespace "auth" (English)
// Ruta: src/lib/i18n/en/auth.ts
// ============================================================

import type { AuthDict } from '@/lib/i18n/es/auth'

export const auth = {
  subtitleLogin: 'Log in to your account',
  subtitleRegister: 'Create your free account',

  inactivityBanner: 'Your session was closed automatically due to inactivity. Log in again to continue.',

  continueWithGoogle: 'Continue with Google',
  connecting: 'Connecting...',
  orContinueWith: 'or continue with',

  emailLabel: 'Email address',
  emailPlaceholder: 'youremail@example.com',
  passwordLabel: 'Password',
  passwordPlaceholder: '••••••••',

  loginButton: 'Log in',
  loggingIn: 'Logging in...',
  noAccountYet: "Don't have an account?",
  registerFreeLink: 'Sign up for free',
  demoAccountsTitle: 'Demo accounts:',

  fullNameLabel: 'Full name',
  fullNamePlaceholder: 'Your first and last name',
  phoneLabel: 'Phone',
  phoneOptional: '(optional)',
  phonePlaceholder: '809-555-0000',
  registerPasswordPlaceholder: 'At least 6 characters',
  confirmPasswordLabel: 'Confirm password',
  confirmPasswordPlaceholder: 'Repeat your password',
  acceptTermsPrefix: 'I accept the',
  termsOfServiceLink: 'Terms of Service',
  andConnector: 'and the',
  privacyPolicyLink: 'Privacy Policy',
  createAccountButton: 'Create account',
  creatingAccount: 'Creating account...',
  alreadyHaveAccount: 'Already have an account?',
  loginLink: 'Log in',

  accountCreatedTitle: 'Account created!',
  checkEmailPrefix: 'Check your email',
  checkEmailSuffix: 'to confirm your account, then log in.',
  goToLoginLink: 'Go to login',

  invalidCredentials: 'Incorrect email or password',
  genericLoginError: 'Error logging in',
  googleSignInErrorLogin: "Couldn't log in. Try again.",
  googleSignInErrorRegister: "Couldn't continue. Try again.",
  passwordMismatch: "Passwords don't match",
  passwordTooShort: 'Password must be at least 6 characters',
  mustAcceptTerms: 'You must accept the Terms of Service and Privacy Policy',
  completeCaptcha: 'Complete the security check',
  captchaFailed: 'Security check failed. Try again.',
  emailAlreadyRegistered: 'This email is already registered',
} satisfies AuthDict
