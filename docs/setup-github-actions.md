# Activer le crawl autonome via GitHub Actions

À ce stade tout est prêt côté code :
- `.github/workflows/crawl.yml` configuré pour s'exécuter toutes les 15 min
- `crawler/scripts/ingest-once.mjs` testé contre la vraie DB (42 articles ingérés)
- Filtres affinés (KEYWORDS forts vs faibles avec cooccurrence Bayonne/Aviron)
- Sources mises à jour (L'Équipe désactivée, ICI Pays Basque ajoutée)

Il manque **3 actions de ton côté** :

## 1. Configurer ton identité git locale

```bash
git -C "/Users/llatour/Documents/Claude/Projects/Aupa AB" config user.email "ton.email@exemple.com"
git -C "/Users/llatour/Documents/Claude/Projects/Aupa AB" config user.name "Lolodark"
```

## 2. Commit + push tout sur GitHub

```bash
git -C "/Users/llatour/Documents/Claude/Projects/Aupa AB" commit -m "init: AUPA AB V1 — Astro + Supabase + crawler + GH Actions cron"
git -C "/Users/llatour/Documents/Claude/Projects/Aupa AB" push -u origin main
```

Si le push demande tes credentials GitHub :
- Soit GitHub Desktop / `gh auth login` t'a déjà loggé (le credential helper passe)
- Soit utilise un **Personal Access Token** : Settings → Developer settings → Personal access tokens → Generate (scope: `repo` + `workflow`)

## 3. Ajouter le secret `DATABASE_URL` au repo GitHub

**Via interface web** :
1. Va sur https://github.com/lolodark-create/AupaAB/settings/secrets/actions
2. Click **New repository secret**
3. Nom : `DATABASE_URL`
4. Valeur : `postgresql://postgres.lzcbpvodxsjyyirlyfsk:Omnesedu2026@aws-0-eu-west-3.pooler.supabase.com:5432/postgres`
5. Add secret

**Ou via gh CLI** :
```bash
gh secret set DATABASE_URL \
  --repo lolodark-create/AupaAB \
  --body "postgresql://postgres.lzcbpvodxsjyyirlyfsk:Omnesedu2026@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"
```

## 4. Trigger un premier run manuel (optionnel)

```bash
gh workflow run crawl.yml --repo lolodark-create/AupaAB
gh run watch --repo lolodark-create/AupaAB
```

Ou via UI : https://github.com/lolodark-create/AupaAB/actions/workflows/crawl.yml → "Run workflow".

## Ce qu'il va se passer

Une fois le secret en place + le code pushé :

- **Toutes les 15 min** (06h-22h UTC) et **toutes les 30 min** la nuit, GH Actions :
  1. Checkout le repo
  2. `npm ci --prefix crawler`
  3. Connect à Supabase via `DATABASE_URL`
  4. Fetch les 6 sources RSS actives (Sud Ouest, La Rép, RMC, Midol, Rugbyrama, ICI Pays Basque)
  5. Filter AB-relevance, classify, insert via `ON CONFLICT (source_url) DO NOTHING` → idempotent
  6. Log les stats (X new / Y dupes)

- **En parallèle**, chaque push sur `main` déclenche :
  1. `ci.yml` — astro check + crawler tests + E2E
  2. **Vercel auto-deploy** sur https://aupa-ab.vercel.app
  3. (Si tu push pendant un cron tick : `concurrency` annule le précédent)

## Sécurité

- Le `DATABASE_URL` contient le password Postgres en clair. **Il reste dans GH Secrets** (chiffré au repos) et n'apparaît jamais dans les logs (GitHub Actions le masque automatiquement avec `***`).
- Si tu veux pas que le password traîne dans GH : crée un user Supabase dédié read-write sur `articles` + `crawl_runs` + `sources.last_fetched_at` seulement.

## Coût GitHub Actions

GitHub Actions gratuit sur repos publics. Sur repo privé :
- Free tier : 2 000 min/mois
- Mon workflow tourne ~30 sec × ~70 fois/jour = 35 min/jour = ~1 050 min/mois
- Tu restes en gratuit. Largement.

## Désactiver temporairement

```bash
gh workflow disable crawl.yml --repo lolodark-create/AupaAB
```

Ou rendre le repo privé / supprimer le secret.
