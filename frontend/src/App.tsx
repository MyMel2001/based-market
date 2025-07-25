import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GameDetailsPage from './pages/GameDetailsPage'
import DeveloperDashboard from './pages/DeveloperDashboard'
import MyGamesPage from './pages/MyGamesPage'
import ProfilePage from './pages/ProfilePage'
import CreateGamePage from './pages/CreateGamePage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/game/:id" element={<GameDetailsPage />} />
          
          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/my-games" element={
            <ProtectedRoute>
              <MyGamesPage />
            </ProtectedRoute>
          } />
          
          {/* Developer Routes */}
          <Route path="/developer" element={
            <ProtectedRoute requiredRole="DEVELOPER">
              <DeveloperDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/developer/create-game" element={
            <ProtectedRoute requiredRole="DEVELOPER">
              <CreateGamePage />
            </ProtectedRoute>
          } />
          
          {/* 404 */}
          <Route path="*" element={
            <div className="page-container py-16 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
              <p className="text-gray-600">The page you're looking for doesn't exist.</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}

export default App 