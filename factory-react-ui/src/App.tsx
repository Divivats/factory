import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PCDetails from './pages/PCDetails'
import ModelLibrary from './pages/ModelLibrary'
import LogAnalyzer from './pages/LogAnalyzer' // Import the new page

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="dashboard/:version" element={<Dashboard />} />
                    <Route path="pc/:id" element={<PCDetails />} />
                    <Route path="models" element={<ModelLibrary />} />
                    <Route path="logs" element={<LogAnalyzer />} /> {/* Add this line */}
                </Route>
            </Routes>
        </Router>
    )
}

export default App