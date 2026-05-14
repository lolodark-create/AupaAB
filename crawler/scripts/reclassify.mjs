#!/usr/bin/env node
/**
 * Re-classify all articles in DB using the latest classifyArticle() rules.
 * Keep this in sync with the same function in ingest-once.mjs.
 *
 *   DATABASE_URL=postgres://... node crawler/scripts/reclassify.mjs
 */
import postgres from 'postgres';

function removeAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const CLASS_RULES = [
  ['mercato',     /\b(signe|signature|prolong[eé]|prolongation|quitte|recrute|recrutement|d[eé]part|arriv[eé]e|mercato|transfert|rumeur|cl[oô]ture\s+du\s+mercato|s['’]engage|paraphe)/i],
  ['espoirs',     /\b(crabos|reichel|u\s?-?\s?(16|18|20)\b|centre\s+(de\s+)?formation|jeune\s+(joueur|talent|espoir)|p[eé]pinière|cadets)/i],
  ['coulisses',   /\b(analyse|interview|coulisses?|strat[eé]gie|tactique|d[eé]cryptage|portrait|chronique|confidences?|témoignage|t[eé]moigne|d[eé]claration)/i],
  ['match',       /\b(match|score|victoire|d[eé]faite|r[eé]sultat|composition|compo|avant[\s-]match|apr[eè]s[\s-]match|coup\s?d['’]envoi|kick[\s-]?off|j-?\d+|s['’]incline|l['’]emporte|re[çc]oit|d[eé]place|finale|demi[\s-]finale|quart|maintien|top\s?14|pro\s?d2|champions?\s+cup|challenge\s+cup|barrage|playoffs?|XV\s+de\s+d[eé]part|essai|m[eê]l[eé]e)/i],
  ['pays_basque', /\b(pays\s+basque|biarritz\s+olympique|euskara|euskal|pelote\s+basque|ikurri[nñ]a|herri\s+urrats|fronton|ikastola)/i],
];

function classifyArticle(title, snippet) {
  const t = removeAccents(`${title || ''} ${snippet || ''}`.toLowerCase());
  for (const [cat, re] of CLASS_RULES) {
    if (re.test(t)) return cat;
  }
  return 'autre';
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });
const articles = await sql`select id, title, excerpt, category from articles`;
console.log(`▶ ${articles.length} articles to re-classify`);

let updated = 0;
const breakdown = {};
for (const a of articles) {
  const newCat = classifyArticle(a.title, a.excerpt);
  breakdown[newCat] = (breakdown[newCat] || 0) + 1;
  if (newCat !== a.category) {
    await sql`update articles set category = ${newCat} where id = ${a.id}`;
    updated++;
    console.log(`  ${a.category.padEnd(12)} → ${newCat.padEnd(12)}  ${a.title.slice(0, 60)}`);
  }
}

console.log('\n── Final distribution ──');
for (const [cat, c] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(15)} ${c}`);
}
console.log(`\n✓ done. ${updated} updated.`);

await sql.end();
