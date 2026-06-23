import React from 'react'
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Badge,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TranslateIcon from '@mui/icons-material/Translate'
import { useThemeContext } from '../ThemeContext'

const Header = ({ currentPage, setCurrentPage }) => {
  const theme = useTheme();
  const { themeColor } = useThemeContext();

  const navItems = [
    { id: 'convert', label: 'Convert Document', icon: <DocumentScannerIcon fontSize="small" /> },
    { id: 'translate', label: 'Translate Document', icon: <TranslateIcon fontSize="small" /> },
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
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`,
      }}
    >
      {/* Logo Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img src="/logo.png" alt="DocuGen AI Logo" style={{ height: 56, objectFit: 'contain', transform: 'scale(2.4)', transformOrigin: 'left center', marginLeft: 10 }} />
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
                backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                fontWeight: isActive ? 600 : 500,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.12) : 'rgba(0,0,0,0.03)',
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
              bgcolor: alpha(theme.palette.primary.main, 0.1),
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
