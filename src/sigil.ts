import sigil, {exhaust, variantList, VariantOf, payload, TypeNames, match} from '@paarth/variant';
import {AppenderFactoryMeta} from './appender';
import {Category} from './category';
import dateFormat from 'dateformat';

export const DEFAULT_FORMAT = 'yyyy-mm-dd HH:MM:ss';

export const Sigil = variantList([
    sigil('Level'),
    sigil('Category'),
    sigil('Label', payload<string>()),
    sigil('Time', (format = DEFAULT_FORMAT) => ({format})),
    sigil('Function', (func: (meta: AppenderFactoryMeta) => string) => ({func})),
]);
export type Sigil<T extends TypeNames<typeof Sigil> = undefined> = VariantOf<typeof Sigil, T>;

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

export const processSigil = (meta: AppenderFactoryMeta, sigil: Sigil) => match(sigil, {
    Category: _ => meta.category != undefined ? categoryString(meta.category) : undefined,
    Function: ({func}) => func(meta),
    Label: ({payload}) => payload,
    Level: _ => meta.logLevelName,
    Time: ({format}) => dateFormat(new Date(), format),
});
