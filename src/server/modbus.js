const ModbusRTU = require('modbus-serial')
const { setupLogger } = require('./utils/logger')

const logger = setupLogger()

class ModbusManager {
  constructor() {
    this.modbus = new ModbusRTU()
    this.isConnected = false
    this.requestQueue = []
    this.isProcessing = false
    this.retryCount = 0
    this.maxRetries = 3
    this.retryDelay = 5000 // 5 секунд
  }

  async connect(port, options = {}) {
    try {
      const connectionOptions = {
        baudRate: options.baudRate || 115200,
        dataBits: options.dataBits || 8,
        stopBits: options.stopBits || 1,
        parity: options.parity || 'none',
      }
      await this.modbus.connectRTUBuffered(port, connectionOptions)
      this.isConnected = true
      logger.info(`Modbus подключен к порту ${port}`)
      this.startProcessing()
    } catch (error) {
      logger.error(`Ошибка подключения к Modbus: ${error.message}`)
      throw error
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.modbus.close()
      this.isConnected = false
      logger.info('Modbus отключен')
    }
  }

  async readTemperature(sensorNumber) {
    const register = 30000 + (sensorNumber - 1)
    try {
      const data = await this.modbus.readHoldingRegisters(1, register, 1)
      return this.decodeTemperature(data.data[0])
    } catch (error) {
      logger.error(`Ошибка чтения температуры датчика ${sensorNumber}: ${error.message}`)
      throw error
    }
  }

  async readHumidity(sensorNumber) {
    const register = 30001 + (sensorNumber - 1)
    try {
      const data = await this.modbus.readHoldingRegisters(1, register, 1)
      return this.decodeHumidity(data.data[0])
    } catch (error) {
      logger.error(`Ошибка чтения влажности датчика ${sensorNumber}: ${error.message}`)
      throw error
    }
  }

  async readStatus(sensorNumber) {
    const register = 40000 + (sensorNumber - 1)
    try {
      const data = await this.modbus.readHoldingRegisters(1, register, 1)
      return this.decodeStatus(data.data[0])
    } catch (error) {
      logger.error(`Ошибка чтения статуса датчика ${sensorNumber}: ${error.message}`)
      throw error
    }
  }

  decodeTemperature(value) {
    // Декодирование температуры согласно ТЗ
    if (value & 0x8000) {
      // Отрицательное значение
      value = ~value + 1
      return -(value / 256)
    }
    return value / 256
  }

  decodeHumidity(value) {
    // Аналогично температуре
    return this.decodeTemperature(value)
  }

  decodeStatus(value) {
    // Декодирование статуса
    return {
      isNormal: value === 0x6d2f,
      rawValue: value,
    }
  }

  async startProcessing() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.isProcessing && this.isConnected) {
      if (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift()
        try {
          await this.processRequest(request)
        } catch (error) {
          logger.error(`Ошибка обработки запроса: ${error.message}`)
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  }

  async processRequest(request) {
    const { type, sensorNumber, callback } = request
    try {
      let result
      switch (type) {
        case 'temperature':
          result = await this.readTemperature(sensorNumber)
          break
        case 'humidity':
          result = await this.readHumidity(sensorNumber)
          break
        case 'status':
          result = await this.readStatus(sensorNumber)
          break
      }
      if (callback) callback(null, result)
    } catch (error) {
      if (callback) callback(error)
    }
  }

  addRequest(type, sensorNumber, callback) {
    this.requestQueue.push({ type, sensorNumber, callback })
  }
}

const modbusManager = new ModbusManager()

const initializeModbus = async () => {
  const port = process.env.MODBUS_PORT || 'COM1'
  await modbusManager.connect(port)
}

module.exports = {
  modbusManager,
  initializeModbus,
}
