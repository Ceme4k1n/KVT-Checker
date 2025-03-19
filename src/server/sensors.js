const { modbusManager } = require('./modbus')
const { addMeasurement, addStatus } = require('./database')
const { notificationManager } = require('./notifications')
const { logger } = require('./utils/logger')

class SensorManager {
  constructor() {
    this.sensors = new Map()
    this.isPolling = false
    this.pollInterval = 1000 // 1 секунда
  }

  addSensor(sensor) {
    this.sensors.set(sensor.id, {
      ...sensor,
      lastUpdate: null,
      errors: 0,
    })
    logger.info(`Добавлен датчик: ${sensor.name}`)
  }

  removeSensor(sensorId) {
    this.sensors.delete(sensorId)
    logger.info(`Удален датчик: ${sensorId}`)
  }

  async startPolling() {
    if (this.isPolling) return
    this.isPolling = true
    logger.info('Запуск опроса датчиков')

    while (this.isPolling) {
      for (const [sensorId, sensor] of this.sensors) {
        try {
          await this.pollSensor(sensorId, sensor)
        } catch (error) {
          logger.error(`Ошибка опроса датчика ${sensor.name}: ${error.message}`)
          await notificationManager.notifySensorError(sensor, 'all', error.message)
        }
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval))
    }
  }

  stopPolling() {
    this.isPolling = false
    logger.info('Остановка опроса датчиков')
  }

  async pollSensor(sensorId, sensor) {
    for (let zone = 1; zone <= sensor.zones_count; zone++) {
      try {
        // Чтение температуры
        const temperature = await new Promise((resolve, reject) => {
          modbusManager.addRequest('temperature', zone, (error, result) => {
            if (error) reject(error)
            else resolve(result)
          })
        })

        // Чтение влажности
        const humidity = await new Promise((resolve, reject) => {
          modbusManager.addRequest('humidity', zone, (error, result) => {
            if (error) reject(error)
            else resolve(result)
          })
        })

        // Чтение статуса
        const status = await new Promise((resolve, reject) => {
          modbusManager.addRequest('status', zone, (error, result) => {
            if (error) reject(error)
            else resolve(result)
          })
        })

        // Проверка пороговых значений
        this.checkThresholds(sensor, zone, temperature, humidity)

        // Сохранение данных
        await addMeasurement(sensorId, zone, temperature, humidity)
        await addStatus(sensorId, zone, status.rawValue)

        // Обновление времени последнего опроса
        sensor.lastUpdate = new Date()
        sensor.errors = 0
      } catch (error) {
        sensor.errors++
        logger.error(`Ошибка опроса зоны ${zone} датчика ${sensor.name}: ${error.message}`)
        await notificationManager.notifySensorError(sensor, zone, error.message)
      }
    }
  }

  checkThresholds(sensor, zone, temperature, humidity) {
    // Проверка температуры
    if (temperature < sensor.temp_threshold_min) {
      notificationManager.notifyThresholdExceeded(sensor, zone, 'Температура', temperature, sensor.temp_threshold_min)
    }
    if (temperature > sensor.temp_threshold_max) {
      notificationManager.notifyThresholdExceeded(sensor, zone, 'Температура', temperature, sensor.temp_threshold_max)
    }

    // Проверка влажности
    if (humidity < sensor.humidity_threshold_min) {
      notificationManager.notifyThresholdExceeded(sensor, zone, 'Влажность', humidity, sensor.humidity_threshold_min)
    }
    if (humidity > sensor.humidity_threshold_max) {
      notificationManager.notifyThresholdExceeded(sensor, zone, 'Влажность', humidity, sensor.humidity_threshold_max)
    }
  }

  getSensorStatus(sensorId) {
    const sensor = this.sensors.get(sensorId)
    if (!sensor) return null

    return {
      id: sensorId,
      name: sensor.name,
      zones_count: sensor.zones_count,
      lastUpdate: sensor.lastUpdate,
      errors: sensor.errors,
    }
  }

  getAllSensors() {
    return Array.from(this.sensors.entries()).map(([id, sensor]) => ({
      id,
      name: sensor.name,
      zones_count: sensor.zones_count,
      lastUpdate: sensor.lastUpdate,
      errors: sensor.errors,
    }))
  }
}

const sensorManager = new SensorManager()

module.exports = {
  sensorManager,
}
