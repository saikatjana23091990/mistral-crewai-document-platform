import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  CircularProgress,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const History = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get(`${API_BASE_URL}/history`)
        setRecords(response.data.records || [])
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load conversion history')
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return records
    return records.filter((item) =>
      [item.original_document, item.converted_document, item.converted_by, item.reference_document]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    )
  }, [records, search])

  const metrics = useMemo(() => {
    const total = records.length
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonth = records.filter((item) => {
      const dt = new Date(item.conversion_date)
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear
    }).length
    const successful = records.filter((item) => item.status === 'Success').length
    const successRate = total > 0 ? `${Math.round((successful / total) * 100)}%` : '0%'
    const totalSizeSavedBytes = records.reduce((sum, item) => {
      const source = Number(item.source_size_bytes || 0)
      const output = Number(item.output_size_bytes || 0)
      return sum + Math.max(source - output, 0)
    }, 0)
    const totalSizeSavedMb = `${(totalSizeSavedBytes / (1024 * 1024)).toFixed(2)} MB`
    return [
      { label: 'Total Conversions', value: total, helper: 'All conversions' },
      { label: 'This Month', value: thisMonth, helper: 'Conversions this month' },
      { label: 'Success Rate', value: successRate, helper: 'Successful conversions' },
      { label: 'Total Size Saved', value: totalSizeSavedMb, helper: 'Compressed size' },
    ]
  }, [records])

  const formatSeconds = (value) => `${Number(value || 0).toFixed(2)} s`
  const formatDate = (value) => {
    if (!value) return '-'
    const dt = new Date(value)
    return Number.isNaN(dt.getTime()) ? value : dt.toLocaleString()
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        History
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        View all your document conversions and their details.
      </Typography>

      <Paper sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            mb: 2.5,
          }}
        >
          <TextField
            size="small"
            placeholder="Search documents..."
            sx={{ minWidth: 260, flex: 1 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ textTransform: 'none' }}>
            Filter
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {metrics.map((metric) => (
            <Grid item xs={12} sm={6} md={3} key={metric.label}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2">{metric.label}</Typography>
                <Typography variant="h5" sx={{ my: 0.5 }}>
                  {metric.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metric.helper}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Original Document</TableCell>
              <TableCell>Converted Document</TableCell>
              <TableCell>Conversion Time</TableCell>
              <TableCell>Converted By</TableCell>
              <TableCell>Conversion Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 5 }}>
                    <Typography sx={{ mb: 0.5, color: 'text.secondary' }}>No history found</Typography>
                    <Chip label="No conversion records yet" size="small" />
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((row, idx) => (
                <TableRow key={`${row.converted_document}-${idx}`}>
                  <TableCell>{row.original_document}</TableCell>
                  <TableCell>{row.converted_document}</TableCell>
                  <TableCell>{formatSeconds(row.conversion_time_seconds)}</TableCell>
                  <TableCell>{row.converted_by || 'Admin User'}</TableCell>
                  <TableCell>{formatDate(row.conversion_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status || 'Unknown'}
                      size="small"
                      color={row.status === 'Success' ? 'success' : 'default'}
                      variant={row.status === 'Success' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default History
