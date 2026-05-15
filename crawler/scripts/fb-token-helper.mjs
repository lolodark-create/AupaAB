#!/usr/bin/env node
/**
 * One-shot helper to derive a PERMANENT Page Access Token from the FB
 * Developer Console.
 *
 * Why: Graph Explorer hands you a short-lived (1-hour) user token. You
 * need a never-expires page token to put in GitHub Actions. The dance:
 *   1. short-lived user token  → long-lived user token  (60 days)
 *   2. long-lived user token   → page access token       (NEVER expires
 *      when generated from a long-lived user token, per FB docs)
 *
 * Usage:
 *   FB_APP_ID=xxx \
 *   FB_APP_SECRET=xxx \
 *   FB_USER_TOKEN=EAAxxxxx... \
 *   node crawler/scripts/fb-token-helper.mjs
 *
 * Prints the permanent page access token for the AupaAB page — copy that
 * single line into GitHub Actions secrets as FB_PAGE_ACCESS_TOKEN.
 */
const { FB_APP_ID, FB_APP_SECRET, FB_USER_TOKEN } = process.env;
if (!FB_APP_ID || !FB_APP_SECRET || !FB_USER_TOKEN) {
  console.error('FB_APP_ID, FB_APP_SECRET, FB_USER_TOKEN all required');
  process.exit(1);
}

// 1) Short-lived user token → long-lived user token (60-day TTL).
const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${FB_USER_TOKEN}`;
const r1 = await fetch(longLivedUrl);
if (!r1.ok) {
  console.error('long-lived exchange failed:', r1.status, await r1.text());
  process.exit(1);
}
const { access_token: longLivedUser } = await r1.json();
console.log('✓ obtained long-lived user token');

// 2) Long-lived user → list of pages → page access token. The page token
// derived from a long-lived user token is permanent (no expiry).
const r2 = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedUser}`);
if (!r2.ok) {
  console.error('me/accounts failed:', r2.status, await r2.text());
  process.exit(1);
}
const { data: pages } = await r2.json();
const aupa = pages.find((p) =>
  p.name?.toLowerCase().includes('aupa') ||
  p.username?.toLowerCase().includes('aupaab') ||
  p.id === '<the page id>',
);
if (!aupa) {
  console.error('AupaAB page not found among:');
  for (const p of pages) console.error(`  - id=${p.id}  name=${p.name}  user=${p.username || ''}`);
  process.exit(1);
}
console.log(`✓ found page  id=${aupa.id}  name=${aupa.name}`);
console.log('\n=== PERMANENT PAGE ACCESS TOKEN ===');
console.log(aupa.access_token);
console.log('===================================\n');
console.log('Put this single line into GitHub Actions secret FB_PAGE_ACCESS_TOKEN.');
console.log('It will NOT expire (until you change your FB password or revoke it).');
