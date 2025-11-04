import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from './components'
import { LoadingSpinner } from './components'

// Lazy load pages for better initial performance
const LoginPage = lazy(() => import('./pages/LoginPage').then(mod => ({ default: mod.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(mod => ({ default: mod.RegisterPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(mod => ({ default: mod.DashboardPage })))
const BraceletRegisterPage = lazy(() => import('./pages/BraceletRegisterPage').then(mod => ({ default: mod.BraceletRegisterPage })))
const MapPage = lazy(() => import('./pages/MapPage').then(mod => ({ default: mod.MapPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(mod => ({ default: mod.SettingsPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(mod => ({ default: mod.NotificationsPage })))

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-bracelet"
            element={
              <ProtectedRoute>
                <BraceletRegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
