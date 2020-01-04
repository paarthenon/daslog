import * as rollers from 'streamroller';
import {AppenderFactory, processSigils, defaultSigilConfig} from '.';
import {LogFunction} from '../logger';

/**
 * Saves to a file
 * @param meta 
 * @param filename 
 * @param sigilConfig 
 */
export const defaultFileAppender: AppenderFactory = (meta, filename = 'das.log', sigilConfig = defaultSigilConfig): LogFunction => {
    const stream = new rollers.RollingFileStream(filename, undefined, undefined, {keepFileExt: true});
    return ((...args: any[]) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        stream.write(`${processSigils(meta, sigilConfig)} ${msg}\n`);
    });
}
