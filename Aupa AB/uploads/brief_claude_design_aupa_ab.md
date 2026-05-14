# Brief Design global — AUPA AB
## Document destiné à Claude (Design) ou à un designer UI/UX

> Ce document décrit l'intégralité du système de design du site **AUPA AB**, agrégateur d'actualités sur le club de rugby Aviron Bayonnais pour sa communauté de supporters. Il est autonome : pas besoin de référer à d'autres documents pour produire les maquettes.

---

## Brief court à coller en prompt

> Conçois l'identité visuelle complète et toutes les maquettes du site **AUPA AB**, un agrégateur d'actualités non-officiel pour les supporters du club de rugby **Aviron Bayonnais** (Top 14 / Pro D2 français, Pays Basque). Ton recherché : **éditorial premium, calme, ferveur retenue, ancrage basque sans folklore caricatural**. Références : *The Athletic*, *Tortoise Media*, *Are.na*, *Substack*. Palette : bleu Aviron `#0099D8`, bleu nuit `#0B2545`, blanc cassé `#FAFAF7`, gris ardoise `#1A1D24`, rouge basque `#D52B1E` (accent rare). Typographie : *Fraunces* (serif) pour les titres + *Inter* pour le corps. Dark mode soigné obligatoire. Le site contient : lecture d'articles agrégés, recherche, comptes utilisateurs, commentaires de communauté, emplacements publicitaires discrets. Mobile-first. Accessibilité WCAG 2.2 AA. Anti-pattern absolu : pop-ups intrusives, carrousels, surcharge visuelle, gradients criards. Livre : système de design Figma (tokens + composants + écrans) + maquettes hi-fi de tous les écrans en versions light et dark, mobile et desktop.

---

## 1. Contexte & vision

### 1.1 Le projet en une phrase
AUPA AB est le foyer numérique des supporters de l'Aviron Bayonnais : on y lit tout ce qui se dit sur le club en un seul endroit, on y discute entre passionnés, on y prolonge la ferveur du stade quand on n'y est pas.

### 1.2 Audience cible

| Persona | Âge | Comportement | Attentes design |
|---|---|---|---|
| **Le tonton bayonnais** | 50–70 | Connaît l'AB depuis Dauger père, lit Sud Ouest tous les matins | Lisibilité, sobriété, respect du club, pas de "buzz" |
| **L'expat basque** | 30–50 | Vit hors région, suit à distance, frustré par la dispersion de l'info | Densité d'information, archives, recherche puissante |
| **Le millennial supporter** | 18–35 | Abonné Instagram AUPA AB, consomme sur mobile en débordement de réunion | Mobile parfait, partage facile, dark mode |
| **La famille bayonnaise** | – | Va au stade, suit le club en arrière-plan | Calendrier clair, navigation simple |

90 % des visites en mobile. Le mobile est la maquette principale, pas l'adaptation.

### 1.3 Positionnement et ton

**Ce que nous sommes** : un média de fans, sérieux et élégant. Une *love letter* au club, pas un torchon.

**Ce que nous ne sommes pas** : un site officiel, un forum bordélique, un agrégateur SEO sans âme, une chaîne YouTube de chambrage.

**Le ton visuel** : la passion contenue. Comme l'avant-match dans la tribune : du monde, de la ferveur, mais pas l'hystérie. Du bleu partout sans hurler.

---

## 2. Direction artistique

### 2.1 Mood et références

**Sources d'inspiration directe** :
- *The Athletic* — éditorial sportif, typographie soignée, photo arty
- *Tortoise Media* — calme, slow news, espace blanc
- *Are.na* — vignettes typographiques pures, sobriété radicale
- *Substack* — lecture longue, typographie d'éditeur
- *Defector Media* — voix de communauté, ton entre passion et lucidité
- *Linear* (pour les composants UI) — précision, transitions soignées

**Sources d'inspiration indirecte (esprit basque)** :
- Architecture des frontons de pelote (lignes pures, ombre franche)
- Les couleurs des maillots de l'AB des années 90 (bleu profond, blanc franc)
- L'imprimerie typographique basque (Hatza, Maite, Bilaka)
- Le travail de l'illustrateur basque **Asisko Urmeneta** (palette terreuse, lignes nettes)

**Anti-références (à ne pas faire)** :
- Sites de paris sportifs (gradients criards, urgence permanente)
- L'Équipe.fr (overload visuel, pubs partout)
- Disqus (commentaires moches)
- 90 % des sites de clubs de foot (3D, dégradés, effets années 2010)

### 2.2 Principes de design

