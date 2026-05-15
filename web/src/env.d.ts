/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_MEILISEARCH_URL: string;
  readonly PUBLIC_MEILISEARCH_SEARCH_KEY: string;
  readonly PUBLIC_CLOUDINARY_CLOUD_NAME: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN: string;
  readonly PUBLIC_ADSENSE_CLIENT: string;
  readonly PUBLIC_GA4_ID: string;

  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly MEILISEARCH_ADMIN_KEY: string;
  readonly ANTHROPIC_API_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly NEWSLETTER_FROM: string;
  readonly NEWSLETTER_REPLY_TO: string;
  readonly CLOUDINARY_API_KEY: string;
  readonly CLOUDINARY_API_SECRET: string;
  readonly RECAPTCHA_SECRET: string;
  readonly ADSENSE_ENABLED: string;
  readonly SENTRY_DSN: string;
  readonly CRON_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
