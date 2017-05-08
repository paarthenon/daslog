"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * console.log(message, message2) => "message message2"
 * prefixedConsole.log(message, message2) => "category | message message2"
 *
 */
function prefix(category, target = console, separator = '|') {
    let logFuncs = new Set(['fatal', 'error', 'warn', 'log', 'info', 'debug', 'trace']);
    return new Proxy(target, {
        get: (target, name) => (...args) => {
            if (category != undefined && logFuncs.has(name)) {
                target[name].apply(target, [category, separator, ...args]);
            }
            else {
                target[name].apply(target, args);
            }
        }
    });
}
exports.prefix = prefix;
