/** @module logging */

const { pid } = process;

const logLevels = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

/** Logger is a supported way to get logs to Sidekick in the expected format. */
const Logger = class {
  /**
   * Create a Logger.
   *
   * @param {string} name - The name of the plugin.
   * @param {object} fields - Additional fields to include with each log.
   * @example
   * const package = require('./package.json');
   * const logger = new Logger(package.name);
   */
  constructor(name, fields = {}) {
    if (!name) {
      throw new Error('Invalid logger name');
    }

    this._name = name;
    this._fields = fields || {};
  }

  /**
   * with creates a new logger that will always have the key/value pairs.
   *
   * @param {...any} args - A list of alternating keys/values.
   * @returns {Logger} - A new logger with the provided fields.
   * @example
   * const logger2 = logger.with('persistentKey', 'persistentValue');
   * logger2.info('Yet another message', 'yetAnotherKey', 'yetAnotherValue');
   * // {
   * //   "@timestamp": "2020-07-30T14:58:21.057000Z",
   * //   "@pid": 1234,
   * //   "@level": "INFO",
   * //   "@module": "my-plugin-name",
   * //   "@message": "Yet another message",
   * //   "persistentKey": "persistentValue",
   * //   "yetAnotherKey": "yetAnotherValue"
   * // }
   */
  with(...args) {
    const fields = this._kvArgsWithFields(args);
    return new Logger(this._name, fields);
  }

  /**
   * trace emits a message and key/value pairs at the TRACE level.
   *
   * @param {string} msg - The message of the log.
   * @param {...string} args - A list of alternating keys/values.
   * @returns {void}
   * @example
   * logger.trace('Some message');
   * // {
   * //   "@timestamp": "2020-07-30T14:58:21.057000Z",
   * //   "@pid": 1234,
   * //   "@level": "TRACE",
   * //   "@module": "my-plugin-name",
   * //   "@message": "Some message"
   * // }
   */
  trace(msg, ...args) {
    this._write(logLevels.TRACE, msg, ...args);
  }

  /**
   * debug emits a message and key/value pairs at the DEBUG level.
   *
   * @param {string} msg - The message of the log.
   * @param {...string} args - A list of alternating keys/values.
   * @returns {void}
   * @example
   * logger.debug('Some message');
   * // {
   * //   "@timestamp": "2020-07-30T14:58:21.057000Z",
   * //   "@pid": 1234,
   * //   "@level": "DEBUG",
   * //   "@module": "my-plugin-name",
   * //   "@message": "Some message"
   * // }
   */
  debug(msg, ...args) {
    this._write(logLevels.DEBUG, msg, ...args);
  }

  /**
   * info emits a message and key/value pairs at the INFO level.
   *
   * @param {string} msg - The message of the log.
   * @param {...string} args - A list of alternating keys/values.
   * @returns {void}
   * @example
   * logger.info('Some message');
   * // {
   * //   "@timestamp": "2020-07-30T14:58:21.057000Z",
   * //   "@pid": 1234,
   * //   "@level": "INFO",
   * //   "@module": "my-plugin-name",
   * //   "@message": "Some message"
   * // }
   */
  info(msg, ...args) {
    this._write(logLevels.INFO, msg, ...args);
  }

  /**
   * warn emits a message and key/value pairs at the WARN level.
   *
   * @param {string} msg - The message of the log.
   * @param {...string} args - A list of alternating keys/values.
   * @returns {void}
   * @example
   * logger.warn('Some message');
   * // {
   * //   "@timestamp": "2020-07-30T14:58:21.057000Z",
   * //   "@pid": 1234,
   * //   "@level": "WARN",
   * //   "@module": "my-plugin-name",
   * //   "@message": "Some message"
   * // }
   */
  warn(msg, ...args) {
    this._write(logLevels.WARN, msg, ...args);
  }

  /**
   * error emits a message and key/value pairs at the ERROR level.
   *
   * @param {string} msg - The message of the log.
   * @param {...string} args - A list of alternating keys/values.
   * @returns {void}
   * @example
   * logger.error('Some message');
   * // {
   * //   "@timestamp": "2020-07-30T14:58:21.057000Z",
   * //   "@pid": 1234,
   * //   "@level": "ERROR",
   * //   "@module": "my-plugin-name",
   * //   "@message": "Some message"
   * // }
   */
  error(msg, ...args) {
    this._write(logLevels.ERROR, msg, ...args);
  }

  /**
   * _write is the underlying implementation for writing a log message.
   *
   * @private
   * @param {string} lvl - The level of the log.
   * @param {string} msg - The message of the log.
   * @param {...string} args - A list of alternating keys/values.
   * @returns {void}
   */
  _write(lvl, msg, ...args) {
    let level = lvl;
    if (!level) {
      level = logLevels.DEBUG;
    }

    if (!Object.values(logLevels).includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }

    const fields = this._kvArgsWithFields(args);

    const json = {
      ...fields,
      '@timestamp': this._getTimestamp(),
      '@pid': pid,
      '@level': level,
      '@module': this._name,
      '@message': msg,
    };

    const stringifyOrder = [
      '@timestamp',
      '@pid',
      '@level',
      '@module',
      '@message',
      ...Object.keys(fields).sort(),
    ];

    process.stdout.write(`${JSON.stringify(json, stringifyOrder)}\n`);
  }

  /**
   * _kvArgsWithFields converts a list of alternating keys/values to an object.
   *
   * @private
   * @param {...string} args - A list of alternating keys/values.
   * @returns {object} - An object created by combining the alternating keys/values.
   * @example
   * _kvArgsWithFields(['key1', 'value1', 'key2', 'value2', 'value3'])
   * // returns { 'key1': 'value1', 'key2': 'value2', 'EXTRA_VALUE_AT_END': 'value3' }
   */
  _kvArgsWithFields(args = []) {
    const argsEven = args.slice(0);

    if (argsEven.length % 2 !== 0) {
      const extra = argsEven.pop();
      argsEven.push('EXTRA_VALUE_AT_END', extra);
    }

    const fields = argsEven.reduce((acc, cur, idx, array) => {
      if (idx % 2 === 0) {
        const next = array[idx + 1];
        acc[cur] = next;
      }
      return acc;
    }, {});

    return {
      ...this._fields,
      ...fields,
    };
  }

  /**
   * _getTimestamp creates a timestamp in the supported format.
   *
   * @private
   * @returns {string} - A timestamp in a format compatible with the host process.
   */
  _getTimestamp() {
    // toISOString() is close, but the seconds value needs to have 6 decimal places.
    return new Date().toISOString().replace(/\.(\d+)Z$/, (_, p1) => `.${p1.padEnd(6, '0')}Z`);
  }
};

