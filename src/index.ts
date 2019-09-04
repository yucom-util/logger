import conf from './conf'
import moment from 'moment'
import context from '@yucom/context'

const symbol = Symbol.for('io.yucom.log.instance')

type Logger = {
  getLevel(): string
  setLevel(levelName: string): Logger
  getLabel(): string
  debug(...messages): Logger
  info(...messages): Logger
  warning(...messages): Logger
  error(...messages): Logger
}

type MainLogger = Logger & {
  create(label, levelName): Logger
}

let instance: MainLogger = globalThis[symbol]

if (!instance) {


  const asString = message => {
    if (typeof message !== 'object') return String(message)
    if (message instanceof Error) return message.stack ? message.stack : message.message
    return JSON.stringify(message)
  }

  class LogLevel {
    constructor(public number: number, public name: string) { }
  }

  class Severity {
    constructor(public number: number, public displayName: string, public stream: NodeJS.WriteStream) {
      this.number = number
      this.displayName = displayName
      this. stream = stream
    }
  }

  const LogLevels = {
    all: new LogLevel(100, 'all'),

    debug: new LogLevel(7, 'debug'),
    info: new LogLevel(6, 'info'),
    warning: new LogLevel(4, 'warning'),
    error: new LogLevel(3, 'error'),

    none: new LogLevel(-1, 'none')
  }

  const Severities = {
    debug: new Severity(7, 'DEBUG', process.stdout),
    info: new Severity(6, 'INFO', process.stdout),
    warning: new Severity(4, 'WARNING', process.stderr),
    error: new Severity(3, 'ERROR', process.stderr)
  };

  let globalLogLevel = LogLevels[String(conf.level).toLowerCase()] || LogLevels.all

  class BaseLogger {

    private level: LogLevel | undefined = undefined;

    constructor(private label: string) { }

    getLevel(): string {
      return this.level ? this.level.name : globalLogLevel.name;
    }

    setLevel(levelName: string): Logger {
      this.level = LogLevels[String(levelName).toLocaleLowerCase()]
      if (!this.level) throw new Error('Invalid level name: ' + levelName)
      return this
    }

    getLabel() {
      return this.label
    }

    debug(...messages) {
      return this.log(Severities.debug, messages)
    }
    info(...messages) {
      return this.log(Severities.info, messages)
    }
    warning(...messages) {
      return this.log(Severities.warning, messages)
    }
    error(...messages) {
      return this.log(Severities.error, messages)
    }

    protected currentLogLevel() {
      return this.level || globalLogLevel
    }

    private log(severity, messages) {
      if (this.currentLogLevel().number >= severity.number) {
        let time = moment().toISOString(true)
        let txid = context.get('txid') || ''
        let strings = messages.map(asString).join(' ')
        severity.stream.write(`${time} [${this.label}][${txid}] ${severity.displayName}: ${strings}\n`)
      }
      return this
    }
  }

  class FullLogger extends BaseLogger {
    constructor() {
      super('')
    }

    protected currentLogLevel() {
      return globalLogLevel
    }

    setLevel(levelName: string) {
      globalLogLevel = LogLevels[levelName]
      return this
    }

    getLevel(): string {
      return globalLogLevel.name;
    }

    create(label, levelName): Logger {
      const newLogger =  new BaseLogger(label)
      if (levelName) newLogger.setLevel(levelName)
      return newLogger
    }
  }

  instance = new FullLogger()
  globalThis[symbol] = instance

  instance.debug('Wellcome! New logger created.')
} else {
  instance.debug('Logger already exist.')
}

export = instance;
