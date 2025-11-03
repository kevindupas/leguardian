import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, Settings, Plus, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

interface SidebarProps {
  onNavigate?: () => void
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const menuItems = [
    {
      icon: LayoutDashboard,
      labelKey: 'common.dashboard',
      path: '/dashboard',
      badge: null,
    },
    {
      icon: Map,
      labelKey: 'common.map',
      path: '/map',
      badge: null,
    },
    {
      icon: Plus,
      labelKey: 'common.addBracelet',
      path: '/register-bracelet',
      badge: 'new',
    },
    {
      icon: Settings,
      labelKey: 'common.settings',
      path: '/settings',
      badge: null,
    },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="h-full flex flex-col border-r border-border bg-card">
      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  onNavigate?.()
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left">{t(item.labelKey)}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {t(`common.${item.badge}`)}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="bg-secondary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4" />
            <h3 className="font-semibold text-sm text-foreground">{t('common.help')}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {t('settings.documentation')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => navigate('/documentation')}
          >
            {t('common.documentation')}
          </Button>
        </div>
      </div>
    </nav>
  )
}
