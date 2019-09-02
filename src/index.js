
const symbol = Symbol.for('io.yucom.log.instance')

let instance = globalThis[symbol]

if (!instance) {

  const conf = require('./conf')
  const moment = require('moment')
  const context = require('@yucom/context')

  const asString = message => {
    if (typeof message !== 'object') return String(message)
    if (message instanceof Error) return message.stack ? message.stack : message.message
    return JSON.stringify(message)
  }

  class LogLevel {
    constructor(number, name) {
      this.number = number
      this.name = name
    }
  }

  class Severity {
    constructor(number, displayName, stream) {
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

  class Logger {

    constructor(label) {
      this.label = label
      this.level = undefined;
    }

    getLevel() {
      return this.level ? this.level.name : globalLogLevel.name;
    }

    setLevel(levelName) {
      this.level = LogLevels[String(levelName).toLocaleLowerCase()]
      if (!this.level) throw new Error('Invalid level name: ' + levelName)
      return this
    }

    getLabel() {
      return this.label
    }

    debug(...messages) {
      this.log(Severities.debug, messages)
    }
    info(...messages) {
      this.log(Severities.info, messages)
    }
    warning(...messages) {
      this.log(Severities.warning, messages)
    }
    error(...messages) {
      this.log(Severities.error, messages)
    }

    log(severity, messages) {
      if (this.__currentLogLevel().number >= severity.number) {
        let time = moment().toISOString(true)
        let txid = context.get('txid') || ''
        let strings = messages.map(asString).join(' ')
        severity.stream.write(`${time} [${this.label}][${txid}] ${severity.displayName}: ${strings}\n`)
      }
      return this
    }

    __currentLogLevel() {
      return this.level || globalLogLevel
    }
  }

  class MainLogger extends Logger {
    constructor() {
      super('')
    }

    __currentLogLevel() {
      return globalLogLevel
    }

    setLevel(levelName) {
      globalLogLevel = LogLevels[levelName]
      return this
    }

    getLevel() {
      return globalLogLevel.name;
    }

    create(label, levelName) {
      const newLogger =  new Logger(label)
      if (levelName) newLogger.setLevel(levelName)
      return newLogger
    }
  }

  instance = new MainLogger()
  globalThis[symbol] = instance

  instance.debug('Wellcome! New logger created.')
} else {
  instance.debug('Logger already exist.')
}

module.exports = instance
