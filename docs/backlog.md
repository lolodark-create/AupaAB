# Backlog atomique AUPA AB

Tâches découpées pour pouvoir être exécutées par un dev humain ou un LLM en une session courte (1 à 4h max).

Convention :
- Chaque tâche = 1 PR
- ✅ = terminé, 🟡 = en cours, ⬜ = à faire
- **Prerequisite** = doit être merge avant
- **Acceptance** = critères vérifiables

---

## Sprint 0 — Foundations

### F1 ⬜ Initialiser le repo git AUPA AB
- `git init` à la racine `Aupa AB/`
- `.gitignore` (node_modules, .env.local, dist, .DS_Store, .astro, .vercel)
- Premier commit "init: structure web + crawler + shared + supabase"
- **Acceptance** : `git log` montre 1 commit, `git status` propre

### F2 ✅ Audit prototype + roadmap V1/V1.5/V2
- `docs/audit-prototype.md`, `docs/roadmap-v1-v2.md`

### F3 ⬜ README racine + ce backlog versionné
- `README.md` (setup, scripts, scope V1)
- Lien vers les briefs originaux dans `Aupa AB/`
- **Acceptance** : un dev nouveau peut cloner et lancer `dev` en ≤ 5 min

---

## Sprint 1 — Design system Astro

### S1.1 ✅ Bootstrap Astro 5 + Tailwind + adapter
- `web/package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`
- **Acceptance** : `npm install && npm run dev` démarre sur :4321

### S1.2 ✅ Tokens design en CSS vars + Tailwind theme
- `web/src/styles/globals.css` (CSS variables RGB pour `<alpha-value>`)
- Light + Dark via `[data-theme="dark"]`
- **Acceptance** : 1 page de démo applique `bg-bg-default` qui switch en dark

### S1.3 ✅ BaseLayout avec meta + OG + theme bootstrap inline
- `web/src/layouts/BaseLayout.astro`
- **Acceptance** : LCP < 1.5s sur dev, no flash unstyled / theme flicker

### S1.4 ⬜ Composants atomiques : Icon, Lauburu, Button, Badge, Avatar
- `web/src/components/atoms/*.astro`
- **Acceptance** : visuellement = prototype, accessibles (aria-label sur icon-only)

### S1.5 ⬜ Composant SourceChip + données sources mockées
- **Acceptance** : 7 sources affichables avec mono + couleur

### S1.6 ⬜ EditorialThumb (4 variants × 4 tailles) en Astro pur
- `web/src/components/EditorialThumb.astro`
- **Acceptance** : rendu pixel-proche du prototype sans JS

### S1.7 ⬜ MatchBanner avec lauburu watermark
- **Acceptance** : conforme prototype, accessible (texte lisible)

### S1.8 ⬜ ArticleCard 4 variants (featured/lead/row/compact)
- **Acceptance** : visuels prototype, focus visible, target tactile ≥ 44px

### S1.9 ⬜ Header sticky + theme toggle (vanilla JS)
- `web/src/components/Header.astro` + `<script>` localStorage theme
- **Acceptance** : sticky, switch theme persistant, focus accessible

### S1.10 ⬜ Footer 4 colonnes + mention non-officielle
- **Acceptance** : conforme brief design §8.9 + mention légale visible

### S1.11 ⬜ MobileDrawer + SearchOverlay (Astro + petits scripts)
- **Acceptance** : ⌘K ouvre, Escape ferme, trap focus dans le drawer

---

## Sprint 2 — Pages publiques V1

### S2.1 ⬜ Page `/` (home) avec mock data
- Match banner, hero featured, KPIs, à la une, sections match/mercato/coulisses, tribune statique
- **Acceptance** : Lighthouse mobile ≥ 90 sur preview

### S2.2 ⬜ Page `/actu` avec filtres + pagination
- Pills catégories, dropdowns source/période, "Charger plus"
- **Acceptance** : URL state préservé (?cat=match), filtres fonctionnels

### S2.3 ⬜ Page `/article/[slug]` SSR
- Breadcrumb, hero, byline, lede, body, CTA sortant, tags, actions, related
- **Acceptance** : JSON-LD NewsArticle valide, meta OG correct

### S2.4 ⬜ Page `/recherche` avec autocomplete
- Connecté à Postgres FTS (stub `/api/search`)
- **Acceptance** : recherche "spedding" retourne mock data en <200ms

### S2.5 ⬜ Pages institutionnelles
- `/a-propos`, `/charte`, `/mentions-legales`, `/confidentialite`, `/cgu`, `/cookies`
- **Acceptance** : 6 pages servies, layout reading-width 680, ToC sticky desktop

### S2.6 ⬜ États 404 / 500 / offline
- **Acceptance** : `/api/inexistant` renvoie 404 stylé, `/500` page existe

### S2.7 ⬜ Page `/sources` (transparence)
- Liste des sources `is_active=true` avec leur dernière mise à jour
- **Acceptance** : reflète `sources` Postgres en temps réel

---

## Sprint 3 — Base de données Supabase

### S3.1 ⬜ Migration `0001_init.sql`
- Tables : sources, articles, profiles, crawl_runs, comments (présent mais inactif V1), comment_votes, comment_reports, saved_articles, moderation_logs
- Enums, indexes, triggers (comment_count, like_count, report_count auto)
- + `articles.takedown_reason`, table `domain_blocklist`
- **Acceptance** : `supabase db reset` applique sans erreur, schema introspect propre

### S3.2 ⬜ Migration `0002_rls.sql` — table par table
- profiles, articles, sources, comments, comment_votes, comment_reports, saved_articles, moderation_logs, crawl_runs, domain_blocklist
- **Acceptance** : `SELECT current_user, has_table_privilege(...)` test pour chaque rôle (anon, authenticated, service_role)

