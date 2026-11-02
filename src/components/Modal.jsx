import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

let openDialogs = 0
let originalOverflow = ''

export default function Modal({ title, children, onClose, alert = false }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement
    if (openDialogs === 0) originalOverflow = document.body.style.overflow
    openDialogs += 1
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    const firstField = dialog.querySelector('input, textarea, select')
    ;(firstField || dialog.querySelector('button'))?.focus()
    return () => {
      dialog.close()
      openDialogs -= 1
      if (openDialogs === 0) document.body.style.overflow = originalOverflow
      if (opener?.isConnected) opener.focus()
      else document.querySelector('[data-dialog-fallback]')?.focus()
    }
  }, [])
  return createPortal(<dialog ref={ref} className="manager-card modal-content large admin-dialog"
    role={alert ? 'alertdialog' : 'dialog'} aria-labelledby={titleId} aria-modal="true"
    onCancel={e => { e.preventDefault(); onClose() }}
    onClick={e => {
      if (e.target !== e.currentTarget) return
      const rect = e.currentTarget.getBoundingClientRect()
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose()
    }}>
    <div className="admin-dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" className="btn-icon" aria-label="Stäng" onClick={onClose}>×</button></div>
    {children}
  </dialog>, document.body)
}
