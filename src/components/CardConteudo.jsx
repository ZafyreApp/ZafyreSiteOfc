import React from 'react'

function CardConteudo({ titulo, descricao, imagem }) {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '300px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <img src={imagem} alt={titulo} style={{ width: '100%', borderRadius: '8px' }} />
      <h3 style={{ marginTop: '12px', color: '#a855f7' }}>{titulo}</h3>
      <p>{descricao}</p>
    </div>
  )
}

export default CardConteudo
