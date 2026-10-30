import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Routes, Route, Navigate } from 'react-router-dom'
import Dryck from './pages/Dryck'
import BottleManager from './components/admin/BottleManager'
import './admin.css'
import './demo.css'

function App() {
  return <>
    <header className="demo-header">
      <div><strong>Brygghuset</strong><span>Fiskebäckskil · Lokal demo med exempeldata</span></div>
      <nav aria-label="Demovyer"><Link to="/dryck">Dryckeslistan</Link><Link to="/admin">Administration</Link></nav>
    </header>
    <Routes>
      <Route path="/" element={<Navigate to="/dryck" replace />} />
      <Route path="/dryck" element={<Dryck />} />
      <Route path="/admin" element={<div className="demo-admin"><BottleManager /></div>} />
      <Route path="*" element={<Navigate to="/dryck" replace />} />
    </Routes>
  </>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>)
