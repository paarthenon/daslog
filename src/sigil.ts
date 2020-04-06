import {variantList, TypeNames, VariantOf, variant, Matrix, match, fields, property, payload} from 'variant';
import dateFormat from 'dateformat';
import {DEFAULT_FORMAT} from './constants';
import {Category, walkCat} from './category';

/**
 * These act as markers or tokens to inform the appender on
 * how to render the log statement.
 */
export const Sigil = variantList([
    /**
     * Render the current log level using a format function.
     * 
     * This can be cached in future if it becomes costly but I don't super expect it to.
     */
    variant('Level', (format?: (str: string) => string) => ({format})),
    /**
     * Render the current time.
     */
    variant('Time', (format?: string) => ({format})),
    /**
     * List of categories (A > B > C)
     */
    variant('Category', (separator = ' > ') => ({separator})),
    /**
     * Any string
     */
    variant('Label', payload<string>()),
    /**
     * Execute a function with some information attached.
     */
    variant('Function', payload<(meta: SigilContext) => string>()),
]);
export type Sigil<T extends TypeNames<typeof Sigil> = undefined> = VariantOf<typeof Sigil, T>;

/**
 * Necessary context to resolve certain sigils.
 */
export interface SigilContext {
    level: string;
    levels: {[level: string]: number};
    threshold?: number;
    time: number;
    category?: Category;
}

/**
 * Render a sigil as an appropriate string.
 * @param sigil 
 * @param param1 
 */
export const processSigil = (sigil: Sigil, context: SigilContext) => match(sigil, {
    Level: ({format}) => format ? format(context.level) : context.level,
    Time: ({format}) => dateFormat(context.time, format != undefined ? format : DEFAULT_FORMAT),
    Category: ({separator}) => walkCat(context.category).join(separator),
    Label: ({payload}) => payload,
    Function: ({payload}) => payload(context),
});

/**
 * Configure the formatting of the sigil chain. 
 */
export interface SigilConfig {
    separator: string;
    spaces: boolean;
    front?: string;
    back?: string;
}

/**
 * Default formatting for the sigil chain
 */
export const DEFAULT_SIGIL_CONFIG: SigilConfig = {
    separator: '|',
    spaces: true,
    front: '[',
    back: ']',
}

export const processSigils = <S extends readonly Sigil[]>(chain: S, config: SigilConfig, context: SigilContext) => {
    let processed = (config.front ? [config.front] : []);

    chain.forEach((sigil, i) => {
        processed.push(processSigil(sigil, context));
        if (i !== chain.length - 1) {
            processed.push(config.separator);
        }
    });
    if (config.back) {
        processed.push(config.back);
    }

    return processed.join(config.spaces ? ' ' : '');
}
