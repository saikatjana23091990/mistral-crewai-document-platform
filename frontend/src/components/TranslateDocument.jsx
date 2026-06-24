import React, { useRef, useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Button, CircularProgress, Grid, Select, MenuItem,
  FormControl, InputLabel, Switch, Divider, useTheme, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import DescriptionIcon from '@mui/icons-material/Description'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import HistoryIcon from '@mui/icons-material/History'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import axios from 'axios'
import { PROVIDERS_AND_MODELS } from '../utils/providerModels'

const API_BASE_URL = 'http://localhost:8000'

// --- Custom Styled Components / Helpers ---
const SectionBadge = ({ number, title }) => {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '8px', 
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.9rem'
      }}>
        {number}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>{title}</Typography>
    </Box>
  )
}

const ModeCard = ({ title, desc, bestFor, recommended, selected, onClick }) => {
  const theme = useTheme()
  return (
    <Paper 
      elevation={0}
      onClick={onClick}
      sx={{ 
        p: 2.5, borderRadius: 3, border: '2px solid',
        borderColor: selected ? 'primary.main' : '#E5E7EB',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.02) : '#ffffff',
        cursor: 'pointer', transition: 'all 0.2s', position: 'relative', height: '100%',
        '&:hover': { borderColor: selected ? 'primary.main' : '#D1D5DB' }
      }}
    >
      {recommended && (
        <Box sx={{ 
          position: 'absolute', top: 12, right: 12, 
          bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main',
          px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700
        }}>
          Recommended
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
        <AutoAwesomeIcon sx={{ color: selected ? 'primary.main' : 'text.disabled' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#16213e' }}>{title}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.4, minHeight: 40 }}>
        {desc}
      </Typography>
      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
        <strong>Best for:</strong> {bestFor}
      </Typography>
    </Paper>
  )
}

const EnhancementToggle = ({ title, desc, checked, onChange }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2, borderBottom: '1px solid #F3F4F6' }}>
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{desc}</Typography>
    </Box>
    <Switch checked={checked} onChange={onChange} color="primary" />
  </Box>
)

const TranslateDocument = ({ setCurrentPage, setStatsTab }) => {
  const theme = useTheme()
  
  // App State
  const [currentStep, setCurrentStep] = useState(0)
  const [fileDetails, setFileDetails] = useState(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [autoDetectInfo, setAutoDetectInfo] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const [provider, setProvider] = useState('mistral')
  const [model, setModel] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('Japanese (日本語)')
  const [translationMode, setTranslationMode] = useState('Business')
  
  const [aiEnhancements, setAiEnhancements] = useState({
    spelling: true,
    grammar: true,
    terminology: false,
    brand: true
  })
  
  const [previewData, setPreviewData] = useState(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  
  const [isTranslating, setIsTranslating] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [progressStatus, setProgressStatus] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [finalResult, setFinalResult] = useState(null)

  const sourceInputRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/settings`)
      .then(res => {
        if (res.data) {
          if (res.data.provider && PROVIDERS_AND_MODELS[res.data.provider]) {
            setProvider(res.data.provider)
            setModel(res.data.model || PROVIDERS_AND_MODELS[res.data.provider].models[0].id)
          }
        }
      })
      .catch(err => console.error("Failed to load settings", err))
  }, [])

  useEffect(() => {
    if (jobId) {
      const ws = new WebSocket(`ws://localhost:8000/ws/translation/${jobId}`)
      wsRef.current = ws
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.status) setProgressStatus(data.status)
        if (data.progress) setProgressPercent(data.progress)
        if (data.status === 'Completed') {
          setFinalResult(data.result)
          setCurrentStep(3) // Move to Download step
          setIsTranslating(false)
          ws.close()
        } else if (data.status === 'Failed') {
          alert("Translation failed. " + (data.result?.error || ''))
          setIsTranslating(false)
          ws.close()
        }
      }
      return () => ws.close()
    }
  }, [jobId])

  const steps = [
    { id: 1, title: 'Upload Document', desc: 'Select the file to translate' },
    { id: 2, title: 'Configure & Preview', desc: 'Set languages and preview' },
    { id: 3, title: 'Translating', desc: 'Processing your document' },
    { id: 4, title: 'Download', desc: 'Get your translated file' }
  ]

  const handleReset = () => {
    setFileDetails(null)
    setAutoDetectInfo(null)
    setPreviewData(null)
    setJobId(null)
    setProgressStatus('')
    setProgressPercent(0)
    setFinalResult(null)
    setCurrentStep(0)
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const file = files[0]
      setFileDetails({ name: file.name, size: file.size, file: file })
      setIsAnalyzing(true)
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await axios.post(`${API_BASE_URL}/translate/analyze`, formData)
        setAutoDetectInfo(res.data)
      } catch (err) {
        console.error("Failed to analyze", err)
        alert("Failed to analyze document")
      } finally {
        setIsAnalyzing(false)
      }
    }
    e.target.value = null
  }
  
  const generatePreview = async () => {
    if (!fileDetails) return
    setIsPreviewing(true)
    try {
      const formData = new FormData()
      formData.append('filename', fileDetails.name)
      const targetLangStr = targetLanguage.split(' (')[0]
      formData.append('targetLanguage', targetLangStr)
      formData.append('mode', translationMode)
      formData.append('model', model)
      formData.append('aiEnhancements', JSON.stringify(aiEnhancements))
      
      const res = await axios.post(`${API_BASE_URL}/translate/preview`, formData)
      setPreviewData(res.data)
      setPreviewModalOpen(true)
    } catch (err) {
      console.error("Failed to generate preview", err)
      alert("Failed to generate preview")
    } finally {
      setIsPreviewing(false)
    }
  }

  const startTranslation = async () => {
    if (!fileDetails) return
    setIsTranslating(true)
    setProgressStatus('Starting...')
    setProgressPercent(10)

    try {
      const formData = new FormData()
      formData.append('file', fileDetails.file)
      const targetLangStr = targetLanguage.split(' (')[0]
      formData.append('targetLanguage', targetLangStr)
      formData.append('mode', translationMode)
      formData.append('provider', provider)
      formData.append('model', model)

      const res = await axios.post(`${API_BASE_URL}/translate/upload`, formData)
      setJobId(res.data.jobId)
    } catch (err) {
      console.error("Failed to start translation", err)
      alert("Failed to start translation.")
      setIsTranslating(false)
    }
  }

  const toggleEnhancement = (key) => {
    setAiEnhancements(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderStepIcon = (step, index) => {
    const isActive = currentStep === index
    const isCompleted = currentStep > index
    return (
      <Box sx={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
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

  return (
    <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, color: '#16213e' }}>Translate & Localize Document</Typography>
          <Typography variant="body1" color="text.secondary">Translate documents while preserving formatting, structure, charts, tables and business terminology.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => {
            if (setStatsTab) setStatsTab(1);
            if (setCurrentPage) setCurrentPage('stats_results');
          }} sx={{ bgcolor: 'white', borderRadius: 2, borderColor: '#E5E7EB', color: '#4B5563', '&:hover': { borderColor: 'primary.main', bgcolor: 'white' } }}>Translation History</Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ bgcolor: 'white', borderRadius: 2, borderColor: '#E5E7EB', color: '#4B5563', '&:hover': { borderColor: 'primary.main', bgcolor: 'white' } }}>Reset</Button>
        </Box>
      </Box>

      {/* Main Layout (Left Stepper, Right Content) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, alignItems: 'flex-start' }}>
        
        {/* Left Side Stepper */}
        <Paper elevation={0} sx={{ 
          width: { xs: '100%', lg: 300 }, flexShrink: 0, 
          py: 4, px: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', 
          gap: 4, position: 'relative', overflow: 'visible', border: '1px solid #F3F4F6' 
        }}>
          <Box sx={{ position: 'absolute', left: 48, top: 40, bottom: 40, width: 2, bgcolor: '#F3F4F6', zIndex: 1, display: { xs: 'none', lg: 'block' } }} />
          {steps.map((step, index) => (
            <Box key={step.id} sx={{ display: 'flex', gap: 2, zIndex: 2, ml: { lg: 1 } }}>
              {renderStepIcon(step, index)}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: currentStep === index ? 700 : 600, color: currentStep === index ? 'primary.main' : (currentStep > index ? 'text.primary' : 'text.disabled'), display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.title}
                </Typography>
                <Typography variant="caption" sx={{ color: currentStep >= index ? 'text.secondary' : 'text.disabled', display: 'block', mt: 0.5, lineHeight: 1.3 }}>{step.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>

        {/* Right Side Content */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* STEP 0: Upload */}
          {currentStep === 0 && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #F3F4F6' }}>
              <SectionBadge number="1" title="Upload Document" />
              <Grid container spacing={4}>
                <Grid item xs={12} md={fileDetails ? 5 : 12}>
                  {!fileDetails ? (
                    <Box 
                      sx={{ 
                        p: 6, borderRadius: 4, border: '2px dashed', borderColor: alpha(theme.palette.primary.main, 0.3), 
                        bgcolor: alpha(theme.palette.primary.main, 0.02), display: 'flex', flexDirection: 'column', 
                        alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2, cursor: 'pointer',
                        transition: 'all 0.2s', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                      }} 
                      onClick={() => sourceInputRef.current?.click()}
                    >
                      <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.8 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Drag & drop your file here</Typography>
                      <Typography variant="body2" color="text.secondary">or</Typography>
                      <Button variant="outlined" sx={{ borderRadius: 6, px: 4, mt: 1, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>Browse Files</Button>
                      <Typography variant="caption" sx={{ mt: 2, color: 'text.disabled' }}>Supported formats: PDF, DOCX, XLSX, PPTX (Max 200 MB)</Typography>
                      <input type="file" ref={sourceInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        p: 4, borderRadius: 4, border: '2px dashed', borderColor: '#E5E7EB', 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                        textAlign: 'center', gap: 2, cursor: 'pointer', height: '100%'
                      }} 
                      onClick={() => sourceInputRef.current?.click()}
                    >
                      <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Click to upload a different file</Typography>
                      <input type="file" ref={sourceInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    </Box>
                  )}
                </Grid>
                
                {fileDetails && (
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#4B5563' }}>Uploaded File</Typography>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <DescriptionIcon />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{fileDetails.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{(fileDetails.size / (1024*1024)).toFixed(1)} MB</Typography>
                        </Box>
                      </Box>
                      <IconButton onClick={() => setFileDetails(null)} size="small"><CloseIcon /></IconButton>
                    </Paper>
                    
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', gap: 1, mb: 4, fontSize: '0.9rem', fontWeight: 600 }}>
                      <CheckCircleIcon fontSize="small" /> File uploaded successfully
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#4B5563' }}>Auto Detection</Typography>
                    {isAnalyzing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                        <CircularProgress size={24} /> <Typography>Analyzing document...</Typography>
                      </Box>
                    ) : autoDetectInfo ? (
                      <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, typography: 'body2' }}>
                        <Typography color="text.secondary" fontWeight={600}>Detected Language</Typography>
                        <Typography fontWeight={700}>{autoDetectInfo.detected_language}</Typography>
                        
                        <Typography color="text.secondary" fontWeight={600}>Confidence</Typography>
                        <Typography fontWeight={700} color="success.main" display="flex" alignItems="center" gap={0.5}>
                          {autoDetectInfo.confidence}% <CheckCircleIcon sx={{ fontSize: 16 }} />
                        </Typography>
                        
                        <Typography color="text.secondary" fontWeight={600}>Document Type</Typography>
                        <Typography fontWeight={700}>{autoDetectInfo.document_type}</Typography>
                        
                        <Typography color="text.secondary" fontWeight={600}>Pages / Slides</Typography>
                        <Typography fontWeight={700}>{autoDetectInfo.pages}</Typography>
                        
                        <Typography color="text.secondary" fontWeight={600}>Word Count</Typography>
                        <Typography fontWeight={700}>{autoDetectInfo.word_count.toLocaleString()} words</Typography>
                      </Box>
                    ) : null}

                    {autoDetectInfo && !isAnalyzing && (
                      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained" endIcon={<ArrowForwardIcon />} 
                          onClick={() => setCurrentStep(1)} sx={{ borderRadius: 2, px: 4 }}
                        >
                          Continue to Configuration
                        </Button>
                      </Box>
                    )}
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* STEP 1: Configure & Preview */}
          {currentStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6} xl={4}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #F3F4F6', height: '100%' }}>
                    <SectionBadge number="2" title="Translation Languages" />
                    <FormControl fullWidth size="small" sx={{ mb: 4 }}>
                      <InputLabel>Source Language</InputLabel>
                      <Select value="Auto Detect" label="Source Language" disabled>
                        <MenuItem value="Auto Detect">Auto Detect</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                      <Typography color="primary.main" sx={{ transform: 'rotate(90deg)' }}>➔</Typography>
                    </Box>

                    <FormControl fullWidth size="small">
                      <InputLabel>Target Language</InputLabel>
                      <Select value={targetLanguage} label="Target Language" onChange={(e) => setTargetLanguage(e.target.value)}>
                        {['English', 'French (Français)', 'German (Deutsch)', 'Spanish (Español)', 'Japanese (日本語)', 'Korean (한국어)', 'Arabic', 'Hindi', 'Bengali'].map(lang => (
                          <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} lg={6} xl={4}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #F3F4F6', height: '100%' }}>
                    <SectionBadge number="3" title="Translation Mode" />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ModeCard 
                        title="Literal" desc="Preserve wording exactly." bestFor="Contracts, Regulatory docs"
                        selected={translationMode === 'Literal'} onClick={() => setTranslationMode('Literal')}
                      />
                      <ModeCard 
                        title="Business" desc="Maintain meaning and readability." bestFor="Reports, Presentations"
                        recommended selected={translationMode === 'Business'} onClick={() => setTranslationMode('Business')}
                      />
                      <ModeCard 
                        title="Localized" desc="Adapt content culturally." bestFor="Training content"
                        selected={translationMode === 'Localized'} onClick={() => setTranslationMode('Localized')}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} lg={12} xl={4}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #F3F4F6', height: '100%' }}>
                    <SectionBadge number="4" title="AI Enhancements" />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr' }, gap: 3 }}>
                      <EnhancementToggle 
                        title="Spelling Correction" desc="Correct spelling mistakes"
                        checked={aiEnhancements.spelling} onChange={() => toggleEnhancement('spelling')}
                      />
                      <EnhancementToggle 
                        title="Grammar Improvement" desc="Improve grammar and readability"
                        checked={aiEnhancements.grammar} onChange={() => toggleEnhancement('grammar')}
                      />
                      <EnhancementToggle 
                        title="Terminology Consistency" desc="Use consistent terminology"
                        checked={aiEnhancements.terminology} onChange={() => toggleEnhancement('terminology')}
                      />
                      <EnhancementToggle 
                        title="Preserve Brand Terms" desc="Do not translate product names"
                        checked={aiEnhancements.brand} onChange={() => toggleEnhancement('brand')}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="outlined" size="large" fullWidth
                        onClick={generatePreview} disabled={isPreviewing}
                        sx={{ borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                      >
                        {isPreviewing ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                        Generate Preview
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Removed inline Translation Preview, now in Dialog */}
            </Box>
          )}

          {/* STEP 2: Translating (Confirm & Process) */}
          {currentStep === 2 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #F3F4F6', height: '100%' }}>
                      <SectionBadge number="6" title="Translation Quality" />
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress variant="determinate" value={100} size={120} thickness={6} sx={{ color: '#E5E7EB' }} />
                          <CircularProgress variant="determinate" value={96} size={120} thickness={6} sx={{ color: 'primary.main', position: 'absolute', left: 0 }} />
                          <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <Typography variant="h4" component="div" color="text.primary" fontWeight={800}>96%</Typography>
                            <Typography variant="caption" color="success.main" fontWeight={700}>Excellent</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #F3F4F6', height: '100%', textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, color: '#1a1a2e' }}>Formatting Preserved</Typography>
                      <VerifiedUserIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight={800}>99.3%</Typography>
                      <Typography variant="body2" color="success.main" fontWeight={700} sx={{ mb: 2 }}>Excellent</Typography>
                      <Typography variant="caption" color="text.secondary">Structure and formatting preservation score</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #F3F4F6', height: '100%', textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, color: '#1a1a2e' }}>Corrections Applied</Typography>
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight={800}>57</Typography>
                      <Typography variant="body2" color="success.main" fontWeight={700} sx={{ mb: 2 }}>Improvements</Typography>
                      <Typography variant="caption" color="text.secondary">Spelling, grammar and style corrections applied</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #F3F4F6', mt: 3 }}>
                  <SectionBadge number="7" title="Translation Summary" />
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Language Pair</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>English ➔ {targetLanguage.split(' (')[0]}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{autoDetectInfo?.document_type.includes("PowerPoint") ? "Slides" : "Pages"}</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>{autoDetectInfo?.pages}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Words</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>{autoDetectInfo?.word_count?.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Corrections</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>57</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Est. Processing Time</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>~ 45 sec</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #F3F4F6', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <SectionBadge number="8" title="Ready to Translate" />
                  <Typography variant="body2" sx={{ mb: 4 }}>Everything looks good! Click translate to start the process.</Typography>
                  
                  {!isTranslating ? (
                    <Button 
                      variant="contained" size="large" onClick={startTranslation}
                      color="primary"
                      sx={{ 
                        borderRadius: 3, py: 2, fontSize: '1.1rem', fontWeight: 700,
                        boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.4)'
                      }}
                    >
                      <AutoAwesomeIcon sx={{ mr: 1 }} /> Translate Document
                    </Button>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 3, border: '1px dashed', borderColor: 'primary.main' }}>
                      <CircularProgress variant="determinate" value={progressPercent} size={80} thickness={4} sx={{ mb: 2, color: 'primary.main' }} />
                      <Typography variant="h5" color="primary.main" fontWeight={700}>{progressPercent}%</Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{progressStatus}</Typography>
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    🔒 You will be able to review and download once complete.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* STEP 3: Download */}
          {currentStep === 3 && finalResult && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #F3F4F6', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
               <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                 <CheckCircleIcon sx={{ fontSize: 40 }} />
               </Box>
               <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Translation Successful!</Typography>
               <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>Your document has been translated to {targetLanguage} using {translationMode} mode.</Typography>
               
               <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                 <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                   <Typography variant="h6" color="primary.main">{finalResult.quality_score}%</Typography>
                   <Typography variant="caption">Quality Score</Typography>
                 </Box>
                 <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                   <Typography variant="h6" color="primary.main">{finalResult.formatting_score}%</Typography>
                   <Typography variant="caption">Format Preservation</Typography>
                 </Box>
                 <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                   <Typography variant="h6" color="primary.main">{finalResult.corrections_applied}</Typography>
                   <Typography variant="caption">Corrections</Typography>
                 </Box>
               </Box>

               <Box sx={{ display: 'flex', gap: 2 }}>
                 <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => window.open(`${API_BASE_URL}/outputs/${finalResult.translated_path}`, '_blank')} sx={{ borderRadius: 2, px: 4 }}>
                   Download Translated File
                 </Button>
                 <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 2 }}>Translate Another</Button>
               </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Preview Dialog */}
      <Dialog 
        open={previewModalOpen} 
        onClose={() => setPreviewModalOpen(false)} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 2, height: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Box sx={{ '& > div': { mb: 0 } }}>
            <SectionBadge number="5" title="Translation Preview" />
          </Box>
          <IconButton onClick={() => setPreviewModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ border: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {previewData && (
            <Grid container spacing={4} sx={{ flex: 1, height: '100%' }}>
              <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#4B5563' }}>Original (English)</Typography>
                <Paper elevation={0} sx={{ p: 0, border: '1px solid #E5E7EB', borderRadius: 2, flex: 1, overflow: 'hidden', bgcolor: '#fff' }}>
                  <iframe 
                    srcDoc={previewData.original_html} 
                    title="Original Preview"
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
                    sandbox="allow-same-origin"
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#4B5563' }}>Translated ({targetLanguage.split(' (')[0]})</Typography>
                <Paper elevation={0} sx={{ p: 0, border: '1px solid #E5E7EB', borderRadius: 2, flex: 1, overflow: 'hidden', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <iframe 
                    srcDoc={previewData.translated_html} 
                    title="Translated Preview"
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
                    sandbox="allow-same-origin"
                  />
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 2 }}>
          <Button variant="outlined" size="large" sx={{ borderRadius: 2 }} onClick={() => setPreviewModalOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            size="large" 
            endIcon={<ArrowForwardIcon />} 
            onClick={() => {
              setPreviewModalOpen(false)
              setCurrentStep(2)
            }} 
            sx={{ borderRadius: 2 }}
          >
            Confirm & Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TranslateDocument
