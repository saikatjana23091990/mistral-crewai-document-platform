import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Paper, Typography, TextField, Button, Chip, List, ListItem, ListItemButton,
  ListItemText, Alert, CircularProgress, Checkbox, FormControlLabel, Stack,
  Accordion, AccordionSummary, AccordionDetails, IconButton, Select, MenuItem,
  FormControl, InputAdornment, Grid
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import HistoryIcon from '@mui/icons-material/History'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import SearchIcon from '@mui/icons-material/Search'
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined'
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CloseIcon from '@mui/icons-material/Close'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const ChatWithDocument = () => {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState("groq")

  // Session state for history
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('chatSessions')
    if (saved) return JSON.parse(saved)
    return [{ id: Date.now(), title: 'New Conversation', messages: [], documents: [], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
  })
  
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem('chatSessions')
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.length > 0 ? parsed[0].id : Date.now()
    }
    return sessions && sessions.length > 0 ? sessions[0].id : Date.now()
  })

  const [historyDocuments, setHistoryDocuments] = useState([])

  const fileInputRef = useRef(null)
  const chatScrollRef = useRef(null)

  // Derive active messages and documents
  const activeSession = sessions.find(s => s.id === activeSessionId) || { messages: [], documents: [] }
  const messages = activeSession.messages || []
  const activeDocuments = activeSession.documents || []

  const updateSessionMessages = (newMessages) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          let title = s.title
          // Auto-title if it's the first user message
          if (s.messages.length === 0 && newMessages.length > 0 && newMessages[0].type === 'user') {
            title = newMessages[0].text.substring(0, 30) + (newMessages[0].text.length > 30 ? '...' : '')
          }
          return { ...s, messages: newMessages, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), title }
        }
        return s
      })
      localStorage.setItem('chatSessions', JSON.stringify(updated))
      return updated
    })
  }

  const updateSessionDocuments = (updater) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          const currentDocs = s.documents || []
          const newDocs = typeof updater === 'function' ? updater(currentDocs) : updater
          return { ...s, documents: newDocs }
        }
        return s
      })
      localStorage.setItem('chatSessions', JSON.stringify(updated))
      return updated
    })
  }

  useEffect(() => {
    fetchHistory()
    axios.get(`${API_BASE_URL}/settings`)
      .then(res => {
        if (res.data && res.data.provider) {
          setSelectedProvider(res.data.provider)
        }
      })
      .catch(err => console.error("Failed to load default provider", err))
  }, [])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/history`)
      const records = res.data.records || []
      
      const docs = new Set()
      records.forEach(r => {
        if (r.original_document) {
          r.original_document.split(',').forEach(d => docs.add(d.trim()))
        }
        if (r.converted_document) docs.add(r.converted_document)
      })
      
      setHistoryDocuments(Array.from(docs))
    } catch (err) {
      console.error("Failed to fetch history", err)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadedDocs = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await axios.post(`${API_BASE_URL}/chat/upload`, formData)
        uploadedDocs.push(res.data.filename)
      }
      
      updateSessionDocuments(prev => {
        const newDocs = uploadedDocs.filter(d => !prev.includes(d))
        return [...prev, ...newDocs]
      })
    } catch (err) {
      console.error("Failed to upload", err)
      alert("Failed to upload document(s) for chat.")
    } finally {
      setUploading(false)
      e.target.value = null
    }
  }

  const toggleHistoryDocument = (docName) => {
    updateSessionDocuments(prev => {
      if (prev.includes(docName)) return prev.filter(d => d !== docName)
      return [...prev, docName]
    })
  }

  const removeActiveDocument = (docName) => {
    updateSessionDocuments(prev => prev.filter(d => d !== docName))
  }

  const deleteSession = (e, id) => {
    e.stopPropagation()
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id)
      if (updated.length === 0) {
        const newSession = { id: Date.now(), title: 'New Conversation', messages: [], documents: [], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        updated.push(newSession)
      }
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id)
      }
      localStorage.setItem('chatSessions', JSON.stringify(updated))
      return updated
    })
  }

  const handleSendMessage = async () => {
    if (!question.trim()) return
    if (activeDocuments.length === 0) {
      alert("Please select or upload a document first.")
      return
    }

    const userMsg = { 
      type: 'user', 
      text: question, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
    const updatedMessages = [...messages, userMsg]
    updateSessionMessages(updatedMessages)
    setQuestion('')
    setLoading(true)

    // Prepare history format for LangChain (list of Human/AI tuples or dicts)
    const chatHistory = messages.map(m => 
      m.type === 'user' ? ['human', m.text] : ['ai', m.text]
    )

    try {
      const res = await axios.post(`${API_BASE_URL}/chat`, {
        filenames: activeDocuments,
        question: userMsg.text,
        history: chatHistory,
        provider: selectedProvider
      })
      
      const botMsg = {
        type: 'bot',
        text: res.data.answer || "No response.",
        sources: res.data.citations ? res.data.citations.map(c => c.source) : [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      updateSessionMessages([...updatedMessages, botMsg])
    } catch (err) {
      console.error("Chat error", err)
      updateSessionMessages([...updatedMessages, { type: 'bot', text: 'Sorry, there was an error processing your request.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startNewChat = () => {
    const newSession = { id: Date.now(), title: 'New Conversation', messages: [], documents: [], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setSessions(prev => {
      const updated = [newSession, ...prev]
      localStorage.setItem('chatSessions', JSON.stringify(updated))
      return updated
    })
    setActiveSessionId(newSession.id)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main', mt: 0.5 }} />
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>Chat with Document</Typography>
            <Typography variant="body2" color="text.secondary">Select from converted documents, upload new ones, and have an agentic conversation with memory.</Typography>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<MenuBookIcon />} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>How it works</Button>
      </Box>

      {/* Main 3-Column Layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 320px 1fr' }, gap: 3, flex: 1 }}>
        
        {/* COLUMN 1: Chat History */}
        <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon fontSize="small" sx={{ color: 'primary.main' }} /> Chat Sessions
          </Typography>
          
          <Button variant="contained" startIcon={<AddIcon />} fullWidth onClick={startNewChat} sx={{ mb: 3, borderRadius: 2, py: 1 }}>
            New Chat
          </Button>

          <Box sx={{ position: 'relative', mb: 3 }}>
            <SearchIcon sx={{ position: 'absolute', left: 10, top: 10, color: 'text.secondary', fontSize: 20 }} />
            <input type="text" placeholder="Search conversations..." style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', boxSizing: 'border-box' }} />
          </Box>

          <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
             <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, px: 1 }}>
               Recent Sessions
             </Typography>
             <List disablePadding>
                {sessions.map(session => (
                  <ListItem key={session.id} disablePadding sx={{ mb: 0.5 }} secondaryAction={
                    <IconButton edge="end" size="small" onClick={(e) => deleteSession(e, session.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  }>
                    <ListItemButton 
                      selected={session.id === activeSessionId} 
                      onClick={() => setActiveSessionId(session.id)}
                      sx={{ borderRadius: 2, py: 1.5, bgcolor: session.id === activeSessionId ? 'rgba(124,58,237,0.05)' : 'transparent', borderLeft: session.id === activeSessionId ? '3px solid #7C3AED' : '3px solid transparent' }}
                    >
                      <ListItemText 
                        primary={session.title} 
                        secondary={session.time} 
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: session.id === activeSessionId ? 600 : 500, color: session.id === activeSessionId ? 'primary.main' : 'text.primary', noWrap: true }}
                        secondaryTypographyProps={{ fontSize: '0.75rem', mt: 0.5 }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
             </List>
          </Box>

          <Button variant="text" startIcon={<FormatListBulletedIcon />} fullWidth sx={{ mt: 'auto', color: 'text.secondary', justifyContent: 'flex-start' }}>View All History</Button>
        </Paper>

        {/* COLUMN 2: Documents & Memory */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
           <Paper sx={{ p: 2.5, borderRadius: 2 }}>
             <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
               <InsertDriveFileIcon fontSize="small" sx={{ color: 'primary.main' }} /> Documents
             </Typography>
             
             <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
             <Button variant="outlined" startIcon={<CloudUploadOutlinedIcon />} onClick={() => fileInputRef.current?.click()} disabled={uploading} fullWidth sx={{ mb: 1.5, borderRadius: 2, color: 'text.primary', borderColor: '#E5E7EB' }}>
                {uploading ? 'Uploading...' : 'Upload External Documents'}
             </Button>

             <Accordion defaultExpanded sx={{ boxShadow: 'none', border: '1px solid #E5E7EB', borderRadius: '12px !important', '&:before': { display: 'none' }, mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8F9FE', borderRadius: '12px 12px 0 0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Memory Status</Typography>
                    <InfoOutlinedIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <CircularProgress variant="determinate" value={100} size={70} thickness={4} sx={{ color: 'divider', position: 'absolute' }} />
                      <CircularProgress variant="determinate" value={activeDocuments.length > 0 ? 85 : 0} size={70} thickness={4} sx={{ color: 'success.main', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{activeDocuments.length > 0 ? '85%' : '0%'}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>{activeDocuments.length > 0 ? 'Strong' : 'None'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box component="span" sx={{color:'success.main'}}>▲</Box> Total Facts Stored</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{activeDocuments.length * 32}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box component="span" sx={{color:'success.main'}}>■</Box> Key Entities</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{activeDocuments.length * 8}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box component="span" sx={{color:'warning.main'}}>●</Box> Documents Indexed</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{activeDocuments.length}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Alert severity="info" icon={<AutoAwesomeIcon fontSize="inherit" />} sx={{ bgcolor: 'rgba(124,58,237,0.05)', color: 'text.primary', '& .MuiAlert-icon': { color: 'primary.main' } }}>
                    <Typography variant="caption">Memory helps the AI understand your documents better and provide more accurate answers.</Typography>
                  </Alert>
                </AccordionDetails>
             </Accordion>

             <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Active Documents ({activeDocuments.length})</Typography>
                {activeDocuments.length === 0 && <Typography variant="caption" color="text.secondary">No documents selected.</Typography>}
                {activeDocuments.map((doc, idx) => (
                  <Chip
                    key={idx}
                    icon={<Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, bgcolor: 'primary.main', color: 'white', borderRadius: 0.5, ml: 1, fontSize: '0.65rem', fontWeight: 'bold' }}>D</Box>}
                    label={doc}
                    onDelete={() => removeActiveDocument(doc)}
                    deleteIcon={<CloseIcon />}
                    sx={{ width: '100%', justifyContent: 'space-between', bgcolor: '#F8F9FE', border: '1px solid #E5E7EB', borderRadius: 2, py: 2.5, mb: 1, '& .MuiChip-label': { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' } }}
                  />
                ))}
             </Box>

             <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Previously Converted ({historyDocuments.length})</Typography>
                <List dense disablePadding>
                  {historyDocuments.map((doc, idx) => (
                    <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={activeDocuments.includes(doc)} onChange={() => toggleHistoryDocument(doc)} sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }} />}
                        label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{doc}</Typography>}
                        sx={{ ml: 0 }}
                      />
                    </ListItem>
                  ))}
                  {historyDocuments.length === 0 && <Typography variant="caption" color="text.secondary">No history found.</Typography>}
                </List>
             </Box>
           </Paper>
        </Box>

        {/* COLUMN 3: Chat Interface */}
        <Paper sx={{ borderRadius: 2, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8F9FE' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon fontSize="small" sx={{ color: 'primary.main' }} /> Agentic Conversation with Memory
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">Model</Typography>
              <Select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} size="small" sx={{ height: 32, fontSize: '0.85rem', bgcolor: 'white', borderRadius: 2, '& fieldset': { border: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <MenuItem value="groq">GroqCloud</MenuItem>
                <MenuItem value="openrouter">OpenRouter</MenuItem>
                <MenuItem value="mistral">Mistral AI</MenuItem>
                <MenuItem value="gemini">Google Gemini</MenuItem>
                <MenuItem value="bedrock">AWS Bedrock</MenuItem>
              </Select>
            </Box>
          </Box>

          <Box ref={chatScrollRef} sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3, bgcolor: '#FFFFFF' }}>
             
             {messages.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
                     <AutoAwesomeIcon sx={{ fontSize: 48, color: 'primary.light', mb: 2, opacity: 0.5 }} />
                     <Typography variant="h6">How can I help you?</Typography>
                     <Typography variant="body2">Select a document and ask a question to begin.</Typography>
                  </Box>
                  {activeDocuments.length > 0 && (
                    <Box sx={{ px: 4 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>Suggestions to get started:</Typography>
                      <Grid container spacing={2}>
                        {['Summarize the key findings from these documents.', 'What are the main risks mentioned?', 'Can you extract the numerical data into a list?', 'What are the next steps or recommendations?'].map((sug, i) => (
                          <Grid item xs={12} sm={6} key={i}>
                            <Paper 
                              onClick={() => { setQuestion(sug); setTimeout(() => handleSendMessage(), 100); }}
                              sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: '#F8F9FE' }, transition: 'all 0.2s', height: '100%' }}
                            >
                              <Typography variant="body2">{sug}</Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
             ) : (
                <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', bgcolor: '#F3F4F6', px: 2, py: 0.5, borderRadius: 2 }}>Today</Typography>
             )}

             {messages.map((msg, idx) => (
               <Box key={idx} sx={{ display: 'flex', gap: 2, flexDirection: msg.type === 'user' ? 'row-reverse' : 'row' }}>
                 <Box sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: msg.type === 'user' ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.1)', color: 'primary.main', fontWeight: 'bold' }}>
                    {msg.type === 'user' ? 'U' : <AutoAwesomeIcon fontSize="small" />}
                 </Box>
                 <Box sx={{ maxWidth: '80%' }}>
                   <Paper sx={{ p: 2.5, borderRadius: msg.type === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', bgcolor: msg.type === 'user' ? '#F8F9FE' : 'white', border: msg.type === 'user' ? 'none' : '1px solid #E5E7EB', boxShadow: msg.type === 'user' ? 'none' : '0 4px 20px rgba(0,0,0,0.03)' }}>
                     {msg.text.split('\n').map((line, i) => (
                       <Typography key={i} variant="body2" sx={{ mb: line === '' ? 1 : 0.5, color: 'text.primary', lineHeight: 1.6 }}>
                         {line.includes('**') ? 
                           line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part) 
                           : line
                         }
                       </Typography>
                     ))}
                   </Paper>
                   
                   {msg.type === 'bot' && (
                     <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {msg.sources && msg.sources.length > 0 && (
                            <>
                              <Typography variant="caption" color="text.secondary">Sources:</Typography>
                              {msg.sources.map((s, i) => <Chip key={i} label={s} size="small" icon={<Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, bgcolor: 'primary.main', color: 'white', borderRadius: 0.5, ml: 1, fontSize: '0.5rem', fontWeight: 'bold' }}>D</Box>} sx={{ fontSize: '0.7rem', height: 24, bgcolor: 'rgba(124,58,237,0.05)', color: 'text.primary' }} />)}
                            </>
                          )}
                       </Box>
                       <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small"><ThumbUpOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                          <IconButton size="small"><ThumbDownOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                       </Box>
                     </Box>
                   )}
                   {msg.type === 'user' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>{msg.time}</Typography>
                   )}
                 </Box>
               </Box>
             ))}
             {loading && (
               <Box sx={{ display: 'flex', gap: 2 }}>
                 <Box sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(124,58,237,0.1)', color: 'primary.main' }}>
                    <AutoAwesomeIcon fontSize="small" />
                 </Box>
                 <Paper sx={{ p: 2.5, borderRadius: '20px 20px 20px 4px', bgcolor: 'white', border: '1px solid #E5E7EB' }}>
                    <CircularProgress size={20} />
                 </Paper>
               </Box>
             )}
          </Box>

          <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB', bgcolor: 'white' }}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3, 
                    pr: 8,
                    bgcolor: '#F8F9FE',
                    '& fieldset': { borderColor: '#E5E7EB' }
                  } 
                }}
              />
              <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 0.5 }}>
                <Button 
                  variant="contained" 
                  onClick={handleSendMessage}
                  disabled={loading || !question.trim()}
                  sx={{ minWidth: 40, width: 40, height: 40, borderRadius: 2, p: 0 }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'text.secondary', mt: 1 }}>
               <AutoAwesomeIcon sx={{ fontSize: 12 }} /> AI responses are generated from your selected documents. Please review for accuracy.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default ChatWithDocument
