// AUPA AB — mock data
// Lifted from prototype/data.js and reshaped to match the Supabase schema.
// Used in SSR pages until the real DB is wired up.

import type { Article, ArticleWithSource, CommentWithAuthor, Source } from './types';

const now = new Date('2026-05-14T10:00:00Z');
const minutesAgo = (n: number) => new Date(now.getTime() - n * 60_000).toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

export const SOURCES: Record<string, Source & { mono: string; color: string }> = {
  'sud-ouest': {
    id: 'src-sudouest',
    slug: 'sud-ouest',
    name: 'Sud Ouest',
    domain: 'sudouest.fr',
    feed_url: 'https://www.sudouest.fr/sport/rugby/aviron-bayonnais/rss.xml',
    logo_url: null,
    is_active: true,
    fetch_interval: 900,
    last_fetched_at: minutesAgo(2),
    created_at: daysAgo(120),
    mono: 'SO',
    color: '#C8102E',
  },
  'la-rep': {
    id: 'src-larep',
    slug: 'la-rep',
    name: 'La République des Pyrénées',
    domain: 'larepubliquedespyrenees.fr',
    feed_url: 'https://www.larepubliquedespyrenees.fr/rss.xml',
    logo_url: null,
    is_active: true,
    fetch_interval: 900,
    last_fetched_at: minutesAgo(3),
    created_at: daysAgo(120),
    mono: 'LR',
    color: '#1B5E20',
  },
  rmc: {
    id: 'src-rmc',
    slug: 'rmc',
    name: 'RMC Sport',
    domain: 'rmcsport.bfmtv.com',
    feed_url: 'https://rmcsport.bfmtv.com/rss/rugby/',
    logo_url: null,
    is_active: true,
    fetch_interval: 900,
    last_fetched_at: minutesAgo(5),
    created_at: daysAgo(120),
    mono: 'RMC',
    color: '#003F87',
  },
  midol: {
    id: 'src-midol',
    slug: 'midol',
    name: 'Midi Olympique',
    domain: 'midi-olympique.fr',
    feed_url: 'https://www.midi-olympique.fr/rss.xml',
    logo_url: null,
    is_active: true,
    fetch_interval: 900,
    last_fetched_at: minutesAgo(7),
    created_at: daysAgo(120),
    mono: 'MO',
    color: '#7B1FA2',
  },
  lequipe: {
    id: 'src-lequipe',
    slug: 'lequipe',
    name: "L'Équipe",
    domain: 'lequipe.fr',
    feed_url: 'https://www.lequipe.fr/rss/actu_rss_Rugby.xml',
    logo_url: null,
    is_active: true,
    fetch_interval: 900,
    last_fetched_at: minutesAgo(4),
    created_at: daysAgo(120),
    mono: 'EQ',
    color: '#1A1A1A',
  },
  rugbyrama: {
    id: 'src-rugbyrama',
    slug: 'rugbyrama',
    name: 'Rugbyrama',
    domain: 'rugbyrama.fr',
    feed_url: 'https://www.rugbyrama.fr/rss.xml',
    logo_url: null,
    is_active: true,
    fetch_interval: 900,
    last_fetched_at: minutesAgo(6),
    created_at: daysAgo(120),
    mono: 'RR',
    color: '#0288D1',
  },
  aupa: {
    id: 'src-aupa',
    slug: 'aupa',
    name: 'AUPA AB',
    domain: 'aupa-ab.fr',
    feed_url: 'https://aupa-ab.fr/rss.xml',
    logo_url: null,
    is_active: true,
    fetch_interval: 900,
    last_fetched_at: minutesAgo(1),
    created_at: daysAgo(60),
    mono: 'AB',
    color: '#0099D8',
  },
};

interface MockArticle extends ArticleWithSource {
  // Extra fields from prototype that aren't in the DB schema but are useful for UI
  lede?: string;
  body?: string[];
  time_label: string;
  date_label: string;
  reading_min: number;
  source_key: string;
}

