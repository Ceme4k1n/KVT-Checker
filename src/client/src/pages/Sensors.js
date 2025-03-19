import React, { useState, useEffect } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, CircularProgress } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

function Sensors() {
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSensor, setEditingSensor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    zones_count: '',
    temp_threshold_min: '',
    temp_threshold_max: '',
    humidity_threshold_min: '',
    humidity_threshold_max: '',
  })

  useEffect(() => {
    fetchSensors()
  }, [])

  const fetchSensors = async () => {
    try {
      const response = await axios.get(`${API_URL}/sensors`)
      setSensors(response.data)
    } catch (err) {
      setError('Ошибка загрузки датчиков')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (sensor = null) => {
    if (sensor) {
      setEditingSensor(sensor)
      setFormData({
        name: sensor.name,
        zones_count: sensor.zones_count,
        temp_threshold_min: sensor.temp_threshold_min,
        temp_threshold_max: sensor.temp_threshold_max,
        humidity_threshold_min: sensor.humidity_threshold_min,
        humidity_threshold_max: sensor.humidity_threshold_max,
      })
    } else {
      setEditingSensor(null)
      setFormData({
        name: '',
        zones_count: '',
        temp_threshold_min: '',
        temp_threshold_max: '',
        humidity_threshold_min: '',
        humidity_threshold_max: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingSensor(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    try {
      if (editingSensor) {
        await axios.put(`${API_URL}/sensors/${editingSensor.id}`, formData)
      } else {
        await axios.post(`${API_URL}/sensors`, formData)
      }
      handleCloseDialog()
      fetchSensors()
    } catch (err) {
      setError('Ошибка сохранения датчика')
      console.error(err)
    }
  }

  const handleDelete = async (sensorId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот датчик?')) {
      try {
        await axios.delete(`${API_URL}/sensors/${sensorId}`)
        fetchSensors()
      } catch (err) {
        setError('Ошибка удаления датчика')
        console.error(err)
      }
    }
  }

  const columns = [
    { field: 'name', headerName: 'Название', width: 200 },
    { field: 'zones_count', headerName: 'Количество зон', width: 150 },
    { field: 'temp_threshold_min', headerName: 'Мин. температура', width: 150 },
    { field: 'temp_threshold_max', headerName: 'Макс. температура', width: 150 },
    { field: 'humidity_threshold_min', headerName: 'Мин. влажность', width: 150 },
    { field: 'humidity_threshold_max', headerName: 'Макс. влажность', width: 150 },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleOpenDialog(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Управление датчиками</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Добавить датчик
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid rows={sensors} columns={columns} pageSize={5} rowsPerPageOptions={[5]} disableSelectionOnClick />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingSensor ? 'Редактирование датчика' : 'Добавление датчика'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Название" name="name" value={formData.name} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Количество зон" name="zones_count" type="number" value={formData.zones_count} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Мин. температура" name="temp_threshold_min" type="number" value={formData.temp_threshold_min} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Макс. температура" name="temp_threshold_max" type="number" value={formData.temp_threshold_max} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Мин. влажность" name="humidity_threshold_min" type="number" value={formData.humidity_threshold_min} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Макс. влажность" name="humidity_threshold_max" type="number" value={formData.humidity_threshold_max} onChange={handleInputChange} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSensor ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Sensors
