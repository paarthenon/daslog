import {LOG4J_LEVELS, levels} from './levels'

test('levels', () => {
    const levelList = ['a', 'b', 'c', 'd'] as const;
    const ranks = levels(levelList);

    expect(ranks).toHaveProperty('a');
    expect(ranks.a).toBe(0);
    expect(ranks.b).toBeLessThan(ranks.c);
})

test('levels (object without const)', () => {
    const levelList = ['a', 'b', 'c', 'd'];
    const ranks = levels(levelList);

    expect(ranks).toHaveProperty('a');
    expect(ranks.a).toBe(0);
    expect(ranks.f).toBeUndefined();
})

test('levels (inline)', () => {
    const ranks = levels(['a', 'b', 'c', 'd']);

    expect(ranks).toHaveProperty('a');
    expect(ranks.a).toBe(0);
    expect(ranks.b).toBeLessThan(ranks.c);
})