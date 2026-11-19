import { describe, it, expect } from 'vitest';
import { match, getKB, THRESHOLD } from '../chatbot/engine.js';
import { questionCount } from '../chatbot/kb.js';

const id = (q) => { const m = match(q); return m.score >= THRESHOLD ? m.intent?.id : null; };

describe('chatbot knowledge base', () => {
  it('has 1,500+ question phrasings', () => {
    expect(questionCount(getKB())).toBeGreaterThanOrEqual(1500);
  });
  it('has no duplicate intent ids', () => {
    const ids = getKB().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every intent has an answer and questions', () => {
    for (const i of getKB()) { expect(i.a, i.id).toBeTruthy(); expect(i.q.length, i.id).toBeGreaterThan(0); }
  });
});

describe('chatbot matching', () => {
  const cases = [
    ['hi', 'hello'], ['what is your price', 'pricing'], ['how much does it cost', 'pricing'], ['kitna paisa lagega', 'pricing'],
    ['your phone number?', 'contact'], ['where is your office', 'location'], ['do you have tamil influencers', 'lang:Tamil'],
    ['i want influencer in kerala', 'state:Kerala'], ['can you promote my brand on instagram', 'plat:instagram'],
    ['have you worked with mamaearth', 'brand:Mamaearth'], ['tell me about ghar soaps', 'r_soaps'], ['who is ramesh', 'founder'],
    ['send your portfolio pdf', 'profile'], ['can i get a reference', 'references'], ['how long to launch', 'timeline'],
    ['minimum budget', 'min_budget'], ['how many views have you delivered in total', 'views_total'], ['get a quote', 'quote'], ['are you a robot', 'bot'], ['bye', 'bye']
  ];
  it.each(cases)('"%s" -> %s', (q, expected) => { expect(id(q)).toBe(expected); });
  it('falls back for off-topic questions', () => { expect(id('what is the capital of france')).toBeNull(); });
});
