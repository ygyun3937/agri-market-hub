// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AnalysisPage from './pages/AnalysisPage'
import ProductsAnalysisPage from './pages/ProductsAnalysisPage'
import MarketsAnalysisPage from './pages/MarketsAnalysisPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/analysis/products" element={<ProductsAnalysisPage />} />
        <Route path="/analysis/markets" element={<MarketsAnalysisPage />} />
      </Routes>
    </BrowserRouter>
  )
}