1. **Lecture d'abord.** Le corps de texte est le composant central. Tout le reste sert la lecture.
2. **Densité contrôlée.** De l'information riche, mais aérée. Pas de tableaux à 12 colonnes, pas de murs de cartes.
3. **Hiérarchie typographique forte.** On distingue instantanément un titre, une méta, un corps, une légende.
4. **Couleur économe.** 80 % de la page en neutres. Le bleu et le rouge sont des respirations, pas des hurlements.
5. **Animation invisible.** Les transitions servent à expliquer, pas à impressionner. Si on les remarque, c'est raté.
6. **Cohérence dark/light.** Le dark mode n'est pas un invert, c'est un design à part entière, pensé pour la lecture en soirée.
7. **Mobile sans concession.** Tout ce qui marche sur mobile marche sur desktop. L'inverse n'est pas vrai.

---

## 3. Système de couleurs

### 3.1 Tokens primaires

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--blue-aviron` | `#0099D8` | 0, 153, 216 | Liens, CTA primaires, accents, logo |
| `--blue-night` | `#0B2545` | 11, 37, 69 | Texte fort, headers, base dark mode |
| `--white-off` | `#FAFAF7` | 250, 250, 247 | Fond principal mode clair |
| `--slate` | `#1A1D24` | 26, 29, 36 | Corps de texte mode clair |
| `--sand` | `#EFEAE0` | 239, 234, 224 | Cartes secondaires, séparateurs, fond alterné |
| `--red-ikurriña` | `#D52B1E` | 213, 43, 30 | Accents rares : badge "live", actions destructrices |
| `--green-basque` | `#2F8F4F` | 47, 143, 79 | Victoires, tags positifs, validation (parcimonieux) |

### 3.2 Tokens neutres

| Token | Hex clair | Hex dark | Usage |
|---|---|---|---|
| `--bg-default` | `#FAFAF7` | `#0E1116` | Fond de page |
| `--bg-elevated` | `#FFFFFF` | `#171B22` | Cartes, modales |
| `--bg-subtle` | `#EFEAE0` | `#1C2129` | Sections alternées |
| `--text-primary` | `#1A1D24` | `#E6E6E1` | Texte principal |
| `--text-secondary` | `#5A6472` | `#9CA3AF` | Méta, légendes |
| `--text-tertiary` | `#8B939C` | `#6B7280` | Texte désactivé |
| `--border-subtle` | `#E5E2D9` | `#252A33` | Bordures discrètes |
| `--border-default` | `#CFCAB8` | `#374151` | Bordures cards, inputs |

### 3.3 Couleurs sémantiques

| Token | Clair | Dark | Usage |
|---|---|---|---|
| `--success` | `#2F8F4F` | `#4ADE80` | Validation, succès |
| `--warning` | `#D97706` | `#FBBF24` | Alertes douces |
| `--danger` | `#D52B1E` | `#F87171` | Erreurs, suppression |
| `--info` | `#0099D8` | `#3FB0E5` | Info, notifications |

### 3.4 Règles d'usage

- **Contraste mode clair** : texte sur fond ≥ 7:1 (AAA). Vérifié : `#1A1D24` sur `#FAFAF7` = 13.8:1.
- **Contraste dark** : texte sur fond ≥ 7:1 (AAA). Vérifié : `#E6E6E1` sur `#0E1116` = 14.2:1.
- Le bleu Aviron ne doit jamais être utilisé en gros aplat plein écran. Il s'exprime sur 10 % d'une page maximum.
- Le rouge ikurriña est réservé à trois usages : badge "Live", bouton de suppression, indicateur d'erreur critique. **Jamais en CTA principal**.

---

## 4. Système typographique

### 4.1 Polices

**Titres et headlines** : **Fraunces** (Google Fonts)
- Variable font, axes : opsz (9-144), wght (100-900), SOFT (0-100), WONK (0-1)
- Réglages signatures pour AUPA AB :
  - H1 : opsz 144, wght 600, SOFT 50, WONK 0
  - H2 : opsz 72, wght 600, SOFT 30
  - H3 : opsz 48, wght 500, SOFT 20

**Corps de texte** : **Inter** (Google Fonts)
- Variable font, axes : wght (100-900), slnt (0 à -10)
- Réglages :
  - Corps : wght 400, taille 18px
  - Méta : wght 500, taille 13px, letter-spacing 0.08em, uppercase

**Fallbacks** :
- Titres : `"Fraunces", "Georgia", "Times New Roman", serif`
- Corps : `"Inter", -apple-system, "Segoe UI", "Helvetica Neue", sans-serif`

### 4.2 Échelle typographique

| Style | Taille | Line-height | Weight | Usage |
|---|---|---|---|---|
| `display` | 64px / 48px* | 1.05 | 600 (Fraunces) | Hero d'accueil, titre de section majeur |
| `h1` | 48px / 36px | 1.1 | 600 (Fraunces) | Titre d'article |
| `h2` | 32px / 28px | 1.2 | 600 (Fraunces) | Sections, accroches |
| `h3` | 24px / 22px | 1.3 | 500 (Fraunces) | Sous-sections |
| `h4` | 20px / 18px | 1.4 | 500 (Inter) | Petits titres, headers cards |
| `body-lg` | 20px | 1.6 | 400 (Inter) | Chapô, intro article |
| `body` | 18px | 1.65 | 400 (Inter) | Corps standard, articles |
| `body-sm` | 16px | 1.5 | 400 (Inter) | Listes, contextes denses |
| `meta` | 13px | 1.4 | 500 (Inter, uppercase, ls 0.08em) | Date, source, catégorie |
| `caption` | 12px | 1.4 | 400 (Inter) | Légendes images, footnotes |

