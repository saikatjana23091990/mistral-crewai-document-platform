import { useState } from 'react'
import { Box, Container } from '@mui/material'
import Header from './components/Header'
import ConvertDocument from './components/ConvertDocument'
import TranslateDocument from './components/TranslateDocument'
import ChatWithDocument from './components/ChatWithDocument'
import StatsResults from './components/StatsResults'
import Settings from './components/Settings'

function App() {
  const [currentPage, setCurrentPage] = useState('convert')
  const [statsTab, setStatsTab] = useState(0)

  const renderPage = () => {
    switch (currentPage) {
      case 'convert':
        return <ConvertDocument />
      case 'translate':
        return <TranslateDocument setCurrentPage={setCurrentPage} setStatsTab={setStatsTab} />
      case 'chat':
        return <ChatWithDocument />
      case 'stats_results':
        return <StatsResults initialTab={statsTab} setStatsTab={setStatsTab} />
      case 'settings':
        return <Settings />
      default:
        return <ConvertDocument />
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth={false} sx={{ maxWidth: 1600, pt: 2, pb: 4, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderPage()}
        </Box>
      </Container>
    </Box>
  )
}

export default App