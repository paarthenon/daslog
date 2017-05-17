/**
 * Daslog supports loading prefixes as strings or string thunks
 */
export declare type LogFragment = string | ((...args: any[]) => string);
/**
 * Log levels are specified as an object mapping level names to numbers.
 *
 * ex:
 *
 * const levels = {
 *     debug: 0,
 *     info: 1,
 *     warn: 2,
 *     error: 3,
 *     fatal: 4,
 * }
 */
export interface LogLevels {
    [level: string]: number;
}
/**
 * Log levels tied to function names
 */
export declare type LogFuncs<T extends LogLevels> = {
    [P in keyof T]: (...args: any[]) => void;
};
/**
 * A factory function to consume the prefix fragments and assemble the
 */
export declare type AppenderFactory = (fragments: LogFragment[]) => (...args: any[]) => void;
/**
 * A logger constructed of several management functions and the levels specific logging functions
 */
export declare type DasLogger<L extends LogLevels> = {
    add: (...fragments: LogFragment[]) => DasLogger<L>;
    prefix: (...fragments: LogFragment[]) => DasLogger<L>;
    setLevels: <T extends LogLevels>(levels: T) => DasLogger<T>;
    setMinimumLogLevel: (minimumLogLevel: keyof L) => DasLogger<L>;
    setAppender: (logGenerator: AppenderFactory) => DasLogger<L>;
} & LogFuncs<L>;
export interface DasMeta<L extends LogLevels> {
    chain: LogFragment[];
    levels: L;
    minimumLogLevel?: number;
    appenderFactory: AppenderFactory;
}
export declare const log4jLevels: {
    trace: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    fatal: number;
};
/**
 * Stitch together the logger.
 * @param _dasMeta
 */
export declare function logger<L extends LogLevels = typeof log4jLevels>(meta?: Partial<DasMeta<L>>): DasLogger<L>;
declare let defaultLogger: DasLogger<{
    trace: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    fatal: number;
}>;
export default defaultLogger;
export declare function updateDefaultLogger(newLogger: DasLogger<any>): void;
