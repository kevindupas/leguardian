import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { getColors } from "../constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Zone {
  id: number;
  name: string;
  icon: string;
}

interface ZonePickerTopSheetProps {
  isVisible: boolean;
  onClose: () => void;
  zones: Zone[];
  selectedZoneId: number | null;
  onSelectZone: (id: number | null) => void;
  isDark: boolean;
}

const SHEET_HEIGHT = 400;

export const ZonePickerTopSheet: React.FC<ZonePickerTopSheetProps> = ({
  isVisible,
  onClose,
  zones,
  selectedZoneId,
  onSelectZone,
  isDark,
}) => {
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(isVisible);

  // On commence "caché en haut" (négatif)
  const translateY = useSharedValue(-SHEET_HEIGHT);

  useEffect(() => {
    if (isVisible) {
      setShowModal(true);
      requestAnimationFrame(() => {
        // Animation vers le bas (0 = visible)
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      });
    } else {
      // Animation vers le haut (caché)
      translateY.value = withTiming(
        -SHEET_HEIGHT,
        {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setShowModal)(false);
          }
        }
      );
    }
  }, [isVisible]);

  // Geste : Swiper vers le HAUT pour fermer
  const pan = Gesture.Pan()
    .onChange((event) => {
      // On ne permet que le mouvement vers le haut (négatif)
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      // Si on a remonté de plus de 60px, on ferme
      if (translateY.value < -60) {
        runOnJS(onClose)();
      } else {
        // Sinon on redescend
        translateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showModal) return null;

  return (
    <Modal
      transparent
      visible={showModal}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
        <Pressable style={styles.overlay} onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.backdrop}
          />
        </Pressable>

        {/* Sheet Wrapper : aligné en HAUT (flex-start) */}
        <View style={styles.sheetWrapper} pointerEvents="box-none">
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.white,
                  paddingTop: insets.top + 10, // Padding pour la safe area
                },
                sheetStyle,
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Filtrer par zone
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: colors.lightBg }]}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 300 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Option: Vue Globale */}
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        selectedZoneId === null
                          ? colors.lightBg
                          : "transparent",
                    },
                  ]}
                  onPress={() => onSelectZone(null)}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor:
                            selectedZoneId === null
                              ? colors.primary
                              : colors.mediumBg,
                        },
                      ]}
                    >
                      <Ionicons
                        name="layers"
                        size={20}
                        color={
                          selectedZoneId === null
                            ? "white"
                            : colors.textSecondary
                        }
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: colors.textPrimary,
                            fontWeight: selectedZoneId === null ? "700" : "500",
                          },
                        ]}
                      >
                        Vue globale
                      </Text>
                      <Text
                        style={[
                          styles.optionSubtext,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Toutes les zones actives
                      </Text>
                    </View>
                  </View>
                  {selectedZoneId === null && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>

                <View
                  style={[styles.divider, { backgroundColor: colors.lightBg }]}
                />

                {/* Liste des zones */}
                {zones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id;
                  return (
                    <TouchableOpacity
                      key={zone.id}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: isSelected
                            ? colors.lightBg
                            : "transparent",
                        },
                      ]}
                      onPress={() => onSelectZone(zone.id)}
                    >
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            styles.iconBox,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : colors.lightBg,
                            },
                          ]}
                        >
                          <Ionicons
                            name={(zone.icon as any) || "home"}
                            size={20}
                            color={isSelected ? "white" : colors.textSecondary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: colors.textPrimary,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                        >
                          {zone.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Barre de drag en bas */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
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
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-start", // Important : aligné en haut !
    zIndex: 2,
  },
  sheetContainer: {
    borderBottomLeftRadius: 28, // Arrondi en bas
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
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
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 12,
  },
  handleContainer: {
    width: "100%",
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
});
