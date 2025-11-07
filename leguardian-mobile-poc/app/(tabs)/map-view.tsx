import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { eventService, type BraceletEvent } from "../../services/eventService";
import { braceletService, type Bracelet } from "../../services/braceletService";
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { getColors } from '../../constants/Colors';
import { EventTimeline, type EventTimelineItem } from "../../components/EventTimeline";

export default function MapViewScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);
  const params = useLocalSearchParams();
  const mapViewRef = useRef<MapView>(null);
  const [events, setEvents] = useState<BraceletEvent[]>([]);
  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BraceletEvent | null>(
    null
  );
  const [filterType, setFilterType] = useState<
    "all" | "arrived" | "lost" | "danger"
  >("all");
  const [selectedBraceletId, setSelectedBraceletId] = useState<number | null>(
    params.braceletId ? parseInt(params.braceletId as string) : null
  );
  const [allBracelets, setAllBracelets] = useState<
    Array<{ id: number; alias: string; unique_code: string }>
  >([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [heartbeatEvents, setHeartbeatEvents] = useState<BraceletEvent[]>([]);

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

  // Load bracelets on mount
  useEffect(() => {
    loadBracelets();
  }, []);

  // Poll for bracelet updates every 5 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await braceletService.getBracelets();
        setBracelets(data);
      } catch (error) {
        // Silently fail on polling errors
        console.log('[MapViewScreen] Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    fetchUnresolvedEvents();
  }, [filterType, selectedBraceletId]);

  // Poll for event updates every 5 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await eventService.getAllEvents();
        // Filter only events with location data
        let eventsWithLocation = (data.data || []).filter(
          (e) =>
            e.latitude !== null &&
            e.latitude !== undefined &&
            e.longitude !== null &&
            e.longitude !== undefined
        );

        // Separate heartbeat events from other events
        const allHeartbeats = eventsWithLocation
          .filter((e) => e.event_type === 'heartbeat')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 30); // Last 30 heartbeats

        setHeartbeatEvents(allHeartbeats);

        // Extract unique bracelets from events
        const uniqueBracelets = Array.from(
          new Map(
            eventsWithLocation
              .filter((e) => e.bracelet)
              .map((e) => [
                e.bracelet_id,
                {
                  id: e.bracelet_id,
                  alias:
                    e.bracelet?.alias || e.bracelet?.unique_code || "Bracelet",
                  unique_code: e.bracelet?.unique_code || "",
                },
              ])
          ).values()
        );
        setAllBracelets(uniqueBracelets);

        // Apply filters (exclude heartbeats from main event list)
        let filtered = eventsWithLocation.filter((e) => e.event_type !== 'heartbeat');
        if (filterType !== "all") {
          filtered = filtered.filter((e) => e.event_type === filterType);
        }
        if (selectedBraceletId !== null) {
          filtered = filtered.filter((e) => e.bracelet_id === selectedBraceletId);
        }

        setEvents(filtered);
      } catch (error) {
        // Silently fail on polling errors
        console.log('[MapViewScreen] Event polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [filterType, selectedBraceletId]);

  const loadBracelets = async () => {
    try {
      const data = await braceletService.getBracelets();
      setBracelets(data);
    } catch (error) {
      console.error('Failed to load bracelets:', error);
    }
  };

  const fetchUnresolvedEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      // Filter only events with location data
      let eventsWithLocation = (data.data || []).filter(
        (e) =>
          e.latitude !== null &&
          e.latitude !== undefined &&
          e.longitude !== null &&
          e.longitude !== undefined
      );

      // Extract unique bracelets from events
      const uniqueBracelets = Array.from(
        new Map(
          eventsWithLocation
            .filter((e) => e.bracelet)
            .map((e) => [
              e.bracelet_id,
              {
                id: e.bracelet_id,
                alias:
                  e.bracelet?.alias || e.bracelet?.unique_code || "Bracelet",
                unique_code: e.bracelet?.unique_code || "",
              },
            ])
        ).values()
      );
      setAllBracelets(uniqueBracelets);

      // Apply filters
      let filtered = eventsWithLocation;
      if (filterType !== "all") {
        filtered = filtered.filter((e) => e.event_type === filterType);
      }
      if (selectedBraceletId !== null) {
        filtered = filtered.filter((e) => e.bracelet_id === selectedBraceletId);
      }

      setEvents(filtered);
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
    fetchUnresolvedEvents();
  };

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case "danger":
        return colors.danger;
      case "lost":
        return colors.warning;
      case "arrived":
        return colors.success;
      default:
        return colors.primary;
    }
  };

  const getEventTypeLabel = (type: string): string => {
    switch (type) {
      case "danger":
        return t('eventTypes.danger');
      case "lost":
        return t('eventTypes.lost');
      case "arrived":
        return t('eventTypes.arrived');
      default:
        return type;
    }
  };

  const getEventTypeIcon = (type: string): string => {
    switch (type) {
      case "danger":
        return "alert-circle";
      case "lost":
        return "help-circle";
      case "arrived":
        return "checkmark-circle";
      default:
        return "information-circle";
    }
  };

  const getEventTimelineType = (type: string): 'danger' | 'warning' | 'success' | 'info' => {
    switch (type) {
      case "danger":
        return "danger";
      case "lost":
        return "warning";
      case "arrived":
        return "success";
      default:
        return "info";
    }
  };

  const animateToEvent = (event: BraceletEvent) => {
    if (!event.latitude || !event.longitude || !mapViewRef.current) return;

    mapViewRef.current.animateToRegion(
      {
        latitude: parseFloat(event.latitude as any),
        longitude: parseFloat(event.longitude as any),
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );

    setSelectedEvent(event);
  };

  // Create dynamic styles based on current theme
  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]} edges={["left", "right"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Filter events - only show unresolved
  const displayedEvents = events.filter((e) => !e.resolved);

  // Get the latest event (arrived, lost, danger - not heartbeat)
  const latestEvent = displayedEvents
    .filter((e) => ['arrived', 'lost', 'danger'].includes(e.event_type))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]} edges={["left", "right", "bottom"]}>
      <MapView
        ref={mapViewRef}
        style={styles.fullscreenMap}
        initialRegion={
          displayedEvents.length > 0
            ? {
                latitude: parseFloat(displayedEvents[0].latitude as any),
                longitude: parseFloat(displayedEvents[0].longitude as any),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : {
                latitude: 48.8566,
                longitude: 2.3522,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
      >
        {/* Blue markers for bracelets with normal tracking (heartbeat/no events) */}
        {bracelets.map((bracelet) => {
          // Check if this bracelet has an event on the map
          const hasEvent = displayedEvents.some((e) => e.bracelet_id === bracelet.id);

          // Only show blue marker if bracelet has location and no event
          if (
            !hasEvent &&
            bracelet.last_latitude &&
            bracelet.last_longitude &&
            bracelet.last_latitude !== null &&
            bracelet.last_longitude !== null
          ) {
            return (
              <Marker
                key={`bracelet-${bracelet.id}`}
                coordinate={{
                  latitude: parseFloat(bracelet.last_latitude as any),
                  longitude: parseFloat(bracelet.last_longitude as any),
                }}
                title={bracelet.alias || bracelet.unique_code || "Bracelet"}
                description={`${t('map.trackedBracelet')} - ${new Date(
                  bracelet.updated_at || new Date()
                ).toLocaleString("fr-FR")}`}
                pinColor="#2196F3" // Blue for normal tracking
              />
            );
          }
          return null;
        })}

        {/* Light blue markers for heartbeat trail (last 30 positions) */}
        {heartbeatEvents.map((heartbeat, index) => (
          <Marker
            key={`heartbeat-${heartbeat.id}`}
            coordinate={{
              latitude: parseFloat(heartbeat.latitude as any),
              longitude: parseFloat(heartbeat.longitude as any),
            }}
            title={`${t('map.trackedBracelet')} (${index + 1}/${heartbeatEvents.length})`}
            description={`${new Date(heartbeat.created_at).toLocaleString('fr-FR')}`}
            pinColor="#87CEEB" // Light blue for heartbeat trail
            opacity={0.5 + (index / heartbeatEvents.length) * 0.5} // Fade from light to more opaque
          />
        ))}

        {/* Colored markers for events (danger, lost, arrived) */}
        {displayedEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: parseFloat(event.latitude as any),
              longitude: parseFloat(event.longitude as any),
            }}
            title={
              event.bracelet?.alias ||
              event.bracelet?.unique_code ||
              "Bracelet"
            }
            description={`${getEventTypeLabel(event.event_type)} - ${new Date(
              event.created_at
            ).toLocaleString("fr-FR")}`}
            pinColor={getEventTypeColor(event.event_type)}
            onPress={() => setSelectedEvent(event)}
          />
        ))}
      </MapView>

      {/* Latest Event Card Overlay - Bottom of map */}
      {latestEvent && (
        <View style={[styles.eventCardOverlay, { backgroundColor: colors.white }]}>
          <View style={styles.eventCardContent}>
            <View style={styles.eventCardLeft}>
              <View
                style={[
                  styles.eventCardIcon,
                  {
                    backgroundColor:
                      getEventTypeColor(latestEvent.event_type) + "20",
                  },
                ]}
              >
                <Ionicons
                  name={getEventTypeIcon(latestEvent.event_type) as any}
                  size={20}
                  color={getEventTypeColor(latestEvent.event_type)}
                />
              </View>
              <View style={styles.eventCardInfo}>
                <Text style={[styles.eventCardBraceletName, { color: colors.textPrimary }]}>
                  {latestEvent.bracelet?.alias ||
                    latestEvent.bracelet?.unique_code ||
                    "Bracelet"}
                </Text>
                <Text
                  style={[
                    styles.eventCardType,
                    { color: getEventTypeColor(latestEvent.event_type) },
                  ]}
                >
                  {getEventTypeLabel(latestEvent.event_type)}
                </Text>
              </View>
            </View>

            <View style={styles.eventCardRight}>
              {latestEvent.battery_level !== undefined && (
                <View style={styles.eventCardBattery}>
                  <Ionicons name="battery-full" size={14} color={colors.textSecondary} />
                  <Text style={[styles.eventCardBatteryText, { color: colors.textSecondary }]}>
                    {latestEvent.battery_level}%
                  </Text>
                </View>
              )}
              <TouchableOpacity onPress={() => animateToEvent(latestEvent)}>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Selected Event Detail Modal */}
      {selectedEvent && (
        <>
          <TouchableOpacity
            style={styles.modalBackdropEvent}
            onPress={() => setSelectedEvent(null)}
            activeOpacity={0.5}
          />
          <View style={[styles.eventDetailModal, { backgroundColor: colors.white }]}>
              <View style={[styles.eventDetailHeader, { borderBottomColor: colors.mediumBg }]}>
                <View>
                  <Text style={[styles.eventDetailTitle, { color: colors.textPrimary }]}>
                    {selectedEvent.bracelet?.alias ||
                      selectedEvent.bracelet?.unique_code ||
                      "Bracelet"}
                  </Text>
                  <Text style={[styles.eventDetailType, { color: colors.textSecondary }]}>
                    {getEventTypeLabel(selectedEvent.event_type)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.eventDetailContent} showsVerticalScrollIndicator={false}>
                {/* Event Type Badge */}
                <View
                  style={[
                    styles.eventDetailBadge,
                    { backgroundColor: getEventTypeColor(selectedEvent.event_type) + "20" },
                  ]}
                >
                  <Ionicons
                    name={getEventTypeIcon(selectedEvent.event_type) as any}
                    size={20}
                    color={getEventTypeColor(selectedEvent.event_type)}
                  />
                  <Text
                    style={[
                      styles.eventDetailBadgeText,
                      { color: getEventTypeColor(selectedEvent.event_type) },
                    ]}
                  >
                    {getEventTypeLabel(selectedEvent.event_type)}
                  </Text>
                </View>

                {/* Location Info */}
                <View style={styles.eventDetailSection}>
                  <View style={styles.eventDetailSectionHeader}>
                    <Ionicons name="location" size={18} color={colors.primary} />
                    <Text style={[styles.eventDetailSectionTitle, { color: colors.textPrimary }]}>{t('eventDetails.location')}</Text>
                  </View>
                  <Text style={[styles.eventDetailCoordinates, { color: colors.textPrimary }]}>
                    {parseFloat(selectedEvent.latitude as any).toFixed(6)}°, {parseFloat(selectedEvent.longitude as any).toFixed(6)}°
                  </Text>
                  {selectedEvent.accuracy && (
                    <Text style={[styles.eventDetailAccuracy, { color: colors.textSecondary }]}>
                      {t('eventDetails.precision')}: ±{Math.round(parseFloat(selectedEvent.accuracy as any))}m
                    </Text>
                  )}
                </View>

                {/* Battery Info */}
                {selectedEvent.battery_level !== undefined && (
                  <View style={styles.eventDetailSection}>
                    <View style={styles.eventDetailSectionHeader}>
                      <Ionicons name="battery-full" size={18} color={colors.primary} />
                      <Text style={[styles.eventDetailSectionTitle, { color: colors.textPrimary }]}>{t('eventDetails.battery')}</Text>
                    </View>
                    <Text style={[styles.eventDetailBatteryLevel, { color: colors.success }]}>
                      {selectedEvent.battery_level}%
                    </Text>
                  </View>
                )}

                {/* Time Info */}
                <View style={styles.eventDetailSection}>
                  <View style={styles.eventDetailSectionHeader}>
                    <Ionicons name="time" size={18} color={colors.primary} />
                    <Text style={[styles.eventDetailSectionTitle, { color: colors.textPrimary }]}>{t('eventDetails.date')}</Text>
                  </View>
                  <Text style={[styles.eventDetailTime, { color: colors.textPrimary }]}>
                    {new Date(selectedEvent.created_at).toLocaleString("fr-FR")}
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={[styles.eventDetailActions, { borderTopColor: colors.mediumBg }]}>
                <TouchableOpacity
                  style={[styles.eventDetailButtonSecondary, { borderColor: colors.mediumBg, backgroundColor: colors.white }]}
                  onPress={() => setSelectedEvent(null)}
                >
                  <Text style={[styles.eventDetailButtonSecondaryText, { color: colors.textSecondary }]}>{t('common.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

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

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Event Type Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('map.eventType')}</Text>
                {(["all", "danger", "lost", "arrived"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      { backgroundColor: colors.lightBg, borderColor: colors.mediumBg },
                      filterType === type && { ...styles.filterOptionActive, backgroundColor: '#EBF5FB', borderColor: colors.primary },
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        { color: colors.textSecondary },
                        filterType === type && { ...styles.filterOptionTextActive, color: colors.primary },
                      ]}
                    >
                      {type === "all"
                        ? t('map.allTypes')
                        : getEventTypeLabel(type)}
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
                    <Text
                      style={[
                        styles.filterOptionText,
                        { color: colors.textSecondary },
                        selectedBraceletId === null &&
                          { ...styles.filterOptionTextActive, color: colors.primary },
                      ]}
                    >
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
                        { backgroundColor: colors.lightBg, borderColor: colors.mediumBg },
                        selectedBraceletId === bracelet.id &&
                          { ...styles.filterOptionActive, backgroundColor: '#EBF5FB', borderColor: colors.primary },
                      ]}
                      onPress={() => setSelectedBraceletId(bracelet.id)}
                    >
                      <View style={styles.braceletFilterContent}>
                        <Ionicons
                          name="watch"
                          size={16}
                          color={
                            selectedBraceletId === bracelet.id
                              ? colors.primary
                              : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.filterOptionText,
                            { color: colors.textSecondary },
                            selectedBraceletId === bracelet.id &&
                              { ...styles.filterOptionTextActive, color: colors.primary },
                          ]}
                        >
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

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "column",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    zIndex: 100,
  },
  filterModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
    zIndex: 101,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumBg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
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
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.mediumBg,
  },
  filterOptionActive: {
    backgroundColor: "#EBF5FB",
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  braceletFilterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fullscreenMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Event Detail Modal Styles
  modalBackdropEvent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 150,
  },
  eventDetailModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
    zIndex: 151,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  eventDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumBg,
  },
  eventDetailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  eventDetailType: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 4,
  },
  eventDetailContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  eventDetailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  eventDetailBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  eventDetailSection: {
    marginBottom: 20,
  },
  eventDetailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  eventDetailSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  eventDetailCoordinates: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 28,
  },
  eventDetailAccuracy: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 28,
    marginTop: 6,
  },
  eventDetailBatteryLevel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
    marginLeft: 28,
  },
  eventDetailTime: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 28,
  },
  eventDetailActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumBg,
  },
  eventDetailButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.mediumBg,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  eventDetailButtonSecondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  eventDetailButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  eventDetailButtonPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  // Event Card Overlay Styles
  eventCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  eventCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eventCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardBraceletName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  eventCardType: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventCardBattery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.lightBg,
    borderRadius: 8,
  },
  eventCardBatteryText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
