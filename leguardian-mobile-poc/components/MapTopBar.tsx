import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../constants/Colors";

interface MapTopBarProps {
  isDark: boolean;
  onSettingsPress: () => void;
  onNotificationsPress: () => void;
  onMapTypePress: () => void;
  onFocusPress: () => void;
  isDrawingMode: boolean;
  onDrawingModeToggle: () => void;
  drawingModeColor: string;
}

export const MapTopBar: React.FC<MapTopBarProps> = ({
  isDark,
  onSettingsPress,
  onNotificationsPress,
  onMapTypePress,
  onFocusPress,
  isDrawingMode,
  onDrawingModeToggle,
  drawingModeColor,
}) => {
  const colors = getColors(isDark);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
      }}
      pointerEvents="box-none"
    >
      {/* Settings Button */}
      <TouchableOpacity
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          elevation: 4,
          backgroundColor: colors.white,
        }}
        onPress={onSettingsPress}
      >
        <Ionicons
          name="settings-sharp"
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Right Column */}
      <View style={{ flexDirection: "column", gap: 12 }} pointerEvents="box-none">
        {/* Notifications Button */}
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            elevation: 4,
            backgroundColor: colors.white,
          }}
          onPress={onNotificationsPress}
        >
          <Ionicons name="notifications" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Map Type Button */}
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            elevation: 4,
            backgroundColor: colors.white,
          }}
          onPress={onMapTypePress}
        >
          <Ionicons name="map" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Focus Button */}
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            elevation: 4,
            backgroundColor: colors.white,
          }}
          onPress={onFocusPress}
        >
          <Ionicons name="navigate" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Drawing Mode Toggle Button */}
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            elevation: 4,
            backgroundColor: colors.white,
            borderColor: isDrawingMode ? drawingModeColor : "transparent",
            borderWidth: isDrawingMode ? 2 : 0,
          }}
          onPress={onDrawingModeToggle}
        >
          <Ionicons
            name={isDrawingMode ? "close" : "shield-checkmark"}
            size={24}
            color={isDrawingMode ? drawingModeColor : colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
