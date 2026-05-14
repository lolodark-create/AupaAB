import { describe, it, expect } from 'vitest';
import { isRelevantToAB } from '../src/filter';

describe('isRelevantToAB', () => {
  it('matches direct club mention in title', () => {
    expect(isRelevantToAB({ title: "L'Aviron Bayonnais s'incline à La Rochelle" })).toBe(true);
  });

  it('matches with diacritics removed', () => {
    expect(isRelevantToAB({ title: 'Le derby aux Pays-Basque a tenu ses promesses' })).toBe(true);
  });

  it('matches "jean-dauger" in content', () => {
    expect(isRelevantToAB({ title: 'Match du week-end', contentSnippet: 'Affluence record à Jean-Dauger samedi soir' })).toBe(true);
  });

  it('matches a current player', () => {
    expect(isRelevantToAB({ title: 'Edwin Maka prolonge deux saisons' })).toBe(true);
  });

  it('matches coach name', () => {
    expect(isRelevantToAB({ title: 'Patat avant Toulouse : "On ne va pas leur faire un cadeau"' })).toBe(true);
  });

  it('matches "aupa ab" as a phrase', () => {
    expect(isRelevantToAB({ description: 'Édito publié sur AUPA AB' })).toBe(true);
  });

  it('matches "ciel et blanc" identity phrase', () => {
    expect(isRelevantToAB({ contentSnippet: 'Les ciel et blanc reprennent la tête' })).toBe(true);
  });

  it('matches via categories array', () => {
    expect(isRelevantToAB({ title: 'Mercato', categories: ['Rugby', 'Aviron Bayonnais'] })).toBe(true);
  });

  it('does NOT match an unrelated article', () => {
    expect(isRelevantToAB({ title: 'Real Madrid : Mbappé blessé', contentSnippet: 'Football espagnol' })).toBe(false);
  });

  it('does NOT match a Stade Toulousain-only article', () => {
    expect(isRelevantToAB({ title: 'Top 14 : le Stade Toulousain en démonstration', contentSnippet: 'Antoine Dupont décisif' })).toBe(false);
  });

  it('does NOT match "Bayonne" alone (city is too broad)', () => {
    expect(isRelevantToAB({ title: 'Manifestation à Bayonne', contentSnippet: 'Cortège dans le centre' })).toBe(false);
  });

  it('DOES match "Bayonne" + rugby co-occurrence', () => {
    expect(isRelevantToAB({ title: 'À Bayonne, le rugby a animé tout le week-end', contentSnippet: 'Stadium plein' })).toBe(true);
  });

  it('handles empty / null inputs gracefully', () => {
    expect(isRelevantToAB({})).toBe(false);
    expect(isRelevantToAB({ title: '' })).toBe(false);
    expect(isRelevantToAB({ title: null, content: null })).toBe(false);
  });

  it('returns true when matched in `content`', () => {
    expect(isRelevantToAB({ content: '<p>Match nul pour l\'Aviron Bayonnais</p>' })).toBe(true);
  });
});
