// AUPA AB — Klaro! CMP configuration.
// V1 stance: zero third-party cookies. Plausible is cookieless and exempt under
// CNIL guidance — loaded directly in BaseLayout, no consent needed.
// Klaro is here for transparency/UI (Préférences cookies link) and is wired up
// for V2 when Google AdSense / GA4 arrive.
//
// IMPORTANT: services use the `callback` (function) form, not `onAccept` (string),
// because our CSP forbids `unsafe-eval` — Klaro's string callbacks rely on `new Function()`.
//
// This file is .js (not .ts) on purpose: astro-check OOMs on the deep literal
// structure (heap > 4GB). Runtime contract is enforced by Klaro.
// Docs: https://klaro.org

export const klaroConfig = {
  version: 1,
  elementID: 'klaro',
  cookieName: 'klaro',
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  noticeAsModal: false,
  privacyPolicy: '/confidentialite',
  translations: {
    fr: {
      consentModal: {
        title: 'Préférences de confidentialité',
        description:
          "AUPA AB est un site sans publicité ni traceur tiers en V1. La seule mesure d'audience utilisée est anonyme et sans cookie.",
      },
      consentNotice: {
        description:
          "AUPA AB n'utilise aucun cookie tiers en V1. {purposes} fonctionnent en mode anonyme.",
        learnMore: 'En savoir plus',
      },
      purposes: {
        analytics: 'Analytics anonymes',
        marketing: 'Publicité (V2)',
        functional: 'Fonctionnel',
      },
      ok: 'Tout accepter',
      acceptAll: 'Tout accepter',
      acceptSelected: 'Valider la sélection',
      decline: 'Refuser',
      close: 'Fermer',
      poweredBy: 'Réalisé avec Klaro',
      service: {
        disableAll: { title: 'Refuser tout', description: 'Désactive tous les services optionnels.' },
        required: { title: 'Toujours actif', description: 'Indispensable au fonctionnement du site.' },
      },
    },
  },
  services: [
    {
      name: 'plausible',
      title: 'Plausible Analytics',
      description:
        "Mesure d'audience anonyme, sans cookie ni identifiant individuel. Conforme RGPD sans consentement strict — toujours active.",
      purposes: ['analytics'],
      required: true,
      cookies: [],
    },
    // V2 services pre-declared but commented — uncomment when wiring:
    // { name: 'google-analytics', title: 'Google Analytics 4', purposes: ['analytics'], cookies: [/^_ga/, /^_gid/] },
    // { name: 'adsense', title: 'Google AdSense', purposes: ['marketing'], cookies: [/^__gads/, /^IDE/, /^test_cookie/] },
  ],
};
