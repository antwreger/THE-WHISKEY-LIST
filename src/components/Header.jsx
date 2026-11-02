import { NavLink } from 'react-router-dom'

// Navigation around the reused design-revision catalogue.
export default function Header() {
  return <header className="demo-header">
    <div><strong>Brygghuset</strong><span>Fiskebäckskil · Lokal demo med exempeldata</span></div>
    <nav aria-label="Demovyer"><NavLink to="/dryck">Dryckeslistan</NavLink><NavLink to="/admin">Administration</NavLink></nav>
  </header>
}
