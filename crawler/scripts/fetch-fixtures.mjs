#!/usr/bin/env node
/**
 * Fetch Aviron Bayonnais fixtures from the ESPN Top 14 endpoint and upsert
 * into public.fixtures. Lets the home page show a real "prochain match"
 * banner without us scraping the LNR HTML (no public API there).
 *
 * Source: site.api.espn.com — free, no key required, structured JSON,
 * updated as matches happen so the same call covers schedule + live score
 * + final score.
 *
 *   DATABASE_URL=...  node crawler/scripts/fetch-fixtures.mjs
 */
import postgres from 'postgres';

const AB_TEAM_ID = '25912';
const LEAGUE_ID  = '270559'; // French Top 14

// The /teams/{id}/schedule endpoint 500s for Top 14, and the league
// scoreboard refuses windows wider than ~6 months. So we walk the
// upcoming + recent months one at a time and stitch the results.
function fmt(d) { return d.toISOString().slice(0, 10).replace(/-/g, ''); }

async function fetchMonth(monthStart) {
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const url = `https://site.api.espn.com/apis/site/v2/sports/rugby/${LEAGUE_ID}/scoreboard?dates=${fmt(monthStart)}-${fmt(monthEnd)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'AUPA-AB-Crawler/0.1 (+https://aupaab.fr/sources)' } });
  if (!r.ok) return [];
  const d = await r.json();
  return d.events || [];
}

const now = new Date();
const months = [];
// Past 2 months for fresh results, next 4 months for upcoming fixtures.
for (let offset = -2; offset <= 4; offset++) {
  const m = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  months.push(m);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

const allEvents = (await Promise.all(months.map(fetchMonth))).flat();
const seen = new Set();
const events = allEvents.filter((ev) => {
  if (!ev?.id || seen.has(ev.id)) return false;
  seen.add(ev.id);
  return (ev.competitions?.[0]?.competitors || []).some(
    (c) => String(c.team?.id || c.id) === AB_TEAM_ID,
  );
});
console.log(`▶ ${allEvents.length} league events across ${months.length} months, ${events.length} involve AB`);

let upserted = 0;
for (const ev of events) {
  const comp = ev.competitions?.[0];
  if (!comp) continue;

  const competitors = comp.competitors || [];
  // ESPN flags one as homeAway:"home", the other "away". Use that.
  const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
  const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];
  if (!home || !away) continue;

  const isHome = String(home.id) === AB_TEAM_ID || String(home.team?.id) === AB_TEAM_ID;
  const status = ev.status?.type?.description || 'Scheduled';
  const homeScore = home.score != null && home.score !== '' ? parseInt(home.score, 10) : null;
  const awayScore = away.score != null && away.score !== '' ? parseInt(away.score, 10) : null;

  const row = {
    id: String(ev.id),
    competition: 'French Top 14',
    round_label: ev.week?.text || comp.notes?.[0]?.headline || null,
    kickoff: new Date(ev.date),
    home_id: String(home.team?.id || home.id),
    away_id: String(away.team?.id || away.id),
    home_short: home.team?.abbreviation || '?',
    away_short: away.team?.abbreviation || '?',
    home_name: home.team?.displayName || home.team?.name || '?',
    away_name: away.team?.displayName || away.team?.name || '?',
    venue: comp.venue?.fullName || null,
    is_home: isHome,
    status,
    home_score: homeScore,
    away_score: awayScore,
  };

  await sql`
    insert into public.fixtures (
      id, competition, round_label, kickoff,
      home_id, away_id, home_short, away_short, home_name, away_name,
      venue, is_home, status, home_score, away_score, fetched_at
    ) values (
      ${row.id}, ${row.competition}, ${row.round_label}, ${row.kickoff},
      ${row.home_id}, ${row.away_id}, ${row.home_short}, ${row.away_short}, ${row.home_name}, ${row.away_name},
      ${row.venue}, ${row.is_home}, ${row.status}, ${row.home_score}, ${row.away_score}, now()
    )
    on conflict (id) do update set
      kickoff = excluded.kickoff,
      status = excluded.status,
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      venue = excluded.venue,
      round_label = excluded.round_label,
      fetched_at = now()
  `;
  upserted++;
  const score = homeScore != null ? `${homeScore}-${awayScore}` : '';
  console.log(`  ${row.kickoff.toISOString().slice(0, 16)}  ${row.home_short}-${row.away_short.padEnd(3)} ${score.padEnd(7)} ${status.padEnd(12)} ${row.venue || ''}`);
}

console.log(`\n✓ upserted ${upserted} fixture(s)`);
await sql.end();
