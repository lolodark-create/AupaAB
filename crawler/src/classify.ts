// Brief §5.4 — category classifier.
// Pure heuristics; if multiple match, the most specific wins (mercato > match > coulisses > pays_basque > espoirs > autre).

import { removeAccents } from './text.js';
import type { ArticleCategory } from '@shared/types';

export interface ClassifyInput {
  title?: string | null;
  snippet?: string | null;
}

// Order matters: tested top to bottom; first match wins.
const RULES: ReadonlyArray<{ category: ArticleCategory; patterns: RegExp[] }> = [
  {
    category: 'mercato',
    patterns: [
      /\b(signe|prolong[eé]|prolongation|quitte|recrute|recrutement|d[eé]part|arriv[eé]e|mercato|transfert|rumeur)/i,
    ],
  },
  {
    category: 'match',
    patterns: [
      /\b(match|score|victoire|d[eé]faite|r[eé]sultat|composition|compo|avant[\s-]match|apr[eè]s[\s-]match|coup\s?d['’]envoi|kick[\s-]?off|j-?\d+)\b/i,
    ],
  },
  {
    category: 'espoirs',
    patterns: [
      /\b(jeune|espoir|formation|centre\s+(de\s+)?formation|crabos|reichel|u\s?-?\s?(16|18|20)\b)/i,
    ],
  },
  {
    category: 'pays_basque',
    patterns: [
      /\b(pays\s+basque|biarritz|anglet|saint[\s-]jean[\s-]de[\s-]luz|festival|euskara|euskal)/i,
    ],
  },
  {
    category: 'coulisses',
    patterns: [
      /\b(analyse|interview|coulisses|coulisse|strat[eé]gie|tactique|d[eé]cryptage|portrait|chronique)/i,
    ],
  },
];

export function classifyArticle(input: ClassifyInput): ArticleCategory {
  const text = removeAccents(`${input.title ?? ''} ${input.snippet ?? ''}`.toLowerCase());
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (p.test(text)) return rule.category;
    }
  }
  return 'autre';
}
