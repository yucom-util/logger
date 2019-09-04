const context = require('@yucom/context')
const express = require('express');
const axios = require('axios');

const baseStdoutWrite = process.stdout.write.bind(process.stdout);
const baseStdErrWrite = process.stdout.write.bind(process.stderr);

const stdoutMessages = [];
process.stdout.write = message => {
  stdoutMessages.push(message);
  return baseStdoutWrite(message);
}

const stderrMessages = [];
process.stderr.write = message => {
  stderrMessages.push(message);
  return baseStdErrWrite(message);
}

const log = require('../');

const defaultLogLevel = 'debug';

describe('Default log', () => {
  test('Label is empty', () => {
    expect(log.getLabel()).toBe('');
  });
  test('Default level is debug', () => {
    expect(log.getLevel()).toBe(defaultLogLevel);
  });
  test('level can be changed', () => {
    log.setLevel('error');
    expect(log.getLevel()).toBe('error');
    log.setLevel(defaultLogLevel);
    expect(log.getLevel()).toBe(defaultLogLevel);
  });
  test('Sublog inherits global level', () => {
    const sublog = log.create('sublog');
    expect(sublog.getLevel()).toBe(defaultLogLevel);
    log.setLevel('error');
    expect(log.getLevel()).toBe('error');
    expect(sublog.getLevel()).toBe('error');
  });
  test('Sublog can have its own  level', () => {
    const sublog = log.create('sublog', 'info');
    expect(sublog.getLevel()).toBe('info');
    log.setLevel('error');
    expect(sublog.getLevel()).toBe('info');
    log.setLevel('debug');
  });
  test('level actually filter messages', () => {
    const outBefore = stdoutMessages.length
    const sublog = log.create('sublog');
    sublog.info('hello', 'world');
    expect(stdoutMessages).toHaveLength(outBefore + 1);
    expect(stdoutMessages[outBefore]).toMatch(/.+ INFO: hello world\n/);
    log.setLevel('error');
    sublog.debug('hello', 'world');
    expect(stdoutMessages).toHaveLength(outBefore + 1);
  });
  test('Warnings and errors goes to stderr', () => {
    const initialStdoutLength = stdoutMessages.length;
    const initialStderrLength = stderrMessages.length;

    log.setLevel('debug');

    const sublog = log.create('sublog');
    log.error('hello', 'world');
    expect(stderrMessages).toHaveLength(initialStderrLength + 1);
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ ERROR: hello world\n/);

    sublog.warning('fooBar');
    expect(stderrMessages).toHaveLength(initialStderrLength + 2);
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ WARNING: fooBar\n/);

    // stdout does not changed
    expect(stdoutMessages).toHaveLength(initialStdoutLength);
  });
  test('Non-strings are converted to string', () => {
    log.error(undefined, null);
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ ERROR: undefined null\n/);

    log.error(67.456);
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ ERROR: 67.456\n/);

    log.error(true);
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ ERROR: true\n/);

    log.error(['Hugo', 'Paco', 'Luis']);
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ \["Hugo","Paco","Luis"\]\n/);

    log.error({ foo: 'bar' });
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ {"foo":"bar"}\n/);

    log.error(new TypeError('Error'));
    expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+ TypeError: Error\s+at /);
  });
  test('Transaction id is logged if it exists in context', (done) => {

    const app = express();
    app.use(context.middleware);
    app.get('/', (_, res) => {
      context.set('txid', 'this is a transaction id');
      setTimeout(() => {
                  log.error('example');
                  log.debug('example2');
                  res.send('Hello World!');
        },       100);
    });

    const server = app.listen(3301, async () => {
      await axios.get('http://localhost:3301/');
      expect(stderrMessages[stderrMessages.length - 1]).toMatch(/.+\[this is a transaction id\]/);
      expect(stdoutMessages[stdoutMessages.length - 1]).toMatch(/.+\[this is a transaction id\]/);
      server.close();
      done();
    });
  });
  test('Instance is allways singleton', () => {
    log.setLevel('debug');
    jest.resetModules()
    const log1 = require('../')
    expect(log1).toBe(log)
  })
});
