# Roadmap AUPA AB — V1 / V1.5 / V2

Document de découpage du périmètre, à valider et tenir à jour. Source : brief dev + brief design + revue externe critique.

Principe : **livrer V1 vite, valider l'audience, puis empiler.**

---

## V1 — "Le lecteur" (10-12 j-dev)

**But** : un agrégateur lisible, rapide, conforme RGPD, déployable sans dépendre de Supabase Auth ni Anthropic.

### Stack V1
- **Front** : Astro 5 (latest stable) + Tailwind + adapter Vercel (alt : node pour self-host)
- **DB** : Supabase Postgres (le service auth est setup mais pas utilisé en V1)
- **Search** : **Postgres FTS** (`unaccent` + `pg_trgm`), pas MeiliSearch
- **Crawler** : Node + `rss-parser` + `node-cron`, **RSS strictement**
- **Images** : Cloudinary
- **Analytics** : Plausible (sans cookie, pas de bandeau requis si conforme CNIL)
- **CMP** : Klaro configuré mais minimal (seul Plausible activé, pas de cookies marketing en V1)

### Pages V1
- `/` — accueil éditorial (match banner, hero, à la une, sections catégorie, tribune statique)
- `/actu` — liste avec filtres catégorie/source/période + pagination cursor
- `/article/[slug]` — article (extrait + CTA sortant + related)
- `/recherche` — page dédiée + suggestions populaires (Postgres FTS)
- `/a-propos`, `/charte`, `/mentions-legales`, `/confidentialite`, `/cgu`, `/cookies`
- `/404`, `/500`, état hors-ligne
- `/sources` — liste publique des sources agrégées (transparence)

### API V1
- `GET /api/articles` — liste filtrée + paginée
- `GET /api/articles/[slug]` — détail
- `POST /api/articles/[id]/view` — compteur de vue (throttle IP)
- `GET /api/search?q=...` — Postgres FTS
- `GET /api/search/autocomplete?q=...` — suggestions
- `GET /api/sources` — liste sources actives
- `POST /api/takedown` — formulaire de demande de retrait par un éditeur source (déclenche email + log)

### Crawler V1
- `node-cron` toutes les 15 min, sources `is_active = true` uniquement
- `rss-parser` ; **aucun scraping**, jamais
- Filtre `isRelevantToAB` + `classifyArticle` + `generateExcerpt` (350 chars max, CHECK constraint en DB) + `generateSlug`
- Push vers `articles` + Postgres FTS index auto via trigger
- Génération vignette Cloudinary
- Log dans `crawl_runs`
- **Respect strict** : `robots.txt` (même via RSS), User-Agent identifié `AUPA-AB-Crawler/1.0 (+https://aupa-ab.fr/about)`, rate limit 1 req/2s par source

### Sécurité V1
- HTTPS + HSTS + CSP strict (script-src 'self' + Cloudinary + Plausible)
- Headers sécurité (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy)
- Validation Zod sur les params API
- Rate limiting `/api/*` via table Postgres ou Upstash
- RLS Postgres exhaustive table par table (cf. migrations)
- Pas de service-role key côté client, jamais

### RGPD V1
- Pages obligatoires (mentions, conf, CGU, charte, cookies)
- CMP Klaro avec consentement granulaire (mais V1 = uniquement Plausible activé, pas de cookies tiers)
- DPO contact + processus de demande
- Pas de compte → pas de droits d'accès/portabilité applicables (vient en V1.5)

### Conformité éditoriale V1
- **350 caractères max** d'extrait, CHECK en DB
- CTA sortant `target="_blank" rel="noopener noreferrer"` systématique
- Bannière footer "Site non-officiel, sans lien juridique avec l'Aviron Bayonnais"
- Page `/sources` listant ce qu'on agrège pour transparence
- **Processus retrait** : un éditeur écrit, on retire en <24h, on logge, on peut blocklister le domaine
- Tables `articles.takedown_reason` + `domain_blocklist` en DB dès V1

### Performance V1 (cible Lighthouse mobile ≥ 95)
- SSG pour `/`, `/a-propos`, etc. avec ISR (rebuild via webhook quand nouvel article)
- Articles SSR + cache edge 60s
- Images Cloudinary `f_auto, q_auto:eco`, AVIF/WebP
- Polices subset latin + `font-display: swap` + preconnect
- JS total < 60 KB gzipped
- Pas d'islands lourdes en V1 (header sticky en CSS pur si possible)

