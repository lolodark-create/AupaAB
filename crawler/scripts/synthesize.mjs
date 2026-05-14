#!/usr/bin/env node
/**
 * Synthesize article excerpts in the AUPA AB editorial tone.
 *
 * Each new article gets a 2-sentence supporter-perspective synthesis that
 * replaces the raw RSS excerpt on the card. Picks up articles where
 * ai_synthesis IS NULL and calls Claude Haiku.
 *
 * Why Claude Haiku: cheap (<$0.001/article), fast (<1s), and quality is
 * fine for 200-character editorial blurbs. Falls back gracefully if the
 * API key is missing — the UI uses the raw excerpt in that case.
 *
 * Usage:
 *   DATABASE_URL=...  ANTHROPIC_API_KEY=sk-ant-...  node crawler/scripts/synthesize.mjs
 *   --limit=5     # synth at most 5 articles this run (default 20)
 *   --force       # re-synth articles that already have one
 *   --dry-run     # print prompts and would-be syntheses without writing
 */
import postgres from 'postgres';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const MODEL = process.env.ANTHROPIC_MODEL_SYNTHESIS || 'claude-haiku-4-5-20251001';

if (!DATABASE_URL) {
  console.error('error: DATABASE_URL required');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.log('⚠ ANTHROPIC_API_KEY not set — skipping synthesis (UI will fall back to raw excerpts)');
  process.exit(0);
}

const args = process.argv.slice(2);
const LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '20', 10);
const FORCE = args.includes('--force');
const DRY = args.includes('--dry-run');

// ─── Prompt ───────────────────────────────────────────────────────────────
// The tone is the central design decision: a Tribune-Sud supporter
// summarizing the article to a mate, not a journalist's lede. Examples
// help the model stay on register; without them it defaults to clickbait.
const SYSTEM_PROMPT = `Tu es l'éditeur d'AUPA AB, un agrégateur d'actualités non-officiel sur l'Aviron Bayonnais (Top 14). Le ton du site est celui d'un supporter qui parle à ses copains en Tribune Sud du stade Jean-Dauger : direct, concret, légèrement ironique mais toujours bienveillant envers le club.

À partir du titre et de l'extrait de l'article, rédige une synthèse de 1 à 2 phrases (140-200 caractères au total) qui donne l'essentiel sans clickbait.

Règles strictes :
- Première personne du pluriel ("on", "nous") plutôt que "le club" ou "les Bayonnais"
- Cite les noms propres pertinents (joueurs, scores, adversaires, dates)
- Aucun superlatif vide : pas de "incroyable", "exceptionnel", "fabuleux"
- Aucune question rhétorique
- Aucun emoji, aucun anglicisme
- Français, ponctuation correcte
- Termine par un point. Jamais par "..."
- Réponds UNIQUEMENT avec la synthèse. Aucun préambule, aucun guillemet, aucune balise.

Exemples du ton recherché :

Titre: « Tous mes soucis sont derrière moi » : Baptiste Heguy va rejouer
Extrait: Trois mois et demi après avoir été séché par un syndrome opsoclonus-myoclonus...
Synthèse: Le retour qu'on espérait : Heguy revient à 100% après trois mois loin du terrain. Direction Lyon ce week-end pour rejouer un bout de saison.

Titre: Top 14 - Bayonne : Andrea Moretti de passage, Tevita Tatafu disponible
Extrait: La composition pour le déplacement à Lyon est presque connue...
Synthèse: Tatafu enfin opérationnel pour le voyage à Lyon, Moretti seulement de passage. Le pack devrait avoir une vraie gueule samedi soir.

Titre: ANALYSE. « Notre concentration n'est pas au niveau » : l'Aviron Bayonnais encore loin du compte à Toulon
Extrait: Largement battus 52-26 sur la Rade...
Synthèse: 52-26 à Toulon, dixième défaite de l'année. On ne sait plus si c'est la concentration ou autre chose, mais le compteur tourne dans le mauvais sens.`;

function userPrompt(article) {
  return `Titre: ${article.title}
Source: ${article.source_name}
Date: ${new Date(article.published_at).toISOString().slice(0, 10)}
Extrait: ${article.excerpt || '(pas d\'extrait disponible)'}

Synthèse :`;
}

// ─── Anthropic API call ───────────────────────────────────────────────────
async function synthesize(article) {
  const body = {
    model: MODEL,
    max_tokens: 200,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt(article) }],
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`anthropic ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.content?.[0]?.text || '').trim();
  // Strip any wrapping quotes the model occasionally adds.
  return text.replace(/^["«"„'']+|["»"'']+$/g, '').trim();
}

// ─── Run ──────────────────────────────────────────────────────────────────
const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

const where = FORCE ? sql`` : sql`where a.ai_synthesis is null`;
const articles = await sql`
  select a.id, a.title, a.excerpt, a.published_at, s.name as source_name
  from public.articles a
  join public.sources s on s.id = a.source_id
  ${where}
  order by a.published_at desc
  limit ${LIMIT}
`;

console.log(`▶ ${articles.length} article(s) to synthesize${DRY ? ' (DRY RUN)' : ''}`);

let ok = 0;
let fail = 0;
for (const a of articles) {
  process.stdout.write(`  ${a.title.slice(0, 60).padEnd(60)} ... `);
  try {
    const synthesis = await synthesize(a);
    if (!synthesis) throw new Error('empty response');
    if (DRY) {
      console.log('\n     →', synthesis);
    } else {
      await sql`update public.articles set ai_synthesis = ${synthesis} where id = ${a.id}`;
      console.log(`✓ (${synthesis.length} chars)`);
      console.log(`     → ${synthesis}`);
    }
    ok++;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    fail++;
  }
  // Rate-limit politely
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\n${DRY ? '(dry-run) ' : ''}synthesized=${ok} failed=${fail}`);
await sql.end();
