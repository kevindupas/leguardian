import React from "react";
import {
  Modal,
  KeyboardAvoidingView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../constants/Colors";

const ZONE_ICONS = [
  "home",
  "school",
  "briefcase",
  "alert-circle",
  "leaf",
  "bicycle",
  "navigate",
];

interface ZoneCreationModalProps {
  visible: boolean;
  zoneName: string;
  onZoneNameChange: (name: string) => void;
  selectedZoneIcon: string;
  onIconSelect: (icon: string) => void;
  zoneType: "polygon" | "circle";
  onZoneTypeChange: (type: "polygon" | "circle") => void;
  circleRadius: number;
  onCircleRadiusChange: (radius: number) => void;
  onCancel: () => void;
  onSave: () => void;
  isDark: boolean;
}

export const ZoneCreationModal: React.FC<ZoneCreationModalProps> = ({
  visible,
  zoneName,
  onZoneNameChange,
  selectedZoneIcon,
  onIconSelect,
  zoneType,
  onZoneTypeChange,
  circleRadius,
  onCircleRadiusChange,
  onCancel,
  onSave,
  isDark,
}) => {
  const colors = getColors(isDark);

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000",
            elevation: 10,
            backgroundColor: colors.white,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              marginBottom: 20,
              textAlign: "center",
              color: colors.textPrimary,
            }}
          >
            Nouvelle Zone
          </Text>

          {/* Nom Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                color: colors.textSecondary,
              }}
            >
              Nom
            </Text>
            <TextInput
              style={{
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: colors.textPrimary,
                backgroundColor: colors.lightBg,
              }}
              placeholder="Ex: Maison..."
              placeholderTextColor="#999"
              value={zoneName}
              onChangeText={onZoneNameChange}
              autoFocus
            />
          </View>

          {/* Type Selector */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                color: colors.textSecondary,
              }}
            >
              Type de Zone
            </Text>
            <View
              style={{
                flexDirection: "row",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => onZoneTypeChange("polygon")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor:
                    zoneType === "polygon" ? colors.primary : colors.lightBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: zoneType === "polygon" ? "700" : "500",
                    color:
                      zoneType === "polygon" ? "white" : colors.textPrimary,
                  }}
                >
                  Polygone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onZoneTypeChange("circle")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor:
                    zoneType === "circle" ? colors.primary : colors.lightBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: zoneType === "circle" ? "700" : "500",
                    color:
                      zoneType === "circle" ? "white" : colors.textPrimary,
                  }}
                >
                  Cercle
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Radius Control (Circle only) */}
          {zoneType === "circle" && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  color: colors.textSecondary,
                }}
              >
                Rayon : {(circleRadius / 1000).toFixed(1)} km
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    onCircleRadiusChange(Math.max(100, circleRadius - 100))
                  }
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.lightBg,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, color: colors.primary }}>−</Text>
                </TouchableOpacity>
                <Text
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.textPrimary,
                  }}
                >
                  {circleRadius}m
                </Text>
                <TouchableOpacity
                  onPress={() => onCircleRadiusChange(circleRadius + 100)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.lightBg,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, color: colors.primary }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Icon Selector */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                color: colors.textSecondary,
              }}
            >
              Icône
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 60 }}
            >
              <View
                style={{ flexDirection: "row", gap: 12, paddingVertical: 5 }}
              >
                {ZONE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => onIconSelect(icon)}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: "transparent",
                      backgroundColor: colors.lightBg,
                      ...(selectedZoneIcon === icon && {
                        backgroundColor: colors.primary,
                      }),
                    }}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={
                        selectedZoneIcon === icon
                          ? "white"
                          : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.lightBg,
              }}
            >
              <Text style={{ color: colors.textPrimary }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={!zoneName.trim()}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary,
                opacity: !zoneName.trim() ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                Enregistrer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
