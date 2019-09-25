# DasLog [![Build Status](https://travis-ci.com/paarthenon/daslog.svg?branch=master)](https://travis-ci.com/paarthenon/daslog) ![npm](https://img.shields.io/npm/v/daslog)

Other loggers I tried:
 * were intended for node.js and used runtime require statements, which did not play well with bundlers
 * did not maintain line numbers when running in a browser console
 * did not support hierarchical categories
 * supported custom log levels but did not expose that type information (which doesn't help when you work in typescript).

Daslog is a fun little project that solves these problems for me. It's not designed to be an enterprise level logging tool. Given the choice between elegance and performance I'll often choose elegance. 

Daslog was originally short for 'dumb as s*** log'. The earliest version was a single prefix function that proxied the console object with a category-like prefix I wrote out of frustration with getting other logging frameworks to work.

This logger

 * Supports node.js and browser runtime environments
 * Allows for simple bundling with zero dynamic requires
 * Provides a default console logger that retains line numbers.
    * and more importantly the ability to create your own such appenders through appender factories rather than wrapper functions.
 * Features log levels
    * and more importantly customizable log levels
        * and yet more importantly typings that update as you create loggers that use these custom levels
 * Exports an easy to use and configurable top level default logger.
 * Features categories
    * and subcategories that can be stacked indefinitely
    * categories and subcategories can be string thunks that will be executed at the time of logging
 * Is designed to be immutable and creates new logger instances leaving the old loggers in place.


A short example of the kind of thing you can do:
```typescript
// this is more what we're looking at.
export const log1 = logger()
    .reformat(([level]) => [Sigil.Category('hi'), level])
    .setMinimumLogLevel('warn');

// Unfortunately this is no longer valid. Will be replacing this very shortly.

import defaultLog, * as das from './index'

defaultLog.warn('warn message'); // >warn message
const categoryLogger = defaultLog
    .add(das.sigils.level)
    .add('Category');

categoryLogger.info('category 1') // >Category | category 1
categoryLogger.warn('category 2')

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
```
