import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";
import { LocationCard } from "./LocationCard";
import { EditBraceletModal } from "./EditBraceletModal";
import { useBraceletCustomization } from "../hooks/useBraceletCustomization";
import { BraceletAvatar } from "./BraceletAvatar";
import { BraceletCustomizationModal } from "./BraceletCustomizationModal";

interface BraceletCardProps {
  id: number;
  name: string;
  uniqueCode: string;
  latitude?: number;
  longitude?: number;
  batteryLevel?: number;
  accuracy?: number;
  lastUpdate?: string;
  onPress?: () => void;
  onViewOnMap?: () => void;
  onEditLocation?: () => void;
  onBraceletUpdated?: () => void;
  onDelete?: () => void;
  status: "safe" | "warning" | "danger";
}

export const BraceletCard: React.FC<BraceletCardProps> = ({
  id,
  name,
  uniqueCode,
  latitude,
  longitude,
  batteryLevel,
  accuracy,
  lastUpdate,
  onPress,
  onViewOnMap,
  onEditLocation,
  onBraceletUpdated,
  onDelete,
  status,
}) => {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);
  const { color, photoUri } = useBraceletCustomization(id);

  const [showLocation, setShowLocation] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const statusColors = {
    safe: {
      bg: isDark ? "#1e5c3e" : "#E8F8F5",
      icon: "checkmark-circle",
      color: colors.success,
    },
    warning: {
      bg: isDark ? "#5c4a1e" : "#FEF5E7",
      icon: "alert-circle",
      color: colors.warning,
    },
    danger: {
      bg: isDark ? "#5c1e1e" : "#FADBD8",
      icon: "close-circle",
      color: colors.danger,
    },
  };

  const current = statusColors[status];

  return (
    <View>
      <TouchableOpacity activeOpacity={1} style={[styles.card, { backgroundColor: colors.lightBg, borderColor: colors.mediumBg }]}>
        {/* Avatar Badge */}
        <BraceletAvatar
          braceletName={name}
          color={color}
          photoUri={photoUri}
          size="medium"
        />

        {/* Content */}
        <View style={styles.content} pointerEvents="box-none">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.braceletName, { color: colors.textPrimary }]}>{name}</Text>
              <Text style={[styles.uniqueCode, { color: colors.textSecondary }]}>{uniqueCode}</Text>
            </View>
            <View>
              {batteryLevel !== undefined && (
                <View style={styles.stat}>
                  <Ionicons
                    name={batteryLevel > 50 ? "battery-full" : "battery-half"}
                    size={14}
                    color={
                      batteryLevel > 50
                        ? colors.success
                        : colors.warning
                    }
                  />
                  <Text style={[styles.statText, { color: colors.textSecondary }]}>{batteryLevel}%</Text>
                </View>
              )}
              <View style={styles.footer}>
                {lastUpdate && (
                  <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
                    {new Date(lastUpdate).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Location Info Preview */}
          <View style={[styles.locationInfo, { backgroundColor: colors.mediumBg }]}>
            <Ionicons
              name="location"
              size={14}
              color={
                latitude && longitude
                  ? colors.primary
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.coordinates,
                { color: latitude && longitude ? colors.primary : colors.textSecondary },
                !latitude || !longitude ? styles.coordinatesDisabled : {},
              ]}
            >
              {latitude && longitude
                ? `${latitude.toFixed(3)}° N, ${longitude.toFixed(3)}° E`
                : t('bracelet.noGeolocation')}
            </Text>
          </View>

          {/* Footer Stats */}

          {/* Location Action Buttons - Always Visible */}
          <View style={styles.locationButtonsContainer}>
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: colors.lightBg, borderColor: colors.primary }]}
              onPress={() => setIsCustomizationOpen(true)}
            >
              <Ionicons
                name="brush"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.locationButtonText, { color: colors.primary }]}>Personnaliser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.locationButton,
                styles.locationButtonPrimary,
                { backgroundColor: colors.primary },
                !latitude || !longitude ? styles.locationButtonDisabled : {},
              ]}
              onPress={onViewOnMap}
              disabled={!latitude || !longitude}
            >
              <Ionicons
                name="map"
                size={14}
                color={
                  latitude && longitude
                    ? colors.white
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.locationButtonText,
                  styles.locationButtonTextPrimary,
                  { color: colors.white },
                  !latitude || !longitude
                    ? styles.locationButtonTextDisabled
                    : {},
                ]}
              >
                {t('bracelet.map')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.locationButton, { backgroundColor: colors.lightBg, borderColor: colors.primary }]} onPress={onPress}>
              <Ionicons
                name="information-circle"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.locationButtonText, { color: colors.primary }]}>{t('bracelet.details')}</Text>
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          {onDelete && (
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}
              onPress={onDelete}
            >
              <Ionicons
                name="trash"
                size={16}
                color={colors.danger}
              />
              <Text style={[styles.deleteButtonText, { color: colors.danger }]}>{t('bracelet.delete')}</Text>
            </TouchableOpacity>
          )}

          {/* Show More Location Details Button - Only if location data exists */}
          {latitude && longitude && (
            <TouchableOpacity
              style={[styles.showMoreButton, { borderTopColor: colors.mediumBg }]}
              onPress={() => setShowLocation(!showLocation)}
            >
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                {showLocation
                  ? t('bracelet.hideCoordinates')
                  : t('bracelet.showCoordinates')}
              </Text>
              <Ionicons
                name={showLocation ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Location Card */}
      {showLocation && latitude && longitude && (
        <LocationCard
          latitude={latitude}
          longitude={longitude}
          accuracy={accuracy}
          lastUpdate={lastUpdate}
          onEdit={onEditLocation}
          onViewOnMap={onViewOnMap}
          title={`Localisation de ${name}`}
        />
      )}

      {/* Customization Modal */}
      <BraceletCustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        braceletId={id}
        braceletName={name}
        onCustomizationSaved={onBraceletUpdated}
      />

      {/* Edit Bracelet Modal */}
      <EditBraceletModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onBraceletUpdated={() => {
          setIsEditModalOpen(false);
          onBraceletUpdated?.();
        }}
        braceletId={id}
        currentAlias={name}
        currentCode={uniqueCode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
  },
  statusBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  braceletName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  uniqueCode: {
    fontSize: 12,
    fontWeight: "500",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  coordinates: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lastUpdate: {
    fontSize: 11,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationButtonsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
    marginTop: 8,
  },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  locationButtonPrimary: {},
  locationButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  locationButtonTextPrimary: {},
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonTextDisabled: {},
  coordinatesDisabled: {},
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
