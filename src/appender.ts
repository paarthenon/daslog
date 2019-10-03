import {Category} from "./category";
import {LogFunction} from "./logger";
import {Sigil, processSigil} from "./sigil";

/**
 * The information passed into an appender factory.
 */
export interface AppenderFactoryMeta {
    logLevelName: string
    chain: ReadonlyArray<Sigil>
    category?: Category
}

/**
 * A factory function to consume the prefix fragments and assemble the 
 */
export type AppenderFactory = (appenderMeta: AppenderFactoryMeta) => LogFunction;

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
export const defaultConsoleAppender: AppenderFactory = (meta, separator: string = '|', spaces: boolean = true, finalSeparator = separator) => {
    let combined = toStringHackFactory(function() {
        const sigils = meta.chain
            .map(sigil => processSigil(meta, sigil))
            .filter(s => s != undefined)
            .join(spaces ? ` ${separator} ` : separator);
        
        return sigils + (spaces ? ' ' : '') + finalSeparator;
    });

    // %s in conjunction with combined being a function calls toString cleanly in both node and the browser
    return console.log.bind(console, ...(meta.chain.length > 0)?['%s', combined]:[]);
}