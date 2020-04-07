import {Appender} from '../logger';
import {VoidFunc} from '../util';
import {processSigils, DEFAULT_SIGIL_CONFIG} from '../sigil';


let collected: string[] = [];

export function getCollected(): string[] {
    return collected;
}

/**
 * Mostly useful for testing. Records the contents of the message to a log.
 */
export function collectionAppender(): Appender<(message: string) => string[]> {
    return (meta, l) => (...args: any[]) => {
        const text = processSigils(meta.chain, DEFAULT_SIGIL_CONFIG, {...meta, time: Date.now(), level: l});
        const line = [text, ...args].join(' ');
        collected.push(line);
        return collected;
    }
}