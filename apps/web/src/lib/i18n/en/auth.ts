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

  forgotPasswordLink: 'Forgot your password?',
  passwordResetSuccessBanner: 'Password updated. Log in with your new password.',

  forgotPasswordSubtitle: 'Recover your password',
  forgotPasswordInstructions: "Enter your email and we'll send you a link to reset your password.",
  sendResetLinkButton: 'Send reset link',
  sendingResetLink: 'Sending...',
  resetLinkSentTitle: 'Check your email!',
  resetLinkSentPrefix: 'We sent a link to',
  resetLinkSentSuffix: 'so you can reset your password.',
  resetLinkError: "Couldn't send the link. Try again.",
  googleUsersNote: 'If you signed up with Google, you don\'t need a password — use the "Continue with Google" button instead.',

  resetPasswordSubtitle: 'Create a new password',
  resetPasswordButton: 'Reset password',
  resettingPassword: 'Resetting...',
  passwordResetFailed: "Couldn't update the password. Try again.",
  invalidOrExpiredLinkMessage: 'This recovery link is no longer valid. Request a new one from the login page.',
} satisfies AuthDict
