import React, { useEffect, useState } from 'react'
import './RankingTopZafyre.css'

export default function RankingTopZafyre() {
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    // Simulação temporária dos dados
    const criadorasTop = [
      {
        id: 1,
        nome: 'Gabi Sensual 💜',
        avatar: '/assets/criadora1.jpg',
        destaque: 'Mais vendida',
        metricas: 'R$2.340 em vendas no mês',
      },
      {
        id: 2,
        nome: 'Ana VIP 👑',
        avatar: '/assets/criadora2.jpg',
        destaque: 'Mais curtidas',
        metricas: '876 curtidas em conteúdos premium',
      },
      {
        id: 3,
        nome: 'Luna 🔥',
        avatar: '/assets/criadora3.jpg',
        destaque: 'Mais assinantes',
        metricas: '112 novas assinaturas',
      },
    ]
    setRanking(criadorasTop)
  }, [])

  return (
    <div className="ranking-container">
      <h2>🌟 Top Zafyre da Semana</h2>
      <div className="grid-ranking">
        {ranking.map(criadora => (
          <div key={criadora.id} className="card-ranking">
            <img src={criadora.avatar} alt={criadora.nome} className="avatar-ranking" />
            <h3>{criadora.nome}</h3>
            <p>{criadora.destaque}</p>
            <p className="metricas">{criadora.metricas}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
