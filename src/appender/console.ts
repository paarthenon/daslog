import {AppenderFactory, processSigils, defaultSigilConfig} from '.';

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
 * The default appender. Prints to the console. When in a browser console this will maintain the line
 * numbers of the calling site through a couple neat tricks. See source.
 * @param meta The logger's internal meta information.
 * @param separator defaults to '|' (with spaces).
 */
export const defaultConsoleAppender: AppenderFactory = (meta, sigilConfig = defaultSigilConfig) => {
    let combined = toStringHackFactory(function() {
        return processSigils(meta);
    });

    // %s in conjunction with combined being a function calls toString cleanly in both node and the browser
    return console.log.bind(console, ...(meta.chain.length > 0)?['%s', combined]:[]);
}

