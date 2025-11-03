import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

export const useAuth = () => {
  const navigate = useNavigate()
  const store = useAuthStore()

  const logout = async () => {
    await store.logout()
    navigate('/login')
  }

  const isAuthenticated = !!store.token && !!store.user

  return {
    user: store.user,
    token: store.token,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout,
    isAuthenticated,
    clearError: store.clearError,
  }
}
