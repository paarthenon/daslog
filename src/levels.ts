import {ROOM_FOR_JESUS} from './constants';

export type LogLevelRanks<Levels extends string> = {
    [Level in Levels]: number;
}

/**
 * Generate a level priority map
 * @param order 
 * @param spacing 
 */
export function levels<LL extends string>(order: readonly LL[], spacing = ROOM_FOR_JESUS): LogLevelRanks<LL> {
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