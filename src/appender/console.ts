import {Appender, indentToString} from '../logger';
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

/**
 * Factory function to return a bound console.log with the sigil chain pre-applied
 * @param config options to control the rendering of the sigil chain
 */
export function consoleAppender(config: SigilConfig = DEFAULT_SIGIL_CONFIG): Appender<typeof console['log']> {
    return (meta, level) => {
        // it looks like a function `() => void` and it is.
        // Its whole purpose is to have .toString() called on it
        // by `console.log` at runtime to get the closest timestamps. 
        const stringInABox = toStringHackFactory(() => processSigils(
            meta.chain,
            config,
            {...meta, level, time: Date.now()}
        ));
        return console.log.bind(console, ...(meta.chain.length > 0)?['%s', stringInABox]:[], indentToString(meta.indent));
    }
}

