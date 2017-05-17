"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFunction(x) {
    return typeof (x) === 'function';
}
function add(...fragments) {
    const _dasMeta = this._dasMeta;
    return logger(Object.assign({}, _dasMeta, { chain: [..._dasMeta.chain, ...fragments] }));
}
function prefix(...fragments) {
    const _dasMeta = this._dasMeta;
    return logger(Object.assign({}, _dasMeta, { chain: [...fragments, ..._dasMeta.chain] }));
}
function setLevels(levels) {
    const _dasMeta = this._dasMeta;
    return logger(Object.assign({}, _dasMeta, { levels }));
}
function setMinimumLogLevel(minimumLogLevel) {
    const _dasMeta = this._dasMeta;
    return logger(Object.assign({}, _dasMeta, { minimumLogLevel: _dasMeta.levels[minimumLogLevel] }));
}
function setAppender(appenderFactory) {
    const _dasMeta = this._dasMeta;
    return logger(Object.assign({}, _dasMeta, { appenderFactory }));
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
const defaultConsoleAppender = (fragments, separator = '|') => {
    let combined = toStringHackFactory(function () {
        return fragments
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
    return Object.keys(meta.levels).reduce((result, key) => {
        result[key] =
            (meta.minimumLogLevel && meta.minimumLogLevel > meta.levels[key])
                ? () => { }
                : meta.appenderFactory(meta.chain);
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
        setMinimumLogLevel,
        _dasMeta }, untypedLevelFuncs);
}
exports.logger = logger;
let defaultLogger = logger();
exports.default = defaultLogger;
function clearObject(x) {
    Object.keys(x).forEach(key => {
        delete x[key];
    });
}
function updateDefaultLogger(newLogger) {
    clearObject(defaultLogger);
    Object.assign(defaultLogger, newLogger);
}
exports.updateDefaultLogger = updateDefaultLogger;
