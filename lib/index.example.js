"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index"), das = index_1;
index_1.default.warn('warn message'); // >warn message
index_1.default.add('Category').info('category 1'); // >Category | category 1
const sampleLogger = das.logger()
    .add('New Default')
    .add(() => (new Date()).toLocaleTimeString());
das.updateDefaultLogger(sampleLogger);
index_1.default.warn('new message?'); // >New Default | 10:25:43 AM | new message?
const log1 = das.logger().add("Log1");
const newLevels = {
    human: 0,
    saiyan: 1,
    superSaiyan: 2,
};
const dbzLog = log1.setLevels(newLevels).add('DbzLog');
dbzLog.human('human hello');
dbzLog.superSaiyan('super say hello');
