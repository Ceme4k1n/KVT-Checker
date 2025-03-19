import React, { useState, useEffect } from 'react'
import { Grid, Paper, Typography, Box, Card, CardContent, CircularProgress, Alert } from '@mui/material'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

function Dashboard() {
  const [sensors, setSensors] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorsResponse, measurementsResponse] = await Promise.all([axios.get(`${API_URL}/sensors`), axios.get(`${API_URL}/measurements`)])

        setSensors(sensorsResponse.data)
        setMeasurements(measurementsResponse.data)
      } catch (err) {
        setError('Ошибка загрузки данных')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Обновление каждые 30 секунд

    return () => clearInterval(interval)
  }, [])

  const getChartData = (sensorId) => {
    const sensorMeasurements = measurements.filter((m) => m.sensor_id === sensorId)
    const labels = sensorMeasurements.map((m) => format(new Date(m.timestamp), 'HH:mm:ss', { locale: ru }))
    const tempData = sensorMeasurements.map((m) => m.temperature)
    const humidityData = sensorMeasurements.map((m) => m.humidity)

    return {
      labels,
      datasets: [
        {
          label: 'Температура (°C)',
          data: tempData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'Влажность (%)',
          data: humidityData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'График измерений',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Панель управления
      </Typography>

      <Grid container spacing={3}>
        {/* Статистика */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статистика
              </Typography>
              <Typography>Всего датчиков: {sensors.length}</Typography>
              <Typography>Активных датчиков: {sensors.filter((s) => s.errors === 0).length}</Typography>
              <Typography>Ошибок: {sensors.reduce((sum, s) => sum + s.errors, 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Датчики */}
        {sensors.map((sensor) => (
          <Grid item xs={12} key={sensor.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {sensor.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Количество зон: {sensor.zones_count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Последнее обновление: {sensor.lastUpdate ? format(new Date(sensor.lastUpdate), 'dd.MM.yyyy HH:mm:ss', { locale: ru }) : 'Нет данных'}
              </Typography>
              {sensor.errors > 0 && (
                <Typography variant="body2" color="error">
                  Количество ошибок: {sensor.errors}
                </Typography>
              )}
              <Box sx={{ mt: 2, height: 300 }}>
                <Line options={chartOptions} data={getChartData(sensor.id)} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default Dashboard
