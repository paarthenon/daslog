import {Category, addCategory, replaceLastCategory} from './category';
import sigil, {Variant, exhaust} from '@paarth/variant';
import {Tuple} from 'ts-toolbelt';

export {Category} from './category';

/**
 * Log sigils.
 */
export module Sigil {
    export const Level = sigil('LEVEL');
    export type Level = ReturnType<typeof Level>;

    export const Category = sigil('CATEGORY');
    export type Category = ReturnType<typeof Category>;

    export const Time = sigil('TIME', (format: string) => ({format}));
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

export type LogFunction = (...args: any[]) => void

/**
 * Log levels are specified as an object mapping level names to numbers.
 * 
 * ex:
 * 
 * const levels = {
 *     debug: 0,
 *     info: 1,
 *     warn: 2,
 *     error: 3,
 *     fatal: 4,
 * }
 */
export interface LogLevels {
    [level: string]: number
}

/**
 * Log levels tied to function names
 */
export type LogFuncs<T extends LogLevels> = {
    [P in keyof T]: LogFunction
}

/**
 * The information passed into an appender factory.
 */
export interface AppenderFactoryMeta {
    logLevelName: string
    chain: ReadonlyArray<Sigil>
    category?: Category<string>
}
/**
 * A factory function to consume the prefix fragments and assemble the 
 */
export type AppenderFactory = (appenderMeta: AppenderFactoryMeta) => LogFunction;

/**
 * A logger constructed of several management functions and the levels specific logging functions
 */
export type DasLogger<L extends LogLevels, C extends ReadonlyArray<Sigil>, K extends string | undefined = undefined> = {
    /**
     * Append sigil to logger config
     * @param x 
     */
    append<S extends Sigil>(x: S): DasLogger<L, Tuple.Append<C, S>, K>
    /**
     * Prepend sigil to logger fragment list
     * @param s 
     */
    prepend<S extends Sigil>(s: S): DasLogger<L, Tuple.Prepend<C, S>, K>
    /**
     * Remember to use 'as const'
     * @param f 
     */
    reformat<R extends ReadonlyArray<Sigil>>(f: (x: C) => R): DasLogger<L, R, K>

    setCategory<Cat extends string>(category: string): DasLogger<L, C, Cat>
    setCategory<Cat extends string>(category: string): DasLogger<L, C, Cat>

    /**
     * Set log levels. After setting the minimum log level will be set to the lowest possible.
     * 
     * See the format of LogLevels
     * 
     * Example default logLevels:
     * 
     * export const log4jLevels = {
     *      trace: 0,
     *      debug: 1,
     *      info: 2,
     *      warn: 3,
     *      error: 4,
     *      fatal: 5,
     *  }
     */
    setLevels: <T extends LogLevels>(levels:T) => DasLogger<T, C, K>
    /**
     * Setting the minimum log level will cause all attempts to log at a lower severity
     * to no-op. 
     * 
     * Implementation note: This literally assigns the empty func `() => {}` to the lower
     * functions. *shrug* the logger's immutable.
     */
    setMinimumLogLevel: (minimumLogLevel: keyof L) => DasLogger<L, C, K>
    /**
     * The logger has a default console appender. This allows you to modify that if you'd
     * like to provide a file appender, something that 
     */
    setAppender: (logGenerator: AppenderFactory) => DasLogger<L, C, K>
} & LogFuncs<L> // cute, huh?

/**
 * The internal meta 
 */
export type DasMeta<L extends LogLevels, S extends ReadonlyArray<Sigil>, K extends string | undefined = undefined> = {
    levels: L
    minimumLogLevel?: number
    chain: S
    // Safely puts K into Category thanks to type narrowing. Thanks, TS.
    category?: Category<string> 
    appenderFactory: AppenderFactory
}
const DasMetaSymbol = Symbol('DASLogger metadata');

type InternalDasLogger<L extends LogLevels, S extends ReadonlyArray<Sigil>, K extends string | undefined> 
    = DasLogger<L, S, K> & {[DasMetaSymbol]: DasMeta<L, S, K>};

/**
 * A hack to force console.log to call a .toString function. This is necessary to simultaneously allow for
 * 	* time sensitive function calls (for example using a fragment for the current time)
 *  * console logs with accurate line numbers.
 * @param toStringFunc - The function to execute
 */
function toStringHackFactory(toStringFunc:() => string) {
    let func = function(){};
    func.toString = toStringFunc;
    return func;
}

/**
 * Renders category as 'Category1 > Subcategory1 > Subcategory2'
 * @param category The Category object a recursive linked list with a label property.
 * @param separator Renders ' > ' with spaces by default. Control the spacing as you wish.
 */
function categoryString(category: Category<string>, separator=' > '): string {
    return getCategories(category).join(separator);
}

function getCategories(category: Category<string>): string[] {
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
            return String(Date.now());
        case 'LABEL':
            return sigil.label;
        case 'FUNCTION':
            return sigil.func(meta);

        default: return exhaust(sigil);
    }
}

