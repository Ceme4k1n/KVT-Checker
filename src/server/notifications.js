const TelegramBot = require('node-telegram-bot-api')
const nodemailer = require('nodemailer')
const { logger } = require('./utils/logger')

class NotificationManager {
  constructor() {
    this.telegramBot = null
    this.smtpTransporter = null
    this.initializeTelegram()
    this.initializeEmail()
  }

  initializeTelegram() {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (token && chatId) {
      this.telegramBot = new TelegramBot(token, { polling: false })
    }
  }

  initializeEmail() {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }

    this.smtpTransporter = nodemailer.createTransport(smtpConfig)
  }

  async sendTelegramMessage(message) {
    if (!this.telegramBot) {
      logger.warn('Telegram бот не настроен')
      return
    }

    try {
      await this.telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID, message)
    } catch (error) {
      logger.error(`Ошибка отправки сообщения в Telegram: ${error.message}`)
    }
  }

  async sendEmail(subject, message) {
    if (!this.smtpTransporter) {
      logger.warn('SMTP не настроен')
      return
    }

    try {
      await this.smtpTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.NOTIFICATION_EMAIL,
        subject: subject,
        text: message,
      })
    } catch (error) {
      logger.error(`Ошибка отправки email: ${error.message}`)
    }
  }

  async notifyThresholdExceeded(sensor, zone, type, value, threshold) {
    const message = `Превышение порогового значения!\n` + `Датчик: ${sensor.name}\n` + `Зона: ${zone}\n` + `Тип: ${type}\n` + `Значение: ${value}\n` + `Порог: ${threshold}`

    await this.sendTelegramMessage(message)
    await this.sendEmail(`Превышение порогового значения - ${sensor.name}`, message)
  }

  async notifySensorError(sensor, zone, error) {
    const message = `Ошибка датчика!\n` + `Датчик: ${sensor.name}\n` + `Зона: ${zone}\n` + `Ошибка: ${error}`

    await this.sendTelegramMessage(message)
    await this.sendEmail(`Ошибка датчика - ${sensor.name}`, message)
  }

  async notifyConnectionError(error) {
    const message = `Ошибка подключения!\n` + `Ошибка: ${error}`

    await this.sendTelegramMessage(message)
    await this.sendEmail('Ошибка подключения', message)
  }
}

const notificationManager = new NotificationManager()

module.exports = {
  notificationManager,
}
