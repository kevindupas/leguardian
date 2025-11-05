import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { eventService, type BraceletEvent } from "../services/eventService";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";
import { getColors } from "../constants/Colors";

export default function NotificationMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);

  const [event, setEvent] = useState<BraceletEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [params.eventId]);

  const fetchEvent = async () => {
    try {
      const eventId = parseInt(params.eventId as string);
      const data = await eventService.getAllEvents();
      const foundEvent = data.data?.find((e) => e.id === eventId);

      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        Alert.alert(t("common.error"), "Événement introuvable");
        router.back();
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), "Impossible de charger l'événement");
      console.error(error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!event || !event.bracelet_id) return;

    setResponding(true);
    try {
      await eventService.sendResponse(event.bracelet_id, event.id);
      Alert.alert(
        t("common.success"),
        `${t("notifications.pingSent")} ${
          event.bracelet?.alias || event.bracelet?.unique_code || "Bracelet"
        }`,
        [{ text: t("common.ok"), onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.response?.data?.message || t("password.error"),
        [{ text: t("common.ok") }]
      );
    } finally {
      setResponding(false);
    }
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
        return "checkmark-circle";
      default:
        return "information-circle";
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.white }]}
        edges={["left", "right"]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.white }]}
        edges={["left", "right"]}
      >
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            Événement introuvable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasLocation = event.latitude && event.longitude;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.white }]}
      edges={["left", "right", "top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.mediumBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {event.bracelet?.alias || event.bracelet?.unique_code || "Bracelet"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map */}
      {hasLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: parseFloat(event.latitude as any),
            longitude: parseFloat(event.longitude as any),
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker
            coordinate={{
              latitude: parseFloat(event.latitude as any),
              longitude: parseFloat(event.longitude as any),
            }}
            title={
              event.bracelet?.alias || event.bracelet?.unique_code || "Bracelet"
            }
            pinColor={getEventTypeColor(event.event_type)}
          />
        </MapView>
      ) : (
        <View style={[styles.noMapContainer, { backgroundColor: colors.lightBg }]}>
          <Ionicons
            name="location"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.noMapText, { color: colors.textSecondary }]}>
            {t("eventDetails.noLocation")}
          </Text>
        </View>
      )}

      {/* Event Details */}
      <ScrollView
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Type Badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: getEventTypeColor(event.event_type) + "20" },
          ]}
        >
          <Ionicons
            name={getEventTypeIcon(event.event_type) as any}
            size={20}
            color={getEventTypeColor(event.event_type)}
          />
          <Text
            style={[
              styles.badgeText,
              { color: getEventTypeColor(event.event_type) },
            ]}
          >
            {getEventTypeLabel(event.event_type)}
          </Text>
        </View>

        {/* Location Info */}
        {hasLocation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="location"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t("eventDetails.location")}
              </Text>
            </View>
            <Text style={[styles.coordinates, { color: colors.textPrimary }]}>
              {parseFloat(event.latitude as any).toFixed(6)}°,{" "}
              {parseFloat(event.longitude as any).toFixed(6)}°
            </Text>
            {event.accuracy && (
              <Text style={[styles.accuracy, { color: colors.textSecondary }]}>
                {t("eventDetails.precision")}: ±{Math.round(parseFloat(event.accuracy as any))}m
              </Text>
            )}
          </View>
        )}

        {/* Battery Info */}
        {event.battery_level !== undefined && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="battery-full"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t("eventDetails.battery")}
              </Text>
            </View>
            <Text style={[styles.batteryLevel, { color: colors.success }]}>
              {event.battery_level}%
            </Text>
          </View>
        )}

        {/* Time Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("eventDetails.date")}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.textPrimary }]}>
            {new Date(event.created_at).toLocaleString("fr-FR")}
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      {!event.resolved && (
        <SafeAreaView
          style={[styles.actionContainer, { borderTopColor: colors.mediumBg }]}
          edges={["left", "right", "bottom"]}
        >
          <TouchableOpacity
            style={[
              styles.respondButton,
              { backgroundColor: colors.primary },
              responding && styles.respondButtonLoading,
            ]}
            onPress={handleRespond}
            disabled={responding}
          >
            {responding ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={18}
                  color={colors.white}
                />
                <Text style={styles.respondButtonText}>
                  {t("notifications.sendSignal")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  map: {
    flex: 1,
  },
  noMapContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  noMapText: {
    fontSize: 14,
    marginTop: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
  },
  detailsContainer: {
    flex: 0.4,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  coordinates: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 28,
  },
  accuracy: {
    fontSize: 12,
    marginLeft: 28,
    marginTop: 4,
  },
  batteryLevel: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 28,
  },
  time: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 28,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  respondButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  respondButtonLoading: {
    opacity: 0.6,
  },
  respondButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
