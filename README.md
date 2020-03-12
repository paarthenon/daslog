# DasLog [![Build Status](https://travis-ci.com/paarthenon/daslog.svg?branch=master)](https://travis-ci.com/paarthenon/daslog) [![npm](https://img.shields.io/npm/v/daslog)](https://www.npmjs.com/package/daslog)

A cute, immutable, and unusually type safe logger for [TypeScript](https://www.typescriptlang.org/) & [ES6+](http://es6-features.org/), [NodeJS](https://nodejs.org/en/) & [Web](https://webpack.js.org/) with some unique features.
# Quick start

    npm i -S daslog

## Use

```typescript
// src/log.ts
import {logger} from 'daslog';
const log = logger().setCategory('Example');

// src/some/file.ts
import log from 'log'; // assuming baseUrl: "src"
log.info('Initializing app'); // 2019-10-03 02:42:19 | info | Example | Initializing app
```

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
    * and the ability to create your own such appenders.
 * Features log levels
    * and more importantly customizable log levels
        * and yet more importantly typings that update as you create loggers that use these custom levels
 * Features categories and subcategories
 * Is designed to be immutable and creates new logger instances leaving the old loggers in place.

****
## Logger

#### `append(sigil: Sigil)`: Adds a new sigil to the end of the chain.
#### `prepend(sigil: Sigil)`: Adds a new sigil to the front of the chain.
#### `reformat<T extends Tuple<Sigil>, U extends Tuple<Sigil>>(func: (current: T) => U)`: Completely restructure the chain.

Note the use of `as const` may be necessary to maintain a well-typed sigil chain. If it's missing the tuple will instead become `Sigil[]`, preventing well-typed reformats in the future.

#### `setCategory(category: string, append?: boolean)`: Set the top level category

Resets the category of the logger to the parameter. `append` is `true` by default.

#### `subCategory(category: string)`: Add a new subcategory

Categories are internally represented as a linked list. subCategory adds a new node to the end of that list.

> 2019-10-03 02:42:19 | info | Utilities > Promises | Hello World

#### `setLevels<L extends LogLevels>(levels: L)` Update the levels associated with the logger

The magic. The levels argument must extend LogLevels i.e. implement `{[level: string]: number}`. See the default log levels

Some people care about keeping a good spread in the values. It's not a bad idea and I've done so for convenience but in a pinch remember you can always remap the values to have wider gaps in the same order.

#### `setMinimumLogLevel(minimumLogLevel: keyof L | 'Infinity')` Assign the minimum log level

If this is set to `'Infinity'` logging is effectively turned off (unless you happen to have a log level with a weight of `Infinity` which... don't do that). Frankly I included this for parity with other loggers, I don't have a use case where I turn logging off fully.

The logger will also include log functions. By default these will correspond to the default log levels, i.e.
* `debug`
* `info`
* `warn`
* `error`
* `fatal`

## Levels

### Custom log levels.

This project was inspired by asking "I wonder if you can make a logger that updates its type signature when you set custom levels". Being familiar with typescript it seemed like it should have been possible which made it strange that the logging frameworks I researched at the time (the js loggers with `@types/` declarations) didn't do it. [Log4j would do this if it could](https://logging.apache.org/log4j/2.x/manual/customloglevels.html#Adding_or_Replacing_Log_Levels). Alas, doomed is the java programmer. Thankfully they're used to that.

The log functions are generated from an object acting as a key-value pair of `log name -> weight.` 

Mapped types existed at the time I originally wrote this, but `as const` and the more mature handling of literal tuples that's capable now did not.

> Note: Log levels will be assigned on the logger meaning they will conflict with the log functions. Do not use log levels of: `append`, `reformat`, `setCategory`, etc.

## Sigils

Sigils are responsible for the `2019-10-03 02:42:19 | info | Utilities > Promises` fragment of the log message in the example. The logger handles this by maintaining a list of markers or *sigils* indicating the items the logger is expected to fill in and the order they are in. The above fragment is generated by calling `.info()` on a logger with the sigil chain `[Sigil.Time(), Sigil.Level(), Sigil.Category()]`. Depending on the sigil, you may be able to pass extra information into the sigil constructor. For example, `Sigil.Time()` accepts the [dateformat](https://github.com/felixge/node-dateformat) format strings.

Sigil types:

 * Level
 * Category
 * Time `(format: string)` -- dateformat format string
 * Label `(label: string)`
 * Function `(func: (meta: AppenderFactoryMeta) => string)`

## Questions I'm Expecting

### Why appender factories over appender functions?

Wrapper functions obfuscate the call site of the log message. That alone makes it worth it to me. By having a factory that returns a preconfigured partially bound `console.log()` I retain the information of the call site and trivially support all of the powerful `console` functionality. Note that this doesn't prevent a user from creating custom factories that generate a wrapper, it just provides a mechanism for users to create factories that don't.

### Why assign no-op functions to log levels below the `minimumLogLevel`?

This was a natural consequence of using factories to get line numbers. We can no longer perform the logic to decide whether or not to print the message when the log function is called so we must do so when the logger is created/configured. Besides, it's kinda neat that turning off logging means you call the empty func `() => {}` every so often and that's the only performance impact. 
