# daslog

Other loggers I tried:
 * were intended for node.js and used runtime require statements, which did not play well with bundlers
 * did not maintain line numbers when running in a browser console
 * did not support hierarchical categories
 * supported custom log levels but did not expose that type information (which doesn't help when you work in typescript).

Daslog is a fun little project that solves these problems for me. It's not an enterprise level logging tool and isn't really meant to be.

Daslog was originally short for 'dumb as s*** log'. The earliest version was a single prefix function that proxied the console object with a category-like prefix I wrote out of frustration with getting other logging frameworks to work.
