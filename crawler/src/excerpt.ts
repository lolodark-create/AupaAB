// Brief §5.7 — excerpt generation. Hard cap 350 chars (DB CHECK constraint).
// Brief §1.2: "Jamais de republication intégrale." Stay well below 350.

import sanitizeHtml from 'sanitize-html';
import { stripHtml } from './text.js';

const HARD_LIMIT = 350;
const SOFT_TARGET = 280;

export interface ExcerptInput {
  contentSnippet?: string | null;
  content?: string | null;
  description?: string | null;
}

/**
 * Produces a clean, truncated text suitable for the `articles.excerpt` column.
 * - Strips HTML
 * - Sanitizes residual entities
 * - Truncates to ~280 chars at a word boundary; appends ellipsis
 * - Guaranteed `<= 350` (hard limit, matches DB constraint)
 */
export function generateExcerpt(input: ExcerptInput): string {
  let raw = '';
  if (input.contentSnippet && input.contentSnippet.trim()) {
    raw = input.contentSnippet;
  } else if (input.content && input.content.trim()) {
    raw = stripHtml(input.content);
  } else if (input.description && input.description.trim()) {
    raw = input.description;
  }

  const cleaned = sanitizeHtml(stripHtml(raw), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!cleaned) return '';

  if (cleaned.length <= SOFT_TARGET) {
    return cleaned;
  }

  // Truncate at word boundary near soft target.
  // SOFT_TARGET = 280 < HARD_LIMIT = 350, so the result is guaranteed under the DB constraint.
  const candidate = cleaned.slice(0, SOFT_TARGET - 1);
  const lastSpace = candidate.lastIndexOf(' ');
  const truncated = lastSpace > 0 ? candidate.slice(0, lastSpace) : candidate;
  return `${truncated}…`;
}

export const EXCERPT_HARD_LIMIT = HARD_LIMIT;
