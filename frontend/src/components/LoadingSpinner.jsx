import React from 'react'

export default function LoadingSpinner({ size = 'medium' }) {
  const sizeClass = size === 'small' ? 'spinner-small' : 
                    size === 'large' ? 'spinner-large' : 'spinner-medium'
  
  return (
    <div className={`loading-spinner ${sizeClass}`}>
      <div className="spinner"></div>
    </div>
  )
}
