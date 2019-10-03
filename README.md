# DasLog [![Build Status](https://travis-ci.com/paarthenon/daslog.svg?branch=master)](https://travis-ci.com/paarthenon/daslog) ![npm](https://img.shields.io/npm/v/daslog)

Other loggers I tried:
 * were intended for node.js and used runtime require statements, which did not play well with bundlers
 * did not maintain line numbers when running in a browser console
 * did not support hierarchical categories
 * supported custom log levels but did not expose that type information (which doesn't help when you work in typescript).

Daslog is a fun little project that solves these problems for me. It lets us do neat things like

```typescript
const log = logger()
    .setCategory('Utilities')
    .subCategory('Promises')
    .append(Sigil.Category())

log.info('Hello World');
// 2019-10-03 02:42:19 | info | Utilities > Promises | Hello World

// This line is type safe and updates the signature of newLog to
// DasLog<L, [Sigil.Time, Sigil.Category, Sigil.Level]>
const newLog = log.reformat(([time, level, category]) => [time, category, level] as const);

const onePunchLevels = {
    wolf: 0,
    tiger: 1,
    demon: 2,
    dragon: 3,
    god: 4,
};

const animeDisaster = newLog.setLevels(onePunchLevels).setCategory('Disaster');

animeDisaster.demon('the city is in danger');
// 2019-10-03 02:50:03 | Disaster | demon | the city is in danger
```

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
