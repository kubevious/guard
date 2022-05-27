import { Backend } from '@kubevious/helper-backend'
import { LogLevel } from 'the-logger';
import { Context } from './context'

const backend = new Backend("guard", {
    logLevels: {
        'DriverMysql': LogLevel.warn
    }
});

new Context(backend);

backend.run();