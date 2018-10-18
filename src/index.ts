export interface LogSigil<T extends string = string> {
    type: 'daslog-sigil',
    value: T,
}

function sigil<T extends string>(key:T): LogSigil<T> {
    return {
        type: 'daslog-sigil',
        value: key,
    }
}

export const sigils = {
    level: sigil('level')
}
/**
 * Daslog supports loading prefixes as strings or string thunks
 */
export type LogFragment = string | ((...args:any[]) => string) | LogSigil
export type LogFunction = (...args:any[]) => void

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
    [level:string]: number
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
export type AppenderFactory = (appenderMeta: AppenderFactoryMeta, fragments: LogFragment[]) => LogFunction;

/**
 * A logger constructed of several management functions and the levels specific logging functions
 */
export type DasLogger<L extends LogLevels> = {
    add: (...fragments: LogFragment[]) => DasLogger<L>
    prefix: (...fragments: LogFragment[]) => DasLogger<L>
    setLevels: <T extends LogLevels>(levels:T) => DasLogger<T>
    setMinimumLogLevel: (minimumLogLevel: keyof L) => DasLogger<L>
    setAppender: (logGenerator: AppenderFactory) => DasLogger<L>
} & LogFuncs<L>


export interface DasMeta<L extends LogLevels> {
    chain: LogFragment[]
    levels: L
    minimumLogLevel?: number
    appenderFactory: AppenderFactory
}
const DasMetaSymbol = Symbol('DASLogger metadata');
type InternalDasLogger<L extends LogLevels> = DasLogger<L> &  {[DasMetaSymbol]: DasMeta<L>};

function add<L extends LogLevels>(this: InternalDasLogger<L>, ...fragments: LogFragment[]): DasLogger<L> {
    const meta = this[DasMetaSymbol];
    return logger<L>({...meta, chain: [...meta.chain, ...fragments]});
}
function prefix<L extends LogLevels>(this: InternalDasLogger<L>, ...fragments: LogFragment[]): DasLogger<L> {
    const meta = this[DasMetaSymbol];
    return logger<L>({...meta, chain: [...fragments, ...meta.chain]})
}
function setLevels<L extends LogLevels>(this: InternalDasLogger<L>, levels:L): DasLogger<L> {
    const meta = this[DasMetaSymbol];
    return logger<L>({...meta, levels});
}
function setMinimumLogLevel<L extends LogLevels>(this: InternalDasLogger<L>, minimumLogLevel: keyof L): DasLogger<L> {
    const meta = this[DasMetaSymbol];
    return logger<L>({...meta, minimumLogLevel: meta.levels[minimumLogLevel]});
}
function setAppender<L extends LogLevels>(this: InternalDasLogger<L>, appenderFactory: AppenderFactory) : DasLogger<L> {
    const meta = this[DasMetaSymbol];
    return logger<L>({...meta, appenderFactory});
}

function isFunction(x:any) : x is Function {
    return typeof(x) === 'function';
}

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

function isSigil(x:any): x is LogSigil {
    return x.type && x.type === 'daslog-sigil';
}

export function processSigil(meta:AppenderFactoryMeta, sigil:LogSigil) {
    switch (sigil.value) {
        case sigils.level.value:
            return meta.logLevelName;
    }
    return sigil;
}
const defaultConsoleAppender: AppenderFactory = (meta, fragments, separator = '|') => {
    let combined = toStringHackFactory(function() {
        return fragments
            .map(fragment => (isSigil(fragment)) ? processSigil(meta, fragment) : fragment)
            .map(fragment => (isFunction(fragment) ? fragment() : fragment))
            .join(` ${separator} `);
    });

    // %s in conjunction with combined being a function calls toString cleanly in both node and the browser
    return console.log.bind(console, ...(fragments.length > 0)?['%s', combined, separator]:[]);
}

export const log4jLevels = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
}

const defaultMeta: DasMeta<typeof log4jLevels> = {
    chain: [],
    levels: log4jLevels,
    appenderFactory: defaultConsoleAppender,
}

/**
 * Transform the levels object from the meta object to the appropriate functions
 * depending on the appender specified in the meta object.
 * @param meta - The DasMeta object for the 
 */
function funcify<L extends LogLevels>(meta: DasMeta<L>) {
    return Object.keys(meta.levels).reduce((result, levelName) => {
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
export function logger<L extends LogLevels = typeof log4jLevels>(meta:Partial<DasMeta<L>> = {}): DasLogger<L> {
    const _dasMeta = {...defaultMeta, ...meta};
    const untypedLevelFuncs:any = funcify(_dasMeta);
    return {
        add,
        prefix,
        setLevels,
        setAppender,
        setMinimumLogLevel,
        [DasMetaSymbol]: _dasMeta,
        ...untypedLevelFuncs,
    }
}

let defaultLogger = logger();

export default defaultLogger;

/**
 * Destructively remove all properties from an object.
 * @param x - object to be cleared. 
 */
function clearObject(x:any) {
    Object.keys(x).forEach(key => {
        delete x[key];
    });
}

/**
 * Destructively update the default logger by clearing the object then incorporating all the properties
 * of the new logger.
 * @param newLogger 
 */
export function updateDefaultLogger<L extends LogLevels>(newLogger: DasLogger<L>) {
    /**
     * Technically I don't need to clear the log object because the type won't allow access to the
     * older log functions. That said...
     *  * I want enumerating the properties of the logger to make sense
     *  * the logger shouldn't surprise users when inspected in the console
     */
    clearObject(defaultLogger);
    Object.assign(defaultLogger, newLogger);
}