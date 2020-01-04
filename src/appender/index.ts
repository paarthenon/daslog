import {Category} from "../category";
import {LogFunction} from "../logger";
import {Sigil, processSigil} from "../sigil";

/**
 * The information passed into an appender factory.
 */
export interface AppenderFactoryMeta {
    logLevelName: string
    chain: ReadonlyArray<Sigil>
    category?: Category
}
export interface SigilConfig {
    separator: string;
    spaces: boolean;
    finalSeparator?: string;
}
export const defaultSigilConfig: SigilConfig = {
    separator: '|',
    spaces: true,
    finalSeparator: '|',
}

/**
 * A factory function to consume the prefix fragments and assemble the 
 */
export type AppenderFactory = (appenderMeta: AppenderFactoryMeta) => LogFunction;

export function processSigils(meta: AppenderFactoryMeta, config = defaultSigilConfig) {
    const {spaces, separator, finalSeparator} = config;
    const outputSigils = meta.chain
        .map(sigil => processSigil(meta, sigil))
        .filter(s => s != undefined)
        .join(spaces ? ` ${separator} ` : separator);
    
    return outputSigils + (spaces ? ' ' : '') + finalSeparator;
}
