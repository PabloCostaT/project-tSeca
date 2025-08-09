/**
 * Utilitário de logging centralizado
 */

const config = require('../config/app');

class Logger {
  constructor() {
    this.level = config.logging.level;
  }

  info(message, data = {}) {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
  }

  error(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }

  warn(message, data = {}) {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
  }

  debug(message, data = {}) {
    if (this.level === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data);
    }
  }
}

module.exports = new Logger();
