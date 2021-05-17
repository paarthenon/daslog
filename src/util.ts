export type Func = (...args: any[]) => any;
export type VoidFunc = (...args: any[]) => void;

/**
 * No-operation. Quietly replaces log functions when they don't meet the threshold.
 */
export function noop(){};
