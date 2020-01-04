import {Tuple} from 'ts-toolbelt';
import {AppenderFactory} from './appender';
import {defaultConsoleAppender} from './appender/console';
import {Category, addCategory, replaceLastCategory} from './category';
import {Sigils, Sigil} from './sigil';

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
 * A logger constructed of several management functions and the levels specific logging functions
 */
export type DasLogger<L extends LogLevels, C extends ReadonlyArray<Sigil>> = {
    /**
     * Append sigil to logger config
     * @param x 
     */
    append<S extends Sigil>(x: S): DasLogger<L, Tuple.Append<C, S>>
    /**
     * Prepend sigil to logger fragment list
     * @param s 
     */
    prepend<S extends Sigil>(s: S): DasLogger<L, Tuple.Prepend<C, S>>
    /**
     * Remember to use 'as const'
     * @param f 
     */
    reformat<R extends ReadonlyArray<Sigil>>(f: (x: C) => R): DasLogger<L, R>

    setCategory(category: string, append?: boolean): DasLogger<L, C>
    subCategory(category: string): DasLogger<L, C>

    /**
     * Set log levels. After setting the minimum log level will be set to the lowest possible.
     * 
     * See the format of LogLevels
     * 
     * Example default logLevels:
     * 
     * export const log4jLevels = {
     *      trace: 0,
     *      debug: 100,
     *      info: 200,
     *      warn: 300,
     *      error: 400,
     *      fatal: 500,
     *  }
     */
    setLevels: <T extends LogLevels>(levels:T) => DasLogger<T, C>
    /**
     * Setting the minimum log level will cause all attempts to log at a lower severity
     * to no-op. 
     * 
     * Implementation note: This literally assigns the empty func `() => {}` to the lower
     * functions. *shrug* the logger's immutable.
     */
    setMinimumLogLevel: (minimumLogLevel: keyof L | 'Infinity') => DasLogger<L, C>
    /**
     * The logger has a default console appender. This allows you to modify that if you'd
     * like to provide a file appender, something that 
     */
    setAppender: (logGenerator: AppenderFactory) => DasLogger<L, C>
} & LogFuncs<L> // cute, huh?

/**
 * The internal meta 
 */
export type DasMeta<L extends LogLevels, S extends ReadonlyArray<Sigil>> = {
    levels: L
    minimumLogLevel?: number
    chain: S
    category?: Category
    appenderFactory: AppenderFactory
}
const DasMetaSymbol = Symbol('daslog metadata');

type InternalDasLogger<L extends LogLevels, S extends ReadonlyArray<Sigil>> 
    = DasLogger<L, S> & {[DasMetaSymbol]: DasMeta<L, S>};

export function getMeta<L extends LogLevels, S extends ReadonlyArray<Sigil>> (logger: DasLogger<L, S>) {
    const iLogger = logger as InternalDasLogger<L, S>; //pls no sue
    return iLogger[DasMetaSymbol];
}

export const log4jLevels = {
    trace: 0,
    debug: 100,
    info: 200,
    warn: 300,
    error: 400,
    fatal: 500,
}

export const baseChain = [
    Sigils.Time(), Sigils.Level(),
] as const;

const defaultMeta: DasMeta<typeof log4jLevels, typeof baseChain> = {
    chain: baseChain,
    levels: log4jLevels,
    appenderFactory: defaultConsoleAppender,
}

/**
 * Transform the levels object from the meta object to the appropriate functions
 * depending on the appender specified in the meta object.
 * @param meta - The DasMeta object for the 
 */
function funcify<L extends LogLevels, C extends ReadonlyArray<Sigil>>(meta: DasMeta<L, C>) {
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
>(meta: DasMeta<L, C>): DasLogger<L, C> {
    /**
     * I kind of hate casting these as any but the backdoor recursive types ts-toolbelt uses don't play
     * well with compiler limitations. There is apparently a fix using interfaces but there's also the potential
     * for better recursive types on the horizon (3.7 on). Until ts-toolbelt or typescript update... 
     * 
     *  - if you hate this too, I'd love a PR.
     */
    const logFuncs = funcify<L, C>(meta);
    const internalLogger = <InternalDasLogger<L, C>>{
        [DasMetaSymbol]: meta,
        append<S extends Sigil>(s: S): DasLogger<L, Tuple.Append<C, S>> {
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
        setCategory<Cat extends string>(category: Cat, append = true) {
            const newCategory = meta.category == undefined ? ({label: category}) : replaceLastCategory(meta.category, category)
            const chain = meta.chain.some(s => s.type === 'Category') ? meta.chain : [...meta.chain, Sigils.Category()];
            return innerLogger({...meta, category: newCategory, chain}) as any
        },
        subCategory<C extends string>(category: C) {
            const newCategory = meta.category == undefined ? ({label: category}) : addCategory(meta.category, category);
            return innerLogger({...meta, category: newCategory}) as any
        },
        setLevels(levels) {
            return innerLogger({
                ...meta,
                levels,
                minimumLogLevel: undefined,
            }) as any;
        },
        setMinimumLogLevel(minimumLogLevel) {
            const level = minimumLogLevel === 'Infinity' ? Infinity : this[DasMetaSymbol].levels[minimumLogLevel];
            return innerLogger({...meta, minimumLogLevel: level}) as any;
        },
        setAppender(appenderFactory) {
            return innerLogger({...meta, appenderFactory}) as any;
        },
        ...logFuncs,
    };

    return internalLogger;
}

export function logger(): DasLogger<typeof log4jLevels, typeof baseChain>;
export function logger<L extends LogLevels, S extends ReadonlyArray<Sigil>>(meta: DasMeta<L, S>): DasLogger<L, S>;
export function logger<L extends LogLevels, S extends ReadonlyArray<Sigil>>(meta?: DasMeta<L, S>) {
    if (meta != undefined) {
        return innerLogger(meta);
    } else {
        return innerLogger(defaultMeta);
    }
}

export default logger;
