import React from "react";
import { View, StyleSheet, Image, Text } from "react-native";

interface CustomMapMarkerProps {
  color: string;
  initials: string;
  photoUri?: string;
  size?: number;
}

export const CustomMapMarker: React.FC<CustomMapMarkerProps> = ({
  color,
  initials,
  photoUri,
  size = 56,
}) => {
  const avatarSize = size - 6;
  const squircleRadius = size * 0.42; // Squircle border radius (carré arrondi fun)

  return (
    <View style={[styles.container, { width: size, height: size + 18 }]}>
      {/* Main squircle marker - carré arrondi avec style */}
      <View
        style={[
          styles.markerSquircle,
          {
            width: size,
            height: size,
            borderRadius: squircleRadius,
            backgroundColor: photoUri ? undefined : color,
            borderColor: "#fff",
            borderWidth: 3,
            shadowColor: color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={[
              styles.photo,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: squircleRadius - 3,
              },
            ]}
          />
        ) : (
          <Text
            style={[styles.initials, { fontSize: size * 0.35, color: "#fff" }]}
          >
            {initials}
          </Text>
        )}
      </View>

      {/* Bottom pointer pin */}
      <View
        style={[
          styles.pointer,
          {
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.25,
            borderRightWidth: size * 0.25,
            borderTopWidth: size * 0.35,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 3,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  markerSquircle: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  photo: {
    resizeMode: "cover",
  },
  initials: {
    fontWeight: "800",
    textAlign: "center",
  },
  pointer: {
    position: "absolute",
    bottom: -10,
  },
});
