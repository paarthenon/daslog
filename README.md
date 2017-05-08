# daslog
dumb as s*** logging

For when you want logging category prefixes and don't care about anything else. Daslog wraps the console object and does not support appenders but provides a fair bit of flexibility. 

## Use

### Basic
```
import {prefix} from 'daslog'

const logger = prefix('Application');

logger.log('hello')

```

prints
```
Application | hello
```

### Tiered
```
import {prefix} from 'daslog'

const appLogger = prefix('Application');

appLogger.log('Initializing')

function utilityFunction() {
    const utilLogger = appLogger.add('Utils');
    
    utilLogger.log('Calculating');
}
```
prints
```
Application | Initializing
Application | Utils | Calculating
```

### Functions
```
import {prefix} from 'daslog'

const appLogger = prefix('Application')
    .add(() => (new Date()).toLocaleTimeString());
        
appLogger.log('Hello World');
```
prints
`Application | 2:19:30 AM | Hello World`
