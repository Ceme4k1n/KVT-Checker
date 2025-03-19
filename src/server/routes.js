const express = require('express')
const { modbusManager } = require('./modbus')
const { addSensor, addMeasurement, getMeasurements, addStatus, getStatuses } = require('./database')
const { logger } = require('./utils/logger')

const setupRoutes = (app) => {
  const router = express.Router()

  // Получение данных с датчика
  router.get('/sensor/:id/measurements', async (req, res) => {
    try {
      const { id } = req.params
      const { startTime, endTime } = req.query
      const measurements = await getMeasurements(id, startTime, endTime)
      res.json(measurements)
    } catch (error) {
      logger.error(`Ошибка получения измерений: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  // Получение статусов датчика
  router.get('/sensor/:id/statuses', async (req, res) => {
    try {
      const { id } = req.params
      const statuses = await getStatuses(id)
      res.json(statuses)
    } catch (error) {
      logger.error(`Ошибка получения статусов: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  // Добавление нового датчика
  router.post('/sensor', async (req, res) => {
    try {
      const { name, zonesCount, thresholds } = req.body
      const sensorId = await addSensor(name, zonesCount, thresholds)
      res.json({ id: sensorId })
    } catch (error) {
      logger.error(`Ошибка добавления датчика: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  // Чтение температуры с датчика
  router.get('/sensor/:id/temperature/:zone', async (req, res) => {
    try {
      const { zone } = req.params
      const temperature = await new Promise((resolve, reject) => {
        modbusManager.addRequest('temperature', parseInt(zone), (error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })
      res.json({ temperature })
    } catch (error) {
      logger.error(`Ошибка чтения температуры: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  // Чтение влажности с датчика
  router.get('/sensor/:id/humidity/:zone', async (req, res) => {
    try {
      const { zone } = req.params
      const humidity = await new Promise((resolve, reject) => {
        modbusManager.addRequest('humidity', parseInt(zone), (error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })
      res.json({ humidity })
    } catch (error) {
      logger.error(`Ошибка чтения влажности: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  // Чтение статуса датчика
  router.get('/sensor/:id/status/:zone', async (req, res) => {
    try {
      const { zone } = req.params
      const status = await new Promise((resolve, reject) => {
        modbusManager.addRequest('status', parseInt(zone), (error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })
      res.json(status)
    } catch (error) {
      logger.error(`Ошибка чтения статуса: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  // Сохранение измерений
  router.post('/measurement', async (req, res) => {
    try {
      const { sensorId, zoneNumber, temperature, humidity } = req.body
      const measurementId = await addMeasurement(sensorId, zoneNumber, temperature, humidity)
      res.json({ id: measurementId })
    } catch (error) {
      logger.error(`Ошибка сохранения измерений: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  // Сохранение статуса
  router.post('/status', async (req, res) => {
    try {
      const { sensorId, zoneNumber, status } = req.body
      const statusId = await addStatus(sensorId, zoneNumber, status)
      res.json({ id: statusId })
    } catch (error) {
      logger.error(`Ошибка сохранения статуса: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  })

  app.use('/api', router)
}

module.exports = {
  setupRoutes,
}
