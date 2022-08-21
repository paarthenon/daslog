import {TypeNames, VariantOf, variant, match, payload, onLiteral} from 'variant';
import dateFormat from 'dateformat';
import {DEFAULT_FORMAT} from './constants';
import {Category, walkCat} from './category';
import type {LogLevelRanks} from './levels';

/**
 * Describe how log level should be rendered.
 */
export interface LevelSigilConfig {
    /**
     * Render as all-caps.
     * @example 'info' -> 'INFO'
     */
    capitalize?: boolean,
    /**
     * Arbitrarily reformat the string.
     * @tutorial
     * 
     * To transform 'info' to 'Info', use a format function like
     * 
     * ```ts
     * {
     *     format: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
     * }
     * ```
     */
    format?: (str: string) => string,
    /**
     * If `pad` is set to true, should the text be left-justified or right-justified?
     */
    justify?: 'left' | 'right',
    /**
     * Pad the output so that all log levels render to the same length.
     */
    pad?: boolean,
}

/**
 * These act as markers or tokens to inform the appender on
 * how to render the log statement.
 */
export const Sigil = variant({
    /**
     * Render the category hierarchy as a chain of labels.
     * @param separator the symbol used to demarcate the categories.
     * @returns a sigil that daslog will combine into a category string.
     */
    Category: (separator = ' > ') => ({separator}),
    /**
     * Render the result of some arbitrary function that returns a string.
     * @param payload a function that `(context: SigilContext) => string`.
     * @returns a sigil that daslog will evaluate to a string.
     */
    Function: payload<(meta: SigilContext) => string>(),
    /**
     * Render any arbitrary text.
     * @param payload some string.
     * @returns a sigil that daslog will unpack into the inner string.
     */
    Label: payload<string>(),
    /**
     * Render the current log level, possibly with some formatting.
     * @param cfg describe the final output - should it be capitalized, padded, or even arbitrarily formatted?
     * @returns a sigil that daslog will replace with a level string.
     */
    Level: (cfg: LevelSigilConfig = {}) => cfg,
    /**
     * Render the current time.
     * @remarks leverages `dateformat`, Steven Levithan's `dateFormat()` function adapted for node
     * @param format string following https://github.com/felixge/node-dateformat guidelines. 
     * @returns an sigil that daslog will replace with a timestamp.
     */
    Time: (format?: string) => ({format}),
});
export type Sigil<T extends TypeNames<typeof Sigil> = undefined> = VariantOf<typeof Sigil, T>;

/**
 * An information package concerning the logger that some sigils may
 * require as input.
 */
export interface SigilContext {
    /**
     * The current log level.
     */
    level: string;
    /**
     * The current set of log levels.
     */
    levels: LogLevelRanks<string>;
    /**
     * The minimum log level, if any. Anything below this value should not be rendered.
     */
    threshold?: number;
    /**
     * The current timestamp.
     */
    time: number;
    /**
     * The current category list, if present.
     */
    category?: Category;
}

/**
 * Render a sigil as its appropriate string.
 * @param {Sigil} sigil any valid `Sigil`
 * @param {SigilContext} context the extra information some sigils may need to be evaluated. 
 */
export const processSigil = (sigil: Sigil, context: SigilContext) => match(sigil, {
    Level: ({format, pad, justify, capitalize}) => {
        // format function takes priority
        if (format) {
            return format(context.level);
        } else {
            let str = context.level;
            if (capitalize) {
                str = str.toLocaleUpperCase();
            }
            if (pad) {
                const longestLevelLabelLength = Object.keys(context.levels)
                    .reduce((max, level) => Math.max(max, level.length), 0);

                str = match(onLiteral(justify ?? 'left'), {
                    left: _ => context.level.padEnd(longestLevelLabelLength),
                    right: _ => context.level.padStart(longestLevelLabelLength),
                })
            }
            return str;
        }
    },
    Time: ({format}) => dateFormat(context.time, format ?? DEFAULT_FORMAT),
    Category: ({separator}) => walkCat(context.category).join(separator),
    Label: ({payload}) => payload,
    Function: ({payload}) => payload(context),
});

/**
 * Configure the formatting of the sigil chain.
 * 
 * @todo add an option to wrap each term.
 */
export interface SigilConfig {
    /**
     * Symbol used to demarcate segments of the log prefix.
     */
    separator: string;
    /**
     * Should the logger include spaces on each side of the separator?
     */
    spaces: boolean;
    /**
     * Symbol used as the initial character.
     */
    front?: string;
    /**
     * Symbol used as the terminal character.
     */
    back?: string;
}

/**
 * Default formatting for the sigil chain.
 */
export const DEFAULT_SIGIL_CONFIG: SigilConfig = {
    separator: '|',
    spaces: true,
    front: '[',
    back: ']',
}

/**
 * Reduce the entire sigil chain to a single string.
 * 
 * @see {@link processSigil}
 * 
 * @remarks not user facing. This is mostly relevant when writing new appenders.
 * @param chain the sigil chain, the tuple that describes how the log statement is rendered.
 * @param config formatting options for the final render.
 * @param context extra information necessary for the processing of some sigils.
 * @returns a string containing the rendered sigils. Also known as the "log prefix"
 */
export function processSigils<Sigils extends readonly Sigil[]>(
    chain: Sigils,
    config: SigilConfig,
    context: SigilContext
) {
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
