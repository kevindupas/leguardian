import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DrawingControlsProps {
  drawingType: "polygon" | "circle";
  setDrawingType: (type: "polygon" | "circle") => void;
  circleRadius: number;
  setCircleRadius: (radius: number) => void;
  resetZone: () => void;
  onValidate: () => void;
  hasEnoughPoints: boolean;
  circleCenter: { latitude: number; longitude: number } | null;
  colors: any; // Define a more specific type if available
  pointCount: number;
}

export const DrawingControls = ({
  drawingType,
  setDrawingType,
  circleRadius,
  setCircleRadius,
  resetZone,
  onValidate,
  hasEnoughPoints,
  circleCenter,
  colors,
  pointCount,
}: DrawingControlsProps) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Sélecteur de Mode */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            drawingType === "polygon" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => {
            setDrawingType("polygon");
            resetZone();
          }}
        >
          <Ionicons
            name="share-social"
            size={20}
            color={
              drawingType === "polygon" ? colors.primary : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  drawingType === "polygon"
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}
          >
            Polygone ({pointCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            drawingType === "circle" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => {
            setDrawingType("circle");
            resetZone();
          }}
        >
          <Ionicons
            name="radio-button-off"
            size={20}
            color={
              drawingType === "circle" ? colors.primary : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  drawingType === "circle"
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}
          >
            Cercle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contrôle du Rayon (si mode cercle) */}
      {drawingType === "circle" && circleCenter && (
        <View style={styles.radiusRow}>
          <Text style={[styles.radiusLabel, { color: colors.textPrimary }]}>
            Rayon: {(circleRadius / 1000).toFixed(1)} km
          </Text>
          <View style={styles.radiusButtons}>
            <TouchableOpacity
              onPress={() => setCircleRadius(Math.max(100, circleRadius - 100))}
              style={[styles.smallBtn, { backgroundColor: colors.lightBg }]}
            >
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCircleRadius(circleRadius + 100)}
              style={[styles.smallBtn, { backgroundColor: colors.lightBg }]}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={resetZone}
          style={[styles.btn, { backgroundColor: colors.lightBg, flex: 0.4 }]}
        >
          <Text style={{ color: colors.danger, fontWeight: "600" }}>
            Effacer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onValidate}
          disabled={
            drawingType === "polygon" ? !hasEnoughPoints : !circleCenter
          }
          style={[
            styles.btn,
            {
              backgroundColor: colors.primary,
              flex: 0.6,
              opacity: (
                drawingType === "polygon" ? !hasEnoughPoints : !circleCenter
              )
                ? 0.5
                : 1,
            },
          ]}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 5,
    gap: 15,
  },
  modeTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
    gap: 8,
  },
  tabText: { fontWeight: "700", fontSize: 13 },
  radiusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radiusLabel: { fontWeight: "700" },
  radiusButtons: { flexDirection: "row", gap: 10 },
  smallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionRow: { flexDirection: "row", gap: 12 },
  btn: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
