# Yucom Log
Preconfigured simple logger

## Install

```
npm install @yucom/logger
```

## Use

```js
import log from '@yucom/log';

// log is a root logger
log.debug('Hello world!'); // 2019-04-11T18:42:50.636-03:00 [][] DEBUG: Hello world!
log.info('Max height:', 5 * 4, 'mm') // ... INFO: Max height 20 mm
log.warning('Received', { status: 404 }) // ... WARNING: Received { "status": 404 }
log.error(new TypeError('WTF!')) // ... ERROR: TypeError: WTF! at ...(full stack trace)...
```

### Tagged logger

This is the recommended way to use a logger. Instead of using the main log instance, create a tagged instance to better identify the source
module.

```js
//tagged logger:
let mylog = log.create('my-module')

mylog.info('Hello') // 2019-04-11T18:42:50.636-03:00 [my-module][] INFO: Hello
```

### Log levels

The root level log reads the environment variable LOG_LEVEL. If it's not defined, `all` (all messages) is used.
Valid level values are:
`all`, `debug`, `info`, `warning`, `error`, `none`

`all` and `debug` are equivalent.

Log level can be changed in runtime:

```js
log.setLevel('warning');
```

This will affect all tagged loggers also, unless they're level had been explicitly specified.


```js
// Creates a logger with its own level
let mylog = log.create('my-module', 'error')
// You can also set its level later
mylog.setLevel('warning');
```

## Context

If the property `txid` is present in [context](https://www.npmjs.com/package/@yucom/context), it will be included in output.
