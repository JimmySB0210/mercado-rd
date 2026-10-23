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

  fullNameLabel: 'Full name',
  fullNamePlaceholder: 'Your first and last name',
  phoneLabel: 'Phone',
  phoneOptional: '(optional)',
  phonePlaceholder: '809-555-1234',
  registerPasswordPlaceholder: 'At least 8 characters',
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
  passwordRequirementsHint: 'At least 8 characters, with an uppercase letter, a lowercase letter and a number.',
  passwordRequirementsError: 'The password must have at least 8 characters, with an uppercase letter, a lowercase letter and a number.',
  mustAcceptTerms: 'You must accept the Terms of Service and Privacy Policy',
  completeCaptcha: 'Complete the security check',
  captchaFailed: 'Security check failed. Try again.',
  captchaLoadError: "We couldn't load the security check. Reload the page or try another browser.",
  emailAlreadyRegistered: 'This email is already registered',

  forgotPasswordLink: 'Forgot your password?',
  passwordResetSuccessBanner: 'Password updated. Log in with your new password.',

  forgotPasswordSubtitle: 'Recover your password',
  forgotPasswordInstructions: "Enter your email and we'll send you a link to reset your password.",
  sendResetLinkButton: 'Send reset link',
  sendingResetLink: 'Sending...',
  resetLinkSentTitle: 'Check your email!',
  resetLinkSentPrefix: 'If there is an account with',
  resetLinkSentSuffix: ", we've sent a link to reset your password.",
  resetLinkLatestNote: 'If you request several emails, only the latest one works.',
  useAnotherEmailLink: 'Use a different email',
  resetLinkError: "Couldn't send the link. Try again.",
  googleUsersNote: 'If you signed up with Google, you don\'t need a password — use the "Continue with Google" button instead.',

  resetPasswordSubtitle: 'Create a new password',
  resetPasswordButton: 'Reset password',
  resettingPassword: 'Resetting...',
  passwordResetFailed: "Couldn't update the password. Try again.",
  passwordSameAsOld: 'The new password must be different from your current one.',
  resetLinkChecking: 'Checking the link...',
  resetLinkInvalidTitle: "This link can't be used",
  resetLinkInvalidBody: 'It was already used, it expired, or a newer email replaced it.',
  resetLinkInvalidHelp: 'Request a new link and open the latest email you receive.',
  requestNewLinkButton: 'Request a new link',

  emailNotArrivingTip: "Not arriving? Check your spam or promotions folder and make sure you typed your email correctly.",
  resendEmailButton: 'Resend email',
  resendEmailWait: 'Resend in {time}',
  resendingEmail: 'Resending...',
  resendEmailSent: "Done, we've sent the email again.",
  resendEmailFailed: "Couldn't resend the email. Try again.",
  emailRateLimited: "You've requested several emails in a row. Wait a moment and try again.",
  emailNotConfirmedMessage: "You haven't confirmed your email yet ({email}). Open the link we sent when you signed up, or request a new one here.",
} satisfies AuthDict
