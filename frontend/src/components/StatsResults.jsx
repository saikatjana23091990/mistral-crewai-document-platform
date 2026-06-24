import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, Grid, TextField, InputAdornment, Button, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  IconButton, Collapse, Tooltip, useTheme, TableContainer, Menu, MenuItem,
  Tabs, Tab
} from '@mui/material'
import { alpha } from '@mui/material/styles'
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
  const theme = useTheme();
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
                        <TableCell sx={{ borderBottom: 0 }}><Chip label="Target" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} /></TableCell>
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

const StatsResults = ({ initialTab = 0, setStatsTab }) => {
  const [tabValue, setTabValue] = useState(initialTab)
  const [records, setRecords] = useState([])
  const [translationRecords, setTranslationRecords] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [anchorEl, setAnchorEl] = useState(null)
  const [stats, setStats] = useState({
    documents_converted: 0,
    chat_interactions: 0,
    api_calls: 0,
    total_size_saved: 0,
    success_rate: 100,
    this_month_conversions: 0
  })
  const [translationStats, setTranslationStats] = useState({
    total_translations: 0,
    successful_translations: 0,
    average_quality: 0.0,
    languages_supported: 12,
    documents_translated: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, historyRes, transStatsRes, transHistoryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stats`),
        axios.get(`${API_BASE_URL}/history`),
        axios.get(`${API_BASE_URL}/translate/stats`),
        axios.get(`${API_BASE_URL}/translate/history`)
      ])

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
      
      const avgSuccessRate = formattedRecords.length > 0 
        ? Math.round(formattedRecords.reduce((acc, curr) => acc + curr.mapping_success_percentage, 0) / formattedRecords.length)
        : 100;

      setStats({ ...statsRes.data, success_rate: avgSuccessRate })
      setRecords(formattedRecords)
      
      setTranslationStats(transStatsRes.data)
      setTranslationRecords(transHistoryRes.data.records || [])
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

  const filteredRecords = records.filter(row => {
    const matchesSearch = row.conversion_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          row.target_template.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || row.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredTranslationRecords = translationRecords.filter(row => {
    const matchesSearch = row.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || row.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <Box sx={{ pb: 4, px: 1 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => {
          setTabValue(val);
          if (setStatsTab) setStatsTab(val);
        }}>
          <Tab label="Document Conversion" />
          <Tab label="Document Translation" />
        </Tabs>
      </Box>

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
          {tabValue === 0 ? (
            <>
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
            </>
          ) : (
            <>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Total Translations</Typography>
                  <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>{translationStats.total_translations}</Typography>
                  <Typography variant="caption" color="text.secondary">All time</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Successful Translations</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{translationStats.successful_translations}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">All time</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                 <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Average Quality</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AssessmentIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{Math.round(translationStats.average_quality)}%</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">AI Scored Quality</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                 <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Languages Supported</Typography>
                  <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>{translationStats.languages_supported}</Typography>
                  <Typography variant="caption" color="text.secondary">Available Target Languages</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                 <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Documents Translated</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DescriptionIcon color="info" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{translationStats.documents_translated}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">Total documents processed</Typography>
                </Paper>
              </Grid>
            </>
          )}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ borderRadius: 2 }} onClick={(e) => setAnchorEl(e.currentTarget)}>
                {filterStatus === 'All' ? 'Filter' : filterStatus}
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setFilterStatus('All'); setAnchorEl(null); }}>All</MenuItem>
                <MenuItem onClick={() => { setFilterStatus('Success'); setAnchorEl(null); }}>Success</MenuItem>
                <MenuItem onClick={() => { setFilterStatus('Failed'); setAnchorEl(null); }}>Failed</MenuItem>
              </Menu>
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                {tabValue === 0 ? (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Conversion Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Source Documents / Target Template</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Converted By</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Conversion Date ↓</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Success Mapping</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Actions</TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Document</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Language Pair</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Mode</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Date ↓</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Quality</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.paper' }}>Actions</TableCell>
                  </TableRow>
                )}
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : tabValue === 0 ? (
                  filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                        <Typography color="text.secondary">No conversions found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((row, index) => <Row key={index} row={row} />)
                  )
                ) : (
                  filteredTranslationRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                        <Typography color="text.secondary">No translations found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTranslationRecords.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <DescriptionIcon sx={{ color: 'primary.light', fontSize: 24 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{row.filename}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{row.source_language} → {row.target_language}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{row.translation_mode}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{new Date(row.date).toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>{row.quality_score}%</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={row.status === 'Completed' ? <CheckCircleOutlineIcon fontSize="small" /> : undefined}
                            label={row.status}
                            size="small"
                            color={row.status === "Completed" ? "success" : "default"}
                            variant="outlined"
                            sx={{ fontWeight: 600, border: 'none', bgcolor: row.status === 'Completed' ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Download">
                            <IconButton 
                              size="small" 
                              sx={{ color: 'primary.main', border: '1px solid #EDE9FE', borderRadius: 2, p: 0.8 }}
                              onClick={() => window.open(`${API_BASE_URL}/outputs/${row.translated_path}`, "_blank")}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  )
}

export default StatsResults
