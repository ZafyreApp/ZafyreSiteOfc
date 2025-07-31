import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import FeedPrincipal from './pages/FeedPrincipal'
import PerfilCriadora from './pages/PerfilCriadora'
import LojaDigital from './pages/LojaDigital'
import AssinaturaPremium from './pages/AssinaturaPremium'
import RankingTopZafyre from './pages/RankingTopZafyre'
import CarteiraZafyreCoins from './pages/CarteiraZafyreCoins'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/feed" element={<FeedPrincipal />} />
        <Route path="/perfil" element={<PerfilCriadora />} />
        <Route path="/loja" element={<LojaDigital />} />
        <Route path="/assinatura" element={<AssinaturaPremium />} />
        <Route path="/ranking" element={<RankingTopZafyre />} />
        <Route path="/carteira" element={<CarteiraZafyreCoins />} />
      </Routes>
    </Router>
  )
}
