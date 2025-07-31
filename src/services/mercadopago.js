export const criarPagamento = async (produto) => {
  const url = 'https://api.mercadopago.com/v1/payments'
  const resposta = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_amount: produto.preco,
      description: produto.nome,
      payment_method_id: 'pix', // Pode alterar para cartão, boleto, etc
      payer: {
        email: 'cliente@exemplo.com',
      },
    }),
  })

  const dados = await resposta.json()
  return dados
}
