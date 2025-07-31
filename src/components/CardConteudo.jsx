import React from 'react'
import './CardConteudo.css'

export default function CardConteudo({ titulo, imagem, curtidas, comentarios }) {
  return (
    <div className="card-conteudo">
      <img src={imagem} alt={titulo} className="conteudo-img" />
      <h3>{titulo}</h3>
      <p>💛 {curtidas} curtidas</p>
      <div className="comentarios">
        {comentarios.map((comentario, index) => (
          <p key={index}>💬 {comentario}</p>
        ))}
      </div>
    </div>
  )
}
