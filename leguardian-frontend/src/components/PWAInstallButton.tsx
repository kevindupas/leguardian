import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '../hooks/usePWA'

export const PWAInstallButton = () => {
  const { isInstallable, installApp } = usePWA()

  if (!isInstallable) {
    return null
  }

  return (
    <Button
      onClick={installApp}
      size="sm"
      variant="outline"
      title="Install LeGuardian as an app"
      className="gap-2 hidden sm:flex"
    >
      <Download className="w-4 h-4" />
      Install App
    </Button>
  )
}