*Les tailles séparées par `/` sont desktop / mobile.

### 4.3 Règles typographiques

- **Mesure de lecture** : 65–75 caractères par ligne sur les articles (~680px à 18px). Hard cap.
- **Veuves et orphelines** : si possible, gérer via CSS `text-wrap: pretty` (support moderne).
- **Ligatures** : activées sur Fraunces pour les titres.
- **Italiques** : utilisés pour les citations et les noms propres étrangers. Jamais pour souligner.
- **Capitales** : les méta (date, source) sont en uppercase avec letter-spacing. Le reste évite les ALLCAPS criardes.

---

## 5. Espacement, grille, breakpoints

### 5.1 Échelle d'espacement (base 4px)

| Token | Px | Usage |
|---|---|---|
| `space-1` | 4 | Espacement entre icône et texte |
| `space-2` | 8 | Padding inputs, gap petits éléments |
| `space-3` | 12 | Gap dans un composant |
| `space-4` | 16 | Padding standard d'une card |
| `space-5` | 24 | Espacement entre composants liés |
| `space-6` | 32 | Espacement entre composants distincts |
| `space-8` | 48 | Marge entre sections |
| `space-10` | 64 | Grandes marges entre blocs majeurs |
| `space-12` | 96 | Marge top de page, séparation sections principales |
| `space-16` | 128 | Marge dramatique, hero, transitions |

### 5.2 Grille

- **Container max-width** : 1280px (desktop), avec padding 24px de chaque côté.
- **Article max-width** : 680px (mesure de lecture optimale).
- **Grille colonnes** : 12 colonnes, gutter 24px (desktop), 16px (mobile).

### 5.3 Breakpoints (tailwind compatible)

| Nom | Min-width | Usage |
|---|---|---|
| `sm` | 640px | Petits téléphones en landscape |
| `md` | 768px | Tablettes portrait |
| `lg` | 1024px | Tablettes landscape, petits laptops |
| `xl` | 1280px | Desktop standard |
| `2xl` | 1536px | Grands écrans |

Les maquettes sont à produire en : **375px (mobile)**, **768px (tablette)**, **1280px (desktop)**.

### 5.4 Rayons de bordure

| Token | Px | Usage |
|---|---|---|
| `radius-sm` | 4 | Tags, badges, petits boutons |
| `radius-md` | 8 | Boutons, inputs |
| `radius-lg` | 12 | Cards |
| `radius-xl` | 16 | Modales, hero |
| `radius-full` | 9999 | Avatars, pills |

### 5.5 Élévation (ombres)

Très discrètes, le design est plat-noble, pas matériel.

- `shadow-sm` : `0 1px 2px rgba(11, 37, 69, 0.04)` — boutons subtils
- `shadow-md` : `0 4px 12px rgba(11, 37, 69, 0.06)` — cards au hover
- `shadow-lg` : `0 12px 32px rgba(11, 37, 69, 0.08)` — modales, dropdowns
- En dark mode, remplacer par des bordures fines plutôt que des ombres (`border-subtle`).

---

## 6. Iconographie

**Bibliothèque retenue** : **Lucide** (open source, MIT, cohérence parfaite).

**Style** :
- Trait 1.5px constant
- Tailles : 16, 20, 24 px (jamais d'autres)
- Couleur héritée du texte (`currentColor`)

**Icônes principales utilisées** :
- Navigation : `home`, `newspaper`, `users`, `search`, `menu`, `x`
- Actions : `bookmark`, `share-2`, `heart`, `message-circle`, `flag`, `more-horizontal`
- Méta : `calendar`, `clock`, `tag`, `external-link`
- Auth : `user`, `log-in`, `log-out`, `settings`
- Système : `moon`, `sun`, `bell`, `check`, `alert-triangle`

**Logo AUPA AB** :
- Wordmark "AUPA AB" en Fraunces 600, légèrement condensé
- À côté ou en dessous, un **lauburu** stylisé (croix basque) en bleu Aviron, traits 2px, 32×32 favicon, 48×48 header
- Variante carrée pour réseaux : lauburu sur fond bleu nuit avec "AUPA AB" sous le symbole

---

## 7. Imagerie et illustrations

### 7.1 Vignettes éditoriales auto-générées

Les articles agrégés n'auront **pas** de photo (droits d'auteur). À la place :

**Format** : 1200×630 (compatible OG image)

