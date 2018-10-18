"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sigil(key) {
    return {
        type: 'daslog-sigil',
        value: key,
    };
}
exports.sigils = {
    level: sigil('level')
};
const DasMetaSymbol = Symbol('DASLogger metadata');
function add(...fragments) {
    const meta = this[DasMetaSymbol];
    return logger(Object.assign({}, meta, { chain: [...meta.chain, ...fragments] }));
}
function prefix(...fragments) {
    const meta = this[DasMetaSymbol];
    return logger(Object.assign({}, meta, { chain: [...fragments, ...meta.chain] }));
}
function setLevels(levels) {
    const meta = this[DasMetaSymbol];
    return logger(Object.assign({}, meta, { levels }));
}
function setMinimumLogLevel(minimumLogLevel) {
    const meta = this[DasMetaSymbol];
    return logger(Object.assign({}, meta, { minimumLogLevel: meta.levels[minimumLogLevel] }));
}
function setAppender(appenderFactory) {
    const meta = this[DasMetaSymbol];
    return logger(Object.assign({}, meta, { appenderFactory }));
}
function isFunction(x) {
    return typeof (x) === 'function';
}
/**
 * A hack to force console.log to call a .toString function. This is necessary to simultaneously allow for
 * 	* time sensitive function calls (for example using a fragment for the current time)
 *  * console logs with accurate line numbers.
 * @param toStringFunc - The function to execute
 */
function toStringHackFactory(toStringFunc) {
    let func = function () { };
    func.toString = toStringFunc;
    return func;
}
function isSigil(x) {
    return x.type && x.type === 'daslog-sigil';
}
function processSigil(meta, sigil) {
    switch (sigil.value) {
        case exports.sigils.level.value:
            return meta.logLevelName;
    }
    return sigil;
}
exports.processSigil = processSigil;
const defaultConsoleAppender = (meta, fragments, separator = '|') => {
    let combined = toStringHackFactory(function () {
        return fragments
            .map(fragment => (isSigil(fragment)) ? processSigil(meta, fragment) : fragment)
            .map(fragment => (isFunction(fragment) ? fragment() : fragment))
            .join(` ${separator} `);
    });
    // %s in conjunction with combined being a function calls toString cleanly in both node and the browser
    return console.log.bind(console, ...(fragments.length > 0) ? ['%s', combined, separator] : []);
};
exports.log4jLevels = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
};
const defaultMeta = {
    chain: [],
    levels: exports.log4jLevels,
    appenderFactory: defaultConsoleAppender,
};
/**
 * Transform the levels object from the meta object to the appropriate functions
 * depending on the appender specified in the meta object.
 * @param meta - The DasMeta object for the
 */
function funcify(meta) {
    return Object.keys(meta.levels).reduce((result, levelName) => {
        result[levelName] =
            (meta.minimumLogLevel && meta.minimumLogLevel > meta.levels[levelName])
                ? () => { }
                : meta.appenderFactory({ logLevelName: levelName }, meta.chain);
        return result;
    }, {});
}
/**
 * Stitch together the logger.
 * @param _dasMeta
 */
function logger(meta = {}) {
    const _dasMeta = Object.assign({}, defaultMeta, meta);
    const untypedLevelFuncs = funcify(_dasMeta);
    return Object.assign({ add,
        prefix,
        setLevels,
        setAppender,
        setMinimumLogLevel, [DasMetaSymbol]: _dasMeta }, untypedLevelFuncs);
}
exports.logger = logger;
let defaultLogger = logger();
exports.default = defaultLogger;
/**
 * Destructively remove all properties from an object.
 * @param x - object to be cleared.
 */
function clearObject(x) {
    Object.keys(x).forEach(key => {
        delete x[key];
    });
}
/**
 * Destructively update the default logger by clearing the object then incorporating all the properties
 * of the new logger.
 * @param newLogger
 */
function updateDefaultLogger(newLogger) {
    /**
     * Technically I don't need to clear the log object because the type won't allow access to the
     * older log functions. That said...
     *  * I want enumerating the properties of the logger to make sense
     *  * the logger shouldn't surprise users when inspected in the console
     */
    clearObject(defaultLogger);
    Object.assign(defaultLogger, newLogger);
}
exports.updateDefaultLogger = updateDefaultLogger;
