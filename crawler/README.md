# @aupa-ab/crawler

Service Node qui agrège les flux RSS des médias surveillés et alimente la table `articles` de Supabase.

**V1 — RSS strictement.** Pas de scraping. Si un flux RSS n'existe pas, on n'ingère pas, point.

## Architecture

- `node-cron` toutes les 15 min (7h-23h Europe/Paris) et toutes les 30 min la nuit.
- `rss-parser` avec User-Agent identifié `AUPA-AB-Crawler/0.1`.
- Délai de 2 secondes entre chaque source pour ne pas tomber dessus.
- Healthcheck HTTP `GET /health` sur le port 3001 → JSON avec dernier run, status, erreurs.

## Fonctions pures (testées à 100%)

- `isRelevantToAB(item)` — filtre par mots-clés (club, joueurs, stade…) + accent-fold
- `classifyArticle({ title, snippet })` — heuristiques → `match | mercato | coulisses | espoirs | pays_basque | autre`
- `generateExcerpt(item)` — hard cap 350 chars, troncature au mot près + ellipse
- `generateSlug(title)` — slug FR + suffix 6 chars pour éviter collisions
- `removeAccents(text)`, `stripHtml(html)` — utilitaires

Tests : `npm test` ou `npm run test:coverage`.

## Variables d'environnement

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=3001
```

## Développement local

```bash
npm install
cp .env.example .env
# remplir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (depuis le projet Supabase local ou cloud)
npm run dev          # avec watch
npm run run-once     # un seul cycle, utile pour tester
npm test             # tests Vitest
```

## Production

Image Docker prête : `docker build -t aupa-ab-crawler .` puis déployer sur Railway / Fly.io / VPS. Le healthcheck Docker vérifie `lastRunOk:true` toutes les 60s.

## Politique éditoriale

- **RSS only.** Si une source n'a pas de flux, elle reste désactivée. Pas de scraping, pas de Selenium, pas de Puppeteer.
- **350 caractères max** dans l'excerpt. Hard cap, CHECK constraint en DB.
- **User-Agent identifié** : tout site peut nous bloquer en regardant ses logs s'il le souhaite.
- **Domain blocklist** : si un éditeur demande l'exclusion via `/contact-retrait`, son domaine va dans `domain_blocklist` et le crawler le saute systématiquement.
- **Audit trail** : chaque run est loggé dans `crawl_runs`.

## Ajouter une source

1. INSERT dans la table `sources` :
   ```sql
   insert into sources (slug, name, domain, feed_url) values
     ('nouvelle-source', 'Nouveau Média', 'nouveaumedia.fr', 'https://nouveaumedia.fr/rss.xml');
   ```
2. Vérifier le flux via `https://validator.w3.org/feed/`.
3. Ajouter les metadata visuelles dans `web/src/lib/sources.ts` (mono + couleur).
4. Lancer `npm run run-once` localement pour valider l'ingestion avant déploiement.
