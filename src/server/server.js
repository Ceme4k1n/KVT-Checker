const express = require('express')
const cors = require('cors')
const { setupLogger } = require('./utils/logger')
const { initializeDatabase } = require('./database')
const modbusManager = require('./modbus')
const { setupRoutes } = require('./routes')
const { setupWebSocket } = require('./websocket')
const { setupNotificationManager } = require('./notifications')
const { setupRequestQueue } = require('./queue')
const config = require('./config')

const logger = setupLogger()

const app = express()
const port = config.server.port

// Middleware
app.use(cors())
app.use(express.json())

// Инициализация базы данных
initializeDatabase()

// Инициализация очереди запросов
const requestQueue = setupRequestQueue()

// Инициализация менеджера уведомлений
const notificationManager = setupNotificationManager()

// Инициализация WebSocket
const wss = setupWebSocket(app)

// Настройка маршрутов
setupRoutes(app, modbusManager, requestQueue, notificationManager)

// Запуск сервера
const server = app.listen(port, async () => {
  logger.info(`Сервер запущен на порту ${port}`)

  if (config.modbus.enabled) {
    try {
      // Пробуем подключиться к Modbus только если он включен в конфигурации
      await modbusManager.connect(config.modbus.port, config.modbus.options)
      logger.info('Modbus успешно подключен')
    } catch (error) {
      logger.warn(`Не удалось подключиться к Modbus: ${error.message}. Сервер продолжит работу без Modbus.`)
    }
  } else {
    logger.info('Modbus отключен в конфигурации')
  }
})

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  logger.error(`Необработанное исключение: ${error.message}`)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Необработанное отклонение промиса: ${reason}`)
})

// Обработка завершения работы
process.on('SIGTERM', () => {
  logger.info('Получен сигнал SIGTERM. Завершение работы...')
  if (config.modbus.enabled) {
    modbusManager.disconnect()
  }
  wss.close()
  server.close(() => {
    logger.info('Сервер остановлен')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('Получен сигнал SIGINT. Завершение работы...')
  if (config.modbus.enabled) {
    modbusManager.disconnect()
  }
  wss.close()
  server.close(() => {
    logger.info('Сервер остановлен')
    process.exit(0)
  })
})
