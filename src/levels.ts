import {ROOM_FOR_JESUS} from './constants';

/**
 * Describe log levels in a meaningful way.
 */
export type LogLevelRanks<Levels extends string> = {
    [Level in Levels]: number;
}

/**
 * Generate a level priority map from an ordered list of strings.
 * @param order a list of log level names ordered least to most severe.
 * @param spacing a multiplier for the value of each index in the list.
 * 
 * @tutorial
 * ```ts
 * export const LOG4J_LEVELS = levels([
 *     'trace',
 *     'debug',
 *     'info',
 *     'warn',
 *     'error',
 *     'fatal',
 * ]);
 * ```
 * 
 * It is possible to generate levels from an existing array, however be
 * sure to use `as const` if doing so to retain the string literal types.
 * 
 * ```ts
 * const levelList = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
 * export const LOG4J_LEVELS = levels(levelList);
 * ```
 */
export function levels<LL extends string>(
    order: readonly LL[],
    spacing = ROOM_FOR_JESUS
): LogLevelRanks<LL> {
    return order.reduce((acc, cur, i) => {
        acc[cur] = i * spacing;
        return acc;
    }, {} as LogLevelRanks<LL>);
}

export const LOG4J_LEVELS = levels([
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
]);

export const SYSLOG_LEVELS = levels([
    'debug',
    'info',
    'notice',
    'warning',
    'err',
    'crit',
    'alert',
    'emerg',
]);