/**
 * prepareLogging overwrites basic console methods so they produce output in an expected format.
 * Also pushes all stdout to stderr.
 *
 * @private
 */
const prepareLogging = () => {
  const consoleDebug = console.debug.bind(console);
  const consoleError = console.error.bind(console);
  const consoleInfo = console.info.bind(console);
  const consoleLog = console.log.bind(console);
  const consoleTrace = console.trace.bind(console);
  const consoleWarn = console.warn.bind(console);

  console.debug = (msg, ...args) => {
    consoleDebug(`[DEBUG] ${msg}`, ...args);
  };

  console.error = (msg, ...args) => {
    consoleError(`[ERROR] ${msg}`, ...args);
  };

  console.info = (msg, ...args) => {
    consoleInfo(`[INFO] ${msg}`, ...args);
  };

  console.log = (msg, ...args) => {
    consoleLog(`[INFO] ${msg}`, ...args);
  };

  console.trace = (msg, ...args) => {
    consoleTrace(`[TRACE] ${msg}`, ...args);
  };

  console.warn = (msg, ...args) => {
    consoleWarn(`[WARN] ${msg}`, ...args);
  };

  process.stdout.write = (...args) => {
    process.stderr.write(...args);
  };
};

module.exports = {
  Logger,
  prepareLogging,
};
