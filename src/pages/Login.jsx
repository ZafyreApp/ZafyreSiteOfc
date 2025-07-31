import React, { useState } from 'react'
import { loginComEmailSenha } from '../services/firebase'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)

  const autenticar = async () => {
    try {
      await loginComEmailSenha(email, senha)
      window.location.href = '/feed'
    } catch (e) {
      setErro('Credenciais inválidas ou erro de conexão.')
    }
  }

  return (
    <div className="login-container">
      <img src="/assets/logo.png" alt="Zafyre Logo" className="logo" />
      <h2>Bem-vinda ao Zafyre 💜</h2>
      <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Sua senha" value={senha} onChange={e => setSenha(e.target.value)} />
      <button onClick={autenticar}>Entrar</button>
      {erro && <p className="erro">{erro}</p>}
    </div>
  )
}
