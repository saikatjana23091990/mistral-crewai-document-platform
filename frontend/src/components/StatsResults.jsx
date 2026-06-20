import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, Grid, TextField, InputAdornment, Button, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  IconButton, Collapse, Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import DownloadIcon from '@mui/icons-material/Download'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DescriptionIcon from '@mui/icons-material/Description'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import AssessmentIcon from '@mui/icons-material/Assessment'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

// Mini Pie Chart component
const MappingPieChart = ({ percentage }) => {
  let color = 'error.main'
  if (percentage >= 80) color = 'success.main'
  else if (percentage >= 50) color = 'warning.main'

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={28}
          thickness={6}
          sx={{ color: 'divider', position: 'absolute' }}
        />
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={28}
          thickness={6}
          sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
        />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color }}>
        {percentage}%
      </Typography>
    </Box>
  )
}

const Row = ({ row }) => {
  const [open, setOpen] = useState(false)
  const isMultiple = row.source_documents && row.source_documents.length > 1

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset', py: 2 } }}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMultiple && (
              <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)} sx={{ bgcolor: 'background.default' }}>
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            )}
            {!isMultiple && <Box sx={{ width: 34 }} />}
            <InsertDriveFileIcon sx={{ color: 'primary.light', fontSize: 24 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{row.conversion_name}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {isMultiple ? "Multiple Source → Target" : "Single Source → Target"}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {isMultiple ? `${row.source_documents.length} source docs → 1 target` : `1 source doc → 1 target template`}
          </Typography>
        </TableCell>
        <TableCell><Typography variant="body2" color="text.secondary">{row.converted_by}</Typography></TableCell>
        <TableCell><Typography variant="body2" color="text.secondary">{row.conversion_date}</Typography></TableCell>
        <TableCell>
          <MappingPieChart percentage={row.mapping_success_percentage} />
        </TableCell>
        <TableCell>
          <Chip
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            label={row.status || "Completed"}
            size="small"
            color={row.status === "Success" ? "success" : "default"}
            variant="outlined"
            sx={{ fontWeight: 600, border: 'none', bgcolor: 'rgba(76, 175, 80, 0.1)' }}
          />
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Download">
            <IconButton 
              size="small" 
              sx={{ color: 'primary.main', border: '1px solid #EDE9FE', borderRadius: 2, p: 0.8 }}
              onClick={() => window.open(`${API_BASE_URL}${row.download_url}`, "_blank")}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      
      {/* Expanded Row for multiple sources */}
      {isMultiple && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: 0 }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2, ml: 8, pl: 3, borderLeft: '2px solid #EDE9FE' }}>
                <Table size="small" aria-label="source documents">
                  <TableBody>
                    {row.source_documents.map((source, index) => (
                      <TableRow key={index} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={{ borderBottom: '1px dashed #EDE9FE', width: '25%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body2">{source.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px dashed #EDE9FE', width: '15%' }}>
                          <Chip label="Source" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#F3F4F6' }} />
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px dashed #EDE9FE', width: '15%' }}>
                          <Typography variant="body2" color="text.secondary">{row.converted_by}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px dashed #EDE9FE', width: '15%' }}>
                           <Typography variant="body2" color="text.secondary">{row.conversion_date}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px dashed #EDE9FE', width: '15%' }}>
                          <Typography variant="body2" sx={{ color: source.mapping_success >= 80 ? 'success.main' : (source.mapping_success >= 50 ? 'warning.main' : 'error.main'), fontWeight: 600 }}>
                            {source.mapping_success}%
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px dashed #EDE9FE', width: '10%' }}>
                           <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>✓ Processed</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px dashed #EDE9FE', width: '5%' }}>
                           {/* Intentionally blank for source rows since output is merged */}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                       <TableCell sx={{ borderBottom: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <InsertDriveFileIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="body2" color="primary.main">{row.target_template}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderBottom: 0 }}><Chip label="Target" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(124, 58, 237, 0.1)', color: 'primary.main' }} /></TableCell>
                        <TableCell sx={{ borderBottom: 0 }}><Typography variant="body2" color="text.secondary">{row.converted_by}</Typography></TableCell>
                        <TableCell sx={{ borderBottom: 0 }}><Typography variant="body2" color="text.secondary">{row.conversion_date}</Typography></TableCell>
                        <TableCell sx={{ borderBottom: 0 }}><Typography variant="body2" color="text.secondary">-</Typography></TableCell>
                        <TableCell sx={{ borderBottom: 0 }}><Typography variant="caption" color="primary.main" fontWeight={600}>G Generated</Typography></TableCell>
                        <TableCell align="right" sx={{ borderBottom: 0 }}>
                          <IconButton 
                            size="small"
                            onClick={() => window.open(`${API_BASE_URL}${row.download_url}`, "_blank")}
                          >
                            <DownloadIcon fontSize="small" color="primary" />
                          </IconButton>
                        </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  )
}

const StatsResults = () => {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState({
    documents_converted: 0,
    chat_interactions: 0,
    api_calls: 0,
    total_size_saved: 0,
    success_rate: 100,
    this_month_conversions: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stats`),
        axios.get(`${API_BASE_URL}/history`)
      ])
      
      setStats(statsRes.data)

      const historyData = historyRes.data.records || []
      const formattedRecords = historyData.map(record => {
        const sources = record.original_document.split(',').map(s => s.trim()).filter(Boolean)
        return {
          conversion_name: record.converted_document || 'Unnamed Conversion',
          source_documents: sources.map(s => ({ name: s, mapping_success: record.success_percentage || 100 })),
          target_template: record.reference_document,
          converted_by: record.converted_by,
          conversion_date: new Date(record.conversion_date).toLocaleString(),
          status: record.status,
          mapping_success_percentage: record.success_percentage || 100,
          download_url: record.download_url
        }
      })
      
      setRecords(formattedRecords)
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Box sx={{ pb: 4, px: 1 }}>
      {/* Header section with Stats */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>Stats & Results</Typography>
            <Typography variant="body2">Overview of your document conversions and mapping performance.</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>This Month</Button>
            <Button variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 2 }} onClick={fetchData}>Refresh</Button>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Total Conversions</Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>{stats.documents_converted}</Typography>
              <Typography variant="caption" color="text.secondary">All time conversions</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Successful Conversions</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.documents_converted}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">All time successful</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
             <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Success Rate</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssessmentIcon color="warning" sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.success_rate || 100}%</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">Average success rate</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
             <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>This Month</Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>{stats.this_month_conversions || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Conversions this month</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
             <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Total Size Saved</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DownloadIcon color="info" sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatSize(stats.total_size_saved || 0)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">Storage saved</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* History section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Conversion History</Typography>
        
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">View and download your past document conversions.</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search by document or target template..."
                sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ borderRadius: 2 }}>Filter</Button>
            </Box>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Conversion Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Source Documents / Target Template</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Converted By</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Conversion Date ↓</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Success Mapping</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary">No conversions found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row, index) => <Row key={index} row={row} />)
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>
  )
}

export default StatsResults