### Hors scope V1 (différé)
- ❌ Auth utilisateurs (Supabase Auth setup mais inactif)
- ❌ Commentaires
- ❌ Modération IA
- ❌ AdSense
- ❌ MeiliSearch
- ❌ Section Tribune photo (mock visuel uniquement)
- ❌ Notifications email
- ❌ Newsletter

---

## V1.5 — "Le membre" (+5 j-dev)

**But** : permettre aux supporters de se créer un compte, sauvegarder des articles, suivre des sujets.

### Ajouts V1.5
- Supabase Auth : Google OAuth + Magic link email
- Pages : `/inscription`, `/connexion`, `/auth/magic-link-sent`, `/inscription/finaliser`
- `/mon-compte` (profil + articles sauvegardés + préférences notif + sécurité + RGPD)
- `/profil/[username]` (profil public)
- API : `/api/auth/*`, `/api/profile/me`, `/api/me/saved/*`
- Email transactionnel via Resend (magic link + welcome)
- Tables : RLS sur `profiles` et `saved_articles`
- Droits RGPD complets : export JSON, suppression compte
- Cookies fonctionnels (session JWT httpOnly) — toujours pas de marketing

### Hors scope V1.5
- ❌ Toujours pas de commentaires
- ❌ Pas de notifs push
- ❌ Pas de newsletter récurrente

---

## V2 — "La communauté" (+15 j-dev)

**But** : ouvrir les commentaires modérés, monétiser via AdSense, passer à MeiliSearch si volume justifie.

### Ajouts V2
- Commentaires : CRUD + threading 2 niveaux + votes + reports + markdown léger + realtime Supabase
- Modération IA (Anthropic Claude Haiku), **modèle en env var** `ANTHROPIC_MODEL_MODERATION`
- Dashboard `/admin` : queue, bannis, stats, logs
- AdSense : 4 slots, conditional sur consentement marketing Klaro
- Newsletter (Resend) : opt-in dans `/mon-compte`
- reCAPTCHA v3 invisible sur signup + commentaire
- Notifications : email on_reply / on_mention
- Cookies marketing activés sous consentement
- **Décision MeiliSearch** : si > 5 000 articles ou recherche < 200ms infaisable en FTS → swap. Sinon on garde Postgres FTS.
- Section Tribune photos communautaires (avec upload modéré)
- Tests E2E Playwright des 5 scénarios critiques

### Hors scope V2 (= Phase 3 / produit ultérieur)
- ❌ Notifications push
- ❌ Score live de match
- ❌ App mobile native
- ❌ Génération posts sociaux auto

---

## Corrections appliquées vs brief initial

| # | Sujet | Action |
|---|---|---|
| 1 | Découpage V1/V1.5/V2 | Ce document |
| 2 | Astro latest stable | package.json bumpé Astro 5.x |
| 3 | Adapter Vercel vs node | `@astrojs/vercel` primaire, `@astrojs/node` documenté |
| 4 | Commentaires hors V1 | Délégué V2 |
| 5 | MeiliSearch en option V2 | Postgres FTS en V1, décision MeiliSearch à V2 |
| 6 | RSS only, scraping NO | Documenté dans le crawler README |
| 7 | RLS table par table | Migrations exhaustives en `supabase/migrations/0002_rls.sql` |
| 8 | Stratégie retrait | Tables `articles.takedown_reason`, `domain_blocklist`, formulaire `/contact-retrait` |
| 9 | Modèles IA configurables | Env var `ANTHROPIC_MODEL_MODERATION` documentée dès V1 |
| 10 | Backlog atomique | Cf. `docs/backlog.md` (à créer en parallèle du dev) |

---

## Métriques de succès V1

- [ ] Lighthouse mobile ≥ 95 sur `/`, `/actu`, `/article/[slug]`
- [ ] axe-core sans erreur (WCAG 2.2 AA)
- [ ] Crawler agrège ≥ 4 sources, < 1 % erreurs sur 7 jours
- [ ] Postgres FTS : recherche < 200 ms sur 1 000+ articles
- [ ] 0 article republié au-delà de 350 chars
- [ ] Processus retrait testé (1 simulation)
- [ ] Mentions légales + charte + conf publiées et à jour
- [ ] Plausible installé, aucun cookie tiers tant que consentement marketing pas donné
