import React, { useState, useEffect } from 'react'
import AvatarCriadora from '../components/AvatarCriadora'
import './PerfilCriadora.css'

export default function PerfilCriadora() {
  const [nome, setNome] = useState('Zafyre Criadora')
  const [descricao, setDescricao] = useState('🌟 Criadora Premium do Zafyre 💬 Conteúdo exclusivo todas as semanas!')
  const [fotoPerfil, setFotoPerfil] = useState(import.meta.env.VITE_DEFAULT_PROFILE_PICTURE_URL)

  useEffect(() => {
    // Aqui você pode puxar do Firebase ou Firestore futuramente
  }, [])

  return (
    <div className="perfil-container">
      <AvatarCriadora src={fotoPerfil} />
      <h2>{nome}</h2>
      <p>{descricao}</p>
      <button>Editar Perfil</button>
    </div>
  )
}
