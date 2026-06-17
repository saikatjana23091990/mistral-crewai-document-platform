import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Divider
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ConvertIcon from '@mui/icons-material/DocumentScanner'
import ChatIcon from '@mui/icons-material/ChatBubble'
import HistoryIcon from '@mui/icons-material/History'
import LogoutIcon from '@mui/icons-material/Logout'

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'convert', label: 'Convert Document', icon: ConvertIcon },
    { id: 'chat', label: 'Chat with Document', icon: ChatIcon },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ]

  return (
    <Box
      sx={{
        width: 256,
        background: 'linear-gradient(180deg, #12295A 0%, #0E214A 100%)',
        color: '#ffffff',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        py: 2.5,
        overflowY: 'auto',
        borderRight: '1px solid',
        borderColor: 'sidebar.border'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            backgroundColor: 'primary.main',
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}
        >
          D
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          DocuGen AI
        </Typography>
      </Box>

      <Divider sx={{ backgroundColor: 'sidebar.border', mb: 2 }} />

      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <ListItem
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              sx={{
                mb: 1,
                borderRadius: 1.5,
                cursor: 'pointer',
                backgroundColor: currentPage === item.id ? 'sidebar.active' : 'transparent',
                '&:hover': {
                  backgroundColor: currentPage === item.id ? 'sidebar.active' : 'sidebar.hover'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.92rem',
                    fontWeight: currentPage === item.id ? 600 : 500
                  }
                }}
              />
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ backgroundColor: 'sidebar.border', mb: 2 }} />

      <ListItem
        sx={{
          borderRadius: 1.5,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'sidebar.hover'
          }
        }}
      >
        <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>

      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'sidebar.border' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 36, height: 36, backgroundColor: 'primary.main' }}>
            AU
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              Admin User
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'sidebar.muted' }}>
              admin@docugen.com
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Sidebar
