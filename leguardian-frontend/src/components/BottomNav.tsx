import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, Settings, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NavItem {
  path: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  translationKey: string
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    translationKey: 'common.dashboard',
  },
  {
    path: '/notifications',
    icon: Bell,
    label: 'Notifications',
    translationKey: 'notifications.title',
  },
  {
    path: '/map',
    icon: Map,
    label: 'Map',
    translationKey: 'common.map',
  },
  {
    path: '/settings',
    icon: Settings,
    label: 'Settings',
    translationKey: 'common.settings',
  },
]

export const BottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border pb-safe safe-px">
      <div className="flex items-center justify-around h-16 px-1 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-colors ${
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{t(item.translationKey)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
