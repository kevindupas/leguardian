import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
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
import { useI18n } from "../contexts/I18nContext";

interface NotificationFilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  filterType: "all" | "arrived" | "lost" | "danger";
  onFilterTypeChange: (type: "all" | "arrived" | "lost" | "danger") => void;
  selectedBraceletId: number | null;
  onBraceletChange: (id: number | null) => void;
  bracelets: Array<{ id: number; alias: string; unique_code: string }>;
  isDark: boolean;
}

const SHEET_HEIGHT = 500; // Hauteur max estimée

export const NotificationFilterBottomSheet: React.FC<
  NotificationFilterBottomSheetProps
> = ({
  isVisible,
  onClose,
  filterType,
  onFilterTypeChange,
  selectedBraceletId,
  onBraceletChange,
  bracelets,
  isDark,
}) => {
  const colors = getColors(isDark);
  const { t } = useI18n(); // On suppose que tu as accès à tes traductions ici

  const [showModal, setShowModal] = useState(isVisible);
  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    if (isVisible) {
      setShowModal(true);
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.quad),
        });
      });
    } else {
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
        translateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Helper pour les labels
  const getLabel = (type: string) => {
    switch (type) {
      case "danger":
        return t("eventTypes.danger") || "Danger";
      case "lost":
        return t("eventTypes.lost") || "Perdu";
      case "arrived":
        return t("eventTypes.arrived") || "Arrivé";
      default:
        return t("map.allTypes") || "Tout";
    }
  };

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

        <View style={styles.sheetWrapper} pointerEvents="box-none">
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.sheetContainer,
                { backgroundColor: colors.white },
                sheetStyle,
              ]}
            >
              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Filtrer les alertes
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
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* SECTION 1: TYPES */}
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  Type d'événement
                </Text>
                <View style={styles.typesRow}>
                  {["all", "danger", "lost", "arrived"].map((type: any) => {
                    const isActive = filterType === type;
                    // Couleur dynamique selon le type quand actif
                    let activeColor = colors.primary;
                    if (type === "danger") activeColor = colors.danger;
                    if (type === "lost") activeColor = colors.warning;
                    if (type === "arrived") activeColor = colors.success;

                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => onFilterTypeChange(type)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isActive
                              ? activeColor
                              : colors.lightBg,
                            borderColor: isActive ? activeColor : "transparent",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isActive ? "white" : colors.textSecondary,
                              fontWeight: isActive ? "700" : "500",
                            },
                          ]}
                        >
                          {getLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* SECTION 2: BRACELETS */}
                {bracelets.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textSecondary, marginTop: 24 },
                      ]}
                    >
                      Par Bracelet
                    </Text>

                    {/* Option "Tous" */}
                    <TouchableOpacity
                      style={[
                        styles.braceletItem,
                        {
                          backgroundColor:
                            selectedBraceletId === null
                              ? colors.lightBg
                              : "transparent",
                        },
                      ]}
                      onPress={() => onBraceletChange(null)}
                    >
                      <View style={styles.braceletInfo}>
                        <View
                          style={[
                            styles.iconBox,
                            {
                              backgroundColor:
                                selectedBraceletId === null
                                  ? colors.primary
                                  : colors.mediumBg,
                            },
                          ]}
                        >
                          <Ionicons name="people" size={16} color="white" />
                        </View>
                        <Text
                          style={[
                            styles.braceletName,
                            {
                              color: colors.textPrimary,
                              fontWeight:
                                selectedBraceletId === null ? "700" : "500",
                            },
                          ]}
                        >
                          Tous les bracelets
                        </Text>
                      </View>
                      {selectedBraceletId === null && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>

                    {/* Liste des bracelets */}
                    {bracelets.map((b) => {
                      const isActive = selectedBraceletId === b.id;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          style={[
                            styles.braceletItem,
                            {
                              backgroundColor: isActive
                                ? colors.lightBg
                                : "transparent",
                            },
                          ]}
                          onPress={() => onBraceletChange(b.id)}
                        >
                          <View style={styles.braceletInfo}>
                            <View
                              style={[
                                styles.iconBox,
                                {
                                  backgroundColor: isActive
                                    ? colors.primary
                                    : colors.mediumBg,
                                },
                              ]}
                            >
                              <Ionicons name="watch" size={16} color="white" />
                            </View>
                            <Text
                              style={[
                                styles.braceletName,
                                {
                                  color: colors.textPrimary,
                                  fontWeight: isActive ? "700" : "500",
                                },
                              ]}
                            >
                              {b.alias}
                            </Text>
                          </View>
                          {isActive && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </ScrollView>
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
    maxHeight: "85%", // Limite la hauteur
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    width: "100%",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  content: {
    flexGrow: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  typesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  braceletItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  braceletInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  braceletName: {
    fontSize: 15,
  },
});
