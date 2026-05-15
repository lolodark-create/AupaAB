// Visual metadata for known sources (mono initials + brand colour).
// Used to render SourceChip and editorial thumbnails without storing it in DB.
// Add new entries when registering a new source in the crawler.

export interface SourceMeta {
  mono: string;
  color: string;
}

// Source mono badges render `text-white` on this colour, so each color must
// pass WCAG AA (4.5:1 with white) at small font sizes. Originals from
// prototype/data.js darkened where needed: rugbyrama and aupa were ~3:1.
export const SOURCE_META: Record<string, SourceMeta> = {
  'sud-ouest': { mono: 'SO', color: '#C8102E' }, // 5.06:1 ✓
  'la-rep': { mono: 'LR', color: '#1B5E20' },    // 9.34:1 ✓
  rmc: { mono: 'RMC', color: '#003F87' },        // 12.5:1 ✓
  midol: { mono: 'MO', color: '#7B1FA2' },       // 6.59:1 ✓
  lequipe: { mono: 'EQ', color: '#1A1A1A' },     // 17.4:1 ✓
  rugbyrama: { mono: 'RR', color: '#01608F' },   // darkened from #0288D1 (3.4:1 → 6.4:1)
  aupa: { mono: 'AB', color: '#006B9D' },        // darkened from #0099D8 to match brand aviron-text (5.5:1)
  'ici-pb': { mono: 'ICI', color: '#7A0019' },   // ICI brand burgundy, 11.9:1 ✓
  // Added V1.1 after the Google Actu audit — three complementary rugby sources.
  'quinze-mondial': { mono: 'QM', color: '#1E3A8A' }, // navy, 9.9:1 ✓
  'rugbynistere':   { mono: 'RN', color: '#0F766E' }, // teal, 5.1:1 ✓
  'figaro-rugby':   { mono: 'FG', color: '#1F2937' }, // Le Figaro dark, 13.7:1 ✓
};

export function getSourceMeta(slug: string): SourceMeta {
  return SOURCE_META[slug] ?? { mono: '??', color: '#5A6472' };
}
