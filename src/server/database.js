const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const { setupLogger } = require('./utils/logger')

const logger = setupLogger()

const dbPath = path.join(__dirname, '../../data/kvt.db')
const dataDir = path.dirname(dbPath)

// Создаем директорию data, если она не существует
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  logger.info(`Создана директория для базы данных: ${dataDir}`)
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error(`Ошибка подключения к базе данных: ${err.message}`)
    throw err
  }
  logger.info('Подключение к базе данных успешно')
})

const initializeDatabase = () => {
  // Создание таблицы датчиков
  db.run(`
        CREATE TABLE IF NOT EXISTS sensors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            zones_count INTEGER NOT NULL,
            temp_threshold_min REAL,
            temp_threshold_max REAL,
            humidity_threshold_min REAL,
            humidity_threshold_max REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)

  // Создание таблицы измерений
  db.run(`
        CREATE TABLE IF NOT EXISTS measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER NOT NULL,
            zone_number INTEGER NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sensor_id) REFERENCES sensors(id)
        )
    `)

  // Создание таблицы статусов
  db.run(`
        CREATE TABLE IF NOT EXISTS statuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER NOT NULL,
            zone_number INTEGER NOT NULL,
            status INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sensor_id) REFERENCES sensors(id)
        )
    `)

  // Создание индексов для оптимизации запросов
  db.run('CREATE INDEX IF NOT EXISTS idx_measurements_sensor_id ON measurements(sensor_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_measurements_timestamp ON measurements(timestamp)')
  db.run('CREATE INDEX IF NOT EXISTS idx_statuses_sensor_id ON statuses(sensor_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_statuses_timestamp ON statuses(timestamp)')
}

// Функции для работы с датчиками
const addSensor = (name, zonesCount, thresholds) => {
  return new Promise((resolve, reject) => {
    const { tempMin, tempMax, humidityMin, humidityMax } = thresholds
    db.run(
      `INSERT INTO sensors (name, zones_count, temp_threshold_min, temp_threshold_max, 
             humidity_threshold_min, humidity_threshold_max) 
             VALUES (?, ?, ?, ?, ?, ?)`,
      [name, zonesCount, tempMin, tempMax, humidityMin, humidityMax],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

// Функции для работы с измерениями
const addMeasurement = (sensorId, zoneNumber, temperature, humidity) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO measurements (sensor_id, zone_number, temperature, humidity) 
             VALUES (?, ?, ?, ?)`,
      [sensorId, zoneNumber, temperature, humidity],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

const getMeasurements = (sensorId, startTime, endTime) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM measurements 
             WHERE sensor_id = ? AND timestamp BETWEEN ? AND ?
             ORDER BY timestamp ASC`,
      [sensorId, startTime, endTime],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

// Функции для работы со статусами
const addStatus = (sensorId, zoneNumber, status) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO statuses (sensor_id, zone_number, status) 
             VALUES (?, ?, ?)`,
      [sensorId, zoneNumber, status],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

const getStatuses = (sensorId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM statuses 
             WHERE sensor_id = ? 
             ORDER BY timestamp DESC`,
      [sensorId],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

module.exports = {
  db,
  initializeDatabase,
  addSensor,
  addMeasurement,
  getMeasurements,
  addStatus,
  getStatuses,
}
