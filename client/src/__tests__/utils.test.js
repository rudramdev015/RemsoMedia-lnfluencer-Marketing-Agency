import { describe, it, expect } from 'vitest';
import { sortCases, filterCreators, simulate, compact } from '../utils.js';

const cases = [{ brand: 'Beco', metric: 0 }, { brand: 'Allen', metric: 20 }, { brand: 'Prince', metric: 350 }];
describe('sortCases', () => {
  it('keeps featured order', () => expect(sortCases(cases, 'featured').map((c) => c.brand)).toEqual(['Beco', 'Allen', 'Prince']));
  it('sorts by impact, no-number last', () => expect(sortCases(cases, 'impact').map((c) => c.brand)).toEqual(['Prince', 'Allen', 'Beco']));
  it('sorts A-Z', () => expect(sortCases(cases, 'az').map((c) => c.brand)).toEqual(['Allen', 'Beco', 'Prince']));
  it('does not mutate input', () => { const copy = [...cases]; sortCases(cases, 'az'); expect(cases).toEqual(copy); });
});

const creators = [{ name: 'Lata Bhakar', handle: 'lata_bhakar_0077' }, { name: 'Akhil', handle: 'akhil_nrd' }, { name: 'Mahi Patel', handle: 'mahipatel_official_' }];
describe('filterCreators', () => {
  it('returns all with empty query', () => expect(filterCreators(creators, '', 'default')).toHaveLength(3));
  it('searches name case-insensitively', () => expect(filterCreators(creators, 'LATA', 'default').map((c) => c.name)).toEqual(['Lata Bhakar']));
  it('searches handle', () => expect(filterCreators(creators, 'akhil_', 'default')).toHaveLength(1));
  it('returns none when nothing matches', () => expect(filterCreators(creators, 'zzz', 'default')).toEqual([]));
  it('sorts A-Z and Z-A', () => {
    expect(filterCreators(creators, '', 'az')[0].name).toBe('Akhil');
    expect(filterCreators(creators, '', 'za')[0].name).toBe('Mahi Patel');
  });
});

describe('simulate', () => {
  const tiers = [{ avgViews: 1000 }, { avgViews: 50000 }];
  it('adds up views across tiers', () => expect(simulate([10, 2], tiers).views).toBe(110000));
  it('derives clicks and orders from the rates', () => { const r = simulate([0, 2], tiers, 2, 5); expect(r.views).toBe(100000); expect(r.clicks).toBe(2000); expect(r.orders).toBe(100); });
  it('treats bad input as zero', () => expect(simulate([-5, 'x'], tiers).views).toBe(0));
  it('counts creators', () => expect(simulate([3, 4], tiers).creators).toBe(7));
});
describe('compact', () => {
  it('formats Indian-style numbers', () => { expect(compact(950)).toBe('950'); expect(compact(12500)).toBe('12.5K'); expect(compact(2500000)).toBe('25.0 L'); expect(compact(30000000)).toBe('3.0 Cr'); });
});
