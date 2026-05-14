// Brief §5.3 — relevance filter "is this article about Aviron Bayonnais?".
// Keep keyword list curated and stable; tests pin behaviour.

import { removeAccents } from './text.js';

export const AB_KEYWORDS: readonly string[] = [
  // Club identity
  'aviron bayonnais',
  'aviron bayonne',
  'ab rugby',
  "l'aviron",
  'aupa ab',
  'aupa, ab',
  'ciel et blanc',
  // Stade
  'jean-dauger',
  'jean dauger',
  'stade de bayonne',
  // Cities & region (with disambiguation: 'bayonne' alone is too broad, we require co-occurrence — see hasContextualBayonne)
  'pays basque',
  // Coaches / staff
  'gregory patat',
  'patat',
  'jean-baptiste aldige',
  // Players (effectif 2025-2026, à mettre à jour à chaque mercato)
  'edwin maka',
  'camille lopez',
  'beka gorgadze',
  'manu tuilagi',
  'tana umaga',
  'spedding',
  'mike spedding',
];

// "Bayonne" alone is too broad (city); require a rugby co-occurrence.
const BAYONNE_RUGBY_CO = ['rugby', 'top 14', 'pro d2', 'maillot', 'tribune', 'mêlée', 'melee', 'match', 'aviron'];

export interface RssLikeItem {
  title?: string | null;
  contentSnippet?: string | null;
  content?: string | null;
  description?: string | null;
  categories?: string[] | null;
}

/**
 * Returns true if the item is plausibly about the Aviron Bayonnais.
 * Pure function: no I/O, deterministic on its inputs.
 */
export function isRelevantToAB(item: RssLikeItem): boolean {
  const haystack = [
    item.title ?? '',
    item.contentSnippet ?? '',
    item.content ?? '',
    item.description ?? '',
    (item.categories ?? []).join(' '),
  ].join(' ');

  if (!haystack.trim()) return false;

  // Normalise: lowercase, accent-fold, hyphens → spaces so "Pays-Basque" matches "pays basque".
  const normalised = removeAccents(haystack.toLowerCase()).replace(/[-_]+/g, ' ');

  // Direct keyword hit
  for (const kw of AB_KEYWORDS) {
    const needle = removeAccents(kw.toLowerCase()).replace(/[-_]+/g, ' ');
    if (normalised.includes(needle)) return true;
  }

  // Indirect: "bayonne" + rugby co-occurrence
  if (normalised.includes('bayonne')) {
    for (const co of BAYONNE_RUGBY_CO) {
      if (normalised.includes(removeAccents(co.toLowerCase()))) return true;
    }
  }

  return false;
}
