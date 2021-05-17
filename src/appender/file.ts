import {RollingFileStream} from 'streamroller';
import {Appender} from '../logger';
import {VoidFunc} from '../util';
import {DEFAULT_SIGIL_CONFIG, processSigils, SigilConfig} from '../sigil';
import {walkCat} from '../category';

/**
 * Unused.
 * @todo incorporate into `fileAppender`
 * @alpha
 */
export interface FileAppenderConfig {
    /**
     * The maximum file size in bytes for a file log.
     */
    maxFileSize?: number;
    /**
     * The number of backup log files to keep.
     */
    numBackups?: number;
    /**
     * Configuration options specific to sigils
     */
    sigilConfig?: SigilConfig;
}

/**
 * Saves to a file.
 * @param filename 
 * @param sigilConfig 
 */
export const fileAppender = (
    filename = 'das.log',
    sigilConfig = DEFAULT_SIGIL_CONFIG
): Appender<VoidFunc> => {
    // TODO: incorporate items from a more advanced settings object.
    const stream = new RollingFileStream(
        filename,
        undefined,
        undefined,
        {keepFileExt: true}
    );
    return (meta, level) => (...args: any[]) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        stream.write(`${processSigils(meta.chain, sigilConfig, {...meta, level, time: Date.now()})} ${msg}\n`);
    }
}

/**
 * Saves to a file.
 * @param filename 
 * @param sigilConfig 
 */
export const structuredFileAppender = (filename = 'das.log'): Appender<VoidFunc> => {
    const stream = new RollingFileStream(filename, undefined, undefined, {keepFileExt: true});
    return (meta, level) => (...args: any[]) => {
        const msgText = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        const msg = {
            text: msgText,
            time: new Date(),
            level,
            ...(meta.category != undefined) ? {category: walkCat(meta.category).join(' > ')} : {}
        }
        stream.write(JSON.stringify(msg, null, 2) + ',\n');
    }
}
