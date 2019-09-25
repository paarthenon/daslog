import sigil, {Variant, exhaust} from '@paarth/variant';

export module Sigil {
    export const Level = sigil('LEVEL');
    export type Level = ReturnType<typeof Level>;

    export const Category = sigil('CATEGORY', (name: string) => ({
        name,
        setName(name: string) {
            this.name = name;
        },
    }));
    export type Category = ReturnType<typeof Category>;

    export const Time = sigil('TIME', (format: string) => ({format}));
    export type Time = ReturnType<typeof Time>;
}
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

export interface AppenderFactoryMeta {
    logLevelName: string
}
/**
 * A factory function to consume the prefix fragments and assemble the 
 */
export type AppenderFactory = (appenderMeta: AppenderFactoryMeta, chain: SigilChain) => LogFunction;

/**
 * A logger constructed of several management functions and the levels specific logging functions
 */
export type DasLogger<L extends LogLevels, C extends SigilChain> = {
    reformat<R extends SigilChain>(f: (x: C) => R): DasLogger<L, R>
    setLevels: <T extends LogLevels>(levels:T) => DasLogger<T, C>
    setMinimumLogLevel: (minimumLogLevel: keyof L) => DasLogger<L, C>
    setAppender: (logGenerator: AppenderFactory) => DasLogger<L, C>
} & LogFuncs<L>


type BaseSigilChain = 
    | [Sigil]
    | [Sigil, Sigil]
    | [Sigil, Sigil, Sigil]
    | [Sigil, Sigil, Sigil, Sigil]
    | [Sigil, Sigil, Sigil, Sigil, Sigil]
;

type SigilChain = Readonly<BaseSigilChain>;

export interface DasMeta<L extends LogLevels, C extends SigilChain> {
    chain: C
    levels: L
    minimumLogLevel?: number
    appenderFactory: AppenderFactory
}
const DasMetaSymbol = Symbol('DASLogger metadata');
type InternalDasLogger<L extends LogLevels, C extends SigilChain> = DasLogger<L, C> &  {[DasMetaSymbol]: DasMeta<L, C>};

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

// const [first, second, third] = id([Sigil.Time(''), Sigil.Level(), Sigil.Category('yo')],
//     ([time, level, cat]) => ([cat, level, time])
// );

export function processSigil(meta:AppenderFactoryMeta, sigil:Sigil) {
    switch (sigil.type) {
        case 'LEVEL':
            return meta.logLevelName;
        case 'CATEGORY':
            return `${sigil.name}`;
        case 'TIME':
            return String(Date.now());

        default: return exhaust(sigil);
    }
}
const defaultConsoleAppender: AppenderFactory = (meta, sigils, separator = '|') => {
    let combined = toStringHackFactory(function() {
        return sigils
            .map(sigil => processSigil(meta, sigil))
            .join(` ${separator} `);
    });

    // %s in conjunction with combined being a function calls toString cleanly in both node and the browser
    return console.log.bind(console, ...(sigils.length > 0)?['%s', combined, separator]:[]);
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
function funcify<L extends LogLevels, C extends SigilChain>(meta: DasMeta<L, C>) {
    return Object.keys(meta.levels).reduce((result, levelName: keyof L & string) => {
        result[levelName] = 
            (meta.minimumLogLevel && meta.minimumLogLevel > meta.levels[levelName])
                ? () => {}
                : meta.appenderFactory({logLevelName: levelName}, meta.chain)
        return result;
    }, {} as LogFuncs<L>);
}

/**
 * Stitch together the logger.
 * @param _dasMeta 
 */
function innerLogger<L extends LogLevels, C extends SigilChain>(meta: DasMeta<L, C>): DasLogger<L, C> {
    const untypedLevelFuncs = funcify<L, C>(meta);
    const internalLogger: InternalDasLogger<L, C> = {
        [DasMetaSymbol]: meta,
        reformat<R extends SigilChain>(format: (c: C) => R) {
            return innerLogger({...meta, chain: format(meta.chain)})
        },
        setLevels(levels) {
            return innerLogger({...meta, levels});
        },
        setAppender(appenderFactory) {
            return innerLogger({...meta, appenderFactory})
        },
        setMinimumLogLevel(minimumLogLevel) {
            return innerLogger({...meta, minimumLogLevel: this[DasMetaSymbol].levels[minimumLogLevel]});
        },
        ...untypedLevelFuncs,
    };

    return internalLogger;
}
export function logger(): DasLogger<typeof log4jLevels, typeof baseChain>;
export function logger<L extends LogLevels, C extends SigilChain>(meta: DasMeta<L, C>): DasLogger<L, C>;
export function logger<L extends LogLevels, C extends SigilChain>(meta?: DasMeta<L, C>) {
    if (meta != undefined) {
        return innerLogger(meta);
    } else {
        return innerLogger(defaultMeta);
    }
}

export default logger;