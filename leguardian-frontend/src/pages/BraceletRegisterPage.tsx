import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBraceletStore } from '../stores/braceletStore'
import { Layout } from '../components/Layout'
import { LoadingSpinner } from '../components'
import type { Bracelet } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, QrCode, Smartphone, RefreshCw, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const BraceletRegisterPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { bracelets, registerBracelet, updateBracelet, isLoading, error } = useBraceletStore()
  const [uniqueCode, setUniqueCode] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [qrInput, setQrInput] = useState('')
  const [registeredBracelet, setRegisteredBracelet] = useState<Bracelet | null>(null)
  const [braceletName, setBraceletName] = useState('')

  const handleRegistration = async (code: string) => {
    try {
      const bracelet = await registerBracelet(code)
      setRegisteredBracelet(bracelet)
      setBraceletName(bracelet.alias || bracelet.name || ``)
      setUniqueCode('')
      setQrInput('')
    } catch (err) {
      console.error('Failed to register bracelet:', err)
    }
  }

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleRegistration(uniqueCode)
  }

  const handleQRScan = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = qrInput.trim()
    if (!code) return
    await handleRegistration(code)
  }

  const handleSaveBraceletName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registeredBracelet) return

    try {
      await updateBracelet(registeredBracelet.id, { alias: braceletName })
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to update bracelet alias:', err)
    }
  }

  if (isLoading && !registeredBracelet) return <LoadingSpinner />

  // Success Screen
  if (registeredBracelet) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('braceletRegister.successTitle')}</h1>
            <p className="text-muted-foreground">{t('braceletRegister.successMessage')}</p>
          </div>

          {/* Card */}
          <Card className="mb-8">
            {/* Info Section */}
            <div className="bg-muted border-b p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Code</p>
                  <p className="text-2xl font-mono font-bold text-foreground">{registeredBracelet.unique_code}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t('dashboard.battery')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full relative overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${registeredBracelet.battery_level}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground w-10">{registeredBracelet.battery_level}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Firmware</p>
                    <p className="text-sm font-bold text-foreground">v{registeredBracelet.firmware_version}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <CardContent className="pt-8">
              <form onSubmit={handleSaveBraceletName} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-3">
                    {t('braceletRegister.enterCode')}
                  </label>
                  <Input
                    type="text"
                    value={braceletName}
                    onChange={(e) => setBraceletName(e.target.value.substring(0, 255))}
                    placeholder="ex: Bracelet enfant"
                    maxLength={255}
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-right">{braceletName.length}/255</p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Button type="submit" disabled={isLoading} className="w-full gap-2" size="lg">
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t('braceletRegister.next')}...
                      </>
                    ) : (
                      <>
                        {t('braceletRegister.next')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="w-full"
                    size="lg"
                  >
                    {t('braceletRegister.back')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  // Initial Registration Screen
  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('braceletRegister.title')}</h1>
          <p className="text-muted-foreground">{t('braceletRegister.selectMode')}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* QR Mode Card */}
          <Card
            className={`cursor-pointer transition-all ${
              !showManualInput ? 'ring-2 ring-primary' : 'hover:border-primary/50'
            }`}
            onClick={() => setShowManualInput(false)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                {t('braceletRegister.qrCode')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('braceletRegister.qrDescription')}</p>
            </CardContent>
          </Card>

          {/* Manual Mode Card */}
          <Card
            className={`cursor-pointer transition-all ${
              showManualInput ? 'ring-2 ring-primary' : 'hover:border-primary/50'
            }`}
            onClick={() => setShowManualInput(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                {t('braceletRegister.manual')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('braceletRegister.manualDescription')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-8">
            {!showManualInput ? (
              /* QR Code Mode */
              <form onSubmit={handleQRScan} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    {t('braceletRegister.scanQR')}
                  </label>
                  <Input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Le code s'affichera ici après scan..."
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">Le code QR de votre bracelet se trouve sur son emballage</p>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !qrInput.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('braceletRegister.scanQR')}...
                    </>
                  ) : (
                    <>
                      {t('braceletRegister.next')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Manual Input Mode */
              <form onSubmit={handleManualRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    {t('braceletRegister.code')}
                  </label>
                  <Input
                    type="text"
                    value={uniqueCode}
                    onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                    placeholder="ex: BR001ABC"
                    maxLength={20}
                    className="font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">Lettres et chiffres (sans espaces)</p>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !uniqueCode.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('braceletRegister.next')}...
                    </>
                  ) : (
                    <>
                      {t('braceletRegister.next')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            {t('braceletRegister.back')}
          </Button>
        </div>

        {/* Help Section */}
        <Alert className="mt-12">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-semibold mb-2">{t('common.help')}?</h3>
            <p className="text-sm">
              Le code du bracelet se trouve sur l'étiquette produit ou sur l'emballage. Assurez-vous de scanner le code QR correctement.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </Layout>
  )
}
