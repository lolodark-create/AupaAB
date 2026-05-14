# Audit du prototype AUPA AB

Référence : `Aupa AB/prototype/` (HTML + React UMD + Babel standalone).
Comparaison avec les deux briefs (`Aupa AB/uploads/brief_claude_design_aupa_ab.md` et `Brief Aupa AB/brief_claude_code_aupa_ab.md`).

## Ce qui est solide

**Design system**
- Tokens couleurs/espacement/radii/ombres conformes brief design §3-5, dans `tokens.css`
- Light + dark mode complets via `data-theme`, transitions cohérentes
- Mobile + desktop, breakpoint à 768px

**Composants atomiques**
- `Button` (primary, secondary, ghost, danger, dark) × 3 tailles
- `Badge` (default, category, live, success, outline, sponsored)
- `Avatar` (rond, taille variable, fallback initiales)
- `Icon` (Lucide-style inline SVG stroke 1.5)
- `Lauburu` SVG réutilisable (composant + filigrane dans vignettes)

**Composants éditoriaux**
- `EditorialThumb` : 4 variants (night, sand, aviron, wave) × 4 tailles (xs/sm/md/lg), conforme brief design §7.1
- `MatchBanner` : prochain match, formes V/D/N, countdown, lauburu en watermark
- `ArticleCard` : 4 variants (featured, lead, row, compact) — conforme brief §8.2
- `AdSlot` : 4 variants (leaderboard, native in-feed, box, sidebar) — conforme brief §12
- `SourceChip` : mini-logo source + nom
- `TrendingList`, `Comment` (threadé), `TribuneTile`

**Chrome**
- Header sticky avec backdrop-blur, version mobile (56px) et desktop (72px)
- MobileDrawer animé (slide-in 250ms)
- SearchOverlay avec ⌘K, highlight des mots-clés, état vide + populaires + résultats
- Footer 4 colonnes desktop, stack mobile

**Écrans implémentés**
- Home complète : match banner, hero featured, KPIs, à la une grid, match/mercato + sidebar trending/newsletter, coulisses, tribune
- Actu : pills catégories sticky, filtres source/période, ads in-feed tous les 4 items
- Article : breadcrumb, byline, vignette éditoriale, lede, body, CTA sortant, tags, actions (save/share/report), related, comments threadés, sidebar trending + ad + pull-quote

**Données mock riches**
- 12 articles plausibles (mercato, match, coulisses, etc.)
- 5 commentaires avec 1 thread de 2 niveaux + 1 commentaire supprimé
- Sources, popular searches, trending, tribune

## Écarts vs brief — à corriger lors de l'industrialisation

### Typographie

Le brief design §4.2 prescrit `body 18px`, mais le prototype utilise `body 17` (tokens.css L124). Pas dramatique mais à aligner.

L'échelle h1/h2/h3 du prototype est contextuelle (ex. h1 mobile 32, desktop 52 sur article) plutôt que basée sur les tokens. Acceptable en proto, à systématiser en composants Astro.

### Accessibilité (WCAG 2.2 AA visé par le brief)

- Beaucoup de `<button>` icon-only sans `aria-label` (header desktop, action bar article…)
- Les `<a>` du footer ont `onClick` sans `href` ni `role="button"` — anti-pattern lecteur d'écran
- Le `<button>` du composant `Comment` "Répondre" n'indique pas son état/cible
- Le filter bar sticky de `/actu` manque de `role="tablist"` ou équivalent
- Pas d'audit axe-core / contraste systématique fait sur le proto
- `prefers-reduced-motion` géré globalement dans `tokens.css` ✅

### SEO

Néant dans le proto, normal. À implémenter dans Astro (meta tags, JSON-LD, sitemap, canonical, OG image).

### Performance

- Styles inline `style={{}}` partout — OK en proto, à remplacer par Tailwind classes
- React UMD + Babel runtime — uniquement pour le proto, remplacé par Astro islands

### Écrans manquants vs brief design §9

- `/recherche` page dédiée (l'overlay existe, pas la page)
- `/inscription`, `/connexion`, `/auth/magic-link-sent`, `/inscription/finaliser` (choix username)
- `/mon-compte` (profil, articles sauvegardés, notifications, sécurité, données, suppression)
- `/profil/[username]` (profil public, commentaires, badges)
- `/admin` dashboard modération (queue, stats, bannis, logs)
- Pages institutionnelles : `/a-propos`, `/charte`, `/mentions-legales`, `/confidentialite`, `/cgu`, `/cookies`
- États globaux : 404, 500, hors-ligne, empty states (pas de comments / pas d'articles sauvegardés)

### CMP & RGPD

CMP Klaro à intégrer (brief dev §12.1). Pas dans le proto.

### Logique de classification

Le filtre `EditorialThumb` choisit la variante par `article.id.charCodeAt(0) + article.id.charCodeAt(1) % 3` — hack proto. À remplacer par une logique propre (par catégorie, ou par champ `cover_variant` en DB).

## Verdict

Le prototype est un **excellent référentiel visuel** : 70% du design system est traduisible 1:1 en composants Astro. Les écarts sont surtout côté accessibilité (aria, sémantique) et écrans manquants (auth, profil, admin, institutionnel).

L'industrialisation suit donc :
1. Migrer tokens.css → `tailwind.config` + `globals.css`
2. Migrer composants atomiques en `.astro` + `.tsx` islands
3. Migrer 3 pages visibles (home, actu, article) avec mock data → SSR depuis Supabase plus tard
4. Implémenter les écrans manquants au fil de l'eau
5. Audit a11y + contraste systématique avant prod
