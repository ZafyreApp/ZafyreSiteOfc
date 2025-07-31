import React, { useState } from 'react'
import BotaoZafyre from '../components/BotaoZafyre'
import './LojaDigital.css'

export default function LojaDigital() {
  const [produtos, setProdutos] = useState([
    {
      id: 1,
      nome: 'Pacote VIP 🔥',
      descricao: 'Inclui fotos inéditas, vídeos exclusivos e bônus de ZafyreCoins.',
      preco: 49.9,
      imagem: '/assets/pacotevip.jpg',
    },
    {
      id: 2,
      nome: 'Conteúdo Avulso 💎',
      descricao: '1 vídeo + 3 fotos da última sessão premium.',
      preco: 19.9,
      imagem: '/assets/conteudoavulso.jpg',
    },
  ])

  const comprarProduto = (produtoId) => {
    // Integração com Mercado Pago (em breve)
    alert(`Redirecionando para pagamento do produto ${produtoId}...`)
  }

  return (
    <div className="loja-container">
      <h2>Loja Exclusiva Zafyre 🛍️</h2>
      <div className="grid-produtos">
        {produtos.map(produto => (
          <div key={produto.id} className="card-produto">
            <img src={produto.imagem} alt={produto.nome} className="produto-img" />
            <h3>{produto.nome}</h3>
            <p>{produto.descricao}</p>
            <p className="preco">R${produto.preco.toFixed(2)}</p>
            <BotaoZafyre texto="Comprar Agora" onClick={() => comprarProduto(produto.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
