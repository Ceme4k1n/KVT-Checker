module.exports = {
  modbus: {
    enabled: false, // По умолчанию Modbus отключен
    port: 'COM1',
    options: {
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
    },
  },
  server: {
    port: process.env.PORT || 3001,
  },
}
