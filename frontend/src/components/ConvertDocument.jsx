import React, { useRef, useState } from 'react'
import {
  Box, Paper, Typography, Button, Chip, CircularProgress, IconButton,
  Grid, Table, TableHead, TableRow, TableCell, TableBody,
  Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Menu,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DescriptionIcon from '@mui/icons-material/Description'
import CloseIcon from '@mui/icons-material/Close'
import SettingsIcon from '@mui/icons-material/Settings'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import FilterListIcon from '@mui/icons-material/FilterList'
import SearchIcon from '@mui/icons-material/Search'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const ConvertDocument = () => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0)
  const [sourceFiles, setSourceFiles] = useState([])
  const [referenceFile, setReferenceFile] = useState(null)
  const [provider, setProvider] = useState('groq')
  
  const [mappingData, setMappingData] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [editingRowIndex, setEditingRowIndex] = useState(null)
  const [editValue, setEditValue] = useState('')

  const [filterStatus, setFilterStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)

  const sourceInputRef = useRef(null)
  const referenceInputRef = useRef(null)

  React.useEffect(() => {
    // Fetch global settings to set the default provider
    axios.get(`${API_BASE_URL}/settings`)
      .then(res => {
        if (res.data && res.data.provider) {
          setProvider(res.data.provider)
        }
      })
      .catch(err => console.error("Failed to load default provider", err))
  }, [])

  const steps = [
    { id: 1, title: 'Upload Documents', desc: 'Add source files and reference template', icon: <CloudUploadIcon /> },
    { id: 2, title: 'Map Review', desc: 'Review and confirm field mappings', icon: <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}><Box sx={{width:6,height:6,bgcolor:'currentColor',borderRadius:0.5}}/><Box sx={{width:6,height:6,bgcolor:'currentColor',borderRadius:0.5}}/><Box sx={{width:6,height:6,bgcolor:'currentColor',borderRadius:0.5}}/><Box sx={{width:6,height:6,bgcolor:'currentColor',borderRadius:0.5}}/></Box> },
    { id: 3, title: 'Convert', desc: 'Process and generate output', icon: <CheckCircleOutlineIcon /> },
    { id: 4, title: 'Download', desc: 'Download converted file and reports', icon: <DownloadIcon /> }
  ]

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files)
    if (type === 'source') {
      const newSources = files.map(file => ({ name: file.name, size: file.size, file }))
      setSourceFiles(prev => [...prev, ...newSources])
    } else if (type === 'reference' && files.length > 0) {
      const file = files[0]
      setReferenceFile({ name: file.name, size: file.size, file })
    }
    // reset file input value so same file can be uploaded again if needed
    e.target.value = null
  }

  const removeSource = (index) => setSourceFiles(prev => prev.filter((_, i) => i !== index))

  const handleReset = () => {
    window.location.reload()
  }

  const handlePreviewMapping = async () => {
    if (sourceFiles.length === 0 || !referenceFile) return
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      sourceFiles.forEach(sf => formData.append('source_files', sf.file))
      formData.append('reference_file', referenceFile.file)

      const res = await axios.post(`${API_BASE_URL}/preview_mapping`, formData)
      setMappingData(res.data.mappings || [])
      setCurrentStep(1)
    } catch (err) {
      console.error("Preview mapping failed", err)
      alert("Failed to preview mapping. See console.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConvert = async () => {
    setCurrentStep(2)
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      sourceFiles.forEach(sf => formData.append('source_files', sf.file))
      formData.append('reference_file', referenceFile.file)
      formData.append('provider', provider)

      // Pass user resolutions based on manual mapping and ignore actions
      const userResolutions = {}
      mappingData.forEach(row => {
        if (row.status === 'Mapped' && row.source.startsWith('Manual: ')) {
          userResolutions[row.target] = row.source.replace('Manual: ', '')
        } else if (row.status === 'Ignored') {
          userResolutions[row.target] = '[Information not found in source documents]'
        } else if (row.status === 'Mapped' && row.source.startsWith('Auto Mapped: ')) {
          userResolutions[row.target] = row.source.replace('Auto Mapped: ', '')
        }
      })
      if (Object.keys(userResolutions).length > 0) {
        formData.append('resolutions', JSON.stringify(userResolutions))
      }
      
      const res = await axios.post(`${API_BASE_URL}/convert`, formData)
      if (res.data.download_url) {
        setDownloadUrl(res.data.download_url)
      }
      setCurrentStep(3)
    } catch (err) {
      console.error("Conversion failed", err)
      alert("Failed to convert document. See console.")
      setCurrentStep(1)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAutoMap = () => {
    setMappingData(prev => prev.map(row => {
      if (row.status === 'Missing' || row.status === 'Needs Review') {
        return {
          ...row,
          source: 'Auto Mapped: Value',
          doc: sourceFiles[0]?.name || '-',
          conf: 75,
          status: 'Mapped',
          color: 'success.main'
        }
      }
      return row
    }))
  }

  const handleOpenEdit = (index) => {
    setEditingRowIndex(index)
    const row = mappingData[index]
    // Use the full extracted value from backend if available, else parse from display label
    let currentVal = ''
    if (row.extractedValue) {
      currentVal = row.extractedValue
    } else if (row.source.startsWith('Manual: ')) {
      currentVal = row.source.replace('Manual: ', '')
    } else if (row.source.startsWith('Extracted: ')) {
      currentVal = row.source.replace('Extracted: ', '')
    } else if (row.source.startsWith('Auto Mapped: ')) {
      currentVal = row.source.replace('Auto Mapped: ', '')
    } else if (row.source === '-- Unmapped --' || row.source === '-- Ignored --' || row.source === 'Similar Field Found' || row.source === 'Conflict Detected') {
      currentVal = ''
    } else {
      currentVal = row.source
    }
    setEditValue(currentVal)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    setMappingData(prev => {
      const newData = [...prev]
      newData[editingRowIndex] = {
        ...newData[editingRowIndex],
        source: `Manual: ${editValue}`,
        status: 'Mapped',
        color: 'success.main',
        conf: 100,
        conflicting_options: [] // Clear conflicts once resolved
      }
      return newData
    })
    setEditDialogOpen(false)
  }

  const handleIgnore = (index) => {
    setMappingData(prev => {
      const newData = [...prev]
      newData[index] = {
        ...newData[index],
        status: 'Ignored',
        color: 'text.disabled',
        source: '-- Ignored --',
        conf: null
      }
      return newData
    })
  }

  const renderStepIcon = (step, index) => {
    const isActive = currentStep === index
    const isCompleted = currentStep > index
    return (
      <Box sx={{
        width: 32, height: 32, borderRadius: '50%',
        bgcolor: isActive || isCompleted ? 'primary.main' : 'background.paper',
        color: isActive || isCompleted ? 'white' : 'text.disabled',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 'bold', fontSize: '0.9rem',
        boxShadow: isActive ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}` : 'none',
        border: isActive || isCompleted ? 'none' : '1px solid #E5E7EB',
        zIndex: 2, position: 'relative'
      }}>
        {isCompleted ? <CheckCircleIcon fontSize="small" sx={{ color: 'white' }} /> : step.id}
      </Box>
    )
  }

  const filteredMappingData = mappingData.filter(row => {
    // Search match
    const searchVal = searchQuery.toLowerCase()
    const matchesSearch = row.target.toLowerCase().includes(searchVal) || 
                          row.source.toLowerCase().includes(searchVal)
    
    // Status match
    let matchesStatus = true
    if (filterStatus !== 'All') {
      if (filterStatus === 'Mapped' && row.status !== 'Mapped') matchesStatus = false
      if (filterStatus === 'Missing' && row.status !== 'Missing') matchesStatus = false
      if (filterStatus === 'Needs Review' && !row.status.includes('Review')) matchesStatus = false
      if (filterStatus === 'Ignored' && row.status !== 'Ignored') matchesStatus = false
    }

    return matchesSearch && matchesStatus
  })

  const statsCount = {
    mapped: mappingData.filter(m => m.status === 'Mapped').length,
    review: mappingData.filter(m => m.status === 'Needs Review' || m.status === 'Mapped with Review').length,
    missing: mappingData.filter(m => m.status === 'Missing').length
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>Convert Document</Typography>
          <Typography variant="body2" color="text.secondary">Upload source document(s) and a reference format. We'll extract, map and convert the data to your target template.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>Reset</Button>
          <Button variant="outlined" startIcon={<MenuBookIcon />} onClick={() => setGuideOpen(true)} sx={{ bgcolor: 'background.paper', borderRadius: 2, color: 'primary.main' }}>Conversion Guide</Button>
        </Box>
      </Box>

      {/* Main Layout Area */}
      <Box sx={{ display: 'flex', gap: 3, flex: 1, alignItems: 'flex-start' }}>
        {/* Left Stepper Rail */}
        <Paper sx={{ width: 260, py: 4, px: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
          {/* Vertical Line connecting steps */}
          <Box sx={{ position: 'absolute', left: 48, top: 40, bottom: 40, width: 2, bgcolor: '#F3F4F6', zIndex: 1 }} />
          
          {steps.map((step, index) => (
            <Box key={step.id} sx={{ display: 'flex', gap: 2, zIndex: 2, ml: 1 }}>
              {renderStepIcon(step, index)}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: currentStep === index ? 700 : 600, color: currentStep === index ? 'primary.main' : 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, lineHeight: 1.3 }}>{step.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>

        {/* Right Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {currentStep === 0 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 4, borderRadius: 2, height: '100%', border: '1px dashed', borderColor: 'primary.light', bgcolor: alpha(theme.palette.primary.main, 0.02), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2, cursor: 'pointer' }} onClick={() => sourceInputRef.current?.click()}>
                    <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'background.paper', color: 'primary.main', boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.1)}` }}>
                      <CloudUploadIcon fontSize="large" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Source Document(s)</Typography>
                    <Typography variant="body2" color="text.secondary">Upload one or more source files. Information will be merged into the reference format.</Typography>
                    <Button variant="contained" sx={{ mt: 2, borderRadius: 6, px: 4 }}>Browse Files</Button>
                    <Typography variant="caption" color="text.disabled">Drag & drop files here</Typography>
                    <input type="file" multiple ref={sourceInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'source')} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 4, borderRadius: 2, height: '100%', border: '1px dashed', borderColor: 'primary.light', bgcolor: alpha(theme.palette.primary.main, 0.02), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2, cursor: 'pointer' }} onClick={() => referenceInputRef.current?.click()}>
                    <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'background.paper', color: 'primary.main', boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.1)}` }}>
                      <InsertDriveFileIcon fontSize="large" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Reference Document (Target Template)</Typography>
                    <Typography variant="body2" color="text.secondary">Upload the target template format for conversion.</Typography>
                    <Button variant="contained" sx={{ mt: 2, borderRadius: 6, px: 4 }}>Browse Template</Button>
                    <Typography variant="caption" color="text.disabled">Drag & drop template file here</Typography>
                    <input type="file" ref={referenceInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'reference')} />
                  </Paper>
                </Grid>
              </Grid>

              {/* Selected Files Preview */}
              <Box sx={{ mt: 4, display: 'flex', gap: 4 }}>
                 <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Selected Sources ({sourceFiles.length})</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {sourceFiles.map((sf, idx) => (
                        <Chip
                          key={idx}
                          icon={<DescriptionIcon sx={{ color: 'primary.main' }} />}
                          label={<Box>
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>{sf.name}</Typography>
                            <Typography variant="caption" component="span" sx={{ color: 'text.secondary', ml: 1 }}>{(sf.size / 1024).toFixed(1)} KB</Typography>
                          </Box>}
                          onDelete={() => removeSource(idx)}
                          deleteIcon={<CloseIcon />}
                          sx={{ p: 1, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #E5E7EB', height: 'auto', py: 1.5 }}
                        />
                      ))}
                    </Box>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Selected Template</Typography>
                    {referenceFile && (
                      <Chip
                          icon={<InsertDriveFileIcon sx={{ color: 'success.main' }} />}
                          label={<Box>
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>{referenceFile.name}</Typography>
                            <Typography variant="caption" component="span" sx={{ color: 'text.secondary', ml: 1 }}>{(referenceFile.size / 1024).toFixed(1)} KB</Typography>
                          </Box>}
                          onDelete={() => setReferenceFile(null)}
                          deleteIcon={<CloseIcon />}
                          sx={{ p: 1, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #E5E7EB', height: 'auto', py: 1.5 }}
                        />
                    )}
                 </Box>
              </Box>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>LLM Provider</InputLabel>
                  <Select
                    value={provider}
                    label="LLM Provider"
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    <MenuItem value="groq">GroqCloud</MenuItem>
                    <MenuItem value="openrouter">OpenRouter</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handlePreviewMapping} 
                  disabled={sourceFiles.length === 0 || !referenceFile || isProcessing}
                  endIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Box component="span" sx={{ml:1}}>→</Box>} 
                  sx={{ borderRadius: 2, px: 4, height: '40px' }}
                >
                  Review Mapping
                </Button>
              </Box>
            </Box>
          )}

          {currentStep === 1 && (
            <Paper sx={{ p: 4, borderRadius: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Map Review & Confirmation</Typography>
                  <Chip label="AI Mapping Suggestions" size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" startIcon={<AutoFixHighIcon />} onClick={handleAutoMap} sx={{ borderRadius: 2 }}>Auto Map</Button>
                  <Button variant="outlined" startIcon={<FilterListIcon />} onClick={(e) => setFilterAnchorEl(e.currentTarget)} sx={{ borderRadius: 2 }}>
                    Filter {filterStatus !== 'All' ? `(${filterStatus})` : ''}
                  </Button>
                  <Menu
                    anchorEl={filterAnchorEl}
                    open={Boolean(filterAnchorEl)}
                    onClose={() => setFilterAnchorEl(null)}
                  >
                    {['All', 'Mapped', 'Needs Review', 'Missing', 'Ignored'].map(status => (
                      <MenuItem key={status} onClick={() => { setFilterStatus(status); setFilterAnchorEl(null); }}>
                        {status}
                      </MenuItem>
                    ))}
                  </Menu>
                  <Box sx={{ position: 'relative' }}>
                    <SearchIcon sx={{ position: 'absolute', left: 12, top: 10, color: 'text.secondary', fontSize: 20 }} />
                    <input 
                      type="text" 
                      placeholder="Search fields..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }} 
                    />
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Review the automatically mapped fields. You can edit mappings, ignore fields or mark as required.</Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Target Field (Template)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Source Field (Mapped From)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Source Document</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMappingData.map((row, idx) => {
                    const originalIdx = mappingData.indexOf(row);
                    return (
                    <TableRow key={originalIdx} sx={{ '& td': { py: 2, borderBottom: '1px solid #F3F4F6' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{row.target}</Typography>
                          {row.req && <Typography variant="caption" sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), px: 1, borderRadius: 1 }}>Required</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: row.conf ? 'text.primary' : 'error.main', fontStyle: row.conf ? 'normal' : 'italic' }}>{row.source}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{row.doc}</Typography></TableCell>
                      <TableCell>
                        {row.conf ? <Typography variant="body2" sx={{ color: row.conf >= 80 ? 'success.main' : 'warning.main', fontWeight: 600 }}>{row.conf}%</Typography> : '-'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {row.status === 'Mapped' && <CheckCircleOutlineIcon sx={{ color: row.color, fontSize: 18 }} />}
                          {row.status === 'Missing' && <CloseIcon sx={{ color: row.color, fontSize: 18 }} />}
                          {row.status.includes('Review') && <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${row.color}` }} />}
                          {row.status === 'Ignored' && <VisibilityOffIcon sx={{ color: row.color, fontSize: 18 }} />}
                          <Typography variant="body2" sx={{ color: row.color, fontWeight: 500 }}>
                            {row.status} {row.conflicting_options?.length > 0 && "(Conflict)"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {row.status !== 'Missing' && row.status !== 'Ignored' ? (
                            <>
                              <Button size="small" variant={row.conflicting_options?.length > 0 ? "contained" : "outlined"} onClick={() => handleOpenEdit(originalIdx)} sx={{ py: 0.5, px: 2, borderRadius: 2 }}>
                                {row.conflicting_options?.length > 0 ? "Resolve" : "Edit"}
                              </Button>
                              <IconButton size="small" onClick={() => handleIgnore(originalIdx)} sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}><VisibilityOffIcon fontSize="small" sx={{ color: 'text.secondary' }} /></IconButton>
                            </>
                          ) : row.status === 'Ignored' ? (
                            <IconButton size="small" onClick={() => handleOpenEdit(originalIdx)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}><EditIcon fontSize="small" sx={{ color: 'primary.main' }} /></IconButton>
                          ) : (
                            <Button size="small" variant="outlined" onClick={() => handleOpenEdit(originalIdx)} sx={{ py: 0.5 }}>Map</Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} /> <Typography variant="caption">High (&gt;=80%)</Typography></Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} /> <Typography variant="caption">Medium (50-79%)</Typography></Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} /> <Typography variant="caption">Low (&lt;50%)</Typography></Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} /> <Typography variant="caption">Unmapped</Typography></Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>Mapped: {statsCount.mapped}</Typography>
                  <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>Needs Review: {statsCount.review}</Typography>
                  <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>Missing: {statsCount.missing}</Typography>
                  <Button variant="contained" sx={{ ml: 2, borderRadius: 2 }} onClick={handleConvert}>Save Mapping & Convert</Button>
                </Box>
              </Box>
            </Paper>
          )}

          {currentStep === 2 && (
            <Paper sx={{ p: 4, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <Typography variant="h5" sx={{ mb: 2 }}>Conversion in Progress</Typography>
               <CircularProgress size={48} sx={{ mb: 4 }} />
               <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Extracting entities and merging data into target template...</Typography>
            </Paper>
          )}

          {currentStep === 3 && (
            <Paper sx={{ p: 4, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
               <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                 <CheckCircleIcon sx={{ fontSize: 40 }} />
               </Box>
               <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Conversion Successful!</Typography>
               <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>Your document has been successfully merged and converted into the target template format. You can now download the file.</Typography>
               <Box sx={{ display: 'flex', gap: 2 }}>
                 <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => window.open(`${API_BASE_URL}${downloadUrl}`, '_blank')} sx={{ borderRadius: 2, px: 4 }}>
                   Download File
                 </Button>
                 <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 2 }}>Convert Another</Button>
               </Box>
            </Paper>
          )}

        </Box>
      </Box>

      {/* Edit Mapping Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Field Mapping</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide or select the manual value for the target field: <b>{editingRowIndex !== null ? mappingData[editingRowIndex].target : ''}</b>
          </Typography>

          {/* Contextual guidance based on mapping status */}
          {editingRowIndex !== null && (() => {
            const row = mappingData[editingRowIndex]
            const hasConflicts = row.conflicting_options?.length > 0

            if (hasConflicts) return null  // Conflict UI is shown separately below

            if (row.status === 'Mapped' && row.extractedValue) {
              return (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.25)' }}>
                  <Typography variant="subtitle2" sx={{ color: 'success.dark', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon fontSize="small" /> Mapped with {row.conf}% confidence
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Value "<b>{row.extractedValue}</b>" was extracted from <b>{row.doc}</b>. You can confirm or edit below.
                  </Typography>
                </Box>
              )
            }

            if (row.status === 'Needs Review') {
              return (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(245, 158, 11, 0.08)', borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <Typography variant="subtitle2" sx={{ color: 'warning.dark', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoFixHighIcon fontSize="small" /> Possible match found ({row.conf}% confidence)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    A similar field was detected in <b>{row.doc}</b>, but the system couldn't extract an exact value. Please review the source document and enter the correct value below.
                  </Typography>
                </Box>
              )
            }

            if (row.status === 'Missing') {
              return (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <Typography variant="caption" color="text.secondary">
                    No matching value was found in the source documents. Please enter the value manually if available.
                  </Typography>
                </Box>
              )
            }

            return null
          })()}

          {editingRowIndex !== null && mappingData[editingRowIndex].conflicting_options && mappingData[editingRowIndex].conflicting_options.length > 0 && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ color: 'warning.dark', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoFixHighIcon fontSize="small" /> Conflict Detected in Source Documents
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                We found different values for this field across your uploaded documents. Please select the correct one:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {mappingData[editingRowIndex].conflicting_options.map((opt, i) => (
                  <Paper 
                    key={i}
                    variant="outlined" 
                    sx={{ p: 1.5, cursor: 'pointer', borderColor: editValue === opt.value ? 'primary.main' : 'divider', bgcolor: editValue === opt.value ? alpha(theme.palette.primary.main, 0.05) : 'transparent' }}
                    onClick={() => setEditValue(opt.value)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ fontWeight: editValue === opt.value ? 600 : 400 }}>{opt.value}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'rgba(0,0,0,0.05)', px: 1, borderRadius: 1 }}>From: {opt.doc}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          <TextField
            autoFocus
            margin="dense"
            label={
              editingRowIndex !== null && mappingData[editingRowIndex].conflicting_options?.length > 0
                ? "Or Enter Custom Value"
                : editingRowIndex !== null && mappingData[editingRowIndex].extractedValue
                  ? "Confirm or Edit Value"
                  : "Enter Value"
            }
            fullWidth
            variant="outlined"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" sx={{ borderRadius: 2 }}>Save Mapping</Button>
        </DialogActions>
      </Dialog>
    {/* Guide Dialog */}
      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon sx={{ color: 'primary.main' }} /> Conversion Guide
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Follow these steps to successfully convert and map your documents:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Upload Source Documents</Typography>
              <Typography variant="body2" color="text.secondary">Provide the documents (PDF, DOCX, XLSX, TXT) containing the raw information.</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Upload Target Template</Typography>
              <Typography variant="body2" color="text.secondary">Provide the destination document schema. We support complex PPTX files with charts, or simple Word/Excel templates.</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Review Mapping</Typography>
              <Typography variant="body2" color="text.secondary">Our AI agent automatically maps data from the source to the target fields. You can manually edit or resolve conflicting data from multiple sources.</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>4</Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Convert & Download</Typography>
              <Typography variant="body2" color="text.secondary">Generate your final document. PPTX templates will have shapes and charts automatically updated with the newly mapped data.</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setGuideOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>Got it</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ConvertDocument
