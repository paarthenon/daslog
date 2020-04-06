import {Category, replaceLastCategory, addCategory} from './category';

const category: Category = {label: 'A', sub: {label: 'B', sub: {label: 'C'}}};

test('replace category', () => {
    const newCat = replaceLastCategory({label: 'A'}, 'B');

    expect(newCat.label).toBe('B');
    expect(newCat.sub).toBeUndefined();
})

test('replace category (undefined)', () => {
    const newCat = replaceLastCategory(undefined, 'B');

    expect(newCat.label).toBe('B');
    expect(newCat.sub).toBeUndefined();
})

test('replace category (deep)', () => {
    const newCat = replaceLastCategory(category, 'D');

    expect(newCat.label).toBe('A');
    expect(newCat.sub!.sub!.label).toBe('D');
})

test('add Category', () => {
    const newCat = addCategory({label: 'A'}, 'B');

    expect(newCat.label).toBe('A');
    expect(newCat.sub!.label).toBe('B');
})

test('add Category (deep)', () => {
    const newCat = addCategory(category, 'D');

    expect(newCat.label).toBe('A');
    expect(newCat.sub!.sub!.sub!.label).toBe('D');
})