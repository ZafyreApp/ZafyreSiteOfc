import React from 'react'
import './ModalAssinatura.css'

export default function ModalAssinatura({ fechar }) {
  const processarAssinatura = () => {
    // Aqui você poderá conectar com Mercado Pago
    alert('Assinatura iniciada! Redirecionando para pagamento...')
    fechar()
  }

  return (
    <div className="modal-assinatura-overlay">
      <div className="modal-assinatura">
        <h3>Confirmar Assinatura Premium 💜</h3>
        <p>Você será direcionada para o pagamento seguro.</p>
        <button onClick={processarAssinatura}>Continuar</button>
        <button className="cancelar" onClick={fechar}>Cancelar</button>
      </div>
    </div>
  )
}
