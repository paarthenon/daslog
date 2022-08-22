import {Sigil} from './sigil';
import {Func, LinkedList, noop, popLL, pushLL} from './util';
import {consoleAppender} from './appender/console';
import {replaceLastCategory, Category, addCategory, getClosestCategory, walkCat} from './category';
import {LogLevelRanks, LOG4J_LEVELS, levels, SYSLOG_LEVELS} from './levels';

type Indent = LinkedList<'text', string>;

interface IndentOptions {
    level?: number;
    spacing?: string;
}

export const indentToString = (indent?: Indent): string => 
    indent != undefined
        ? `${indent.text ?? ''}${indentToString(indent?.sub)}`
        : ''
;

export interface DasMeta<
    Levels extends string,
    Chain extends ReadonlyArray<Sigil>,
    LogFunc extends Func
> {
    levels: LogLevelRanks<Levels>;
    chain: Chain;
    appender: Appender<LogFunc>;
    threshold?: number;
    category?: Category;
    /**
     * Indentation level.
     */
    indent?: Indent;
}

/**
 * Inner marker. Internal use only.
 */
 const META = Symbol('daslog');

const DEFAULT_CHAIN = [
    Sigil.Time(),
    Sigil.Level({capitalize: true, pad: true}),
] as const;

const defaultMeta: DasMeta<keyof typeof LOG4J_LEVELS, typeof DEFAULT_CHAIN, Func> = {
    levels: LOG4J_LEVELS,
    appender: consoleAppender(),
    chain: DEFAULT_CHAIN,
}

export type Appender<LF extends Func> = (meta: DasMeta<string, readonly Sigil[], any>, level: string) => LF;

interface SetCategoryOptions {
    /**
     * If my logger's categories are [A, B] and I call setCategory('D'), 
     * should my new list be [D] instead of [A, D]? (false by default)
     */
    reset?: boolean;
    /**
     * If my logger does not have a category in its chain, should this
     * command add it to the end? (true by default)
     */
    append?: boolean;
}
const DEFAULT_CATEGORY_OPTIONS: SetCategoryOptions = {
    reset: false,
    append: true,
}

/**
 * An instance of the log.
 */
export type Daslog<
    LogLevels extends string, // 'trace' | 'debug' | 'warn' | ...
    Chain extends ReadonlyArray<Sigil>,
    LogFunc extends Func,
> = {[L in LogLevels]: LogFunc} & {
    readonly levels: LogLevelRanks<LogLevels>;
    readonly threshold?: number;
    readonly category?: string;
    readonly categories?: string[];

    /**
     * Assign new levels to the logger. The logger will gain a new function for each level.
     * @param levels an object mapping each log level `string` to some numerical priority.
     * @param threshold the minimum priority currently being broadcast.
     */
    setLevels<NL extends string>(levels: LogLevelRanks<NL>, threshold?: NL): Daslog<NL, Chain, LogFunc>;
    /**
     * Set a new threshold, regardless of what the old one was.
     * @param threshold the new minimum log value.
     */
    setThreshold(threshold: LogLevels): Daslog<LogLevels, Chain, LogFunc>;
    /**
     * Remove the threshold entirely, allowing all logs. Opposite of `.mute()`.
     */
    clearThreshold(): Daslog<LogLevels, Chain, LogFunc>;
    /**
     * Set an infinite threshold, disabling all logs. Opposite of `.clearThreshold()`
     */
    mute(): Daslog<LogLevels, Chain, LogFunc>;

    setAppender<NLF extends Func>(appender: Appender<NLF>): Daslog<LogLevels, Chain, NLF>;

    setCategory(category: string, options?: SetCategoryOptions): Daslog<LogLevels, Chain, LogFunc>;
    subCategory(category: string): Daslog<LogLevels, Chain, LogFunc>;

    append<S extends Sigil>(s: Sigil): Daslog<LogLevels, [...Chain, S], LogFunc>;
    prepend<S extends Sigil>(s: Sigil): Daslog<LogLevels, [S, ...Chain], LogFunc>;
    reformat<CN extends readonly Sigil[]>(func: (oldFormat: Chain) => CN): Daslog<LogLevels, CN, LogFunc>;

    indent(options?: IndentOptions): Daslog<LogLevels, Chain, LogFunc>;
    dedent(): Daslog<LogLevels, Chain, LogFunc>;
    resetIndent(): Daslog<LogLevels, Chain, LogFunc>;
}


/**
 * Create a log4j-style console logger.
 */
export function logger(): Daslog<keyof typeof LOG4J_LEVELS, typeof DEFAULT_CHAIN, ReturnType<typeof defaultMeta.appender>>;
/**
 * Create a new logger based on some configuration object.
 * @param meta 
 */
export function logger<
    Levels extends string,
    Chain extends ReadonlyArray<Sigil>,
    LF extends Func
>(meta: DasMeta<Levels, Chain, LF>): Daslog<Levels, Chain, LF>;
// Impl, so return type doesn't matter.
export function logger<
    Levels extends string,
    Chain extends ReadonlyArray<Sigil>,
    LF extends Func
