import React, { useState, useEffect } from 'react'
import { Box, Paper, Typography, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Divider } from '@mui/material'
import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

function Settings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [settings, setSettings] = useState({
    modbus_port: '',
    modbus_baud_rate: '',
    modbus_data_bits: '',
    modbus_stop_bits: '',
    modbus_parity: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    notification_email: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`)
      setSettings(response.data)
    } catch (err) {
      setError('Ошибка загрузки настроек')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    try {
      await axios.post(`${API_URL}/settings`, settings)
      setSuccess('Настройки успешно сохранены')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Ошибка сохранения настроек')
      console.error(err)
      setTimeout(() => setError(null), 3000)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Настройки системы
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Настройки Modbus */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Настройки Modbus
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="COM-порт" name="modbus_port" value={settings.modbus_port} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Скорость передачи" name="modbus_baud_rate" type="number" value={settings.modbus_baud_rate} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Биты данных" name="modbus_data_bits" type="number" value={settings.modbus_data_bits} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Стоповые биты" name="modbus_stop_bits" type="number" value={settings.modbus_stop_bits} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Четность</InputLabel>
              <Select name="modbus_parity" value={settings.modbus_parity} onChange={handleInputChange} label="Четность">
                <MenuItem value="none">Нет</MenuItem>
                <MenuItem value="even">Четная</MenuItem>
                <MenuItem value="odd">Нечетная</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Настройки Telegram */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Настройки Telegram
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Токен бота" name="telegram_bot_token" value={settings.telegram_bot_token} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="ID чата" name="telegram_chat_id" value={settings.telegram_chat_id} onChange={handleInputChange} />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Настройки SMTP */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Настройки SMTP
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="SMTP сервер" name="smtp_host" value={settings.smtp_host} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Порт SMTP" name="smtp_port" type="number" value={settings.smtp_port} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Пользователь SMTP" name="smtp_user" value={settings.smtp_user} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Пароль SMTP" name="smtp_pass" type="password" value={settings.smtp_pass} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Email для уведомлений" name="notification_email" value={settings.notification_email} onChange={handleInputChange} />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
                Сохранить настройки
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default Settings
