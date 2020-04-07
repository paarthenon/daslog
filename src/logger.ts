import {variantList, variant, TypeNames, VariantOf} from 'variant';
import {Tuple} from 'ts-toolbelt';

import {Sigil} from './sigil';
import {Func, noop} from './util';
import {consoleAppender} from './appender/console';
import {fileAppender} from './appender/file';
import {replaceLastCategory, Category, addCategory} from './category';
import {LogLevelRanks, LOG4J_LEVELS, Threshold, parseLevel, levels} from './levels';



export interface DasMeta<Levels extends string, Chain extends ReadonlyArray<Sigil>, LogFunc extends Func> {
    levels: LogLevelRanks<Levels>;
    threshold?: number;
    appender: Appender<LogFunc>;
    category?: Category;
    chain: Chain;
}

const DEFAULT_CHAIN = [
    Sigil.Time(),
    Sigil.Level(s => s.toUpperCase()),
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
 * Logger scoped to certaint types.
 */
export type Daslog<
    LogLevels extends string, // 'trace' | 'debug' | 'warn' | ...
    Chain extends ReadonlyArray<Sigil>,
    LF extends Func,
> = {[L in LogLevels]: LF} & {
    setLevels<NL extends string>(levels: LogLevelRanks<NL>): Daslog<NL, Chain, LF>;
    setThreshold(threshold: Threshold<LogLevels>): Daslog<LogLevels, Chain, LF>;

    setAppender<NLF extends Func>(appender: Appender<NLF>): Daslog<LogLevels, Chain, NLF>;

    setCategory(category: string, options?: SetCategoryOptions): Daslog<LogLevels, Chain, LF>;
    subCategory(category: string): Daslog<LogLevels, Chain, LF>;

    append<S extends Sigil>(s: Sigil): Daslog<LogLevels, Tuple.Append<Chain, S>, LF>;
    prepend<S extends Sigil>(s: Sigil): Daslog<LogLevels, Tuple.Prepend<Chain, S>, LF>;
    reformat<CN extends readonly Sigil[]>(func: (oldFormat: Chain) => CN): Daslog<LogLevels, CN, LF>;
}

const META = Symbol('daslog');
type InternalDaslog<
    LogLevels extends string,
    Chain extends ReadonlyArray<Sigil>,
    LF extends Func,
> = Daslog<LogLevels, Chain, LF> & {
    [META]: DasMeta<LogLevels, Chain, LF>;
}

export function logger(): Daslog<keyof typeof LOG4J_LEVELS, typeof DEFAULT_CHAIN, ReturnType<typeof defaultMeta.appender>>;
export function logger<Levels extends string, Chain extends ReadonlyArray<Sigil>, LF extends Func>(meta: DasMeta<Levels, Chain, LF>): Daslog<Levels, Chain, LF>;
export function logger<Levels extends string, Chain extends ReadonlyArray<Sigil>, LF extends Func>(meta?: DasMeta<Levels, Chain, LF>): any {
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
 * @param invalidFunc 
 */
function logFuncs<Levels extends string, Chain extends readonly Sigil[], LF extends Func>(meta: DasMeta<Levels, Chain, LF>, invalidFunc = noop as LF) {
    const levels = Object.keys(meta.levels) as (keyof typeof meta.levels)[];
    return levels.reduce((acc, cur) => {
        acc[cur] = (meta.threshold === undefined || meta.levels[cur] >= meta.threshold) ? meta.appender(meta, cur) : invalidFunc; // the money
        return acc;
    }, {} as {[L in Levels]: ReturnType<typeof meta.appender>})
}

function createLogger<Levels extends string, Chain extends ReadonlyArray<Sigil>, LF extends Func>(meta: DasMeta<Levels, Chain, LF>) {
    return {
        [META]: meta,
        ...logFuncs(meta),
        setLevels<NL extends string>(this: InternalDaslog<Levels, Chain, LF>, levels: LogLevelRanks<NL>, threshold?: Threshold<NL>) {
            return createLogger({
                ...this[META],
                levels,
                threshold: undefined,
            });
        },
        setThreshold(threshold: Threshold<Levels>) {
            return createLogger({
                ...this[META],
                threshold: parseLevel(this[META].levels, threshold),
            });
        },
        setAppender<LF extends Func>(appender: () => LF) {
            return createLogger({
                ...this[META],
                appender,
            });
        },
        setCategory(category: string, options?: SetCategoryOptions) {
            const {append, reset} = {
                ...options,
                ...DEFAULT_CATEGORY_OPTIONS,
            }

            return createLogger({
                ...this[META],
                category: reset 
                    ? {label: category} 
                    : replaceLastCategory(this[META].category, category),
                chain: (append && !this[META].chain.some(s => s.type === 'Category')) 
                    ? [...this[META].chain, Sigil.Category()] 
                    : this[META].chain,
            });
        },
        subCategory(category: string) {
            const cat = this[META].category;
            return createLogger({
                ...this[META],
                category: cat ? addCategory(cat, category) : {label: category},
            });
        },
        append(sigil: Sigil) {
            return createLogger({
                ...this[META],
                chain: [...this[META].chain, sigil],
            });
        },
        prepend(sigil: Sigil) {
            return createLogger({
                ...this[META],
                chain: [sigil, ...this[META].chain],
            });
        },
        reformat(format: (old: readonly Sigil[]) => readonly Sigil[]) {
            return createLogger({
                ...this[META],
                chain: format(this[META].chain),
            })
        }
    }
}

export const stdlog = logger();
export const syslog = logger().setLevels(levels([
    'debug',
    'info',
    'notice',
    'warning',
    'err',
    'crit',
    'alert',
    'emerg',
]));
