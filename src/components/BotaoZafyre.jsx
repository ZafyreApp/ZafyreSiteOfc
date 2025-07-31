import React from 'react'

function BotaoZafyre({ children, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        backgroundColor: '#a855f7',
        color: '#fff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      {children}
    </button>
  )
}

export default BotaoZafyre
