"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFunction(x) {
    return typeof (x) === 'function';
}
const defaultLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};
const defaultLogGen = (fragments, separator = '|') => {
    // dirty hack to force console.log to call a .toString function. This is necessary to simultaneously allow for
    // - time sensitive function calls (like using the current time in a prefix);
    // - console logs with accurate line numbers
    let combined = function () { };
    combined.toString = function () {
        return fragments
            .map(fragment => (isFunction(fragment) ? fragment() : fragment))
            .join(` ${separator} `);
    };
    return console.log.bind(console, ...(fragments.length > 0) ? ['%s', combined, separator] : []);
};
const defaultMeta = {
    chain: [],
    levels: {},
    logGenerator: defaultLogGen,
};
const template = {
    add,
    prefix,
    setLevels,
    setAppender,
};
function add(...fragments) {
    const _dasMeta = this._dasMeta;
    return build(Object.assign({}, _dasMeta, { chain: [..._dasMeta.chain, ...fragments] }));
}
function prefix(...fragments) {
    const _dasMeta = this._dasMeta;
    return build(Object.assign({}, _dasMeta, { chain: [...fragments, ..._dasMeta.chain] }));
}
function setLevels(levels) {
    const _dasMeta = this._dasMeta;
    return build(Object.assign({}, _dasMeta, { levels }));
}
function setAppender(logGenerator) {
    const _dasMeta = this._dasMeta;
    return build(Object.assign({}, _dasMeta, { logGenerator }));
}
function funcify(meta) {
    return Object.keys(meta.levels).reduce((result, key) => {
        result[key] = meta.logGenerator(meta.chain);
        return result;
    }, {});
}
function build(_dasMeta = defaultMeta) {
    const untypedLevelFuncs = funcify(_dasMeta);
    return Object.assign({}, template, { _dasMeta }, untypedLevelFuncs);
}
exports.defaultLogger = build().setLevels(defaultLevels);
