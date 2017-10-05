export interface LogSigil<T extends string = string> {
    type: 'daslog-sigil';
    value: T;
}
export declare function sigil<T extends string>(key: T): LogSigil<T>;
