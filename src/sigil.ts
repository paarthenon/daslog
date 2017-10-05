export interface LogSigil<T extends string = string> {
    type: 'daslog-sigil',
    value: T,
}
export function sigil<T extends string>(key:T): LogSigil<T> {
    return {
        type: 'daslog-sigil',
        value: key,
    }
}
