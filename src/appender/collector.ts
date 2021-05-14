import {Appender, DasMeta} from '../logger';
import {VoidFunc} from '../util';
import {processSigils, DEFAULT_SIGIL_CONFIG, Sigil} from '../sigil';
import {Category} from '../category';



/**
 * Mostly useful for testing. Records the contents of the message to a log.
 */
export function collectionAppender() {
    // this is why global state sucks.
    let collected: string[] = [];
    const appender: Appender<(message: string) => string[]> = (meta, l) => (...args: any[]) => {
        const text = processSigils(meta.chain, DEFAULT_SIGIL_CONFIG, {...meta, time: Date.now(), level: l});
        const line = [text, ...args].join(' ');
        collected.push(line);
        return collected;
    }

    Object.assign(appender, {
        getCollected: () => collected,
    })

    return appender;
}

export interface LogObject<L extends string = string> {
    level: L;
    timestamp: Date;
    category?: Category;
    msg: any[];
}

/**
 * Generate a logging object
 */
export function logObject<
    L extends string, 
    Chain extends readonly Sigil[]
>(
    meta: DasMeta<L, Chain, VoidFunc>,
    level: L,
    msg: any[]
): LogObject<L> {
    return {
        level: level as L,
        timestamp: new Date(),
        msg,
        ...(meta.category && {category: meta.category}),
    }
}


export function objectAppender<L extends string = string>(): Appender<(...args: any[]) => LogObject<L> | undefined> {
    return (meta, l) => (...args: any[]) => {
        return logObject(meta, l as L, args);
    }
}
