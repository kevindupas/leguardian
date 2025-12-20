import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { eventService, type BraceletEvent } from "../../services/eventService";
import { useTheme } from "../../contexts/ThemeContext";
import { useI18n } from "../../contexts/I18nContext";
import { getColors } from "../../constants/Colors";
// Import du nouveau composant
import { NotificationFilterBottomSheet } from "../../components/NotificationFilterBottomSheet";
import { useWebSocket } from "../../contexts/WebSocketContext";

export default function NotificationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);
  const params = useLocalSearchParams();
  const { isConnected, subscribeToAllBracelets, unsubscribeFromAllBracelets } = useWebSocket();

  // States
  const [events, setEvents] = useState<BraceletEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "arrived" | "lost" | "danger"
  >("all");
  const [selectedBraceletId, setSelectedBraceletId] = useState<number | null>(
    null
  );
  const [allBracelets, setAllBracelets] = useState<
    Array<{ id: number; alias: string; unique_code: string }>
  >([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "archives">("pending");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (params.braceletId) {
      setSelectedBraceletId(parseInt(params.braceletId as string));
    }
  }, [params.braceletId]);

  useEffect(() => {
    fetchEvents();
  }, [filterType, selectedBraceletId]);

  // Subscribe to WebSocket updates instead of polling
  useEffect(() => {
    if (isConnected) {
      console.log('[NotificationsScreen] WebSocket connected, subscribing to bracelet updates');
      subscribeToAllBracelets((update) => {
        console.log('[NotificationsScreen] Received bracelet update via WebSocket, refreshing events');
        fetchEvents();
      });
    }

    return () => {
      unsubscribeFromAllBracelets();
    };
  }, [isConnected, subscribeToAllBracelets, unsubscribeFromAllBracelets]);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      let filteredEvents = (data.data || []).filter(
        (e) => e.event_type !== "heartbeat"
      );

      const uniqueBracelets = Array.from(
        new Map(
          filteredEvents
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

      if (filterType !== "all") {
        filteredEvents = filteredEvents.filter(
          (e) => e.event_type === filterType
        );
      }
      if (selectedBraceletId !== null) {
        filteredEvents = filteredEvents.filter(
          (e) => e.bracelet_id === selectedBraceletId
        );
      }

      setEvents(filteredEvents);
    } catch (error) {
      console.log("Error fetching events:", error);
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
      Alert.alert(t("common.success"), t("notifications.pingSent"));
      fetchEvents();
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message);
    } finally {
      setRespondingId(null);
    }
  };

  const handleViewOnMap = (event: BraceletEvent) => {
    if (!event.latitude || !event.longitude) {
      Alert.alert(t("common.error"), t("eventDetails.noLocation"));
      return;
    }
    router.push({
      pathname: "/(tabs)/map-view",
      params: { braceletId: event.bracelet_id.toString() },
    });
  };

  // Helpers UI
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
        return t("eventTypes.danger");
      case "lost":
        return t("eventTypes.lost");
      case "arrived":
        return t("eventTypes.arrived");
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
        return "location";
      default:
        return "notifications";
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} h`;
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const renderEvent = ({ item }: { item: BraceletEvent }) => {
    const color = getEventTypeColor(item.event_type);

    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
            <Ionicons
              name={getEventTypeIcon(item.event_type) as any}
              size={20}
              color={color}
            />
          </View>

          <View style={styles.headerTexts}>
            <View style={styles.titleRow}>
              <Text style={[styles.eventType, { color: colors.textPrimary }]}>
                {getEventTypeLabel(item.event_type)}
              </Text>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <Text
              style={[styles.braceletName, { color: colors.textSecondary }]}
            >
              {item.bracelet?.alias ||
                item.bracelet?.unique_code ||
                "Appareil inconnu"}
            </Text>
          </View>
        </View>

        <View
          style={[styles.detailsContainer, { backgroundColor: colors.lightBg }]}
        >
          {item.latitude && (
            <View style={styles.detailItem}>
              <Ionicons
                name="navigate-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
              >
                {parseFloat(item.latitude as any).toFixed(4)},{" "}
                {parseFloat(item.longitude as any).toFixed(4)}
              </Text>
            </View>
          )}
          {item.battery_level !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons
                name="battery-half"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
              >
                {item.battery_level}%
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.cardActions, { borderTopColor: colors.lightBg }]}>
          {item.latitude && (
            <TouchableOpacity
              style={[
                styles.actionBtnSecondary,
                { borderColor: colors.mediumBg },
              ]}
              onPress={() => handleViewOnMap(item)}
            >
              <Ionicons
                name="map-outline"
                size={16}
                color={colors.textPrimary}
              />
              <Text
                style={[styles.actionBtnText, { color: colors.textPrimary }]}
              >
                Carte
              </Text>
            </TouchableOpacity>
          )}

          {!item.resolved && (
            <TouchableOpacity
              style={[
                styles.actionBtnPrimary,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => handleRespond(item)}
              disabled={respondingId === item.id}
            >
              {respondingId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={16} color="white" />
                  <Text
                    style={{ color: "white", fontWeight: "600", marginLeft: 6 }}
                  >
                    Répondre
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const pendingEvents = events.filter((e) => !e.resolved);
  const resolvedEvents = events.filter((e) => e.resolved);
  const displayedEvents =
    activeTab === "pending" ? pendingEvents : resolvedEvents;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.lightBg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t("notifications.title")}
        </Text>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.white }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name={
              filterType === "all" && selectedBraceletId === null
                ? "filter-outline"
                : "filter"
            }
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabWrapper}>
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.mediumBg + "40" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "pending" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("pending")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "pending"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              En cours ({pendingEvents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "archives" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("archives")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "archives"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Archives
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTE */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {displayedEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.white },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={48}
                color={colors.textSecondary}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
              {activeTab === "pending" ? "Tout est calme" : "Aucune archive"}
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              {activeTab === "pending"
                ? "Vous n'avez aucune notification non lue."
                : "L'historique des notifications est vide."}
            </Text>
          </View>
        ) : (
          displayedEvents.map((event) => (
            <View key={event.id} style={{ marginBottom: 16 }}>
              {renderEvent({ item: event })}
            </View>
          ))
        )}
      </ScrollView>

      {/* NOUVEAU COMPOSANT BOTTOM SHEET */}
      <NotificationFilterBottomSheet
        isVisible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        selectedBraceletId={selectedBraceletId}
        onBraceletChange={setSelectedBraceletId}
        bracelets={allBracelets}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabWrapper: { paddingHorizontal: 20, marginBottom: 16 },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    height: 44,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTexts: { flex: 1, justifyContent: "center" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventType: { fontSize: 16, fontWeight: "700" },
  timeText: { fontSize: 12, fontWeight: "500" },
  braceletName: { fontSize: 13, marginTop: 2 },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 12, fontWeight: "500" },
  cardActions: { flexDirection: "row", gap: 10 },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: "70%",
    lineHeight: 20,
  },
});
