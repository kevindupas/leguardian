import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bracelet } from "../services/braceletService";
import { getColors } from "../constants/Colors";

const CARD_WIDTH = Dimensions.get("window").width * 0.85;

interface BraceletMapCardProps {
  item: Bracelet;
  isSelected: boolean; // Pas utilisé pour le style pour éviter les sauts
  onPress: () => void;
  customization?: { color: string; photoUri?: string };
  isDark: boolean;
}

export const BraceletMapCard: React.FC<BraceletMapCardProps> = ({
  item,
  onPress,
  customization,
  isDark,
}) => {
  const colors = getColors(isDark);
  // Couleur du bracelet (ou couleur par défaut)
  const color = customization?.color || colors.primary;
  const initials = (item.alias || item.unique_code || "B")
    .substring(0, 2)
    .toUpperCase();

  const lat = item.last_latitude
    ? parseFloat(item.last_latitude as any).toFixed(5)
    : "--";
  const lng = item.last_longitude
    ? parseFloat(item.last_longitude as any).toFixed(5)
    : "--";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.cardContainer, { backgroundColor: colors.white }]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        {/* C'EST ICI QUE ÇA SE PASSE */}
        <View
          style={[
            styles.avatarContainer,
            {
              backgroundColor: color + "15", // Fond très léger teinté
              borderColor: color, // <-- LA COULEUR DU BRACELET
              borderWidth: 2, // <-- ÉPAISSEUR FIXE (Visible et stable)
            },
          ]}
        >
          {customization?.photoUri ? (
            <Image
              source={{ uri: customization.photoUri }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={[styles.avatarText, { color: color }]}>
              {initials}
            </Text>
          )}
        </View>

        <View style={styles.cardTexts}>
          <Text
            style={[styles.cardTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.alias || "Bracelet"}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {item.unique_code}
          </Text>
        </View>

        <View style={styles.batteryContainer}>
          <Ionicons
            name={
              item.battery_level && item.battery_level < 20
                ? "battery-dead"
                : "battery-half"
            }
            size={18}
            color={
              item.battery_level && item.battery_level < 20
                ? colors.danger
                : colors.textSecondary
            }
          />
          <Text style={[styles.batteryText, { color: colors.textSecondary }]}>
            {item.battery_level ?? "--"}%
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.success + "15" },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: colors.success }]}
            />
            <Text style={[styles.statusText, { color: colors.textPrimary }]}>
              Actif
            </Text>
          </View>

          <View style={styles.coordinatesContainer}>
            <Ionicons
              name="location-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.coordinatesText, { color: colors.textSecondary }]}
            >
              {lat}, {lng}
            </Text>
          </View>
        </View>

        <Text style={[styles.lastSeenText, { color: colors.textSecondary }]}>
          {new Date(item.updated_at || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: 130,
    borderRadius: 20,
    marginRight: 10,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24, // Rond parfait
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Important pour que l'image ne dépasse pas de la bordure
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardTexts: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardSubtitle: { fontSize: 12 },
  batteryContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  batteryText: { fontSize: 12, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f7f7f7",
    paddingTop: 12,
  },
  footerLeft: {
    gap: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  coordinatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 2,
  },
  coordinatesText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  lastSeenText: { fontSize: 12, marginBottom: 2 },
});
