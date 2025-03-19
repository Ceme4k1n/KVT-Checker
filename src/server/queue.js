const { logger } = require('./utils/logger')

class Request {
  constructor(packet, callback, advData = {}) {
    this.packet = packet
    this.callback = callback
    this.advData = advData
    this.createTime = Date.now()
    this.sendTime = -1
    this.answerTime = -1
    this.sendCount = 0
    this.maxRetries = 3
  }
}

class RequestQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.processingTimeout = 1000 // 1 секунда
    this.maxQueueSize = 100
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeoutRequests: 0,
    }
  }

  addRequest(packet, callback, advData = {}) {
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn('Очередь запросов переполнена')
      return false
    }

    const request = new Request(packet, callback, advData)
    this.queue.push(request)
    this.stats.totalRequests++
    return true
  }

  async processQueue(processFunction) {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.isProcessing && this.queue.length > 0) {
      const request = this.queue[0]
      request.sendTime = Date.now()

      try {
        await processFunction(request)
        request.answerTime = Date.now()
        this.stats.successfulRequests++
        this.queue.shift()
      } catch (error) {
        if (error.message.includes('timeout')) {
          this.stats.timeoutRequests++
        } else {
          this.stats.failedRequests++
        }

        if (request.sendCount < request.maxRetries) {
          request.sendCount++
          logger.warn(`Повторная попытка запроса (${request.sendCount}/${request.maxRetries})`)
        } else {
          logger.error(`Запрос не удался после ${request.maxRetries} попыток`)
          this.queue.shift()
        }
      }

      await new Promise((resolve) => setTimeout(resolve, this.processingTimeout))
    }

    this.isProcessing = false
  }

  stopProcessing() {
    this.isProcessing = false
    logger.info('Обработка очереди остановлена')
  }

  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
    }
  }

  clearQueue() {
    this.queue = []
    logger.info('Очередь очищена')
  }
}

const requestQueue = new RequestQueue()

module.exports = {
  requestQueue,
}
