import React, { useRef, useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Button, Chip, CircularProgress, IconButton,
  Grid, Select, MenuItem, FormControl, InputLabel,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import DescriptionIcon from '@mui/icons-material/Description'
import CloseIcon from '@mui/icons-material/Close'
import TranslateIcon from '@mui/icons-material/Translate'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import axios from 'axios'
import { PROVIDERS_AND_MODELS } from '../utils/providerModels'

const API_BASE_URL = 'http://localhost:8000'

const TranslateDocument = () => {
  const theme = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [sourceFile, setSourceFile] = useState(null)
  const [provider, setProvider] = useState('mistral')
  const [model, setModel] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('Spanish')
  const [translationMode, setTranslationMode] = useState('Business')
  
  const [isProcessing, setIsProcessing] = useState(false)
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
          if (res.data.defaultTargetLanguage) setTargetLanguage(res.data.defaultTargetLanguage)
          if (res.data.defaultTranslationMode) setTranslationMode(res.data.defaultTranslationMode)
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
          setCurrentStep(3)
          setIsProcessing(false)
          ws.close()
        } else if (data.status === 'Failed') {
          alert("Translation failed. " + (data.result?.error || ''))
          setIsProcessing(false)
          ws.close()
        }
      }
      return () => ws.close()
    }
  }, [jobId])

  const steps = [
    { id: 1, title: 'Upload Document', desc: 'Select the file to translate', icon: <CloudUploadIcon /> },
    { id: 2, title: 'Configure', desc: 'Select language and mode', icon: <TranslateIcon /> },
    { id: 3, title: 'Translating', desc: 'Processing your document', icon: <CircularProgress size={20} color="inherit" /> },
    { id: 4, title: 'Download', desc: 'Get your translated file', icon: <DownloadIcon /> }
  ]

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setSourceFile({ name: files[0].name, size: files[0].size, file: files[0] })
      setCurrentStep(1)
    }
    e.target.value = null
  }

  const handleReset = () => {
    setSourceFile(null)
    setCurrentStep(0)
    setJobId(null)
    setProgressStatus('')
    setProgressPercent(0)
    setFinalResult(null)
  }

  const startTranslation = async () => {
    if (!sourceFile) return
    setCurrentStep(2)
    setIsProcessing(true)
    setProgressStatus('Starting...')
    setProgressPercent(10)

    try {
      const formData = new FormData()
      formData.append('file', sourceFile.file)
      formData.append('targetLanguage', targetLanguage)
      formData.append('mode', translationMode)
      formData.append('provider', provider)
      formData.append('model', model)

      const res = await axios.post(`${API_BASE_URL}/translate/upload`, formData)
      setJobId(res.data.jobId)
    } catch (err) {
      console.error("Failed to start translation", err)
      alert("Failed to start translation.")
      setCurrentStep(1)
      setIsProcessing(false)
    }
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
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>Translate Document</Typography>
          <Typography variant="body2" color="text.secondary">Translate your enterprise documents while preserving formatting, tables, and charts.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>Reset</Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flex: 1, alignItems: 'flex-start' }}>
        <Paper sx={{ width: 260, py: 4, px: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
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

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {currentStep === 0 && (
            <Paper sx={{ p: 4, borderRadius: 2, height: '100%', border: '1px dashed', borderColor: 'primary.light', bgcolor: alpha(theme.palette.primary.main, 0.02), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2, cursor: 'pointer' }} onClick={() => sourceInputRef.current?.click()}>
              <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'background.paper', color: 'primary.main', boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <CloudUploadIcon fontSize="large" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Upload Document</Typography>
              <Typography variant="body2" color="text.secondary">Supports PDF, DOCX, XLSX, PPTX up to 200MB.</Typography>
              <Button variant="contained" sx={{ mt: 2, borderRadius: 6, px: 4 }}>Browse Files</Button>
              <input type="file" ref={sourceInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            </Paper>
          )}

          {currentStep === 1 && sourceFile && (
            <Paper sx={{ p: 4, borderRadius: 2, flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Configuration</Typography>
              
              <Chip
                icon={<DescriptionIcon sx={{ color: 'primary.main' }} />}
                label={
                  <Box>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>{sourceFile.name}</Typography>
                    <Typography variant="caption" component="span" sx={{ color: 'text.secondary', ml: 1 }}>{(sourceFile.size / 1024).toFixed(1)} KB</Typography>
                  </Box>
                }
                onDelete={handleReset}
                deleteIcon={<CloseIcon />}
                sx={{ p: 1, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #E5E7EB', height: 'auto', py: 1.5, mb: 4 }}
              />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Target Language</InputLabel>
                    <Select value={targetLanguage} label="Target Language" onChange={(e) => setTargetLanguage(e.target.value)}>
                      {['English', 'French', 'German', 'Spanish', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Bengali'].map(lang => (
                        <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Translation Mode</InputLabel>
                    <Select value={translationMode} label="Translation Mode" onChange={(e) => setTranslationMode(e.target.value)}>
                      <MenuItem value="Literal">Literal (Regulatory / Legal)</MenuItem>
                      <MenuItem value="Business">Business (Reports / Presentations)</MenuItem>
                      <MenuItem value="Localized">Localized (Marketing / Training)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>LLM Provider</InputLabel>
                  <Select value={provider} label="LLM Provider" onChange={(e) => {
                    setProvider(e.target.value)
                    setModel(PROVIDERS_AND_MODELS[e.target.value]?.models[0].id)
                  }}>
                    {Object.entries(PROVIDERS_AND_MODELS).map(([key, data]) => (
                      <MenuItem key={key} value={key}>{data.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Model</InputLabel>
                  <Select value={model} label="Model" onChange={(e) => setModel(e.target.value)}>
                    {PROVIDERS_AND_MODELS[provider]?.models.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button variant="contained" size="large" onClick={startTranslation} sx={{ borderRadius: 2, px: 4 }}>Start Translation</Button>
              </Box>
            </Paper>
          )}

          {currentStep === 2 && (
            <Paper sx={{ p: 4, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h5" sx={{ mb: 2 }}>Translating Document...</Typography>
              <CircularProgress variant="determinate" value={progressPercent} size={64} sx={{ mb: 2 }} />
              <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>{progressPercent}%</Typography>
              <Typography variant="body2" color="text.secondary">{progressStatus}</Typography>
            </Paper>
          )}

          {currentStep === 3 && finalResult && (
            <Paper sx={{ p: 4, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
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
    </Box>
  )
}

export default TranslateDocument
