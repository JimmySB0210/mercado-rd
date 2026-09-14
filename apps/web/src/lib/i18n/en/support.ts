// ============================================================
// MercadoRD — i18n: namespace "support" (English)
// Ruta: src/lib/i18n/en/support.ts
// ============================================================

import type { SupportDict } from '@/lib/i18n/es/support'

export const support = {
  breadcrumbHome: 'Home',
  breadcrumbCurrent: 'Support',
  pageTitle: 'Customer support',
  pageSubtitle: "Tell us what happened and we'll help you over WhatsApp.",
  whatIsYourProblemLabel: "What's your problem?",

  categoryDamagedTitle: 'Damaged or broken products',
  categoryWrongItemTitle: 'Incomplete or wrong orders',
  categoryNotAsDescribedTitle: 'Differences from the description',
  categoryDisputeTitle: 'File a commercial dispute',
  categoryHiddenChargesTitle: 'Hidden charges',

  scheduleBanner: 'We reply Monday to Saturday, 9am–6pm. Response time: under 2 hours during business hours.',

  fullNameLabel: 'Full name',
  fullNamePlaceholder: 'Your full name',
  fullNameRequiredError: 'Enter your full name.',
  orderNumberLabel: 'Order number',
  orderNumberOptionalSuffix: '(optional)',
  orderNumberPlaceholder: '#RD-XXXXXXXX',
  issueTypeLabel: 'Type of issue',
  descriptionLabel: 'Description of the issue',
  descriptionPlaceholder: 'Tell us in detail what happened (minimum {min} characters)',
  descriptionCounter: '{count}/{min} characters minimum',
  descriptionRequiredError: 'Describe your issue with at least {min} characters.',
  submitButton: 'Send via WhatsApp',

  issueNotReceived: "I didn't receive my order",
  issueDamaged: 'The product arrived damaged',
  issueCancelOrder: 'I want to cancel my order',
  issuePaymentProblem: 'Problem with payment',
  issueHiddenCharges: 'Hidden charges on my order',
  issueProductQuestion: 'I have a question about a product',
  issueOther: 'Other',

  whatsappGreeting: 'Hi MercadoRD, I need help 🛒',
  whatsappNameLabel: 'Name',
  whatsappOrderLabel: 'Order',
  whatsappNoOrderNumber: 'No order number',
  whatsappIssueLabel: 'Issue',
  whatsappDescriptionLabel: 'Description',
} satisfies SupportDict
