export default function LoadError({ message = 'Kunde inte ladda innehållet.' }) {
  return <div className="load-error" role="alert"><p>{message}</p><button className="btn" onClick={() => window.location.reload()}>Försök igen</button></div>
}
