import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'error', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose(), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-show' : 'toast-hide'}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={() => {
        setVisible(false)
        setTimeout(() => onClose(), 300)
      }}>×</button>
    </div>
  )
}
