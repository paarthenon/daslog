import defaultLog, * as das from './index'

defaultLog.warn('warn message'); // >warn message
defaultLog.add('Category').info('category 1'); // >Category | category 1

const sampleLogger = das.logger()
    .add('New Default')
    .add(() => (new Date()).toLocaleTimeString())

das.updateDefaultLogger(sampleLogger);

defaultLog.warn('new message?'); // >New Default | 10:25:43 AM | new message?


const log1 = das.logger().add("Log1")

const newLevels = {
    human: 0,
    saiyan: 1,
    superSaiyan: 2,
}

const dbzLog = log1.setLevels(newLevels).add('DbzLog');

dbzLog.human('human hello');
dbzLog.superSaiyan('super say hello');