### S3.3 ⬜ Migration `0003_fts.sql` — Postgres FTS
- Extension `unaccent`, `pg_trgm`
- Colonne générée `tsvector` sur articles (title + excerpt + tags)
- Index GIN
- Fonction `search_articles(q text, ...)`
- **Acceptance** : `SELECT search_articles('sped')` renvoie résultat en < 50ms sur 1000 articles seed

### S3.4 ⬜ Migration `0004_takedown.sql`
- View `articles_public` qui exclut `takedown_reason IS NOT NULL` automatiquement
- **Acceptance** : un article avec takedown_reason est invisible côté front

### S3.5 ⬜ Script seed `supabase/seed.sql`
- Sources (les 7-8 du brief)
- 50 articles fictifs (basés sur mock.ts)
- **Acceptance** : `supabase db reset` produit une DB browsable

---

## Sprint 4 — Crawler RSS

### C4.1 ⬜ Setup crawler/ (tsconfig, vitest, package.json)
- Node 22, ESM, TypeScript
- **Acceptance** : `npm test` exécute Vitest

### C4.2 ⬜ Fonctions pures + tests (100% coverage)
- `isRelevantToAB`, `classifyArticle`, `generateExcerpt`, `generateSlug`, `removeAccents`
- **Acceptance** : `vitest run --coverage` ≥ 100% lines sur ces 5 fonctions

### C4.3 ⬜ Adapter Supabase (insert + check duplicate)
- Connexion Postgres via `@supabase/supabase-js` service-role
- `findBySourceUrl(url)` + `insertArticle(article)`
- **Acceptance** : test d'intégration vs base locale

### C4.4 ⬜ Run principal (1 source à la fois, transactionnel)
- `runCrawl()` + log `crawl_runs` start/end
- Respect User-Agent + delay entre sources
- **Acceptance** : 1 source RSS pulled localement, 5+ articles insérés

### C4.5 ⬜ Cron `node-cron` + scheduling
- `*/15 7-23 * * *` + `*/30 0-6 * * *`
- Healthcheck endpoint `/health`
- **Acceptance** : process tourne 1h, run toutes les 15 min sans crash

### C4.6 ⬜ Vignette Cloudinary
- Génération URL avec overlays title + source mono + date
- **Acceptance** : URL ouvre une 1200×630 conforme template brief §10.2

### C4.7 ⬜ Dockerfile + déploiement Railway/Fly
- `Dockerfile` node-alpine, healthcheck
- **Acceptance** : `docker build && docker run` fonctionne localement

---

## Sprint 5 — API Astro

### A5.1 ⬜ `/api/articles` GET (liste + filtres + cursor pagination)
- Zod schema query params
- **Acceptance** : retours `{ data, error, meta: { cursor, has_more } }`

### A5.2 ⬜ `/api/articles/[slug]` GET
- 404 propre si non trouvé
- **Acceptance** : meta OG + JSON-LD bien renvoyés

### A5.3 ⬜ `/api/search` GET (Postgres FTS)
- **Acceptance** : recherche FR avec unaccent, < 100ms

### A5.4 ⬜ `/api/search/autocomplete` GET
- Suggestions courtes + recherches populaires
- **Acceptance** : retourne ≤ 5 suggestions

### A5.5 ⬜ `/api/articles/[id]/view` POST (throttle IP)
- Compteur de vue, anti-spam basique
- **Acceptance** : 2 hits du même IP dans 60s ne comptent qu'1 vue

### A5.6 ⬜ `/api/sources` GET (public, transparence)
- **Acceptance** : retourne sources `is_active=true`

### A5.7 ⬜ `/api/takedown` POST (formulaire retrait éditeur)
- Reçoit email + URL article + raison
- Envoie email à DPO + log dans une table dédiée
- **Acceptance** : test E2E formulaire → email reçu

### A5.8 ⬜ Middleware rate limiting + CORS + security headers
- Table Postgres `api_rate_limit` ou Upstash
- **Acceptance** : 100 reqs en 10s → 429

---

## Sprint 6 — CMP, RGPD, SEO

### R6.1 ⬜ Klaro config minimal V1
- Seul Plausible activé (sans cookie, mention transparente)
- **Acceptance** : aucun cookie tiers tant que pas de consentement marketing

### R6.2 ⬜ Sitemap auto + robots.txt
- `@astrojs/sitemap` filtre /admin, /api, /mon-compte
- **Acceptance** : `/sitemap-index.xml` accessible

### R6.3 ⬜ Schema.org NewsArticle sur `/article/[slug]`
- **Acceptance** : Google Rich Results test passe

### R6.4 ⬜ Mentions légales + Politique conf + CGU + Charte + Cookies finalisées
- **Acceptance** : DPO mentionné, processus retrait documenté, contact valide

---

## Sprint 7 — Déploiement & monitoring V1

### D7.1 ⬜ Projet Vercel + connect repo
### D7.2 ⬜ Crawler Railway/Fly + secrets
### D7.3 ⬜ Supabase Cloud projet + migrations push
### D7.4 ⬜ Sentry pour front + crawler
### D7.5 ⬜ Uptime monitor (BetterStack/Uptime Robot) sur `/` + crawler `/health`
### D7.6 ⬜ Plausible domaine setup
### D7.7 ⬜ Domaine custom + SSL
### D7.8 ⬜ Audit final Lighthouse + axe + manual a11y

---

## V1.5 — backlog en attente

Détaillé séparément lorsque V1 sera déployée et stable.

---

## V2 — backlog en attente

Idem.
