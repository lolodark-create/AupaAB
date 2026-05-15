# AUPA AB

![CI](https://github.com/REPLACE-WITH-YOUR-ORG/aupa-ab/actions/workflows/ci.yml/badge.svg)

Agrégateur d'actualités non-officiel de l'Aviron Bayonnais. Conçu sobrement, lu en mobile, fait par et pour les supporters.

> **Site non-officiel.** Aucun lien juridique avec l'Aviron Bayonnais. Les articles agrégés sont des extraits courts (≤ 350 caractères) accompagnés d'un lien vers la source originale. Les éditeurs peuvent demander le retrait via `/contact-retrait`.

## Statut

**V1 en construction.** Découpage du périmètre :

- **V1** (cible 10-12 j-dev) — lecture publique, crawler RSS, recherche Postgres FTS, RGPD. Pas de comptes, pas de commentaires, pas d'ads.
- **V1.5** — comptes Supabase Auth (Google + magic link), articles sauvegardés, profils publics.
- **V2** — commentaires modérés (Anthropic Haiku), AdSense, dashboard admin, éventuel passage à MeiliSearch.

Détail : voir [`docs/roadmap-v1-v2.md`](docs/roadmap-v1-v2.md) et [`docs/backlog.md`](docs/backlog.md).

## Structure

```
.
├── web/         # Application Astro 5 (front + API routes)
├── crawler/     # Service Node : RSS → Postgres
├── supabase/    # Migrations SQL + seed
├── shared/      # Types TS + mock data partagés
├── docs/        # Roadmap, audit prototype, backlog
└── Aupa AB/     # Briefs, prototype React + screenshots (référentiel design)
```

Le dossier `Aupa AB/` contient les briefs originaux (dev + design) et le prototype hi-fi en React UMD qui sert de référentiel visuel. **Ne pas le modifier — c'est la source de vérité du design.**

## Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Front | **Astro 5** + Tailwind + TypeScript | SSG/ISR éditorial, islands minimaux |
| Adapter prod | `@astrojs/vercel` (alt : `@astrojs/node`) | `ADAPTER=node` pour self-host |
| DB | **Supabase Postgres 15** + RLS exhaustive | Free tier confort, auth pour V1.5 |
| Search | **Postgres FTS** (V1) — `pg_trgm` + `unaccent` | Pas de service tiers tant que < 5 k articles |
| Crawler | Node 22 + `rss-parser` + `node-cron` | Process séparé, healthcheck, Docker |
| Tests crawler | Vitest 100 % coverage sur fonctions pures | Brief §16.2 |

## Prérequis

- Node 22+
- npm 10+ (ou pnpm — adapter les commandes)
- Docker (uniquement pour le crawler Dockerfile et Supabase local optionnel)
- Compte Supabase (cloud ou via `supabase` CLI en local)

## Setup local

### Web

```bash
cd web
cp .env.example .env.local
# remplir PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY (depuis Supabase project settings)
npm install
npm run dev          # http://localhost:4321
```

### Crawler

```bash
cd crawler
cp .env.example .env
# remplir SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm test             # tests Vitest, 100% coverage attendu sur les fonctions pures
npm run run-once     # un cycle complet, utile pour debug
npm run dev          # cron en watch
```

### Supabase

```bash
# avec Supabase CLI (https://supabase.com/docs/guides/cli)
supabase start
supabase db reset    # applique les migrations + seed
```

Sans CLI : créer un projet sur supabase.com, exécuter les fichiers `supabase/migrations/*.sql` dans l'ordre via l'éditeur SQL.

## Commandes utiles

| Commande | Effet |
|---|---|
| `cd web && npm run dev` | Astro dev server sur :4321 |
| `cd web && npm run build` | Build prod (adapter selon `ADAPTER` env var) |
| `cd web && npm run check` | Astro check + TypeScript |
| `cd web && npm run test:e2e` | Playwright (7 scénarios × 2 viewports) |
| `cd crawler && npm test` | Tests unitaires + coverage |
| `cd crawler && npm run run-once` | Un cycle de crawl (debug) |
| `supabase db reset` | Reset DB locale + applique migrations + seed |

## CI

Toutes les PR sont validées par `.github/workflows/ci.yml` :

- **web** — `astro check` (0 erreur) + build prod (Vercel adapter)
- **crawler** — Vitest avec **100% coverage** sur les 5 fonctions pures (53 tests)
- **e2e** — Playwright sur chromium + mobile Pixel 5 (14 tests, mock-api fallback, aucun secret requis)
- **lighthouse** — Audit perf/a11y/SEO sur home, /actu, /article (informationnel)

Les browsers Playwright sont mis en cache GitHub par hash du `package-lock.json` pour des runs CI rapides.

## Conformité éditoriale

- **350 caractères max** d'extrait, CHECK constraint en DB. Ne jamais bypass.
- **CTA sortant** systématique avec `target="_blank" rel="noopener noreferrer"`.
- **RSS uniquement.** Pas de scraping. Si un éditeur n'a pas de flux, on n'ingère pas.
- **User-Agent identifié** : `AUPA-AB-Crawler/0.1 (+https://aupa-ab.fr/sources)` — tout éditeur peut nous bloquer s'il le souhaite.
- **Domain blocklist** : table dédiée, le crawler la consulte avant chaque run.
- **Processus retrait** : formulaire `/contact-retrait` + table `takedown_requests` + email DPO automatique. Réponse < 24 h ouvrées.
- **Mention "non-officiel"** sur l'accueil et le footer.

## Sécurité

- HTTPS partout, HSTS forcé via middleware.
- CSP strict (Cloudinary + Plausible whitelisted), X-Frame-Options DENY.
- RLS Postgres exhaustive table par table (voir `0002_rls.sql`).
- Rate limiting via table `api_rate_limit`.
- Pas de service-role key côté client (jamais).
- Secrets en env vars uniquement, jamais committés.

## RGPD

- Pas de cookie tiers en V1. Plausible Analytics sans cookie, agrégat anonyme.
- CMP Klaro intégré (à activer en V2 quand les ads arrivent).
- Pages obligatoires : `/mentions-legales`, `/confidentialite`, `/cgu`, `/charte`, `/cookies`.
- Droits utilisateur (V1.5+) : export JSON, suppression compte.

## Déploiement (V1)

- **Front** : Vercel (recommandé) ou Node sur Railway/Fly/VPS.
- **Crawler** : Railway / Fly.io / VPS (Dockerfile fourni). Healthcheck `/health`.
- **DB** : Supabase Cloud (free tier).

```bash
# Web sur Vercel
cd web && vercel --prod

# Crawler sur Railway
cd crawler && railway up
```

## Contribuer

Voir [`docs/backlog.md`](docs/backlog.md). Une tâche = un PR. Garder les PR sous 400 lignes.

## Licence

À définir. Les contenus agrégés appartiennent à leurs éditeurs respectifs ; le code AUPA AB sera publié sous licence open source à confirmer.
