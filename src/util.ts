export type Func = (...args: any[]) => any;
export type VoidFunc = (...args: any[]) => void;
export type MysteryFunc = (x: unknown) => unknown;

/**
 * No-operation. Quietly replaces log functions when they don't meet the threshold.
 */
export function noop(){};
