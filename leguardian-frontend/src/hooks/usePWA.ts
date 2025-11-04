import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed (iOS)
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstallable(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success('LeGuardian installed successfully!', {
        description: 'You can now use the app offline'
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        toast.success('Installing LeGuardian...', {
          description: 'Check your home screen soon'
        })
      } else {
        toast.info('Installation cancelled', {
          description: 'You can install anytime from the menu'
        })
      }

      // Reset state
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Installation failed:', error)
      toast.error('Installation failed', {
        description: 'Please try again or use the browser menu'
      })
    }
  }

  return {
    isInstallable,
    isInstalled,
    installApp,
    deferredPrompt
  }
}
