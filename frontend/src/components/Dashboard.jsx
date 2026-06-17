import React, { useState, useEffect } from 'react'
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Button } from '@mui/material'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import HistoryIcon from '@mui/icons-material/History'
import RefreshIcon from '@mui/icons-material/Refresh'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const statCards = [
  {
    key: 'documents_converted',
    label: 'Documents Converted',
    icon: DocumentScannerIcon,
  },
  {
    key: 'chat_interactions',
    label: 'Chat Interactions',
    icon: ChatBubbleIcon,
  },
  {
    key: 'api_calls',
    label: 'API Calls',
    icon: HistoryIcon,
  },
]

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/stats`)
        setStats(response.data)
        setError('')
      } catch {
        setError('Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          <Typography variant="body2">Welcome back, Admin! Here&apos;s what&apos;s happening with your documents.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ textTransform: 'none' }}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2.5}>
        {statCards.map(({ key, label, icon: Icon }) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Icon sx={{ fontSize: 30, color: 'primary.main', mb: 1.5 }} />
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {label}
                </Typography>
                {loading ? (
                  <CircularProgress size={30} sx={{ color: 'primary.main' }} />
                ) : (
                  <Typography variant="h4" sx={{ color: 'text.primary' }}>
                    {stats?.[key] ?? 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 2.5, borderRadius: 3 }}>
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.8 }}>
              Welcome to DocuGen AI
            </Typography>
            <Typography variant="body2">
              Convert your documents, chat with them, and get intelligent insights in seconds.
            </Typography>
          </Box>
          <ChatBubbleIcon sx={{ fontSize: 60, color: 'primary.light' }} />
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard
