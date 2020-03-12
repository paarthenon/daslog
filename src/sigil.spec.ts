import {Sigil, DEFAULT_FORMAT} from './sigil'

test('Label contains payload', () => {
    const sigil = Sigil.Label('test');

    expect(sigil.payload).toBe('test');
});

test('time contains time', () => {
    const sigil = Sigil.Time('yyyy');
    const sigil2 = Sigil.Time();
    expect(sigil.format).toBe('yyyy');
    expect(sigil2.format).toBe(DEFAULT_FORMAT);
})
