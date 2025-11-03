import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useBraceletStore } from '../stores/braceletStore'
import { Layout } from '../components/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import L from 'leaflet'
import { MapPin, AlertCircle } from 'lucide-react'
import type { BraceletEvent } from '../types'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export const MapPage = () => {
  const { t } = useTranslation()
  const locationState = useLocation()
  const { bracelets, recentEvents, fetchBracelets } = useBraceletStore()

  // Get event from navigation state if coming from notifications
  const eventFromState = (locationState.state as any)?.event as BraceletEvent | undefined
  const selectedBraceletId = (locationState.state as any)?.selectedBraceletId as number | undefined

  useEffect(() => {
    fetchBracelets()
  }, [fetchBracelets])

  // Get bracelet locations from last events
  const braceletLocations: Array<{ id: number; name: string; lat: number; lng: number; status: string }> = []

  // If coming from notifications with a specific event, show that
  if (eventFromState && eventFromState.latitude && eventFromState.longitude) {
    const bracelet = bracelets.find((b) => b.id === eventFromState.bracelet_id)
    if (bracelet) {
      braceletLocations.push({
        id: bracelet.id,
        name: bracelet.alias || bracelet.name,
        lat: Number(eventFromState.latitude),
        lng: Number(eventFromState.longitude),
        status: bracelet.status,
      })
    }
  }
  // Otherwise, use all bracelets' last event locations
  else if (selectedBraceletId) {
    const bracelet = bracelets.find((b) => b.id === selectedBraceletId)
    const lastEvent = recentEvents
      .filter((e) => e.bracelet_id === selectedBraceletId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    if (bracelet && lastEvent && lastEvent.latitude && lastEvent.longitude) {
      braceletLocations.push({
        id: bracelet.id,
        name: bracelet.alias || bracelet.name,
        lat: Number(lastEvent.latitude),
        lng: Number(lastEvent.longitude),
        status: bracelet.status,
      })
    }
  }
  // Show all bracelets with recent events
  else {
    bracelets.forEach((bracelet) => {
      const lastEvent = recentEvents
        .filter((e) => e.bracelet_id === bracelet.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      if (lastEvent && lastEvent.latitude && lastEvent.longitude) {
        braceletLocations.push({
          id: bracelet.id,
          name: bracelet.alias || bracelet.name,
          lat: Number(lastEvent.latitude),
          lng: Number(lastEvent.longitude),
          status: bracelet.status,
        })
      }
    })
  }

  const mapCenter: [number, number] = braceletLocations.length > 0
    ? [braceletLocations[0].lat, braceletLocations[0].lng]
    : [48.8566, 2.3522] // Paris default

  const statusColor = {
    active: '#10b981',
    emergency: '#ef4444',
    inactive: '#6b7280',
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('map.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('map.registerBracelets')}
          </p>
        </div>

        {/* Map Container */}
        {braceletLocations.length > 0 ? (
          <Card className="overflow-hidden shadow-lg h-96 md:h-96">
            <MapContainer
              {...({ center: mapCenter } as any)}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                {...({
                  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                } as any)}
              />
              {braceletLocations.map((location) => {
                const customIcon = L.icon({
                  iconUrl: `data:image/svg+xml;base64,${btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="14" fill="${statusColor[location.status as keyof typeof statusColor] || '#6b7280'}" />
                      <circle cx="16" cy="16" r="12" fill="white" opacity="0.3" />
                    </svg>
                  `)}`,
                  iconSize: [32, 32] as [number, number],
                  iconAnchor: [16, 16] as [number, number],
                })
                return (
                  <Marker
                    key={location.id}
                    position={[location.lat, location.lng] as [number, number]}
                    {...{ icon: customIcon } as any}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-slate-900">{location.name}</h3>
                        <p className="text-sm text-slate-600">
                          Statut: <span className={`font-semibold ${
                            location.status === 'active' ? 'text-green-600' :
                            location.status === 'emergency' ? 'text-red-600' :
                            'text-slate-600'
                          }`}>
                            {location.status}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </Card>
        ) : (
          /* No Locations State */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">{t('map.noBracelets')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('map.registerBracelets')}
                  </p>
                  <div className="space-y-3">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <h4 className="font-semibold mb-1">GPS Info</h4>
                        <p className="text-sm">
                          Enable location tracking in bracelet settings
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bracelet List */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">{t('dashboard.bracelet')}</h3>
              <div className="space-y-3">
                {bracelets.map((bracelet) => {
                  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
                    switch (status) {
                      case 'emergency':
                        return 'destructive'
                      case 'active':
                        return 'default'
                      default:
                        return 'secondary'
                    }
                  }

                  return (
                    <Card key={bracelet.id}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {bracelet.alias || bracelet.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{bracelet.unique_code}</p>
                          </div>
                          <Badge variant={getStatusVariant(bracelet.status)}>
                            {bracelet.status === 'active' ? t('dashboard.active') : bracelet.status === 'emergency' ? t('dashboard.emergency') : t('dashboard.inactive')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
