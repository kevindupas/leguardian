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
