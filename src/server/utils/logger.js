const winston = require('winston')
const path = require('path')

const logDir = path.join(__dirname, '../../../logs')

const setupLogger = () => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
      }),
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ],
  })

  // Создаем директорию для логов, если она не существует
  try {
    require('fs').mkdirSync(logDir, { recursive: true })
  } catch (err) {
    console.error('Ошибка создания директории для логов:', err)
  }

  return logger
}

module.exports = {
  setupLogger,
}
