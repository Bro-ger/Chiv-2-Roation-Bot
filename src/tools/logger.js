const pino = require('pino');

function createLogger(env) {
  const transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  };

  return pino({
    level: 'info',
    base: null,
    transport
  });
}

module.exports = { createLogger };
