import {Appender} from '../logger';
import {SigilConfig, DEFAULT_SIGIL_CONFIG, processSigils} from '../sigil';

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

export function consoleAppender(config: SigilConfig = DEFAULT_SIGIL_CONFIG): Appender<typeof console['log']> {
    return (meta, l) => {
        const combined = toStringHackFactory(() => processSigils(meta.chain, config, {...meta, level: l, time: Date.now()}));
        return console.log.bind(console, ...(meta.chain.length > 0)?['%s', combined]:[]);
    }
}

