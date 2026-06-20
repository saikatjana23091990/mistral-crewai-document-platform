import React from 'react'
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Badge,
} from '@mui/material'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'

const Header = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'convert', label: 'Convert Document', icon: <DocumentScannerIcon fontSize="small" /> },
    { id: 'chat', label: 'Chat with Document', icon: <ChatBubbleOutlineIcon fontSize="small" /> },
    { id: 'stats_results', label: 'Stats & Results', icon: <AssessmentOutlinedIcon fontSize="small" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsOutlinedIcon fontSize="small" /> },
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        mb: 3,
        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)',
      }}
    >
      {/* Logo Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img src="/logo.svg" alt="DocuGen AI Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
          DocuGen AI
        </Typography>
      </Box>

      {/* Navigation Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.id
          return (
            <Button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              startIcon={item.icon}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 3,
                color: isActive ? 'primary.main' : 'text.secondary',
                backgroundColor: isActive ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(124, 58, 237, 0.12)' : 'rgba(0,0,0,0.03)',
                },
              }}
            >
              {item.label}
            </Button>
          )
        })}
      </Box>

      {/* Profile & Notifications */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton sx={{ color: 'text.secondary' }}>
          <Badge color="error" variant="dot">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'rgba(124, 58, 237, 0.1)',
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            AU
          </Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
              Admin User
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              admin@docugen.com
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Header
