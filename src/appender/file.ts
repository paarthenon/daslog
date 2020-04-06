import {RollingFileStream} from 'streamroller';
import {Appender} from '../logger';
import {VoidFunc} from '../util';
import {DEFAULT_SIGIL_CONFIG, processSigils} from '../sigil';

/**
 * Saves to a file.
 * @param filename 
 * @param sigilConfig 
 */
export const fileAppender = (filename = 'das.log', sigilConfig = DEFAULT_SIGIL_CONFIG): Appender<VoidFunc> => {
    const stream = new RollingFileStream(filename, undefined, undefined, {keepFileExt: true});
    return (meta, level) => (...args: any[]) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        stream.write(`${processSigils(meta.chain, sigilConfig, {...meta, level, time: Date.now()})} ${msg}\n`);
    }
}
