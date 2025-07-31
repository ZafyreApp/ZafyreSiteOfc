import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import AvatarForm from './pages/AvatarForm'
import Cards from './pages/Cards'
import CardsForm from './pages/CardsForm'
import Settings from './pages/Settings'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/avatar-form" element={<AvatarForm />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/cards-form" element={<CardsForm />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}

export default App
