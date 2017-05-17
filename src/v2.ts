export type LogFragment = string | ((...args:any[]) => string)

export interface LogLevels {
    [level:string]: number
}

export type LogFuncs<T> = {
    [P in keyof T]: (...args:any[]) => void
}

function isFunction(x:any) : x is Function {
    return typeof(x) === 'function';
}

export type LogGenerator = (fragments: LogFragment[]) => (...args:any[]) => void;

interface DasMeta<L extends LogLevels> {
    chain: LogFragment[]
    levels: L
    logGenerator: LogGenerator
}

const defaultLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
}

const defaultLogGen :LogGenerator = (fragments, separator = '|') => {
    // dirty hack to force console.log to call a .toString function. This is necessary to simultaneously allow for
    // - time sensitive function calls (like using the current time in a prefix);
    // - console logs with accurate line numbers
    let combined:any = function(){};
    combined.toString = function() {
        return fragments
            .map(fragment => (isFunction(fragment) ? fragment() : fragment))
            .join(` ${separator} `);
    }

    return console.log.bind(console, ...(fragments.length > 0)?['%s', combined, separator]:[]);
}

const defaultMeta: DasMeta<{}> = {
    chain: [],
    levels: {},
    logGenerator: defaultLogGen,
}

const template:DasLogger<{}> = {
    add,
    prefix,
    setLevels,
    setAppender,
}

function add<L extends LogLevels>(...fragments: LogFragment[]): DasLogger<L> {
    const _dasMeta: DasMeta<L> = this._dasMeta;
    return build<L>({..._dasMeta, chain: [..._dasMeta.chain, ...fragments]});
}
function prefix<L extends LogLevels>(...fragments: LogFragment[]): DasLogger<L> {
    const _dasMeta: DasMeta<L> = this._dasMeta;
    return build<L>({..._dasMeta, chain: [...fragments, ..._dasMeta.chain]})
}
function setLevels<L extends LogLevels>(levels:L): DasLogger<L> {
    const _dasMeta: DasMeta<L> = this._dasMeta;
    return build<L>({..._dasMeta, levels});
}
function setAppender<L extends LogLevels>(logGenerator: LogGenerator) : DasLogger<L> {
    const _dasMeta: DasMeta<L> = this._dasMeta;
    return build<L>({..._dasMeta, logGenerator});
}

export type DasLogger<L extends LogLevels> = {
    add: (...fragments: LogFragment[]) => DasLogger<L>
    prefix: (...fragments: LogFragment[]) => DasLogger<L>
    setLevels: <T extends LogLevels>(levels:T) => DasLogger<T>
    setAppender: (logGenerator: LogGenerator) => DasLogger<L>
} & LogFuncs<L>

function funcify<L extends LogLevels>(meta: DasMeta<L>) {
    return Object.keys(meta.levels).reduce((result, key) => {
        result[key] = meta.logGenerator(meta.chain);
        return result;
    }, {} as LogFuncs<L>);
}

function build<L extends LogLevels = {}>(_dasMeta:DasMeta<{}> = defaultMeta) : DasLogger<L> {
    const untypedLevelFuncs:any = funcify(_dasMeta);
    return {
        ...template,
        _dasMeta,
        ...untypedLevelFuncs,
    }
}

export const defaultLogger = build().setLevels(defaultLevels);
