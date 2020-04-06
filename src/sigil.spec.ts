import {Sigil} from './sigil'

test('level', () => {
    const level = Sigil.Level();
    expect(level.type).toBe('Level');
})