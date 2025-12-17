import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
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
  const { color, photoUri, refresh } = useBraceletCustomization(id);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);

  // Configuration des statuts
  const statusConfig = {
    safe: { color: colors.success, label: "Actif", icon: "checkmark-circle" },
    warning: {
      color: colors.warning,
      label: "Attention",
      icon: "alert-circle",
    },
    danger: { color: colors.danger, label: "Urgence", icon: "warning" },
  };
  const currentStatus = statusConfig[status];

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* --- HEADER : Avatar, Nom, Batterie --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Avatar avec le même style que la Map */}
          <BraceletAvatar
            braceletName={name}
            color={color}
            photoUri={photoUri}
            size="medium"
          />
          <View style={styles.titleContainer}>
            <Text
              style={[styles.name, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <View style={styles.codeContainer}>
              <Text style={[styles.code, { color: colors.textSecondary }]}>
                ID: {uniqueCode}
              </Text>
              {/* Point de statut */}
              <View
                style={[styles.dot, { backgroundColor: currentStatus.color }]}
              />
              <Text style={[styles.statusText, { color: currentStatus.color }]}>
                {currentStatus.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Batterie Pill */}
        {batteryLevel !== undefined && (
          <View
            style={[
              styles.batteryPill,
              {
                backgroundColor:
                  batteryLevel > 20 ? colors.lightBg : colors.danger + "15",
              },
            ]}
          >
            <Ionicons
              name={batteryLevel > 20 ? "battery-half" : "battery-dead"}
              size={14}
              color={batteryLevel > 20 ? colors.textSecondary : colors.danger}
            />
            <Text
              style={[
                styles.batteryText,
                {
                  color: batteryLevel > 20 ? colors.textPrimary : colors.danger,
                },
              ]}
            >
              {batteryLevel}%
            </Text>
          </View>
        )}
      </View>

      {/* --- BODY : Localisation --- */}
      <View style={styles.body}>
        <View style={[styles.locationRow, { backgroundColor: colors.lightBg }]}>
          <Ionicons
            name={latitude ? "location" : "location-outline"}
            size={16}
            color={latitude ? colors.primary : colors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.locationText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {latitude && longitude
                ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                : t("bracelet.noGeolocation")}
            </Text>
            {lastUpdate && (
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                Mis à jour à{" "}
                {new Date(lastUpdate).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>

          {/* Bouton pour voir plus de détails loc (si dispo) */}
          {latitude && longitude && (
            <TouchableOpacity
              onPress={() => setShowLocationDetails(!showLocationDetails)}
            >
              <Ionicons
                name={showLocationDetails ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Carte de localisation étendue */}
        {showLocationDetails && latitude && longitude && (
          <View style={{ marginTop: 12 }}>
            <LocationCard
              latitude={latitude}
              longitude={longitude}
              accuracy={accuracy}
              lastUpdate={lastUpdate}
              onEdit={onEditLocation}
              onViewOnMap={onViewOnMap}
              title=""
            />
          </View>
        )}
      </View>

      {/* --- FOOTER : Actions --- */}
      <View style={[styles.footer, { borderTopColor: colors.lightBg }]}>
        {/* Bouton Carte */}
        <TouchableOpacity
          style={[styles.actionBtn, { opacity: latitude ? 1 : 0.5 }]}
          onPress={onViewOnMap}
          disabled={!latitude}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="map" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
            Carte
          </Text>
        </TouchableOpacity>

        {/* Bouton Personnaliser */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setIsCustomizationOpen(true)}
        >
          <View style={[styles.iconCircle, { backgroundColor: color + "15" }]}>
            <Ionicons name="brush" size={18} color={color} />
          </View>
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
            Perso
          </Text>
        </TouchableOpacity>

        {/* Bouton Détails / Config */}
        <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.textSecondary + "15" },
            ]}
          >
            <Ionicons
              name="settings-sharp"
              size={18}
              color={colors.textSecondary}
            />
          </View>
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
            Réglages
          </Text>
        </TouchableOpacity>

        {/* Bouton Supprimer (Petit, à droite) */}
        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <BraceletCustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => {
          setIsCustomizationOpen(false);
          refresh();
          onBraceletUpdated?.();
        }}
        braceletId={id}
        braceletName={name}
        onCustomizationSaved={() => {
          setIsCustomizationOpen(false);
          refresh();
          onBraceletUpdated?.();
        }}
      />

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
  container: {
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
    // Ombre douce et moderne
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  titleContainer: {
    justifyContent: "center",
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  code: {
    fontSize: 12,
    fontWeight: "500",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  batteryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 8,
  },
});