const a = (
  partial: Omit<MockArticle, 'id' | 'source_id' | 'source_url' | 'fetched_at' | 'created_at' | 'updated_at' | 'view_count' | 'is_published' | 'is_pinned' | 'reading_time_sec' | 'cover_image_url' | 'source'>,
): MockArticle => {
  const src = SOURCES[partial.source_key];
  return {
    id: partial.slug,
    source_id: src.id,
    source_url: `https://${src.domain}/articles/${partial.slug}`,
    fetched_at: partial.published_at,
    created_at: partial.published_at,
    updated_at: partial.published_at,
    view_count: 0,
    is_published: true,
    is_pinned: false,
    reading_time_sec: partial.reading_min * 60,
    cover_image_url: null,
    source: { name: src.name, slug: src.slug, domain: src.domain, logo_url: src.logo_url },
    ...partial,
  };
};

export const ARTICLES: MockArticle[] = [
  a({
    slug: 'edwin-maka-prolonge-deux-saisons',
    title:
      "Edwin Maka prolonge deux saisons : « Bayonne, c'est devenu chez moi (le piment d'Espelette aussi) »",
    excerpt:
      "Le troisième-ligne fidjien, arrivé en 2022, a paraphé un nouveau contrat jusqu'en 2028. Le club tient l'un de ses cadres, à un moment où le marché s'affole.",
    lede:
      "Le troisième-ligne fidjien, arrivé en 2022, a paraphé un nouveau contrat jusqu'en 2028. Le club tient l'un de ses cadres, à un moment où le marché s'affole.",
    body: [
      "Il y a des signatures qui font du bruit, et il y a des signatures qui en disent long. Celle d'Edwin Maka, finalisée mardi en fin d'après-midi dans les bureaux de la rue des Allées Paulmy, appartient à la seconde catégorie. Le troisième-ligne fidjien de 30 ans s'engage avec l'Aviron Bayonnais jusqu'au 30 juin 2028.",
      "« On en discutait depuis février », confirme le directeur sportif Jean-Baptiste Aldigé. « Edwin était attendu ailleurs — on ne va pas se mentir, deux clubs anglais étaient passés à l'offensive. Mais il y avait une volonté commune de continuer, et ça simplifie beaucoup de choses ».",
      "Sur le terrain, l'ailier de la troisième-ligne ciel et blanc affiche cette saison son meilleur ratio plaquages-courses (89 % de réussite, 14 turnovers gagnés). Hors du terrain, le bonhomme s'est intégré au point d'envoyer ses enfants à l'école bilingue d'Anglet. C'est ce genre de détails qui pèsent, parfois plus que les zéros sur le contrat.",
      "Il y a aussi, quelque part, l'aveu d'un projet sportif. Quand un joueur de ce calibre, sollicité ailleurs, choisit de rester dans un club qui a connu le purgatoire de la Pro D2 il y a quatre saisons, c'est qu'il croit à quelque chose. Reste à voir ce que ça donne en mai prochain.",
    ],
    author: 'Pierre Lasserre',
    published_at: minutesAgo(60),
    time_label: 'il y a 1 h',
    date_label: '14 mai 2026',
    reading_min: 4,
    category: 'mercato',
    tags: ['Mercato', 'Edwin Maka', 'Prolongation', 'Top 14'],
    comment_count: 28,
    source_key: 'sud-ouest',
  }),
  a({
    slug: 'avant-match-bayonne-toulouse',
    title:
      "Avant-match Bayonne — Toulouse : et si, cette fois, on osait y croire ?",
    excerpt:
      "Samedi, à Jean-Dauger, l'AB reçoit le champion de France en titre. Sept ans qu'on n'avait pas battu ces gens-là à la maison. Sept. Ans. Mais.",
    lede:
      "Samedi, à Jean-Dauger, l'AB reçoit le champion de France en titre. Sept ans qu'on n'avait pas battu ces gens-là à la maison. Sept. Ans. Mais.",
    author: 'La rédaction AUPA',
    published_at: minutesAgo(180),
    time_label: 'il y a 3 h',
    date_label: '14 mai 2026',
    reading_min: 6,
    category: 'match',
    tags: ['Top 14', 'Toulouse', 'Jean-Dauger'],
    comment_count: 47,
    source_key: 'aupa',
  }),
  a({
    slug: 'camille-lopez-vintage',
    title: "Camille Lopez : « Je ne suis pas vieux, je suis vintage »",
    excerpt:
      "À 36 ans, l'ouvreur basque est interrogé sur sa fin de carrière. Réponse en forme de pirouette, en plein milieu d'une conférence de presse qui partait sur autre chose.",
    lede:
      "À 36 ans, l'ouvreur basque est interrogé sur sa fin de carrière. Réponse en forme de pirouette, en plein milieu d'une conférence de presse qui partait sur autre chose.",
    author: 'Mathieu Lartot',
    published_at: minutesAgo(300),
    time_label: 'il y a 5 h',
    date_label: '14 mai 2026',
    reading_min: 3,
    category: 'coulisses',
    tags: ['Camille Lopez', 'Coulisses'],
    comment_count: 53,
    source_key: 'rmc',
  }),
  a({
    slug: 'mercato-rumeurs-classement',
    title:
      'Mercato : les rumeurs de fin de saison, classées de « sérieuse » à « franchement délirante »',
    excerpt:
      'On a passé les bruits de couloir au filtre. Spedding à Bayonne ? Sérieux. Beauden Barrett à Jean-Dauger ? Plus tendu. Notre tri.',
    lede:
      'On a passé les bruits de couloir au filtre. Spedding à Bayonne ? Sérieux. Beauden Barrett à Jean-Dauger ? Plus tendu. Notre tri.',
    author: 'Léo Faure',
    published_at: minutesAgo(420),
    time_label: 'il y a 7 h',
    date_label: '14 mai 2026',
    reading_min: 5,
    category: 'mercato',
    tags: ['Mercato', 'Rumeurs'],
    comment_count: 92,
    source_key: 'midol',
  }),
  a({
    slug: 'la-rochelle-bilan-vestiaire',
    title: "Mêlée fermée : ce qui s'est dit dans le vestiaire après La Rochelle",
    excerpt:
      "Défaite frustrante, indiscipline qui revient, capitaine remonté. On a reconstitué l'heure qui a suivi le coup de sifflet final.",
    lede:
      "Défaite frustrante, indiscipline qui revient, capitaine remonté. On a reconstitué l'heure qui a suivi le coup de sifflet final.",
    author: 'Iban Etcheverry',
    published_at: minutesAgo(540),
    time_label: 'il y a 9 h',
    date_label: '13 mai 2026',
    reading_min: 4,
    category: 'match',
    tags: ['La Rochelle', 'Vestiaire'],
    comment_count: 31,
    source_key: 'la-rep',
  }),
  a({
    slug: 'jean-dauger-travaux-tribune-sud',
    title:
      "Jean-Dauger : la tribune Sud refaite à l'intersaison, les abonnés relogés (sans drame)",
    excerpt:
      "Travaux confirmés. 12 000 places concernées pendant six semaines. Le club a anticipé le casse-tête.",
    lede:
      "Travaux confirmés. 12 000 places concernées pendant six semaines. Le club a anticipé le casse-tête.",
    author: 'Florence Mounet',
    published_at: daysAgo(1),
    time_label: 'hier',
    date_label: '13 mai 2026',
    reading_min: 3,
    category: 'autre',
    tags: ['Stade', 'Travaux'],
    comment_count: 14,
    source_key: 'sud-ouest',
  }),
  a({
    slug: 'crabos-u18-finale',
    title: "Crabos : les U18 en finale, et personne ne l'a vu venir",
    excerpt:
      "Victoire 24-19 face à Toulon dimanche. Trois joueurs surveillés de près par Patat. Le centre de formation respire.",
    lede:
      "Victoire 24-19 face à Toulon dimanche. Trois joueurs surveillés de près par Patat. Le centre de formation respire.",
    author: 'Jean-Marc Larrieu',
    published_at: daysAgo(1),
    time_label: 'hier',
    date_label: '13 mai 2026',
    reading_min: 5,
    category: 'espoirs',
    tags: ['Crabos', 'Formation'],
    comment_count: 19,
    source_key: 'la-rep',
  }),
  a({
    slug: 'gorgadze-capitaine-georgie',
    title:
      'Beka Gorgadze capitaine de la Géorgie : un Bayonnais sur le toit du Caucase',
    excerpt:
      'Officialisation lundi. Première sélection en tant que capitaine prévue contre l\'Italie en juin. Fierté côté Pays Basque.',
    lede:
      'Officialisation lundi. Première sélection en tant que capitaine prévue contre l\'Italie en juin. Fierté côté Pays Basque.',
    author: 'Antoine Bertrand',
    published_at: daysAgo(1),
    time_label: 'hier',
    date_label: '13 mai 2026',
    reading_min: 3,
    category: 'coulisses',
    tags: ['Gorgadze', 'Géorgie'],
    comment_count: 22,
    source_key: 'rugbyrama',
  }),
  a({
    slug: 'derby-biarritz-pro-d2',
    title: "Derby : le BO en Pro D2 l'an prochain. On peut en parler ?",
    excerpt:
      "Le voisin va passer une dixième saison hors du Top 14. Personne, ici, n'ose vraiment se réjouir. Personne ne va pleurer non plus.",
    lede:
      "Le voisin va passer une dixième saison hors du Top 14. Personne, ici, n'ose vraiment se réjouir. Personne ne va pleurer non plus.",
    author: 'AUPA AB',
    published_at: daysAgo(2),
    time_label: 'il y a 2 j',
    date_label: '12 mai 2026',
    reading_min: 4,
    category: 'pays_basque',
    tags: ['Biarritz', 'Derby'],
    comment_count: 187,
    source_key: 'aupa',
  }),
  a({
    slug: 'billetterie-toulouse-derniere-vague',
    title:
      'Bayonne — Toulouse : 200 places remises en vente jeudi à 10h. Bonne chance.',
    excerpt:
      "Désistements du parcage visiteur. La file d'attente sera, comme d'habitude, l'occasion de se faire des amis.",
    lede:
      "Désistements du parcage visiteur. La file d'attente sera, comme d'habitude, l'occasion de se faire des amis.",
    author: 'AB Communication',
    published_at: daysAgo(2),
    time_label: 'il y a 2 j',
    date_label: '12 mai 2026',
    reading_min: 2,
    category: 'autre',
    tags: ['Billetterie'],
    comment_count: 8,
    source_key: 'sud-ouest',
  }),
  a({
    slug: 'tana-umaga-rumeur-anglet',
    title: 'Tana Umaga aperçu à Anglet : la rumeur qui ne meurt jamais',
    excerpt:
      "L'ancien All Black était au Pays Basque dimanche pour le mariage d'un ami. Internet en a tiré les conclusions habituelles.",
    lede:
      "L'ancien All Black était au Pays Basque dimanche pour le mariage d'un ami. Internet en a tiré les conclusions habituelles.",
    author: 'Mathieu Lartot',
    published_at: daysAgo(3),
    time_label: 'il y a 3 j',
    date_label: '11 mai 2026',
    reading_min: 4,
    category: 'coulisses',
    tags: ['Tana Umaga', 'Rumeurs'],
    comment_count: 144,
    source_key: 'rmc',
  }),
  a({
    slug: 'patat-conference-presse-toulouse',
    title: "Patat avant Toulouse : « On ne va pas leur faire un cadeau »",
    excerpt:
      "Conférence de presse plus longue que prévue. L'entraîneur a parlé du XV, de la mêlée, et — un peu — de Spedding.",
    lede:
      "Conférence de presse plus longue que prévue. L'entraîneur a parlé du XV, de la mêlée, et — un peu — de Spedding.",
    author: 'Renaud Bourel',
    published_at: daysAgo(3),
    time_label: 'il y a 3 j',
    date_label: '11 mai 2026',
    reading_min: 3,
    category: 'match',
    tags: ['Grégory Patat', 'Conférence'],
    comment_count: 36,
    source_key: 'lequipe',
  }),
];

