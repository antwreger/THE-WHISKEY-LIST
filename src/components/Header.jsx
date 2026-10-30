import { Link } from 'react-router-dom'

// Demo shell only. The catalogue itself is August's unmodified design-revision component.
export default function Header() {
  return <header className="demo-header">
    <div><strong>Brygghuset</strong><span>Fiskebäckskil · Lokal demo med exempeldata</span></div>
    <nav aria-label="Demovyer"><Link to="/dryck">Dryckeslistan</Link><Link to="/admin">Administration</Link></nav>
  </header>
}
