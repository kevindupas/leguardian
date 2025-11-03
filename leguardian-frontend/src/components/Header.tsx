import React, { useState } from 'react'
import { Menu, Zap, Moon, Sun, LogOut, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  onMenuClick?: () => void
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const

export const Header = ({ onMenuClick, sidebarOpen, onSidebarToggle }: HeaderProps) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setLanguageDrawerOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section - Logo and Brand */}
        <div className="flex items-center gap-3 flex-1">
          {/* Menu Toggle - Desktop Only */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick || onSidebarToggle}
            className="hidden md:flex"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-lg font-bold text-foreground">{t('common.appName')}</h1>
              <p className="text-xs text-muted-foreground">Safety First</p>
            </div>
          </div>
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/notifications')}
            title={t('notifications.title') || 'Notifications'}
          >
            <Bell className="w-5 h-5" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* Language Selector - Desktop Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={t('common.language')} className="hidden md:flex">
                {LANGUAGES.find((lang) => lang.code === i18n.language)?.flag || '🌐'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className="cursor-pointer gap-2"
                >
                  <span className="text-lg">{lang.flag}</span>
                  {lang.label}
                  {i18n.language === lang.code && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Selector - Mobile Drawer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguageDrawerOpen(true)}
            title={t('common.language')}
            className="md:hidden"
          >
            {LANGUAGES.find((lang) => lang.code === i18n.language)?.flag || '🌐'}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2">
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

      {/* Language Drawer - Mobile Only */}
      {isMobile && (
        <Drawer open={languageDrawerOpen} onOpenChange={setLanguageDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('common.language')}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto space-y-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-primary/10 border border-primary'
                      : 'border border-border hover:bg-secondary/50'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-foreground">{lang.label}</span>
                  {i18n.language === lang.code && <span className="ml-auto text-primary">✓</span>}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
