import React from 'react'
import './AvatarCriadora.css'

export default function AvatarCriadora({ src }) {
  return (
    <div className="avatar-criadora">
      <img src={src} alt="Foto da Criadora" className="avatar-img" />
    </div>
  )
}
