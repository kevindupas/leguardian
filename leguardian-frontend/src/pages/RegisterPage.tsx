import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Zap, User, Mail, Lock, AlertCircle, ArrowRight, RefreshCw, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuth()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [validationError, setValidationError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) clearError()
    if (validationError) setValidationError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (formData.password !== formData.password_confirmation) {
      setValidationError(t('register.errorPasswordMismatch'))
      return
    }

    if (formData.password.length < 8) {
      setValidationError(t('register.passwordHint'))
      return
    }

    try {
      await register(formData)
      navigate('/dashboard')
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-4">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">{t('common.appName')}</h1>
          <p className="text-muted-foreground text-sm mt-2">Safety First</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {(error || validationError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('register.errorRequired')}</AlertTitle>
                <AlertDescription>{error || validationError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('register.name')}
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Jean Dupont"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t('register.email')}
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="name@example.com"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('register.password')}
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {t('register.passwordHint')}
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('register.confirmPassword')}
                </label>
                <Input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 mt-6"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('register.createAccount')}...
                  </>
                ) : (
                  <>
                    {t('register.createAccount')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('register.haveAccount')}</span>
              </div>
            </div>

            {/* Login Link */}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full"
              size="lg"
            >
              {t('login.signIn')}
            </Button>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-6 p-4 bg-secondary border border-border rounded-lg">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {t('register.security')}
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              {t('register.dataEncrypted')}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              {t('register.gdprCompliant')}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              {t('register.secureAuth')}
            </li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs mt-6">
          © 2025 {t('common.appName')}
        </p>
      </div>
    </div>
  )
}
