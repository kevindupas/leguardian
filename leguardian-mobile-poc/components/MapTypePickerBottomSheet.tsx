import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing, // <-- Import nécessaire pour la courbe de vitesse
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { getColors } from "../constants/Colors";

interface MapTypePickerBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  currentMapType: "standard" | "satellite" | "hybrid" | "terrain";
  onMapTypeChange: (
    type: "standard" | "satellite" | "hybrid" | "terrain"
  ) => void;
  isDark: boolean;
}

const SHEET_HEIGHT = 400;

export const MapTypePickerBottomSheet: React.FC<
  MapTypePickerBottomSheetProps
> = ({ isVisible, onClose, currentMapType, onMapTypeChange, isDark }) => {
  const colors = getColors(isDark);

  const [showModal, setShowModal] = useState(isVisible);
  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    if (isVisible) {
      setShowModal(true);
      requestAnimationFrame(() => {
        // OUVERTURE : Rapide (250ms) et nette (OutQuad = ralentit à la fin, sans dépasser)
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.quad),
        });
      });
    } else {
      // FERMETURE : Rapide (200ms)
      translateY.value = withTiming(
        SHEET_HEIGHT,
        {
          duration: 200,
          easing: Easing.in(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(setShowModal)(false);
          }
        }
      );
    }
  }, [isVisible]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (translateY.value > 100) {
        runOnJS(onClose)();
      } else {
        // RETOUR EN PLACE : Rapide et sans rebond si on lâche le swipe
        translateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, SHEET_HEIGHT],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  if (!showModal) return null;

  const mapOptions = [
    { type: "standard" as const, label: "Plan", icon: "map-outline" },
    { type: "satellite" as const, label: "Satellite", icon: "earth" },
    { type: "hybrid" as const, label: "Hybride", icon: "layers-outline" },
  ];

  return (
    <Modal
      transparent
      visible={showModal}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <View style={styles.sheetWrapper} pointerEvents="box-none">
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                  borderTopColor: isDark ? "#333" : "transparent",
                  borderTopWidth: isDark ? 1 : 0,
                },
                sheetStyle,
              ]}
            >
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Type de carte
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsGrid}>
                {mapOptions.map((option) => {
                  const isSelected = currentMapType === option.type;
                  return (
                    <TouchableOpacity
                      key={option.type}
                      activeOpacity={0.7}
                      onPress={() => onMapTypeChange(option.type)}
                      style={styles.optionItem}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                            borderColor: isSelected
                              ? colors.primary
                              : "transparent",
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={32}
                          color={isSelected ? colors.primary : "#8E8E93"}
                        />
                      </View>
                      <Text
                        style={[
                          styles.label,
                          {
                            color: isSelected
                              ? colors.primary
                              : colors.textPrimary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 40 }} />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 2,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    width: "100%",
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D1D6",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  optionItem: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: "100%",
    aspectRatio: 1.25,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    marginTop: 2,
  },
});
