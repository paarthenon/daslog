import {parseLevel, LOG4J_LEVELS, levels} from './levels'

test('parseLevel', () => {
    expect(parseLevel(LOG4J_LEVELS, 'error')).toBe(LOG4J_LEVELS.error);
})

test('parseLevel (infinte)', () => {
    expect(parseLevel(LOG4J_LEVELS, 'Infinity')).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
})

test('levels', () => {
    const levelList = ['a', 'b', 'c', 'd'] as const;
    const ranks = levels(levelList);

    expect(ranks).toHaveProperty('a');
    expect(ranks.a).toBe(0);
    expect(ranks.b).toBeLessThan(ranks.c);
})