/**
 * Sistema de logging simple y colorido para consola
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * Obtener timestamp formateado
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Log genérico
 */
function log(level, color, module, message, data = null) {
  const timestamp = getTimestamp();
  const moduleStr = module ? `[${module}]` : '';
  
  console.log(
    `${color}[${level}]${colors.reset} ${colors.bright}${timestamp}${colors.reset} ${colors.cyan}${moduleStr}${colors.reset} ${message}`
  );
  
  if (data) {
    console.log(colors.bright + '→ Data:', colors.reset, data);
  }
}

module.exports = {
  /**
   * Log de información
   */
  info: (module, message, data) => {
    log('INFO', colors.blue, module, message, data);
  },

  /**
   * Log de éxito
   */
  success: (module, message, data) => {
    log('SUCCESS', colors.green, module, message, data);
  },

  /**
   * Log de error
   */
  error: (module, message, data) => {
    log('ERROR', colors.red, module, message, data);
  },

  /**
   * Log de advertencia
   */
  warn: (module, message, data) => {
    log('WARN', colors.yellow, module, message, data);
  },

  /**
   * Log de evento recibido
   */
  event: (eventType, message, data) => {
    log('EVENT', colors.magenta, eventType, message, data);
  },
};