const defaultConsoleAppender: AppenderFactory = (meta, separator = '|') => {
    let combined = toStringHackFactory(function() {
        return meta.chain
            .map(sigil => processSigil(meta, sigil))
            .filter(s => s != undefined)
            .join(` ${separator} `);
    });

    // %s in conjunction with combined being a function calls toString cleanly in both node and the browser
    return console.log.bind(console, ...(meta.chain.length > 0)?['%s', combined, separator]:[]);
}

export const log4jLevels = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
}

export const baseChain = [
    Sigil.Level(),
] as const;



const defaultMeta: DasMeta<typeof log4jLevels, typeof baseChain, undefined> = {
    chain: baseChain,
    levels: log4jLevels,
    appenderFactory: defaultConsoleAppender,
}

/**
 * Transform the levels object from the meta object to the appropriate functions
 * depending on the appender specified in the meta object.
 * @param meta - The DasMeta object for the 
 */
function funcify<L extends LogLevels, C extends ReadonlyArray<Sigil>>(meta: DasMeta<L, C, any>) {
    return Object.keys(meta.levels).reduce((result, levelName: keyof L & string) => {
        result[levelName] = 
            (meta.minimumLogLevel == undefined || meta.levels[levelName] >= meta.minimumLogLevel)
                ? meta.appenderFactory({...meta, logLevelName: levelName})
                : () => {}
        return result;
    }, {} as LogFuncs<L>);
}

/**
 * Stitch together the logger.
 * @param _dasMeta 
 */
function innerLogger<
    L extends LogLevels,
    C extends ReadonlyArray<Sigil>,
    K extends string | undefined,
>(meta: DasMeta<L, C, K>): DasLogger<L, C, K> {
    /**
     * I kind of hate casting these as any but the backdoor recursive types ts-toolbelt uses don't play
     * well with compiler limitations. There is apparently a fix using interfaces but there's also the potential
     * for better recursive types on the horizon (3.7 on). Until ts-toolbelt or typescript update... 
     * 
     *  - if you hate this too, I'd love a PR.
     */
    const logFuncs = funcify<L, C>(meta);
    const internalLogger = <InternalDasLogger<L, C, K>>{
        [DasMetaSymbol]: meta,
        append<S extends Sigil>(s: S): DasLogger<L, Tuple.Append<C, S>, K> {
            return innerLogger({...meta, chain: [...meta.chain, s]}) as any;
        },
        prepend(s: Sigil) {
            return innerLogger({...meta, chain: [s, ...meta.chain]}) as any;
        },
        reformat<R extends ReadonlyArray<Sigil>>(format: (c: C) => R) {
            return innerLogger({
                ...meta,
                chain: format(meta.chain),
            }) as any
        },
        setCategory<Cat extends string>(category: Cat) {
            const newCategory = meta.category == undefined ? ({label: category}) : replaceLastCategory(meta.category, category)
            return innerLogger({...meta, category: newCategory})
        },
        subCategory<C extends string>(category: C) {
            const newCategory = meta.category == undefined ? ({label: category}) : addCategory(meta.category, category);
            return innerLogger({...meta, category: newCategory})
        },
        setLevels(levels) {
            return innerLogger({
                ...meta,
                levels,
                minimumLogLevel: undefined,
            }) as any;
        },
        setMinimumLogLevel(minimumLogLevel) {
            return innerLogger({...meta, minimumLogLevel: this[DasMetaSymbol].levels[minimumLogLevel]}) as any;
        },
        setAppender(appenderFactory) {
            return innerLogger({...meta, appenderFactory}) as any;
        },
        ...logFuncs,
    };

    return internalLogger;
}

export function logger(): DasLogger<typeof log4jLevels, typeof baseChain>;
export function logger<L extends LogLevels, S extends ReadonlyArray<Sigil>, K extends string | undefined>(meta: DasMeta<L, S, K>): DasLogger<L, S, K>;
export function logger<L extends LogLevels, S extends ReadonlyArray<Sigil>, K extends string | undefined>(meta?: DasMeta<L, S, K>) {
    if (meta != undefined) {
        return innerLogger(meta);
    } else {
        return innerLogger(defaultMeta);
    }
}

export default logger;

// experiments


