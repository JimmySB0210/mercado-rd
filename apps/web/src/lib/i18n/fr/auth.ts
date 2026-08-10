// ============================================================
// MercadoRD — i18n: namespace "auth" (français)
// Ruta: src/lib/i18n/fr/auth.ts
// ============================================================

import type { AuthDict } from '@/lib/i18n/es/auth'

export const auth = {
  subtitleLogin: 'Connectez-vous à votre compte',
  subtitleRegister: 'Créez votre compte gratuit',

  inactivityBanner: 'Votre session a été fermée automatiquement pour cause d\'inactivité. Reconnectez-vous pour continuer.',

  continueWithGoogle: 'Continuer avec Google',
  connecting: 'Connexion...',
  orContinueWith: 'ou continuez avec',

  emailLabel: 'Adresse e-mail',
  emailPlaceholder: 'votremail@exemple.com',
  passwordLabel: 'Mot de passe',
  passwordPlaceholder: '••••••••',

  loginButton: 'Se connecter',
  loggingIn: 'Connexion en cours...',
  noAccountYet: "Vous n'avez pas de compte ?",
  registerFreeLink: 'Inscrivez-vous gratuitement',
  demoAccountsTitle: 'Comptes de démonstration :',

  fullNameLabel: 'Nom complet',
  fullNamePlaceholder: 'Votre prénom et nom',
  phoneLabel: 'Téléphone',
  phoneOptional: '(facultatif)',
  phonePlaceholder: '809-555-0000',
  registerPasswordPlaceholder: 'Au moins 6 caractères',
  confirmPasswordLabel: 'Confirmer le mot de passe',
  confirmPasswordPlaceholder: 'Répétez votre mot de passe',
  acceptTermsPrefix: "J'accepte les",
  termsOfServiceLink: "Conditions d'utilisation",
  andConnector: 'et la',
  privacyPolicyLink: 'Politique de confidentialité',
  createAccountButton: 'Créer un compte',
  creatingAccount: 'Création du compte...',
  alreadyHaveAccount: 'Vous avez déjà un compte ?',
  loginLink: 'Se connecter',

  accountCreatedTitle: 'Compte créé !',
  checkEmailPrefix: 'Vérifiez votre e-mail',
  checkEmailSuffix: 'pour confirmer votre compte, puis connectez-vous.',
  goToLoginLink: 'Aller à la connexion',

  invalidCredentials: 'E-mail ou mot de passe incorrect',
  genericLoginError: 'Erreur lors de la connexion',
  googleSignInErrorLogin: 'Impossible de se connecter. Réessayez.',
  googleSignInErrorRegister: 'Impossible de continuer. Réessayez.',
  passwordMismatch: 'Les mots de passe ne correspondent pas',
  passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
  mustAcceptTerms: "Vous devez accepter les Conditions d'utilisation et la Politique de confidentialité",
  completeCaptcha: 'Complétez la vérification de sécurité',
  captchaFailed: 'Échec de la vérification de sécurité. Réessayez.',
  emailAlreadyRegistered: 'Cet e-mail est déjà enregistré',
} satisfies AuthDict
