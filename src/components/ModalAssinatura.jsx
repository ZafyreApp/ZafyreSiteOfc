import React from 'react'

function ModalAssinatura({ aberto, onFechar, children }) {
  if (!aberto) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <button onClick={onFechar} style={{ float: 'right', fontWeight: 'bold' }}>X</button>
        {children}
      </div>
    </div>
  )
}

export default ModalAssinatura
