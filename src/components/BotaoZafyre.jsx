import React from 'react'
import './BotaoZafyre.css'

export default function BotaoZafyre({ texto, onClick }) {
  return (
    <button className="botao-zafyre" onClick={onClick}>
      💎 {texto}
    </button>
  )
}
