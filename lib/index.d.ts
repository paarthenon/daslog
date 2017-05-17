export declare type LogFragment = string | ((...args: any[]) => string);
export interface LogLevels {
    [level: string]: number;
}
export declare type LogFuncs<T> = {
    [P in keyof T]: (...args: any[]) => void;
};
export declare type LogGenerator = (fragments: LogFragment[]) => (...args: any[]) => void;
export declare type DasLogger<L extends LogLevels> = {
    add: (...fragments: LogFragment[]) => DasLogger<L>;
    prefix: (...fragments: LogFragment[]) => DasLogger<L>;
    setLevels: <T extends LogLevels>(levels: T) => DasLogger<T>;
    setAppender: (logGenerator: LogGenerator) => DasLogger<L>;
} & LogFuncs<L>;
export declare const defaultLogger: DasLogger<{
    debug: number;
    info: number;
    warn: number;
    error: number;
    fatal: number;
}>;
