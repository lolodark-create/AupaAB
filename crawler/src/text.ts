// Lower-level text helpers — pure, deterministic.

/**
 * Strip diacritics so "éàç" → "eac". Uses NFD normalization which is the
 * standard cross-runtime approach and doesn't require an external table.
 */
export function removeAccents(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Crude HTML stripper. The crawler also runs sanitize-html, but for the
 * relevance filter and excerpt we want a fast plain-text view of the content.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
