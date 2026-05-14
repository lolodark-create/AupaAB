// Brief §5.6 — slug generation.
// `${slugified-title}-${6-char-suffix}` so the slug stays readable but collisions are improbable.

import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

const SUFFIX_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/1/I/l/o ambiguity
const makeSuffix = customAlphabet(SUFFIX_ALPHABET, 6);

const TITLE_MAX = 80;

export interface SlugOptions {
  // For tests / deterministic seeding
  suffix?: string;
}

export function generateSlug(title: string, opts: SlugOptions = {}): string {
  const base = slugify(title.trim(), {
    lower: true,
    strict: true,
    locale: 'fr',
    trim: true,
  });
  const truncated = base.length > TITLE_MAX ? base.slice(0, TITLE_MAX).replace(/-+$/, '') : base;
  const safeBase = truncated || 'article';
  const suffix = opts.suffix ?? makeSuffix();
  return `${safeBase}-${suffix}`;
}
