import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { useTheme } from '../contexts/ThemeContext'
import { Layout } from '../components/Layout'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Moon, Bell, LogOut, User, Shield, Info, Edit2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [logoutDrawerOpen, setLogoutDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleConfirmLogout = async () => {
    setLogoutDrawerOpen(false)
    await logout()
    navigate('/login')
  }

  const handleLogout = async () => {
    setLogoutDrawerOpen(true)
  }

  const handleSaveProfile = async () => {
    const errors: Record<string, string> = {}

    if (!profileData.name.trim()) {
      errors.name = 'Name is required'
    }
    if (!profileData.email.trim()) {
      errors.email = 'Email is required'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    try {
      // TODO: Call API to update profile
      console.log('Saving profile:', profileData)
      setEditingProfile(false)
      setEditErrors({})
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {}

    if (!passwordData.current.trim()) {
      errors.current = 'Current password is required'
    }
    if (!passwordData.new.trim()) {
      errors.new = 'New password is required'
    }
    if (passwordData.new !== passwordData.confirm) {
      errors.confirm = 'Passwords do not match'
    }
    if (passwordData.new.length < 8) {
      errors.new = 'Password must be at least 8 characters'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    try {
      // TODO: Call API to change password
      console.log('Changing password')
      setChangingPassword(false)
      setPasswordData({ current: '', new: '', confirm: '' })
      setEditErrors({})
    } catch (error) {
      console.error('Failed to change password:', error)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre compte et vos préférences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t('settings.accountInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('settings.name')}
                  </label>
                  <p className="text-foreground font-medium bg-muted rounded-lg p-3 border">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('settings.email')}
                  </label>
                  <p className="text-foreground font-medium bg-muted rounded-lg p-3 border">{user?.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setProfileData({ name: user?.name || '', email: user?.email || '' })
                      setEditingProfile(true)
                      setEditErrors({})
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setChangingPassword(true)
                      setPasswordData({ current: '', new: '', confirm: '' })
                      setEditErrors({})
                    }}
                  >
                    {t('settings.security')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.preferences')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg border hover:border-primary/50 transition-all gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
                      <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-xs sm:text-sm font-semibold text-foreground truncate">
                        {t('common.darkMode')}
                      </label>
                      <p className="text-xs text-muted-foreground hidden sm:block">Activer le thème sombre</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 sm:h-8 sm:w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                      theme === 'dark' ? 'bg-primary' : 'bg-input'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-background transition-transform ${
                        theme === 'dark' ? 'translate-x-5 sm:translate-x-7' : 'translate-x-0.5 sm:translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Notifications Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg border hover:border-primary/50 transition-all gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-xs sm:text-sm font-semibold text-foreground truncate">
                        {t('settings.notifications')}
                      </label>
                      <p className="text-xs text-muted-foreground hidden sm:block">Recevoir les alertes de vos bracelets</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`relative inline-flex h-6 w-11 sm:h-8 sm:w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                      notificationsEnabled ? 'bg-primary' : 'bg-input'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-background transition-transform ${
                        notificationsEnabled ? 'translate-x-5 sm:translate-x-7' : 'translate-x-0.5 sm:translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="w-5 h-5" />
                  {t('settings.security')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  These actions are irreversible. Be careful.
                </p>
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('settings.logout')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  {t('settings.about')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    {t('settings.version')}
                  </p>
                  <p className="text-lg font-bold text-foreground">v1.0.0</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Copyright
                  </p>
                  <p className="text-sm text-foreground">
                    © 2025 {t('common.appName')}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {t('settings.status')}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-foreground">All systems operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('common.help')}?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Consultez notre documentation pour plus d'informations sur l'utilisation de LeGuardian.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    /* TODO: Link to documentation */
                  }}
                >
                  {t('common.help')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('common.edit')} {t('settings.accountInfo')}</DialogTitle>
              <DialogDescription>Update your profile information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('settings.name')}
                </label>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your name"
                />
                {editErrors.name && <p className="text-xs text-destructive mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('settings.email')}
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="your@email.com"
                />
                {editErrors.email && <p className="text-xs text-destructive mt-1">{editErrors.email}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProfile(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveProfile}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={changingPassword} onOpenChange={setChangingPassword}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Update your password to keep your account secure</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  placeholder="Enter current password"
                />
                {editErrors.current && <p className="text-xs text-destructive mt-1">{editErrors.current}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  placeholder="Enter new password (min 8 characters)"
                />
                {editErrors.new && <p className="text-xs text-destructive mt-1">{editErrors.new}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  placeholder="Confirm new password"
                />
                {editErrors.confirm && <p className="text-xs text-destructive mt-1">{editErrors.confirm}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangingPassword(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleChangePassword}>
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout Confirmation Drawer */}
        {isMobile && (
          <Drawer open={logoutDrawerOpen} onOpenChange={setLogoutDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t('settings.logout')}</DrawerTitle>
                <DrawerDescription>{t('settings.logoutConfirm')}</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLogoutDrawerOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => handleConfirmLogout()}
                >
                  <LogOut className="w-4 h-4" />
                  {t('settings.logout')}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </Layout>
  )
}
