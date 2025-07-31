import React, { useState, useEffect } from 'react'
import { formatarMoeda } from '../utils/formatarMoeda'
import './CarteiraZafyreCoins.css'

export default function CarteiraZafyreCoins() {
  const [saldo, setSaldo] = useState(2340.75)
  const [historico, setHistorico] = useState([])

  useEffect(() => {
    // Histórico simulado
    setHistorico([
      { id: 1, descricao: 'Venda de conteúdo VIP', valor: 49.9 },
      { id: 2, descricao: 'Assinatura mensal recebida', valor: 19.9 },
      { id: 3, descricao: 'Bônus de engajamento semanal', valor: 30.0 },
    ])
  }, [])

  const sacarValor = () => {
    alert('Saque solicitado! Redirecionando para Mercado Pago...')
  }

  return (
    <div className="carteira-container">
      <h2>💎 Sua Carteira Zafyre</h2>
      <p className="saldo">Saldo disponível: <strong>{formatarMoeda(saldo)}</strong></p>
      <button onClick={sacarValor}>Sacar via Mercado Pago</button>
      <h3>📜 Histórico de Ganhos</h3>
      <ul className="historico-lista">
        {historico.map(item => (
          <li key={item.id}>
            {item.descricao}: <span>{formatarMoeda(item.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
