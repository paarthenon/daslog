import {logger} from './logger'
import {ROOM_FOR_JESUS} from './constants';
import {levels} from './levels';
import {Sigil} from './sigil';

test('logger (basic)', () => {
    const log = logger();

    log.info('Hello');

    expect(log.debug).toBeDefined();
})

test('setLevels', () => {
    const log = logger().setLevels({
        low: 1,
        medium: 2,
        high: 3,
    });

    log.high('hIGH IGH HELOO')

    expect(log.high).toBeDefined();
    expect((log as any)['trace']).toBeUndefined();
})

test('setLevels two', () => {
    const log = logger().setLevels(levels(['low', 'medium', 'high']));

    expect(log.high).toBeDefined();
    expect((log as any).trace).toBeUndefined();
})

test('minimum level', () => {
    const log = logger()
        .setThreshold('warn')
        .setLevels(levels(['low', 'high', 'info']))
        .setCategory('yohoho')
        .reformat(([time, level]) => {
            return [time, Sigil.Label('Mina')] as const
        })
    ;

    log.info('info');
    log.low('warn');
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            log.high('error');
            resolve();
        }, 3000);
    })
})
