import defaultLog, * as das from './index'

defaultLog.warn('warn message'); // >warn message
defaultLog.add('Category').info('category 1'); // >Category | category 1


das.updateDefaultLogger(das.logger().add('new default'));

defaultLog.warn('new message?'); // >new default | new message?