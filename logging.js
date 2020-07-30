const { pid } = process;

const logLevels = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const Logger = class {
  constructor(name, fields = {}) {
    if (!name) {
      throw new Error('Invalid logger name');
    }

    this.name = name;
    this.fields = fields || {};
  }

  with(...args) {
    if (args.length % 2 !== 0) {
      throw new Error(`Invalid number of args: ${args.length} (must be even)`);
    }

    const fields = {
      ...this.fields,
      ...this._kvArgsToObj(args),
    };
    return new Logger(this.name, fields);
  }

  trace(msg, ...args) {
    this._write(logLevels.TRACE, msg, ...args);
  }

  debug(msg, ...args) {
    this._write(logLevels.DEBUG, msg, ...args);
  }

  info(msg, ...args) {
    this._write(logLevels.INFO, msg, ...args);
  }

  warn(msg, ...args) {
    this._write(logLevels.WARN, msg, ...args);
  }

  error(msg, ...args) {
    this._write(logLevels.ERROR, msg, ...args);
  }

  _write(lvl, msg, ...args) {
    let level = lvl;
    if (!level) {
      level = logLevels.DEBUG;
    }

    if (!Object.values(logLevels).includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }

    if (args.length % 2 !== 0) {
      throw new Error(`Invalid number of args: ${args.length} (must be even)`);
    }

    const fields = {
      ...this.fields,
      ...this._kvArgsToObj(args),
    };

    const json = {
      ...fields,
      '@timestamp': new Date().toISOString(),
      '@pid': pid,
      '@level': level,
      '@module': this.name,
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

    process.stdout.write(JSON.stringify(json, stringifyOrder));
  }

  _kvArgsToObj(args) {
    return args.reduce((acc, cur, idx, array) => {
      if (idx % 2 === 0) {
        const next = array[idx + 1];
        acc[cur] = next;
      }
      return acc;
    }, {});
  }
};

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