**Template visuel** :
- Fond : aplat bleu nuit `#0B2545` avec léger motif lauburu en filigrane 4 % d'opacité (centre droite)
- En haut : petit logo de la source en blanc cassé (50px de haut max)
- Au centre : titre de l'article en Fraunces 600, blanc, taille adaptative (32–48px), max 3 lignes, alignement gauche, marge 64px
- En bas à gauche : monogramme "AUPA AB" en blanc cassé, opacité 60 %
- En bas à droite : date au format meta, blanc cassé opacité 60 %

**3 variantes de fond** (rotation pour éviter la monotonie) :
1. Bleu nuit + lauburu (par défaut)
2. Sable + ligne horizontale bleu Aviron en bas
3. Bleu Aviron + motif vagues basques en filigrane (pour les articles "Pays Basque")

### 7.2 Photos communautaires (section Tribune)

- Photos prises par les supporters AUPA AB, fournies avec accord
- Traitement : léger grain, contraste +5 %, saturation -10 % (rendu argentique discret)
- Format : carré 1:1 ou 4:5 portrait
- Cadre : pas de bordure, ombre `shadow-md` au hover

### 7.3 Illustrations originales

À long terme : commander 3–5 illustrations originales à un illustrateur basque (motifs, paysages stylisés, ambiance) pour les pages institutionnelles (`/a-propos`, `/charte`, etc.).

Style cible : trait fin, palette bleu/sable/blanc, géométrique inspirée de l'art basque.

---

## 8. Système de composants

### 8.1 Bouton

**Variantes** :
- `primary` : fond `--blue-aviron`, texte blanc, hover assombri 5 %
- `secondary` : fond `--bg-elevated`, bordure `--border-default`, texte `--text-primary`
- `ghost` : transparent, texte `--blue-aviron`, hover fond `--bg-subtle`
- `danger` : fond `--red-ikurriña`, texte blanc (rare)

**Tailles** :
- `sm` : padding 8×12, texte 14px, height 32
- `md` : padding 10×16, texte 16px, height 40 (défaut)
- `lg` : padding 14×24, texte 18px, height 48

