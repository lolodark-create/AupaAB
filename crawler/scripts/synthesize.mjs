#!/usr/bin/env node
/**
 * Synthesize article TITLE + EXCERPT in the AUPA AB editorial tone.
 *
 * One Claude call per article produces both:
 *   - ai_title       (3-7 words, headline-editor punch line)
 *   - ai_synthesis   (2 sentences, ~150 chars, supporter perspective)
 *
 * Why one call: cheaper (no double system-prompt charge), more coherent
 * (the model sees both targets at once), and atomically written so a card
 * never shows the new title with the old synthesis or vice versa.
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
  console.log('⚠ ANTHROPIC_API_KEY not set — skipping synthesis (UI will fall back to raw title/excerpt)');
  process.exit(0);
}

const args = process.argv.slice(2);
const LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '20', 10);
const FORCE = args.includes('--force');
const DRY = args.includes('--dry-run');

// ─── Prompt ───────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'éditeur d'AUPA AB, un agrégateur d'actualités non-officiel sur l'Aviron Bayonnais (Top 14). Le ton du site est celui d'un supporter qui parle à ses copains en Tribune Sud du stade Jean-Dauger : direct, concret, légèrement ironique mais toujours bienveillant envers le club.

À partir du titre et de l'extrait de l'article source, tu produis DEUX choses :

1. TITRE — un titre court, le nectar de l'information en 3 à 7 mots. Le titre journalistique original est souvent long et clickbait ; toi tu donnes l'info centrale d'un coup, comme une manchette de journal. Cite des faits concrets (joueur, score, date, adversaire) plutôt que des formules vagues.

2. SYNTHESE — 1 à 2 phrases (140-200 caractères) qui développent. Première personne du pluriel ("on", "nous"). Cite les noms propres pertinents.

Règles strictes pour les deux :
- **N'INVENTE AUCUN FAIT.** Tu ne dois utiliser que les faits qui apparaissent
  EXPLICITEMENT dans le titre ou l'extrait de l'article ci-dessous. Si une
  information n'y est pas, tu ne la mentionnes PAS, point. Cas typiques à NE
  JAMAIS deviner : chaîne TV (Canal+, France Télévisions, Eurosport…),
  horaire exact, score final, classement, nom de joueur, blessure, palmarès.
  Plutôt vague ("en direct samedi soir") qu'inventé ("à 21h05 sur Canal+").
- Aucun superlatif vide (incroyable, exceptionnel, fabuleux)
- Aucune question rhétorique
- Aucun emoji, aucun anglicisme
- Français, ponctuation correcte
- Termine par un point, jamais par "..."
- Pas de guillemets autour de la sortie

Format de réponse STRICT — exactement cette structure, rien d'autre :
TITRE: <ton titre court>
SYNTHESE: <ta synthèse>

Exemples du registre attendu :

ARTICLE: « Tous mes soucis sont derrière moi » : Baptiste Heguy va rejouer
EXTRAIT: Trois mois et demi après avoir été séché par un syndrome opsoclonus-myoclonus...
TITRE: Heguy revient après trois mois
SYNTHESE: Le retour qu'on espérait : Heguy revient à 100% après cette saleté de virus rare. Direction Lyon ce week-end pour rejouer.

ARTICLE: Top 14 - Bayonne : Andrea Moretti de passage, Tevita Tatafu disponible pour défier Lyon
EXTRAIT: La composition pour le déplacement à Lyon est presque connue...
TITRE: Tatafu opérationnel pour Lyon
SYNTHESE: Tatafu enfin opérationnel pour le voyage à Lyon, Moretti seulement de passage. Le pack devrait avoir une vraie gueule samedi soir.

ARTICLE: ANALYSE. « Notre concentration n'est pas au niveau » : l'Aviron Bayonnais encore loin du compte à Toulon
EXTRAIT: Largement battus 52-26 sur la Rade...
TITRE: AB sombre à Toulon (52-26)
SYNTHESE: 52-26 à Toulon, dixième défaite de l'année. On ne sait plus si c'est la concentration ou autre chose, mais le compteur tourne dans le mauvais sens.

ARTICLE: Aviron Bayonnais : Esteban Capilla sur le départ dès cet été ?
EXTRAIT: Les discussions traînent pour prolonger Capilla au-delà de 2027...
TITRE: Capilla vers la sortie cet été
SYNTHESE: Les discussions traînent pour prolonger Capilla au-delà de 2027. Le président Tayeb négocie mais rien n'est encore signé et un départ cet été n'est pas exclu.`;

function userPrompt(article) {
  return `ARTICLE: ${article.title}
SOURCE: ${article.source_name}
DATE: ${new Date(article.published_at).toISOString().slice(0, 10)}
EXTRAIT: ${article.excerpt || '(pas d\'extrait disponible)'}

Réponds maintenant au format demandé :`;
}

function parseResponse(text) {
  const tMatch = text.match(/TITRE\s*:\s*(.+?)(?=\n|$)/i);
  const sMatch = text.match(/SYNTHESE\s*:\s*([\s\S]+?)(?:\n\n|$)/i);
  const title = tMatch?.[1]?.trim().replace(/^["«"„'']+|["»"'']+\.?$/g, '').replace(/\.$/, '').trim();
  const synthesis = sMatch?.[1]?.trim().replace(/^["«"„'']+|["»"'']+$/g, '').trim();
  return { title, synthesis };
}

async function synthesize(article) {
  const body = {
    model: MODEL,
    max_tokens: 350,
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
  return parseResponse(text);
}

// ─── Run ──────────────────────────────────────────────────────────────────
const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

// Pick articles missing EITHER field, so the script repopulates ai_title for
// pre-V1.1 articles that already have ai_synthesis.
const where = FORCE ? sql`` : sql`where a.ai_title is null or a.ai_synthesis is null`;
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
  process.stdout.write(`  ${a.title.slice(0, 60).padEnd(60)} `);
  try {
    const { title, synthesis } = await synthesize(a);
    if (!title || !synthesis) throw new Error('parse failed');
    if (DRY) {
      console.log(`(dry)`);
      console.log(`     T: ${title}`);
      console.log(`     S: ${synthesis}`);
    } else {
      await sql`update public.articles set ai_title = ${title}, ai_synthesis = ${synthesis} where id = ${a.id}`;
      console.log(`✓`);
      console.log(`     T: ${title}`);
      console.log(`     S: ${synthesis}`);
    }
    ok++;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\n${DRY ? '(dry-run) ' : ''}synthesized=${ok} failed=${fail}`);
await sql.end();
