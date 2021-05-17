import {logger} from '../logger';
import {collectionAppender} from './collector';

test('collected', () => {
    let appender = collectionAppender();
    const log = logger().setAppender(appender);

    log.info('hello collector');

    expect(appender.getCollected().length).toBe(1);
})

test('mute', () => {
    let appender = collectionAppender();

    const log = logger().setAppender(appender).mute();

    log.info('hello');

    expect(appender.getCollected().length).toBe(0);
})

test('complex collection appender', () => {
    let appender1 = collectionAppender();
    let appender2 = collectionAppender();
    
    const log1 = logger().setAppender(appender1);
    const log2 = logger().setAppender(appender2);

    log1.info('Yellow');

    expect(appender1.getCollected().length).toBe(1);
    expect(appender2.getCollected().length).toBe(0);
})