**États** : default, hover, active, focus (anneau `--blue-aviron` 2px à 2px d'offset), disabled (opacity 0.5), loading (spinner + texte conservé)

**Border-radius** : `radius-md` (8px). Pas de boutons ronds sauf icon-buttons.

### 8.2 Card article

**Variantes** :
- `featured` (hero) : grande, asymétrique 2/3 image + 1/3 texte
- `lead` (À la une) : verticale, image en haut, contenu en bas
- `row` (listes) : horizontale, image 240×160 à gauche, contenu à droite
- `compact` (sidebar, related) : très condensée, image 80×80 + titre 2 lignes

**Anatomie d'une card row** :
```
┌─────────────┬──────────────────────────────────────┐
│             │ MÉTA: source · catégorie · 2h        │
│  [vignette] │                                       │
│  240 × 160  │ Titre de l'article en Fraunces 500   │
│             │ jusqu'à 2 lignes                      │
│             │                                       │
│             │ Extrait sur 2 lignes maximum, texte  │
│             │ secondaire pour le contexte...        │
│             │                                       │
│             │ 🔖 12 commentaires · 4 min de lecture │
└─────────────┴──────────────────────────────────────┘
```

**Interactions** :
- Hover : translation -2px en Y, ombre `shadow-md`, vignette qui zoom à 1.02
- Toute la card est cliquable (lien sur le titre, mais zone tactile entière)
- Boutons d'action (save, share) sur la card en hover desktop / toujours visibles mobile

### 8.3 Input et formulaires

**Input texte** :
- Height 40 (md), 48 (lg)
- Padding horizontal 12
- Border `--border-default` 1px
- Border-radius `radius-md`
- Focus : bordure `--blue-aviron` 2px (sans box-shadow ring agressif, juste un changement net)
- Label au-dessus, taille 14, weight 500, marge 6 sous le label

**Textarea** : idem mais resize vertical only, min-height 120

**Select** : custom, pas le natif, avec icône chevron Lucide

**Checkbox / Radio** : custom, taille 18, accent color `--blue-aviron`

### 8.4 Tag / Badge

- Pill (radius-full), padding 4×10, texte 12px weight 500
- Variantes : `default` (fond sand, texte slate), `category` (fond bleu light, texte bleu Aviron), `live` (fond red-ikurriña, texte blanc, pulse animation)

### 8.5 Avatar

- Rond, tailles 24/32/40/48
- Si pas d'image : initiales sur fond généré (palette bleu + sable + bleu nuit, selon hash du username), texte blanc weight 600

### 8.6 Modale

- Backdrop : `rgba(11, 37, 69, 0.6)` avec backdrop-blur 8px
- Container : max-width 560, radius-xl, padding 32
- Animation : fade backdrop + slide-up modale (16px), durée 200ms ease-out
- Fermeture : clic backdrop ou bouton X ou Escape

### 8.7 Toast / Notification

- Position : bottom-right desktop, bottom-center mobile
- Taille : 320 max-width, padding 16
- Variantes : success (vert basque léger), info (bleu Aviron léger), error (rouge léger)
- Durée affichage : 4 sec, dismissable manuellement
- Empilement : nouveau en bas, ancien remonte

### 8.8 Header sticky

**Desktop** :
- Height 80 par défaut, réduit à 56 après 100px de scroll (transition 250ms)
- Fond `--bg-default` à 92 % avec backdrop-blur 12px
- Bordure basse `--border-subtle` 1px
- Layout : logo gauche, nav centre, actions droite

**Mobile** :
- Height 56, fond opaque
- Logo gauche, menu burger droite, recherche en icône
- Menu burger : drawer plein écran (pas de menu déroulant chiche)

### 8.9 Footer

- Fond `--bg-subtle`
- Padding vertical 64, horizontal selon container
- 3 colonnes desktop, empilé mobile
- Logo + tagline en col 1
- Liens sources en col 2 (max 8, le reste en "Voir toutes")
- Liens nav institutionnels en col 3
- Bas du footer : copyright + petit lauburu + lien mentions

---

## 9. Écrans détaillés

### 9.1 Page d'accueil `/`

**Au-dessus de la ligne de flottaison (mobile)** :
```
┌────────────────────────────┐
│ [logo]  [≡] [🔍] [🌙]      │  56px
├────────────────────────────┤
│                            │
│  PROCHAIN MATCH · J-3      │
│  Aviron Bayonnais          │  Bandeau bleu nuit
│  vs Stade Toulousain       │  texte blanc
│  Samedi 18h · Jean-Dauger  │  hauteur 96
│                            │
├────────────────────────────┤
│                            │
│  Vignette hero (1200×630)  │  Image éditoriale
│                            │  générée
├────────────────────────────┤
│ SUD OUEST · IL Y A 2H      │  Méta
│                            │
│ Titre du jour en Fraunces  │  H1 / 36px
│ jusqu'à 3 lignes maximum   │
│                            │
│ Extrait court de l'article │  Body-lg
│ qui donne envie de lire... │
│                            │
│ [Lire sur Sud Ouest →]     │  Bouton primary
└────────────────────────────┘
```

**Suite (toujours mobile, scroll)** :
- Section "À la une" : 4 cards lead en stack vertical
- Bandeau pub discret (256×100 native style)
- Section "Match" : 3 cards row + "Tout voir →"
- Section "Mercato" : idem
- Section "Coulisses" : idem
- Bandeau pub
- Section "Tribune AUPA AB" : 3 vignettes carrées de la communauté
- CTA réseaux sociaux
- Footer

**Desktop (1280px)** :
- Hero asymétrique : image 2/3 gauche, contenu 1/3 droite, hauteur 540
- "À la une" en grille mosaïque : 1 lead grand à gauche (col 1-7), 3 row à droite (col 8-12)
- Sections catégories en grille 3 colonnes
- Sidebar droite optionnelle avec : "Le plus lu cette semaine" + pub 300×250

### 9.2 Page liste `/actu`

```
┌────────────────────────────────────────────┐
│ ACTUALITÉS                                  │
│ Toutes les news de l'Aviron Bayonnais     │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ 🔍 Recherche...     [Source ▾] [Date ▾] ││  Filtres sticky
│ └─────────────────────────────────────────┘│
│                                             │
│ ┌──────┬──────────────────────────────────┐│
│ │      │ MÉTA                              ││
│ │ [IMG]│ Titre article                     ││  Card row
│ │      │ Extrait...                        ││
│ │      │ 🔖 · 💬 5 · ⏱ 4 min               ││
│ └──────┴──────────────────────────────────┘│
│ (répété)                                    │
│                                             │
│              [Charger plus]                 │
└────────────────────────────────────────────┘
```

**Filtres** :
- Source : multi-select dropdown avec logos
- Catégorie : pills horizontaux scrollables sur mobile
- Période : dropdown (24h, 7j, 30j, tout, custom)
- Reset filters : croix discrète quand actifs

### 9.3 Page article `/article/[slug]`

```
┌────────────────────────────────────────────┐
│                  Header                     │
├────────────────────────────────────────────┤
│                                             │
│        Largeur 680px max, centrée          │
│                                             │
│  🏷️ MERCATO · SUD OUEST · 14 MAI 2026     │
│                                             │
│  Titre de l'article complet                │  H1 48px
│  en Fraunces, jusqu'à 4 lignes             │
│                                             │
│  Par Auteur si dispo · 4 min de lecture    │
│                                             │
│  [Vignette éditoriale 1200×600]            │
│                                             │
│  Extrait long de l'article reformulé       │  Body-lg
│  pour respecter le droit d'auteur, avec    │
│  un résumé en 200-300 caractères qui       │
│  donne envie d'aller lire l'original.      │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ 📖 Lire l'article complet sur       │  │  Bouton primary
│  │    Sud Ouest →                       │  │  full width
│  └─────────────────────────────────────┘  │
│                                             │
│  Tags : [Mercato] [Spedding] [Top 14]      │
│                                             │
│  [🔖 Sauvegarder]  [🔗 Partager]           │  Boutons ghost
│                                             │
├────────────────────────────────────────────┤
│  Pub 300×250 (post-content, désactivable)  │
├────────────────────────────────────────────┤
│  À LIRE ENSUITE                             │  H3
│  ┌──────────┬──────────┬──────────┐        │
│  │  Card 1  │  Card 2  │  Card 3  │        │  3 cards compact
│  └──────────┴──────────┴──────────┘        │
├────────────────────────────────────────────┤
│  ─────────  COMMENTAIRES (24)  ▼  ─────── │  Section collapsed
│         (déplier au clic, voir 9.5)        │
├────────────────────────────────────────────┤
│                  Footer                     │
└────────────────────────────────────────────┘
```

Sidebar desktop : boutons partage flottants à gauche du contenu (sticky scroll), bouton "haut de page" à droite.

### 9.4 Page recherche `/recherche`

**État initial (vide)** :
```
                  🔍
        Recherchez dans 3 247 articles
       de l'actualité Aviron Bayonnais

  ┌──────────────────────────────────┐
  │ Spedding, mercato, Toulouse...  │  Input XL, focus auto
  └──────────────────────────────────┘

  Recherches populaires :
  [Top 14] [Spedding] [Jean-Dauger]
  [Pro D2] [Mercato 2026]

  Vos recherches récentes (si connecté) :
  - Tana Umaga (il y a 2 jours)
  - calendrier mai
```

**État résultats** : barre de recherche reste en haut, filtres pills sous (24h / 7j / 30j / Tout — Match / Mercato / Coulisses), liste de résultats type "row" avec **surlignage des mots-clés** dans titre/extrait.

### 9.5 Section commentaires

**État replié** (par défaut) :
```
─────  COMMENTAIRES (24)  ▼  ─────
```

**État déplié** :
```
─────  COMMENTAIRES (24)  ▲  ─────

[Avatar] Vous · @maite      
┌────────────────────────────────────┐
│ Partagez votre avis...             │  Textarea
│                                    │
└────────────────────────────────────┘
                    [Publier] (disabled si vide)

Trier par : [Meilleurs ▾] [Plus récents]

┌────────────────────────────────────────────┐
│ [Avatar] @paco · il y a 12 min · MODÉRATEUR│
│                                             │
│ Le contenu du commentaire en body, sur     │
│ plusieurs lignes si besoin, avec markdown  │
│ léger : **gras** et *italique*.            │
│                                             │
│ 👍 24    💬 Répondre    ⋯                  │
│                                             │
│   └─ [Avatar] @ttiki · il y a 8 min        │  Indentation 32
│      Réponse en réponse, avec mention      │
│      @paco qui devient un lien.            │
│      👍 5    💬 Répondre    ⋯              │
└────────────────────────────────────────────┘

(répété, pagination par 20)

[Charger plus]
```

**Détails** :
- Avatar 40×40 pour le commentaire principal, 32×32 pour les réponses
- Badge `MODÉRATEUR` ou `CONTRIBUTEUR` à droite du pseudo (petit, weight 600)
- Menu `⋯` : Modifier (auteur, 5 min), Supprimer (auteur), Signaler, Bloquer auteur
- Si signalé > 3 fois : commentaire caché avec "[Commentaire en cours de modération]" et un bouton "Afficher" pour le voir quand même
- Si supprimé : "[Commentaire supprimé par l'auteur]" en gris

### 9.6 Pages auth

**Inscription `/inscription`** :
```
              [logo AUPA AB]
        Rejoignez la tribune supporters

  ┌────────────────────────────────────┐
  │  [G] Continuer avec Google         │  Boutons OAuth
  └────────────────────────────────────┘
  ┌────────────────────────────────────┐
  │  [f] Continuer avec Facebook       │
  └────────────────────────────────────┘

         ──── ou par email ────

  ┌────────────────────────────────────┐
  │ votre@email.com                    │
  └────────────────────────────────────┘
  ┌────────────────────────────────────┐
  │ Mot de passe                       │
  └────────────────────────────────────┘

       [☐] J'accepte la charte AUPA AB

         [Créer mon compte]

  Déjà un compte ? Se connecter
```

**Connexion** : symétrique mais sans le checkbox charte et le bouton dit "Se connecter".

**Magic link** : champ email seul → écran de confirmation "Email envoyé à xxx@yyy".

**Choix username (post-OAuth)** :
- Suggestion auto (basée sur le prénom ou l'email)
- Validation en direct : disponibilité, format, longueur
- Avatar généré ou upload optionnel

### 9.7 Mon compte `/mon-compte`

Layout : sidebar gauche desktop (Profil, Articles sauvegardés, Notifications, Sécurité, Données, Supprimer le compte), contenu droite. Onglets en haut sur mobile.

Page Profil : édition username, display_name, bio, supporter_since, joueur préféré, avatar (upload Cloudinary).

### 9.8 Profil public `/profil/[username]`

```
        [Avatar 96×96]
        @maite-pamplemousse
        Maïté Etxegoyen
        Supporter depuis 1998 · ⚪🔵 Pamplemousse
        
        [Badges : Premier abonné · Contributeur]
        
        ─────────────────────
        
        Bio si fournie, en italique, max 200 chars
        
        ─────────────────────
        
        [Commentaires] [Articles sauvegardés (privé)]
        
        47 commentaires publics, triés du plus récent au plus ancien
        Chaque commentaire affiché avec l'article où il a été posté
```

### 9.9 Dashboard modération `/admin`

Accès : utilisateurs avec role `moderator` ou `admin` uniquement.

**Sections** :
- **Queue** : commentaires en attente (pending), signalés (3+ reports), flaggés par IA (score 0.5-0.8)
- **Actions rapides** : Approuver / Supprimer / Bannir auteur (durée), boutons clairs avec confirmation pour les destructions
- **Stats** : modérations/jour, taux désaccord IA, top reporters, top reportés
- **Utilisateurs bannis** : liste, durées, raisons, possibilité de débannir
- **Logs** : audit trail de toutes les actions modération

Design : dense, fonctionnel. Pas de chichis. C'est un outil de travail.

### 9.10 Pages institutionnelles

`/a-propos`, `/charte`, `/mentions-legales`, `/confidentialite`, `/cgu` :
- Layout simple, largeur 680
- Typographie d'article
- Table des matières flottante à gauche (desktop) pour les longs

---

## 10. États de composants

### 10.1 États vides (empty states)

- Pas de commentaires : illustration légère (lauburu stylisé) + "Soyez le premier à commenter" + bouton CTA
- Aucun résultat de recherche : "Aucun article ne correspond à votre recherche" + 3 suggestions
- Aucun article sauvegardé : "Sauvegardez les articles pour les retrouver ici" + lien vers actu

### 10.2 États de chargement

- Skeleton screens pour les cards (pas de spinners infinis). Pulse animation douce.
- Spinners uniquement pour les actions ponctuelles (envoi formulaire, vote)

### 10.3 États d'erreur

- 404 : "Cette page n'existe pas ou a été déplacée." + bouton retour accueil + illustration
- 500 : "Quelque chose ne s'est pas passé comme prévu." + bouton réessayer
- Hors-ligne : bandeau en haut "Vous êtes hors-ligne, certaines fonctionnalités sont limitées"
- Erreur formulaire : message inline sous le champ, couleur danger, icône alert

### 10.4 États interactifs

Pour chaque composant cliquable, fournir : default, hover, active, focus-visible (anneau d'accessibilité), disabled, loading.

---

## 11. Animations et micro-interactions

### 11.1 Principes

- Durée par défaut : **200ms** (UI standard)
- Easing : `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out, naturel)
- Distance de translation : max 16px (jamais d'animations qui traversent l'écran)
- Respect strict de `prefers-reduced-motion: reduce` → toutes les animations désactivées sauf opacity

### 11.2 Animations spécifiques

- **Page transitions** : fade 150ms sur le contenu principal au changement de route
- **Card hover** : translateY(-2px) + shadow 200ms
- **Image hover** : scale(1.02) 300ms ease-out
- **Header sticky** : passage 80px → 56px en 250ms
- **Modale** : backdrop fade 200ms + modale slide-up 16px + scale 0.98 → 1, 200ms
- **Toasts** : slide-in depuis bord 200ms + slide-out 150ms
- **Like sur commentaire** : petite "particule" cœur qui s'envole + counter qui s'incrémente avec rebond
- **Bouton publier commentaire** : si erreur, shake horizontal 6px 3 fois, 300ms total
- **Scroll vers commentaire** : smooth scroll + flash background du commentaire ciblé 800ms

---

## 12. Emplacements publicitaires

**Contrainte design** : la publicité doit s'intégrer sans casser l'éditorial.

**Emplacement 1 — Accueil entre hero et "À la une"** :
- Format : 970×250 desktop, 320×100 mobile
- Cadre : padding identique aux sections, fond `--bg-subtle`, label "Publicité" en meta tag au-dessus à gauche, opacité 60 %
- Pas de bordure bling, pas de "Cliquez ici !"

**Emplacement 2 — Liste d'articles, tous les 8 items** :
- Format : in-feed native, **même structure visuelle que les cards article** (image + titre + excerpt)
- Label "Sponsorisé" en haut à gauche de la card, tag distinct couleur sand

**Emplacement 3 — Page article, post-CTA, pré-comments** :
- Format : 300×250 desktop / display mobile 320×100
- Espacement généreux (space-10 au-dessus et en dessous)
- Label "Publicité" en meta tag

**Emplacement 4 — Sidebar desktop article** (optionnel) :
- Format : 300×250
- Sticky avec offset
- Disparaît si vue mobile

**À ne pas faire** :
- Sticky bottom mobile
- Interstitial
- Popup
- Vidéo autoplay
- Pub plein écran
- Couleurs flashy hors palette

---

## 13. Accessibilité

### 13.1 Niveau visé : WCAG 2.2 AA (cible AAA sur les contrastes)

### 13.2 Checklist design

- Contrastes texte/fond ≥ 7:1 (verifier avec Stark dans Figma)
- Focus ring visible et distinct sur tous les composants interactifs : anneau 2px `--blue-aviron`, offset 2px
- Tailles de cible tactile ≥ 44×44 px sur mobile
- Pas de "hover-only" features sur mobile (toutes les actions accessibles au tap)
- Texte des liens distinguable du corps même sans couleur (underline ou weight ≥ +100)
- Indicateurs d'état pas uniquement par couleur (icône + texte sur les badges)
- Animations désactivables via `prefers-reduced-motion`
- Lisibilité à 200 % de zoom navigateur sans rupture de layout

### 13.3 Considérations spécifiques

- Mode "lecture confort" : option dans le profil pour augmenter la taille de texte des articles (16 / 18 / 20 / 22 px)
- Dark mode disponible et clairement signalé
- Pas de texte sur image sans fallback solide

---

## 14. Mode sombre — règles spécifiques

- Le dark mode est un design à part entière, pas un invert automatique
- Le bleu Aviron en dark devient `#3FB0E5` (légèrement plus saturé pour rester visible)
- Les ombres deviennent des **bordures fines** (`rgba(255,255,255,0.04)`)
- Les images ont un overlay sombre subtil (filter brightness 0.9) pour éviter qu'elles ne crient
- Le rouge ikurriña en dark devient `#F87171` (moins agressif)
- Test obligatoire : toutes les maquettes doivent exister en dark et en light, et le passage de l'un à l'autre ne doit jamais rompre la hiérarchie visuelle

---

## 15. Livrables attendus

### 15.1 Fichier Figma

Organisation des pages Figma :

1. **00 — Cover** : titre du projet, version, dernière mise à jour
2. **01 — Tokens** : couleurs, typographie, espacements, ombres (en styles + variables)
3. **02 — Composants** : tous les composants atomiques et moléculaires
4. **03 — Patterns** : navigation, hero, sections, footer
5. **04 — Écrans Mobile** : tous les écrans en 375px (light + dark)
6. **05 — Écrans Desktop** : tous les écrans en 1280px (light + dark)
7. **06 — États & flux** : états vides, erreur, chargement, flux d'inscription, flux de commentaire
8. **07 — Annexes** : iconographie, illustrations, OG images templates

### 15.2 Design tokens

Export JSON des tokens via Figma Variables, format compatible Style Dictionary, prêt à être consommé par le code (Tailwind config).

### 15.3 Spécifications interactives

Pour les écrans clés, fournir un prototype Figma cliquable avec les transitions principales (3–5 écrans).

### 15.4 Guide d'usage

Document court (5–10 pages) expliquant :
- Comment utiliser la palette (do / don't)
- Hiérarchie typographique en pratique
- Comment composer une nouvelle page en respectant le système

---

## 16. Calendrier indicatif

| Étape | Durée | Livrable |
|---|---|---|
| 1. Recherche & moodboard | 2 j | Concept board validé |
| 2. Design tokens & composants de base | 3 j | Système design v1 |
| 3. Maquettes accueil + article + liste | 4 j | 6 écrans (mobile + desktop, light + dark) |
| 4. Recherche + auth + commentaires | 3 j | 8 écrans |
| 5. Profil + mon compte + admin | 2 j | 6 écrans |
| 6. États, errors, illustrations | 2 j | Cohérence finale |
| 7. Prototype + guide | 2 j | Livrables complets |

**Total** : ~18 jours de design senior, soit 3,5 semaines.

---

## 17. Critères d'acceptation design

- [ ] Tous les écrans existent en mobile (375px) ET desktop (1280px)
- [ ] Tous les écrans existent en light ET dark mode
- [ ] Aucun contraste texte/fond ne descend en dessous de 4.5:1 (AA), idéalement 7:1 (AAA)
- [ ] Tous les composants ont au moins 4 états documentés (default, hover, focus, disabled)
- [ ] Le système de design est consistant : pas de couleur hors palette, pas de taille typo hors échelle
- [ ] Les emplacements publicitaires sont identifiés et ne brisent pas l'éditorial
- [ ] Les illustrations / vignettes auto sont documentées avec leur logique de génération
- [ ] Le guide d'usage permet à un autre designer de poursuivre le travail sans questions

---

*Document de brief Design — version 1.0, mai 2026.*
