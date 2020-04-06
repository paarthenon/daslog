import {ROOM_FOR_JESUS} from './constants';

export type LogLevelRanks<Levels extends string> = {
    [Level in Levels]: number;
}

/**
 * 
 * 
 * log func is T => void;
 * 
 *   the appender is (config) => T => void;
 * 
 *      for console that's consoleConfig => console.log(bound);
 *      for file that's fileConfig => (...args: any[]) => void;
 * 
 */
export type Threshold<L extends string> = L | 'Infinity'; 

export function parseLevel<L extends string>(rank: LogLevelRanks<L>, level: Threshold<L>) : number {
    return level === 'Infinity' ? Infinity : rank[level];
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
