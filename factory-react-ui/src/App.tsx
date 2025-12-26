import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ModelLibrary from './pages/ModelLibrary'
import { ThemeProvider } from './contexts/ThemeContext'
import LogAnalyzer from './pages/LogAnalyzer'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/:version" element={<Dashboard />} />
            <Route path="models" element={<ModelLibrary />} />      
            <Route path="logs" element={<LogAnalyzer />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App