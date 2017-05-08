export declare type logFragment = string | (() => string);
export interface DasLog extends Console {
    add: (fragment: logFragment) => DasLog;
}
export declare function prefix(fragment: string, target?: Console, separator?: string): DasLog;
