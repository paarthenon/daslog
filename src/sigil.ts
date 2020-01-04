import sigil, {exhaust, variantList, VariantsOf, Oneof, payload} from '@paarth/variant';
import {AppenderFactoryMeta} from './appender';
import {Category} from './category';
import dateFormat from 'dateformat';

const defaultFormat = 'yyyy-mm-dd HH:MM:ss';

export const Sigils = variantList([
    sigil('Level'),
    sigil('Category'),
    sigil('Label', payload<string>()),
    sigil('Time', (format: string = defaultFormat) => ({format})),
    sigil('Function', (func: (meta: AppenderFactoryMeta) => string) => ({func})),
]);
export type Sigils = VariantsOf<typeof Sigils>;
export type Sigil = Oneof<Sigils>;

/**
 * Renders category as 'Category1 > Subcategory1 > Subcategory2'
 * @param category The Category object a recursive linked list with a label property.
 * @param separator Renders ' > ' with spaces by default. Control the spacing as you wish.
 */
function categoryString(category: Category, separator=' > '): string {
    return getCategories(category).join(separator);
}

function getCategories(category: Category): string[] {
    const subcategories = category.sub ? getCategories(category.sub) : [];
    return [category.label, ...subcategories];
}

export function processSigil(meta: AppenderFactoryMeta, sigil: Sigil) {
    switch (sigil.type) {
        case 'Level':
            return meta.logLevelName;
        case 'Category':
            return meta.category != undefined ? categoryString(meta.category) : undefined;
        case 'Time':
            return dateFormat(new Date(), sigil.format);
        case 'Label':
            return sigil.payload;
        case 'Function':
            return sigil.func(meta);

        default: return exhaust(sigil);
    }
}
