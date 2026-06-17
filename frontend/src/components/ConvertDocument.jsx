import React, { useRef, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const ConvertDocument = () => {
  const [sourceFiles, setSourceFiles] = useState([])
  const [referenceFile, setReferenceFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const sourceInputRef = useRef(null)
  const referenceInputRef = useRef(null)

  // Conflict resolution state
  const [conflicts, setConflicts] = useState([])
  const [resolutions, setResolutions] = useState({})
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  // Reset the entire conversion page
  const handleReset = () => {
    setSourceFiles([])
    setReferenceFile(null)
    setPreview('')
    setDownloadUrl('')
    setError('')
    setSuccess('')
    setLoading(false)
    setConflicts([])
    setResolutions({})
    setShowConflictModal(false)
    if (sourceInputRef.current) sourceInputRef.current.value = ''
    if (referenceInputRef.current) referenceInputRef.current.value = ''
  }

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files)
    if (type === 'source') {
      const newSources = files.map(file => ({
        name: file.name,
        size: file.size,
        file
      }))
      setSourceFiles(prev => [...prev, ...newSources])
    } else if (type === 'reference' && files.length > 0) {
      const file = files[0]
      setReferenceFile({ name: file.name, size: file.size, file })
    }
    setError('')
    setPreview('')
    setDownloadUrl('')
    setSuccess('')
  }

  const removeSource = (index) => {
    setSourceFiles(prev => prev.filter((_, i) => i !== index))
    setPreview('')
    setDownloadUrl('')
  }

  const openPicker = (type) => {
    const ref = type === 'source' ? sourceInputRef : referenceInputRef
    if (ref.current) ref.current.value = ''
    ref.current?.click?.()
  }

  const handleConvert = async (withResolutions = false, currentResolutions = {}) => {
    if (sourceFiles.length === 0 || !referenceFile) {
      setError('Please upload at least one source document and a reference document')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      sourceFiles.forEach((sf) => {
        formData.append('source_files', sf.file)
      })
      formData.append('reference_file', referenceFile.file)

      if (withResolutions && Object.keys(currentResolutions).length > 0) {
        formData.append('resolutions', JSON.stringify(currentResolutions))
      }

      const response = await axios.post(`${API_BASE_URL}/convert`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const data = response.data
      setPreview(data.preview || '')

      if (data.conflicts && data.conflicts.length > 0 && !withResolutions) {
        // First time with conflicts - show modal
        setConflicts(data.conflicts)
        setResolutions({})
        setShowConflictModal(true)
        setSuccess('Conflicts detected between sources. Please resolve them.')
        setDownloadUrl('') // don't enable download until resolved
      } else {
        // No conflicts or after resolution
        setDownloadUrl(data.download_url)
        setSuccess(withResolutions ? 'Conflicts resolved. Final document ready!' : 'Document converted successfully!')
        setShowConflictModal(false)
        setConflicts([])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error converting document')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(`${API_BASE_URL}${downloadUrl}`, '_blank')
    }
  }

  // Handle conflict resolution in modal
  const updateResolution = (field, value) => {
    setResolutions(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleResolveConflicts = async () => {
    if (Object.keys(resolutions).length === 0) {
      setError('Please select or enter a value for at least one conflict')
      return
    }

    setIsResolving(true)
    // Re-call convert with resolutions (files are still in state)
    await handleConvert(true, resolutions)
    setIsResolving(false)
  }

  const closeConflictModal = () => {
    setShowConflictModal(false)
    // Keep the draft preview visible so user can see what was generated
    setSuccess('Draft preview shown above. Conflicts were not resolved.')
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Convert Document
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Upload source document(s) and a reference format. Supports multiple sources → single output.
          </Typography>
        </Box>
        <Tooltip title="Reset page for new conversion">
          <IconButton 
            onClick={handleReset} 
            color="default"
            sx={{ 
              border: '1px solid #ddd', 
              borderRadius: 1,
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Source Documents Section */}
        <Paper elevation={2} sx={{ p: 3, flex: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon /> Source Document(s)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload one or more source files. Information will be merged into the reference format.
          </Typography>

          <input
            type="file"
            multiple
            ref={sourceInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e, 'source')}
          />

          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => openPicker('source')}
            fullWidth
            sx={{ mb: 2 }}
          >
            Add Source File(s)
          </Button>

          {sourceFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Selected Sources ({sourceFiles.length}):</Typography>
              {sourceFiles.map((sf, index) => (
                <Chip
                  key={index}
                  label={`${sf.name} (${(sf.size / 1024).toFixed(1)} KB)`}
                  onDelete={() => removeSource(index)}
                  sx={{ mr: 1, mb: 1 }}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Reference Document Section */}
        <Paper elevation={2} sx={{ p: 3, flex: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon /> Reference Document
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The reference defines the target structure and format of the output.
          </Typography>

          <input
            type="file"
            ref={referenceInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e, 'reference')}
          />

          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => openPicker('reference')}
            fullWidth
            sx={{ mb: 2 }}
          >
            Upload Reference File
          </Button>

          {referenceFile && (
            <Chip
              label={`${referenceFile.name} (${(referenceFile.size / 1024).toFixed(1)} KB)`}
              color="secondary"
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
        </Paper>
      </Box>

      {/* Convert Button */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          onClick={() => handleConvert(false)}
          disabled={loading || sourceFiles.length === 0 || !referenceFile}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : 'Convert Document'}
        </Button>

        {downloadUrl && (
          <Button
            variant="outlined"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            size="large"
          >
            Download Converted File
          </Button>
        )}
      </Box>

      {/* Results Section */}
      {(preview || downloadUrl) && (
        <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Conversion Result {conflicts.length > 0 && !downloadUrl ? '(Draft - Conflicts Pending)' : ''}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {downloadUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Converted file ready for download. The format matches the reference document.
              </Typography>
            </Box>
          )}

          {preview && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview:</Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 320
                }}
              >
                {preview}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Conflict Resolution Modal - Human in the Loop */}
      <Dialog 
        open={showConflictModal} 
        onClose={closeConflictModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Conflict Resolution (Human-in-the-Loop)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            The following fields have different values across your source documents. 
            Please choose the correct value for each (or enter a custom one). 
            This will be used to generate the final document.
          </Typography>

          {conflicts.map((conflict, index) => {
            const currentValue = resolutions[conflict.field] || ''
            return (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {conflict.field}
                </Typography>

                <RadioGroup
                  value={currentValue}
                  onChange={(e) => updateResolution(conflict.field, e.target.value)}
                >
                  {conflict.values.map((val, i) => (
                    <FormControlLabel
                      key={i}
                      value={val.value}
                      control={<Radio />}
                      label={`${val.source}: ${val.value}`}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </RadioGroup>

                <TextField
                  fullWidth
                  size="small"
                  label="Custom value (optional)"
                  placeholder="Enter your resolved value"
                  value={currentValue}
                  onChange={(e) => updateResolution(conflict.field, e.target.value)}
                  sx={{ mt: 1 }}
                />
              </Box>
            )
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConflictModal} disabled={isResolving}>
            Cancel (keep draft)
          </Button>
          <Button 
            onClick={handleResolveConflicts} 
            variant="contained" 
            disabled={isResolving || Object.keys(resolutions).length === 0}
          >
            {isResolving ? <CircularProgress size={20} /> : 'Resolve & Generate Final Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Instructions */}
      <Paper sx={{ mt: 3, p: 2, backgroundColor: '#f9f9f9' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Multi-source + Conflict support:</strong> Upload multiple sources. 
          Conflicting values (e.g. different totals, vendors, dates) will trigger this resolution modal. 
          Missing data from the reference will be labeled "[Information not found in source documents]".
        </Typography>
      </Paper>
    </Box>
  )
}

export default ConvertDocument
