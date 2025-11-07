import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { eventService, type BraceletEvent } from '../../services/eventService';
import { braceletService, type Bracelet } from '../../services/braceletService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { getColors } from '../../constants/Colors';

export default function NotificationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);
  const params = useLocalSearchParams();
  const [events, setEvents] = useState<BraceletEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'arrived' | 'lost' | 'danger'>('all');
  const [selectedBraceletId, setSelectedBraceletId] = useState<number | null>(null);
  const [allBracelets, setAllBracelets] = useState<Array<{ id: number; alias: string; unique_code: string }>>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'archives'>('pending');

  // Configure header with filter button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={{ marginRight: 16 }}
        >
          <Ionicons
            name="funnel"
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Update selected bracelet ID when params change
  useEffect(() => {
    if (params.braceletId) {
      setSelectedBraceletId(parseInt(params.braceletId as string));
    }
  }, [params.braceletId]);

  // Fetch events initially and when filters change
  useEffect(() => {
    fetchEvents();
  }, [filterType, selectedBraceletId]);

  // Poll for event updates every 5 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await eventService.getAllEvents();
        let filteredEvents = data.data || [];

        // Extract unique bracelets from events
        const uniqueBracelets = Array.from(
          new Map(
            filteredEvents
              .filter((e) => e.bracelet)
              .map((e) => [
                e.bracelet_id,
                {
                  id: e.bracelet_id,
                  alias: e.bracelet?.alias || e.bracelet?.unique_code || 'Bracelet',
                  unique_code: e.bracelet?.unique_code || '',
                },
              ])
          ).values()
        );
        setAllBracelets(uniqueBracelets);

        // Apply filters
        if (filterType !== 'all') {
          filteredEvents = filteredEvents.filter((e) => e.event_type === filterType);
        }

        if (selectedBraceletId !== null) {
          filteredEvents = filteredEvents.filter((e) => e.bracelet_id === selectedBraceletId);
        }

        setEvents(filteredEvents);
      } catch (error) {
        // Silently fail on polling errors
        console.log('[NotificationsScreen] Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [filterType, selectedBraceletId]);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      let filteredEvents = data.data || [];

      // Extract unique bracelets from events
      const uniqueBracelets = Array.from(
        new Map(
          filteredEvents
            .filter((e) => e.bracelet)
            .map((e) => [
              e.bracelet_id,
              {
                id: e.bracelet_id,
                alias: e.bracelet?.alias || e.bracelet?.unique_code || 'Bracelet',
                unique_code: e.bracelet?.unique_code || '',
              },
            ])
        ).values()
      );
      setAllBracelets(uniqueBracelets);

      // Apply filters
      if (filterType !== 'all') {
        filteredEvents = filteredEvents.filter((e) => e.event_type === filterType);
      }

      if (selectedBraceletId !== null) {
        filteredEvents = filteredEvents.filter((e) => e.bracelet_id === selectedBraceletId);
      }

      setEvents(filteredEvents);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('common.error'));
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleRespond = async (event: BraceletEvent) => {
    if (!event.bracelet_id) return;

    setRespondingId(event.id);
    try {
      await eventService.sendResponse(event.bracelet_id, event.id);

      // Get bracelet name
      const braceletName = event.bracelet?.alias || event.bracelet?.unique_code || 'Bracelet';

      // Show success toast notification
      Alert.alert(
        t('common.success'),
        `${t('notifications.pingSent')} ${braceletName}`,
        [{ text: t('common.ok'), onPress: () => {
          // Refresh events data but stay in pending tab
          fetchEvents();
        }}]
      );

      // Log response action to console (visible in debugger/logs)
      console.log(`✅ Response sent to bracelet: ${braceletName} (Event #${event.id})`);

    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('common.error'),
        [{ text: t('common.ok') }]
      );
      console.error(`❌ Failed to respond to event #${event.id}:`, error);
    } finally {
      setRespondingId(null);
    }
  };

  const handleViewOnMap = (event: BraceletEvent) => {
    if (!event.latitude || !event.longitude) {
      Alert.alert(t('common.error'), t('eventDetails.noLocation'));
      return;
    }
    // Navigate to custom notification map page
    router.push({
      pathname: '/notification-map',
      params: {
        eventId: event.id.toString(),
      },
    });
  };

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'danger':
        return colors.danger;
      case 'lost':
        return colors.warning;
      case 'arrived':
        return colors.success;
      default:
        return colors.primary;
    }
  };

  const getEventTypeLabel = (type: string): string => {
    switch (type) {
      case 'danger':
        return t('eventTypes.danger');
      case 'lost':
        return t('eventTypes.lost');
      case 'arrived':
        return t('eventTypes.arrived');
      default:
        return type;
    }
  };

  const getEventTypeIcon = (type: string): string => {
    switch (type) {
      case 'danger':
        return 'alert-circle';
      case 'lost':
        return 'help-circle';
      case 'arrived':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR');
  };

  const renderEvent = ({ item }: { item: BraceletEvent }) => (
    <View style={[styles.eventCard, { backgroundColor: colors.white, borderLeftColor: getEventTypeColor(item.event_type) }]}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTitleSection}>
          <View
            style={[
              styles.eventTypeIcon,
              { backgroundColor: getEventTypeColor(item.event_type) + '20' },
            ]}
          >
            <Ionicons
              name={getEventTypeIcon(item.event_type) as any}
              size={20}
              color={getEventTypeColor(item.event_type)}
            />
          </View>
          <View style={styles.eventInfo}>
            <Text style={[styles.eventType, { color: colors.textPrimary }]}>{getEventTypeLabel(item.event_type)}</Text>
            <Text style={[styles.braceletName, { color: colors.textSecondary }]}>
              {item.bracelet?.alias || item.bracelet?.unique_code || 'Bracelet'}
            </Text>
            <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Event Details */}
      <View style={styles.eventDetails}>
        {item.latitude !== null && item.latitude !== undefined && item.longitude !== null && item.longitude !== undefined && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {parseFloat(item.latitude as any).toFixed(4)}, {parseFloat(item.longitude as any).toFixed(4)}
            </Text>
          </View>
        )}
        {item.battery_level !== undefined && (
          <View style={styles.detailRow}>
            <Ionicons name="battery-half" size={14} color={colors.warning} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Batterie: {item.battery_level}%</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {item.latitude && item.longitude && (
          <TouchableOpacity
            style={[styles.mapButton, { borderColor: colors.primary, backgroundColor: '#EBF5FB' }]}
            onPress={() => handleViewOnMap(item)}
          >
            <Ionicons name="map" size={16} color={colors.primary} />
            <Text style={[styles.mapButtonText, { color: colors.primary }]}>{t('notifications.viewOnMap')}</Text>
          </TouchableOpacity>
        )}
        {!item.resolved && (
          <TouchableOpacity
            style={[styles.respondButton, { backgroundColor: colors.success }, respondingId === item.id && styles.respondButtonLoading]}
            onPress={() => handleRespond(item)}
            disabled={respondingId === item.id}
          >
            {respondingId === item.id ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="send" size={16} color={colors.white} />
                <Text style={[styles.respondButtonText, { color: colors.white }]}>{t('notifications.respond')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.lightBg }]} edges={['left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const pendingEvents = events.filter((e) => !e.resolved);
  const resolvedEvents = events.filter((e) => e.resolved);
  const displayedEvents = activeTab === 'pending' ? pendingEvents : resolvedEvents;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.lightBg }]} edges={['left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header with Tabs */}
        <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.mediumBg }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('notifications.title')}</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: colors.white, borderBottomColor: colors.mediumBg }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && { ...styles.tabActive, borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'pending' && { ...styles.tabTextActive, color: colors.primary }]}>
              {t('notifications.unresolved')} ({pendingEvents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'archives' && { ...styles.tabActive, borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('archives')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'archives' && { ...styles.tabTextActive, color: colors.primary }]}>
              {t('notifications.archives')} ({resolvedEvents.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        {displayedEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'pending' ? t('notifications.noUnresolved') : t('notifications.noArchives')}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {activeTab === 'pending'
                ? t('notifications.alertsHere')
                : t('notifications.respondedHere')}
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {displayedEvents.map((event, index) => (
              <View key={event.id}>
                {renderEvent({ item: event } as any)}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      {showFilterModal && (
        <>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowFilterModal(false)}
            activeOpacity={0.5}
          />

          {/* Modal Content */}
          <View style={[styles.filterModal, { backgroundColor: colors.white }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.mediumBg }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('map.filterEvents')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Event Type Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('map.eventType')}</Text>
                {(['all', 'danger', 'lost', 'arrived'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      { backgroundColor: colors.lightBg, borderColor: colors.mediumBg },
                      filterType === type && { ...styles.filterOptionActive, backgroundColor: '#EBF5FB', borderColor: colors.primary },
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: colors.textSecondary },
                      filterType === type && { ...styles.filterOptionTextActive, color: colors.primary },
                    ]}>
                      {type === 'all' ? t('map.allTypes') : getEventTypeLabel(type)}
                    </Text>
                    {filterType === type && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bracelet Section */}
              {allBracelets.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('map.bracelets')}</Text>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      { backgroundColor: colors.lightBg, borderColor: colors.mediumBg },
                      selectedBraceletId === null && { ...styles.filterOptionActive, backgroundColor: '#EBF5FB', borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedBraceletId(null)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: colors.textSecondary },
                      selectedBraceletId === null && { ...styles.filterOptionTextActive, color: colors.primary },
                    ]}>
                      {t('map.allBracelets')}
                    </Text>
                    {selectedBraceletId === null && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  {allBracelets.map((bracelet) => (
                    <TouchableOpacity
                      key={bracelet.id}
                      style={[
                        styles.filterOption,
                        selectedBraceletId === bracelet.id && styles.filterOptionActive,
                      ]}
                      onPress={() => setSelectedBraceletId(bracelet.id)}
                    >
                      <View style={styles.braceletFilterContent}>
                        <Ionicons name="watch" size={16} color={selectedBraceletId === bracelet.id ? colors.primary : colors.textSecondary} />
                        <Text style={[
                          styles.filterOptionText,
                          selectedBraceletId === bracelet.id && styles.filterOptionTextActive,
                        ]}>
                          {bracelet.alias}
                        </Text>
                      </View>
                      {selectedBraceletId === bracelet.id && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 100,
  },
  filterModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  filterSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  filterOptionActive: {
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterOptionTextActive: {
    fontWeight: '700',
  },
  braceletFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventCard: {
    borderRadius: 14,
    borderLeftWidth: 4,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  eventHeader: {
    marginBottom: 10,
  },
  eventTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventTypeIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '700',
  },
  braceletName: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 11,
    marginTop: 2,
  },
  eventDetails: {
    marginBottom: 10,
    paddingLeft: 52,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 52,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  respondButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  respondButtonLoading: {
    opacity: 0.7,
  },
  respondButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
  },
});
