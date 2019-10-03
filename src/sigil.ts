import sigil, {Variant, exhaust} from '@paarth/variant';
import {AppenderFactoryMeta} from './appender';
import {Category} from './category';
import dateFormat from 'dateformat';

const defaultFormat = 'yyyy-mm-dd HH:MM:ss';

/**
 * Log sigils.
 */
export module Sigil {
    export const Level = sigil('LEVEL');
    export type Level = ReturnType<typeof Level>;

    export const Category = sigil('CATEGORY');
    export type Category = ReturnType<typeof Category>;

    /**
     * Format as per Steven Levithan's dateformat()
     * 
     * https://www.npmjs.com/package/dateformat
     */
    export const Time = sigil('TIME', (format: string = defaultFormat) => ({format}));
    export type Time = ReturnType<typeof Time>;

    export const Label = sigil('LABEL', (label: string) => ({label}));
    export type Label = ReturnType<typeof Label>;

    export const Function = sigil('FUNCTION', (func: (meta: AppenderFactoryMeta) => string) => ({func}));
    export type Function = ReturnType<typeof Function>;
}
/**
 * The various possible Sigils.
 */
export type Sigil = Variant<typeof Sigil>;

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
        case 'LEVEL':
            return meta.logLevelName;
        case 'CATEGORY':
            return meta.category != undefined ? categoryString(meta.category) : undefined;
        case 'TIME':
            return dateFormat(new Date(), sigil.format);
        case 'LABEL':
            return sigil.label;
        case 'FUNCTION':
            return sigil.func(meta);

        default: return exhaust(sigil);
    }
}
