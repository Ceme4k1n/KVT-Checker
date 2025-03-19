require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initializeModbus } = require('./modbus')
const { initializeDatabase } = require('./database')
const { setupRoutes } = require('./routes')
const { setupLogger } = require('./utils/logger')

const app = express()
const PORT = process.env.PORT || 3001

// Инициализация логгера
const logger = setupLogger()

// Middleware
app.use(cors())
app.use(express.json())

// Инициализация базы данных
initializeDatabase()

// Инициализация Modbus
initializeModbus()

// Настройка маршрутов
setupRoutes(app)

// Обработка ошибок
app.use((err, req, res, next) => {
  logger.error(err.stack)
  res.status(500).send('Что-то пошло не так!')
})

app.listen(PORT, () => {
  logger.info(`Сервер запущен на порту ${PORT}`)
})
