import { useState } from 'react'
import { Box } from '@mui/material'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ConvertDocument from './components/ConvertDocument'
import ChatWithDocument from './components/ChatWithDocument'
import History from './components/History'

function App() {
  const [currentPage, setCurrentPage] = useState('convert')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'convert':
        return <ConvertDocument />
      case 'chat':
        return <ChatWithDocument />
      case 'history':
        return <History />
      default:
        return <ConvertDocument />
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {renderPage()}
      </Box>
    </Box>
  )
}

export default App