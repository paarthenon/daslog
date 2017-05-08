"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logFuncs = new Set(['fatal', 'error', 'warn', 'log', 'info', 'debug', 'trace']);
/**
 * console.log(message, message2) => "message message2"
 * prefixedConsole.log(message, message2) => "category | message message2"
 *
 */
// export function prefix(category:string, target=console, separator='|') :Console {
// 	return new Proxy<Console>(target, {
// 		get: (target:Console, name:keyof Console) => (...args:any[]) => {
// 			if (category != undefined && logFuncs.has(name)) {
// 				target[name].apply(target, [category, separator, ...args]);
// 			} else {
// 				target[name].apply(target, args);
// 			}
// 		}
// 	});
// }
const DAS_PROPS_KEY = '_dasProps';
function add(...fragments) {
    let props = this[DAS_PROPS_KEY];
    return buildProxy(Object.assign({}, props, { chain: [...props.chain, ...fragments] }));
}
function isFunction(x) {
    return typeof (x) === 'function';
}
function buildProxy(props) {
    return new Proxy(Object.assign({}, console, { add, [DAS_PROPS_KEY]: props }), {
        get: (target, name) => {
            if (isFunction(target[name]) && logFuncs.has(name)) {
                return (...args) => {
                    const combined = target._dasProps.chain
                        .map(fragment => (isFunction(fragment) ? fragment() : fragment))
                        .join(` ${target._dasProps.separator} `);
                    return target[name].apply(target, [combined, target._dasProps.separator, ...args]);
                };
            }
            else {
                return target[name];
            }
        }
    });
}
function isDasLog(x) {
    return DAS_PROPS_KEY in x;
}
function getOriginal(target) {
    if (isDasLog(target)) {
        return target._dasProps.original;
    }
    else {
        return target;
    }
}
function getChain(target) {
    if (isDasLog(target)) {
        return target._dasProps.chain;
    }
    else {
        return [];
    }
}
function prefix(fragment, target = console, separator = '|') {
    return buildProxy({
        original: getOriginal(target),
        chain: [fragment, ...getChain(target)],
        separator,
    });
}
exports.prefix = prefix;
