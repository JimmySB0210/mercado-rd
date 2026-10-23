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

  fullNameLabel: 'Nom complet',
  fullNamePlaceholder: 'Votre prénom et nom',
  phoneLabel: 'Téléphone',
  phoneOptional: '(facultatif)',
  phonePlaceholder: '809-555-1234',
  registerPasswordPlaceholder: 'Au moins 8 caractères',
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
  passwordRequirementsHint: 'Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.',
  passwordRequirementsError: 'Le mot de passe doit contenir au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.',
  mustAcceptTerms: "Vous devez accepter les Conditions d'utilisation et la Politique de confidentialité",
  completeCaptcha: 'Complétez la vérification de sécurité',
  captchaFailed: 'Échec de la vérification de sécurité. Réessayez.',
  captchaLoadError: 'Impossible de charger la vérification de sécurité. Rechargez la page ou essayez un autre navigateur.',
  emailAlreadyRegistered: 'Cet e-mail est déjà enregistré',

  forgotPasswordLink: 'Mot de passe oublié ?',
  passwordResetSuccessBanner: 'Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.',

  forgotPasswordSubtitle: 'Récupérez votre mot de passe',
  forgotPasswordInstructions: 'Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
  sendResetLinkButton: 'Envoyer le lien de récupération',
  sendingResetLink: 'Envoi en cours...',
  resetLinkSentTitle: 'Vérifiez votre e-mail !',
  resetLinkSentPrefix: "S'il existe un compte avec",
  resetLinkSentSuffix: ', nous avons envoyé un lien pour réinitialiser votre mot de passe.',
  resetLinkLatestNote: 'Si vous demandez plusieurs e-mails, seul le dernier fonctionne.',
  useAnotherEmailLink: 'Utiliser un autre e-mail',
  resetLinkError: "Impossible d'envoyer le lien. Réessayez.",
  googleUsersNote: 'Si vous vous êtes inscrit avec Google, vous n\'avez pas besoin de mot de passe — utilisez plutôt le bouton « Continuer avec Google ».',

  resetPasswordSubtitle: 'Créez un nouveau mot de passe',
  resetPasswordButton: 'Réinitialiser le mot de passe',
  resettingPassword: 'Réinitialisation...',
  passwordResetFailed: 'Impossible de mettre à jour le mot de passe. Réessayez.',
  passwordSameAsOld: "Le nouveau mot de passe doit être différent de l'actuel.",
  resetLinkChecking: 'Vérification du lien...',
  resetLinkInvalidTitle: 'Ce lien ne peut pas être utilisé',
  resetLinkInvalidBody: "Il a déjà été utilisé, il a expiré ou un e-mail plus récent l'a remplacé.",
  resetLinkInvalidHelp: 'Demandez un nouveau lien et ouvrez le dernier e-mail reçu.',
  requestNewLinkButton: 'Demander un nouveau lien',

  emailNotArrivingTip: "Rien reçu ? Vérifiez vos courriers indésirables ou promotions et assurez-vous d'avoir bien saisi votre e-mail.",
  resendEmailButton: "Renvoyer l'e-mail",
  resendEmailWait: 'Renvoyer dans {time}',
  resendingEmail: 'Renvoi...',
  resendEmailSent: "C'est fait, nous avons renvoyé l'e-mail.",
  resendEmailFailed: "Impossible de renvoyer l'e-mail. Réessayez.",
  emailRateLimited: 'Vous avez demandé plusieurs e-mails de suite. Patientez un instant et réessayez.',
  emailNotConfirmedMessage: "Vous n'avez pas encore confirmé votre e-mail ({email}). Ouvrez le lien envoyé lors de l'inscription ou demandez-en un nouveau ici.",
} satisfies AuthDict
