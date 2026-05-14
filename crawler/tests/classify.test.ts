import { describe, it, expect } from 'vitest';
import { classifyArticle } from '../src/classify';

describe('classifyArticle', () => {
  it('classifies a mercato signing', () => {
    expect(classifyArticle({ title: 'Edwin Maka prolonge deux saisons' })).toBe('mercato');
    expect(classifyArticle({ title: 'Spedding signe à Bayonne, c\'est officiel' })).toBe('mercato');
    expect(classifyArticle({ title: 'Mercato : les rumeurs de fin de saison' })).toBe('mercato');
  });

  it('classifies a match preview / report', () => {
    expect(classifyArticle({ title: 'Bayonne — Toulouse : la compo', snippet: '' })).toBe('match');
    expect(classifyArticle({ title: 'Score final : 24-19, victoire bayonnaise' })).toBe('match');
    expect(classifyArticle({ title: 'Avant-match : ce qu\'il faut savoir' })).toBe('match');
    expect(classifyArticle({ title: 'J-3 avant le choc' })).toBe('match');
  });

  it('classifies espoirs / centre de formation', () => {
    expect(classifyArticle({ title: 'Crabos : les U18 en finale' })).toBe('espoirs');
    expect(classifyArticle({ title: 'Le centre de formation tient sa pépite' })).toBe('espoirs');
    expect(classifyArticle({ title: 'Reichel : Bayonne au troisième tour' })).toBe('espoirs');
  });

  it('classifies pays_basque content', () => {
    expect(classifyArticle({ title: 'Festival basque à Saint-Jean-de-Luz' })).toBe('pays_basque');
    expect(classifyArticle({ title: 'Derby : Biarritz vs Bayonne, encore' })).toBe('pays_basque');
    expect(classifyArticle({ title: 'Anglet : un nouveau partenariat club-école' })).toBe('pays_basque');
  });

  it('classifies coulisses / analysis', () => {
    expect(classifyArticle({ title: 'Analyse : pourquoi la mêlée bayonnaise tient' })).toBe('coulisses');
    expect(classifyArticle({ title: 'Interview : "Je veux finir ma carrière ici"' })).toBe('coulisses');
    expect(classifyArticle({ title: 'Coulisses du vestiaire après La Rochelle' })).toBe('coulisses');
    expect(classifyArticle({ title: 'Portrait : le nouveau capitaine' })).toBe('coulisses');
  });

  it('falls back to "autre" when nothing matches', () => {
    expect(classifyArticle({ title: 'Communiqué du club' })).toBe('autre');
    expect(classifyArticle({ title: 'Mise à jour des horaires de la billetterie' })).toBe('autre');
  });

  it('handles missing fields', () => {
    expect(classifyArticle({})).toBe('autre');
    expect(classifyArticle({ title: null, snippet: null })).toBe('autre');
  });

  it('classifies even when keywords have diacritics', () => {
    expect(classifyArticle({ title: 'Défaite à Toulouse en match retour' })).toBe('match');
    expect(classifyArticle({ title: 'Arrivée d\'un nouveau pilier en provenance d\'Argentine' })).toBe('mercato');
  });

  it('prioritises mercato over match when both keywords present', () => {
    // Order in RULES gives mercato precedence
    expect(classifyArticle({ title: 'Match : Spedding signe en pleine compo' })).toBe('mercato');
  });
});
