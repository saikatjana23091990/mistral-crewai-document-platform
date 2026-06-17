import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import HistoryIcon from '@mui/icons-material/History'
import MemoryIcon from '@mui/icons-material/Memory'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import VerifiedIcon from '@mui/icons-material/Verified'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const SUGGESTED_PROMPTS = [
  "Summarize the key points of this document",
  "What are the most important numbers and dates?",
  "Extract all action items and responsibilities",
  "Compare the data with the reference document",
  "What are the main risks or issues mentioned?",
  "Give me a detailed analysis of the content"
]

const ChatWithDocument = () => {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [historyDocuments, setHistoryDocuments] = useState([])
  const [selectedHistoryDocs, setSelectedHistoryDocs] = useState([])
  const [chatHistory, setChatHistory] = useState([])
  const [memoryEntities, setMemoryEntities] = useState({})

  // === Chat History State (Start with NO default conversation) ===
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState("mistral")

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  const createNewConversation = () => {
    const newId = 'chat_' + Date.now()
    const newConv = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      chatHistory: [],
      lastUpdated: new Date()
    }
    setConversations(prev => [...prev, newConv])
    setCurrentConversationId(newId)
    setMessages([])
    setChatHistory([])
    setMemoryEntities({})
  }

  const switchConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      setCurrentConversationId(convId)
      setMessages(conv.messages || [])
      setChatHistory(conv.chatHistory || [])
    }
  }

  const deleteConversation = (convId, e) => {
    e.stopPropagation()
    const newConvs = conversations.filter(c => c.id !== convId)
    setConversations(newConvs)

    if (currentConversationId === convId) {
      if (newConvs.length > 0) {
        setCurrentConversationId(newConvs[0].id)
        setMessages(newConvs[0].messages || [])
        setChatHistory(newConvs[0].chatHistory || [])
      } else {
        setCurrentConversationId(null)
        setMessages([])
        setChatHistory([])
      }
    }
  }

  const updateCurrentConversation = (newMessages, newChatHistory) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversationId
          ? { 
              ...conv, 
              messages: newMessages, 
              chatHistory: newChatHistory,
              lastUpdated: new Date(),
              title: conv.title === 'New Conversation' && newMessages.length > 0 
                ? newMessages[0].text.substring(0, 40) + (newMessages[0].text.length > 40 ? '...' : '')
                : conv.title
            }
          : conv
      )
    )
  }

  const formatTimestamp = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setUploading(true)
      setError('')
      const successfulUploads = []
      try {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          await axios.post(`${API_BASE_URL}/chat/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          successfulUploads.push(file)
        }
        setUploadedFiles((prev) => {
          const existingNames = new Set(prev.map((item) => item.name))
          const newFiles = successfulUploads.filter((file) => !existingNames.has(file.name))
          return [...prev, ...newFiles]
        })
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to upload document(s)')
      } finally {
        setUploading(false)
        e.target.value = ''
      }
    }
  }

  const loadHistoryDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`)
      const records = response.data.records || []
      const uniqueDocs = []
      const seen = new Set()
      records.forEach((record) => {
        const docStr = record.original_document || ""
        // Split comma-joined multi-source records into separate selectable files
        const parts = docStr.includes(",") ? docStr.split(",").map(s => s.trim()).filter(Boolean) : [docStr]
        parts.forEach((docName) => {
          if (docName && !seen.has(docName)) {
            seen.add(docName)
            uniqueDocs.push({ ...record, original_document: docName })
          }
        })
      })
      setHistoryDocuments(uniqueDocs)
      setShowHistory(true)
    } catch (err) {
      setError('Failed to load conversion history')
    }
  }

  const toggleHistoryDocument = (record) => {
    const isSelected = selectedHistoryDocs.some((d) => d.original_document === record.original_document)
    if (isSelected) {
      setSelectedHistoryDocs((prev) => prev.filter((d) => d.original_document !== record.original_document))
    } else {
      setSelectedHistoryDocs((prev) => [...prev, record])
    }
  }

  const getAllSelectedFilenames = () => {
    const uploadedNames = uploadedFiles.map((f) => f.name)
    let historyNames = []
    selectedHistoryDocs.forEach((d) => {
      const name = d.original_document || ""
      if (name.includes(",")) {
        historyNames.push(...name.split(",").map(s => s.trim()).filter(Boolean))
      } else if (name) {
        historyNames.push(name)
      }
    })
    return [...new Set([...uploadedNames, ...historyNames])]
  }

  const handleSuggestedPrompt = (prompt) => {
    setQuestion(prompt)
  }

  const handleSendMessage = async () => {
    if (!question.trim()) return

    const allFilenames = getAllSelectedFilenames()
    if (allFilenames.length === 0) {
      setError('Please select or upload at least one document')
      return
    }

    // Auto-create first conversation if none exists
    let activeConvId = currentConversationId
    if (!activeConvId) {
      const newId = 'chat_' + Date.now()
      const newConv = {
        id: newId,
        title: 'New Conversation',
        messages: [],
        chatHistory: [],
        lastUpdated: new Date()
      }
      setConversations([newConv])
      setCurrentConversationId(newId)
      activeConvId = newId
    }

    const userMessage = { type: 'user', text: question }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setQuestion('')
    setLoading(true)
    setError('')

    const conversationHistory = chatHistory.slice(-6)

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        filenames: allFilenames,
        question: question.trim(),
        history: conversationHistory,
        provider: selectedProvider
      })

      const citations = response.data.citations || []
      const botMessage = {
        type: 'bot',
        text: response.data.answer || 'No response received.',
        citations: citations,
        grounding: citations.length >= 3 ? 'high' : citations.length >= 1 ? 'medium' : 'low'
      }

      const updatedMessages = [...newMessages, botMessage]
      setMessages(updatedMessages)

      const newChatHistory = [
        ...chatHistory,
        { role: 'user', content: question.trim() },
        { role: 'assistant', content: botMessage.text }
      ]
      setChatHistory(newChatHistory)

      updateCurrentConversation(updatedMessages, newChatHistory)

      if (botMessage.text) {
        const newEntities = extractEntitiesFromText(botMessage.text + " " + question)
        setMemoryEntities((prev) => ({ ...prev, ...newEntities }))
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to get answer'
      setError(errorMsg)
      const errorMessages = [...newMessages, { type: 'bot', text: `Error: ${errorMsg}` }]
      setMessages(errorMessages)
      updateCurrentConversation(errorMessages, chatHistory)
    } finally {
      setLoading(false)
    }
  }

  const extractEntitiesFromText = (text) => {
    const entities = {}
    const dateMatches = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) || []
    const amountMatches = text.match(/\$?\d{1,3}(,\d{3})*(\.\d{2})?\b/g) || []
    const companyMatches = text.match(/\b[A-Z][a-z]+ (Inc|LLC|Ltd|Corp|Technologies|Solutions)\b/g) || []

    if (dateMatches.length) entities.dates = [...new Set(dateMatches)]
    if (amountMatches.length) entities.amounts = [...new Set(amountMatches)]
    if (companyMatches.length) entities.companies = [...new Set(companyMatches)]
    return entities
  }

  const removeUploadedFile = (fileName) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName))
  }

  const removeHistoryDoc = (originalDoc) => {
    setSelectedHistoryDocs((prev) => prev.filter((d) => d.original_document !== originalDoc))
  }

  const allSelectedDocs = getAllSelectedFilenames()

  const getGroundingColor = (level) => {
    if (level === 'high') return 'success'
    if (level === 'medium') return 'warning'
    return 'error'
  }

  const getGroundingLabel = (level) => {
    if (level === 'high') return 'High Grounding'
    if (level === 'medium') return 'Medium Grounding'
    return 'Low Grounding'
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Chat with Document
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Select from converted documents, upload new ones, and have an agentic conversation with memory.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr 2fr' }, gap: 3 }}>
        
        {/* === CHAT HISTORY PANEL === */}
        <Paper sx={{ p: 2, borderRadius: 3, height: 'fit-content' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Chat History
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth
            onClick={createNewConversation}
            sx={{ 
              mb: 2, 
              py: 1.2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
            }}
          >
            New Chat
          </Button>

          <List dense sx={{ maxHeight: 420, overflow: 'auto' }}>
            {conversations.map((conv) => (
              <ListItem key={conv.id} disablePadding secondaryAction={
                conversations.length > 0 && (
                  <IconButton edge="end" size="small" onClick={(e) => deleteConversation(conv.id, e)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )
              }>
                <ListItemButton
                  selected={conv.id === currentConversationId}
                  onClick={() => switchConversation(conv.id)}
                >
                  <ListItemText
                    primary={conv.title}
                    secondary={formatTimestamp(conv.lastUpdated)}
                    primaryTypographyProps={{ noWrap: true, fontSize: '0.9rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {conversations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                No conversations yet. Click "New Chat" to start.
              </Typography>
            )}
          </List>
        </Paper>

        {/* Left Panel - Document Selection + Memory */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Documents
          </Typography>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={uploading}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            {uploading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Upload External Documents
            <input type="file" hidden multiple onChange={handleFileUpload} />
          </Button>

          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            fullWidth
            onClick={loadHistoryDocuments}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Load from Conversion History
          </Button>

          {/* Memory Status Panel */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MemoryIcon color="primary" />
                <Typography variant="subtitle2">Memory Status</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {Object.keys(memoryEntities).length > 0 ? (
                <Box>
                  {memoryEntities.dates && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Dates</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {memoryEntities.dates.map((d, i) => <Chip key={i} label={d} size="small" />)}
                      </Stack>
                    </Box>
                  )}
                  {memoryEntities.amounts && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Amounts</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {memoryEntities.amounts.map((a, i) => <Chip key={i} label={a} size="small" color="success" />)}
                      </Stack>
                    </Box>
                  )}
                  {memoryEntities.companies && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Companies</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {memoryEntities.companies.map((c, i) => <Chip key={i} label={c} size="small" color="primary" />)}
                      </Stack>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Entities will appear here as the conversation progresses.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Selected Documents */}
          {allSelectedDocs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Active Documents ({allSelectedDocs.length})
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {uploadedFiles.map((file, i) => (
                  <Chip key={i} label={file.name} onDelete={() => removeUploadedFile(file.name)} color="primary" size="small" />
                ))}
                {selectedHistoryDocs.map((doc, i) => (
                  <Chip key={i} label={doc.original_document} onDelete={() => removeHistoryDoc(doc.original_document)} color="success" size="small" />
                ))}
              </Stack>
            </Box>
          )}

          {/* History Selection */}
          {showHistory && historyDocuments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Previously Converted</Typography>
              <List dense sx={{ maxHeight: 180, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                {historyDocuments.map((record, index) => {
                  const isSelected = selectedHistoryDocs.some(d => d.original_document === record.original_document)
                  return (
                    <ListItem key={index} disablePadding>
                      <FormControlLabel
                        control={<Checkbox checked={isSelected} onChange={() => toggleHistoryDocument(record)} />}
                        label={<Typography variant="body2">{record.original_document}</Typography>}
                        sx={{ width: '100%', ml: 1 }}
                      />
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          )}
        </Paper>

        {/* Right Panel - Chat */}
        <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', height: '72vh' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Agentic Conversation with Memory
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedProvider}
                label="Model"
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <MenuItem value="mistral">Mistral</MenuItem>
                <MenuItem value="gemini">Gemini</MenuItem>
                <MenuItem value="bedrock">AWS Bedrock</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Suggested Prompts */}
          {allSelectedDocs.length > 0 && messages.length === 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                Suggested questions:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <Chip
                    key={idx}
                    label={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1, cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Messages */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            mb: 2,
            p: 2,
            backgroundColor: '#F8FAFF',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            {messages.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 6 }}>
                Select documents and start a conversation.<br />The agent will remember entities and context.
              </Typography>
            ) : (
              messages.map((msg, index) => (
                <Box key={index} sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: msg.type === 'user' ? '#e3f2fd' : '#fff',
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                  
                  {/* Grounding / Confidence Indicator */}
                  {msg.type === 'bot' && msg.grounding && (
                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<VerifiedIcon />}
                        label={getGroundingLabel(msg.grounding)}
                        color={getGroundingColor(msg.grounding)}
                        size="small"
                        variant="outlined"
                      />
                      {msg.citations && msg.citations.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Grounded in source material
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Citations */}
                  {msg.citations?.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      {msg.citations.map((cite, i) => (
                        <Chip 
                          key={i} 
                          label={`[${cite.index}] ${cite.source}`} 
                          size="small" 
                          sx={{ mr: 0.5, mt: 0.5, fontSize: '0.7rem' }} 
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ))
            )}
            {loading && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}><CircularProgress size={16} /> Thinking...</Box>}
          </Box>

          {/* Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder={allSelectedDocs.length === 0 ? "Select documents first..." : "Ask a follow-up question..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading || allSelectedDocs.length === 0}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={loading || !question.trim() || allSelectedDocs.length === 0}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default ChatWithDocument
