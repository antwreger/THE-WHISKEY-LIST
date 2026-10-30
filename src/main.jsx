import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Routes, Route, Navigate } from 'react-router-dom'
import Dryck from './pages/Dryck'
import BottleManager from './components/admin/BottleManager'
import Header from './components/Header'
import './index.css'
import './admin.css'
import './demo.css'

function App() {
  return <>
    <Routes>
      <Route path="/" element={<Navigate to="/dryck" replace />} />
      <Route path="/dryck" element={<Dryck />} />
      <Route path="/admin" element={<><Header /><div className="demo-admin"><BottleManager /></div></>} />
      <Route path="/dryckesprovningar" element={<><Header /><main className="demo-booking"><h1>Provning</h1><p>Bokning ingår inte i denna lokala demolista.</p><Link to="/dryck">Tillbaka till dryckeslistan</Link></main></>} />
      <Route path="*" element={<Navigate to="/dryck" replace />} />
    </Routes>
  </>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>)
