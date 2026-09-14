// ============================================================
// MercadoRD — i18n: namespace "support" (français)
// Ruta: src/lib/i18n/fr/support.ts
// ============================================================

import type { SupportDict } from '@/lib/i18n/es/support'

export const support = {
  breadcrumbHome: 'Accueil',
  breadcrumbCurrent: 'Assistance',
  pageTitle: 'Assistance client',
  pageSubtitle: 'Dites-nous ce qui est arrivé et nous vous aiderons par WhatsApp.',
  whatIsYourProblemLabel: 'Quel est votre problème ?',

  categoryDamagedTitle: 'Produits endommagés ou cassés',
  categoryWrongItemTitle: 'Commandes incomplètes ou erronées',
  categoryNotAsDescribedTitle: 'Différences avec la description',
  categoryDisputeTitle: 'Déposer un litige commercial',
  categoryHiddenChargesTitle: 'Frais cachés',

  scheduleBanner: 'Nous répondons du lundi au samedi, 9h–18h. Délai de réponse : moins de 2 heures en horaires ouvrables.',

  fullNameLabel: 'Nom complet',
  fullNamePlaceholder: 'Votre nom complet',
  fullNameRequiredError: 'Saisissez votre nom complet.',
  orderNumberLabel: 'Numéro de commande',
  orderNumberOptionalSuffix: '(optionnel)',
  orderNumberPlaceholder: '#RD-XXXXXXXX',
  issueTypeLabel: 'Type de problème',
  descriptionLabel: 'Description du problème',
  descriptionPlaceholder: 'Décrivez en détail ce qui est arrivé (minimum {min} caractères)',
  descriptionCounter: '{count}/{min} caractères minimum',
  descriptionRequiredError: 'Décrivez votre problème avec au moins {min} caractères.',
  submitButton: 'Envoyer via WhatsApp',

  issueNotReceived: "Je n'ai pas reçu ma commande",
  issueDamaged: 'Le produit est arrivé endommagé',
  issueCancelOrder: 'Je veux annuler ma commande',
  issuePaymentProblem: 'Problème de paiement',
  issueHiddenCharges: 'Frais cachés sur ma commande',
  issueProductQuestion: "J'ai une question sur un produit",
  issueOther: 'Autre',

  whatsappGreeting: "Bonjour MercadoRD, j'ai besoin d'aide 🛒",
  whatsappNameLabel: 'Nom',
  whatsappOrderLabel: 'Commande',
  whatsappNoOrderNumber: 'Sans numéro de commande',
  whatsappIssueLabel: 'Problème',
  whatsappDescriptionLabel: 'Description',
} satisfies SupportDict
