import React, { useState } from 'react'
import ModalAssinatura from '../components/ModalAssinatura'
import './AssinaturaPremium.css'

export default function AssinaturaPremium() {
  const [modalAberta, setModalAberta] = useState(false)

  const planos = [
    {
      id: 1,
      nome: 'Mensal 💜',
      preco: 19.9,
      beneficios: ['Conteúdo exclusivo toda semana', 'ZafyreCoins extras', 'Acesso à loja VIP'],
    },
    {
      id: 2,
      nome: 'Trimestral 💎',
      preco: 49.9,
      beneficios: ['Todos benefícios mensais + bônus de mídia privada'],
    },
  ]

  return (
    <div className="assinatura-container">
      <h2>Assine e Desbloqueie Tudo 🔓</h2>
      <div className="planos-grid">
        {planos.map(plano => (
          <div key={plano.id} className="card-plano">
            <h3>{plano.nome}</h3>
            <p className="preco">R${plano.preco.toFixed(2)}</p>
            <ul>
              {plano.beneficios.map((item, index) => <li key={index}>✅ {item}</li>)}
            </ul>
            <button onClick={() => setModalAberta(true)}>Assinar</button>
          </div>
        ))}
      </div>

      {modalAberta && <ModalAssinatura fechar={() => setModalAberta(false)} />}
    </div>
  )
}