>(meta?: DasMeta<Levels, Chain, LF>): any {
    if (meta) {
        return createLogger({
            ...defaultMeta,
            levels: meta.levels,
        });
    } else {
        return createLogger(defaultMeta);
    }
}

/**
 * Utility function to generate the log functions.
 * @param meta 
 * @param invalidFunc optionally define some fallback function to use for cases that fail to meet the threshold.
 */
function logFuncs<
    Levels extends string,
    Chain extends readonly Sigil[],
    LogFunc extends Func
>(meta: DasMeta<Levels, Chain, LogFunc>, invalidFunc = noop as LogFunc) {
    const levels = Object.keys(meta.levels) as Levels[];
    return levels.reduce((acc, cur) => {
        acc[cur] = (meta.threshold === undefined || meta.levels[cur] >= meta.threshold)
            ? meta.appender(meta, cur)
            : invalidFunc;
        return acc;
    }, {} as {[L in Levels]: LogFunc});
}

/**
 * Internal Daslog. Aware of the DasMeta object available at [META].
 */
type IDaslog<
    Levels extends string,
    Chain extends ReadonlyArray<Sigil>,
    LogFunc extends Func
> = Daslog<Levels, Chain, LogFunc>
    & {[META]: DasMeta<Levels, Chain, LogFunc>};

/**
 * Stitch together a logger
 * 
 * @remarks Internal use only.
 * @param meta the relevant `DasMeta`
 * @returns a new logger.
 */
function createLogger<
    Levels extends string,
    Chain extends ReadonlyArray<Sigil>,
    LF extends Func
>(meta: DasMeta<Levels, Chain, LF>): Daslog<Levels, Chain, LF> {
    return {
        [META]: meta,
        get levels() {
            return meta.levels;
        },
        get threshold() {
            return meta.threshold;
        },
        get category() {
            return getClosestCategory(meta.category);
        },
        get categories() {
            return walkCat(meta.category);
        },

        ...logFuncs(meta),
        
        setLevels(this: IDaslog<Levels, Chain, LF>, levels, threshold) {
            return createLogger({
                ...this[META],
                levels,
                threshold: threshold != undefined ? levels[threshold] : undefined,
            });
        },
        setThreshold(this: IDaslog<Levels, Chain, LF>, level) {
            return createLogger({
                ...this[META],
                threshold: this[META].levels[level],
            });
        },
        clearThreshold(this: IDaslog<Levels, Chain, LF>){
            return createLogger({
                ...this[META],
                threshold: undefined,
            })
        },
        mute(this: IDaslog<Levels, Chain, LF>) {
            return createLogger({
                ...this[META],
                threshold: Infinity,
            })
        },
        setAppender(this: IDaslog<Levels, Chain, LF>, appender) {
            return createLogger({
                ...this[META],
                appender,
            });
        },
        setCategory(this: IDaslog<Levels, Chain, LF>, category, options) {
            const {append, reset} = {
                ...options,
                ...DEFAULT_CATEGORY_OPTIONS,
            }

            const chain = (append && !this[META].chain.some(s => s.type === 'Category')) 
            ? [...this[META].chain, Sigil.Category()] 
            : this[META].chain

            return createLogger({
                ...this[META],
                category: reset 
                    ? {label: category} 
                    : replaceLastCategory(this[META].category, category),
                chain,
            }) as Daslog<Levels, Chain, LF>;
        },
        subCategory(this: IDaslog<Levels, Chain, LF>, category) {
            const cat = this[META].category;
            return createLogger({
                ...this[META],
                category: cat ? addCategory(cat, category) : {label: category},
            });
        },
        append(this: IDaslog<Levels, Chain, LF>, sigil) {
            return createLogger({
                ...this[META],
                chain: [...this[META].chain, sigil],
            }) as any; // the interface will take care of the typing.
        },
        prepend(this: IDaslog<Levels, Chain, LF>, sigil: Sigil) {
            return createLogger({
                ...this[META],
                chain: [sigil, ...this[META].chain],
            }) as any; // the interface will take care of the typing.
        },
        reformat(this: IDaslog<Levels, Chain, LF>, format) {
            return createLogger({
                ...this[META],
                chain: format(this[META].chain),
            })
        },
        indent(this: IDaslog<Levels, Chain, LF>, options) {
            const characters = options?.spacing ?? '    ';
            const level = options?.level ?? 1;

            const newIndentLevels = (text: string, levels: number): Indent | undefined =>
                levels == 0
                    ? undefined
                    : {text, sub: newIndentLevels(text, levels - 1)}
            ;

            const newIndent = newIndentLevels(characters, level);
            if (newIndent) {
                return createLogger({
                    ...this[META],
                    indent: pushLL(this[META].indent, newIndent),
                })
            } else {
                return this;
            }

        },
        dedent(this: IDaslog<Levels, Chain, LF>) {
            return createLogger({
                ...this[META],
                indent: popLL(this[META].indent),
            })
        },
        resetIndent(this: IDaslog<Levels, Chain, LF>) {
            return createLogger({
                ...this[META],
                indent: undefined,
            })
        },
    }
}

export const stdlog = logger();
export const syslog = logger().setLevels(SYSLOG_LEVELS);