// NEXT_MATCH / TRIBUNE / TRENDING removed in V1.1 — they were fake fixture
// data, fake user tribune entries, and fake popularity rankings. We had no
// view tracking yet, no real fixtures source, and no community in V1, so
// keeping the mocks would just have invited regressions. To bring back:
//   - fixtures: scrape LNR or stand up a small fixtures table
//   - trending: enable view-count writes via a beacon, then ORDER BY view_count
//   - tribune: V2 feature, opens with comments

export const COMMENTS: CommentWithAuthor[] = [
  {
    id: 'c1',
    article_id: 'edwin-maka-prolonge-deux-saisons',
    author_id: 'u1',
    parent_id: null,
    body:
      "Excellente nouvelle. Maka c'est exactement le profil qu'on doit garder : il joue dur, il ferme sa bouche, et il sort le grand match quand il faut. Bravo à la cellule sportive.",
    body_rendered:
      "<p>Excellente nouvelle. Maka c'est exactement le profil qu'on doit garder : il joue dur, il ferme sa bouche, et il sort le grand match quand il faut. Bravo à la cellule sportive.</p>",
    is_edited: false,
    edited_at: null,
    status: 'published',
    is_pinned: false,
    like_count: 47,
    report_count: 0,
    ai_toxicity_score: 0.05,
    ai_flags: null,
    created_at: minutesAgo(12),
    author: {
      username: 'paco_pamplemousse',
      display_name: 'Paco',
      avatar_url: null,
      role: 'moderator',
    },
    replies: [
      {
        id: 'c1r1',
        article_id: 'edwin-maka-prolonge-deux-saisons',
        author_id: 'u2',
        parent_id: 'c1',
        body: '@paco_pamplemousse +1. Et puis franchement, voir un type rester pour de bonnes raisons, ça change un peu.',
        body_rendered:
          '<p><a href="/profil/paco_pamplemousse">@paco_pamplemousse</a> +1. Et puis franchement, voir un type rester pour de bonnes raisons, ça change un peu.</p>',
        is_edited: false,
        edited_at: null,
        status: 'published',
        is_pinned: false,
        like_count: 12,
        report_count: 0,
        ai_toxicity_score: 0.02,
        ai_flags: null,
        created_at: minutesAgo(8),
        author: { username: 'ttiki', display_name: 'Ttiki', avatar_url: null, role: 'member' },
      },
    ],
  },
  {
    id: 'c2',
    article_id: 'edwin-maka-prolonge-deux-saisons',
    author_id: 'u3',
    parent_id: null,
    body:
      "Le passage sur l'école bilingue d'Anglet m'a touchée. C'est aussi pour ça qu'on aime ce club : il ne signe pas que des contrats, il accueille des familles.",
    body_rendered:
      "<p>Le passage sur l'école bilingue d'Anglet m'a touchée. C'est aussi pour ça qu'on aime ce club : il ne signe pas que des contrats, il accueille des familles.</p>",
    is_edited: false,
    edited_at: null,
    status: 'published',
    is_pinned: false,
    like_count: 34,
    report_count: 0,
    ai_toxicity_score: 0.03,
    ai_flags: null,
    created_at: minutesAgo(28),
    author: {
      username: 'maite_etxegoyen',
      display_name: 'Maïté',
      avatar_url: null,
      role: 'contributor',
    },
    replies: [],
  },
  {
    id: 'c3',
    article_id: 'edwin-maka-prolonge-deux-saisons',
    author_id: 'u4',
    parent_id: null,
    body: 'Bon. Maintenant on prolonge Capilla et on en reparle.',
    body_rendered: '<p>Bon. Maintenant on prolonge Capilla et on en reparle.</p>',
    is_edited: false,
    edited_at: null,
    status: 'published',
    is_pinned: false,
    like_count: 89,
    report_count: 0,
    ai_toxicity_score: 0.04,
    ai_flags: null,
    created_at: minutesAgo(41),
    author: {
      username: 'le_tonton_du_pignada',
      display_name: 'Le Tonton du Pignada',
      avatar_url: null,
      role: 'member',
    },
    replies: [
      {
        id: 'c3r1',
        article_id: 'edwin-maka-prolonge-deux-saisons',
        author_id: 'u5',
        parent_id: 'c3',
        body: 'On en parle TOUS les jours @le_tonton_du_pignada. Tous. Les. Jours.',
        body_rendered:
          '<p>On en parle TOUS les jours <a href="/profil/le_tonton_du_pignada">@le_tonton_du_pignada</a>. Tous. Les. Jours.</p>',
        is_edited: false,
        edited_at: null,
        status: 'published',
        is_pinned: false,
        like_count: 24,
        report_count: 0,
        ai_toxicity_score: 0.05,
        ai_flags: null,
        created_at: minutesAgo(32),
        author: { username: 'dauger_forever', display_name: 'Dauger', avatar_url: null, role: 'member' },
      },
    ],
  },
];

export const POPULAR_SEARCHES = [
  'Spedding',
  'Mercato 2026',
  'Jean-Dauger',
  'Tana Umaga',
  'Top 14',
  'Patat',
];

export type { MockArticle };
