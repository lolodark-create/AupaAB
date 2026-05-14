-- AUPA AB — seed data for local development
-- Run after migrations with `supabase db reset`.

-- ---------------------------------------------------------
-- Sources (matches shared/src/mock.ts)
-- ---------------------------------------------------------
insert into public.sources (slug, name, domain, feed_url, is_active, fetch_interval) values
  ('sud-ouest',  'Sud Ouest',                  'sudouest.fr',                'https://www.sudouest.fr/sport/rugby/aviron-bayonnais/rss.xml', true, 900),
  ('la-rep',     'La République des Pyrénées', 'larepubliquedespyrenees.fr', 'https://www.larepubliquedespyrenees.fr/rss.xml',               true, 900),
  ('rmc',        'RMC Sport',                  'rmcsport.bfmtv.com',         'https://rmcsport.bfmtv.com/rss/rugby/',                        true, 900),
  ('midol',      'Midi Olympique',             'midi-olympique.fr',          'https://www.midi-olympique.fr/rss.xml',                        true, 900),
  ('lequipe',    'L''Équipe',                  'lequipe.fr',                 'https://www.lequipe.fr/rss/actu_rss_Rugby.xml',                true, 900),
  ('rugbyrama',  'Rugbyrama',                  'rugbyrama.fr',               'https://www.rugbyrama.fr/rss.xml',                             true, 900),
  ('aupa',       'AUPA AB',                    'aupa-ab.com',                'https://aupa-ab.com/rss.xml',                                  true, 900)
on conflict (slug) do nothing;

-- ---------------------------------------------------------
-- Articles (a handful — the crawler will populate the rest)
-- ---------------------------------------------------------
with src as (
  select id, slug from public.sources
)
insert into public.articles (slug, title, source_id, source_url, excerpt, author, published_at, category, tags, reading_time_sec, cover_variant)
select
  v.slug, v.title, src.id, v.source_url, v.excerpt, v.author, v.published_at, v.category, v.tags, v.reading_time_sec, v.cover_variant
from (values
  (
    'edwin-maka-prolonge-deux-saisons',
    'Edwin Maka prolonge deux saisons : « Bayonne, c''est devenu chez moi (le piment d''Espelette aussi) »',
    'sud-ouest',
    'https://www.sudouest.fr/sport/rugby/aviron-bayonnais/edwin-maka-prolonge',
    'Le troisième-ligne fidjien, arrivé en 2022, a paraphé un nouveau contrat jusqu''en 2028. Le club tient l''un de ses cadres, à un moment où le marché s''affole.',
    'Pierre Lasserre',
    now() - interval '1 hour',
    'mercato'::public.article_category,
    array['Mercato', 'Edwin Maka', 'Prolongation', 'Top 14'],
    240,
    'night'
  ),
  (
    'avant-match-bayonne-toulouse',
    'Avant-match Bayonne — Toulouse : et si, cette fois, on osait y croire ?',
    'aupa',
    'https://aupa-ab.com/article/avant-match-bayonne-toulouse',
    'Samedi, à Jean-Dauger, l''AB reçoit le champion de France en titre. Sept ans qu''on n''avait pas battu ces gens-là à la maison. Sept. Ans. Mais.',
    'La rédaction AUPA',
    now() - interval '3 hours',
    'match'::public.article_category,
    array['Top 14', 'Toulouse', 'Jean-Dauger'],
    360,
    'aviron'
  ),
  (
    'camille-lopez-vintage',
    'Camille Lopez : « Je ne suis pas vieux, je suis vintage »',
    'rmc',
    'https://rmcsport.bfmtv.com/rugby/camille-lopez-vintage',
    'À 36 ans, l''ouvreur basque est interrogé sur sa fin de carrière. Réponse en forme de pirouette, en plein milieu d''une conférence de presse qui partait sur autre chose.',
    'Mathieu Lartot',
    now() - interval '5 hours',
    'coulisses'::public.article_category,
    array['Camille Lopez', 'Coulisses'],
    180,
    'sand'
  ),
  (
    'mercato-rumeurs-classement',
    'Mercato : les rumeurs de fin de saison, classées de « sérieuse » à « franchement délirante »',
    'midol',
    'https://www.midi-olympique.fr/article/mercato-rumeurs',
    'On a passé les bruits de couloir au filtre. Spedding à Bayonne ? Sérieux. Beauden Barrett à Jean-Dauger ? Plus tendu. Notre tri.',
    'Léo Faure',
    now() - interval '7 hours',
    'mercato'::public.article_category,
    array['Mercato', 'Rumeurs'],
    300,
    'night'
  ),
  (
    'derby-biarritz-pro-d2',
    'Derby : le BO en Pro D2 l''an prochain. On peut en parler ?',
    'aupa',
    'https://aupa-ab.com/article/derby-biarritz',
    'Le voisin va passer une dixième saison hors du Top 14. Personne, ici, n''ose vraiment se réjouir. Personne ne va pleurer non plus.',
    'AUPA AB',
    now() - interval '2 days',
    'pays_basque'::public.article_category,
    array['Biarritz', 'Derby'],
    240,
    'wave'
  )
) as v(slug, title, source_slug, source_url, excerpt, author, published_at, category, tags, reading_time_sec, cover_variant)
join src on src.slug = v.source_slug
on conflict (slug) do nothing;
