import React, { useState, useEffect } from 'react'
import CardConteudo from '../components/CardConteudo'
import './FeedPrincipal.css'

export default function FeedPrincipal() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    // Simulação de conteúdos carregados
    const conteudoSimulado = [
      {
        id: 1,
        titulo: 'Preview do novo ensaio 🔥',
        imagem: '/assets/ensaio1.jpg',
        curtidas: 92,
        comentarios: ['Maravilhosa!', 'Ansiosa pelo conteúdo completo 💜'],
      },
      {
        id: 2,
        titulo: 'Live exclusiva amanhã às 20h 🎥',
        imagem: '/assets/livebanner.jpg',
        curtidas: 55,
        comentarios: ['Estarei lá!', 'Não perco por nada!'],
      },
    ]
    setPosts(conteudoSimulado)
  }, [])

  return (
    <div className="feed-container">
      <h2>Seu Feed Premium 💫</h2>
      {posts.map(post => (
        <CardConteudo key={post.id} {...post} />
      ))}
    </div>
  )
}
