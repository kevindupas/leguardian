import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { braceletService, type Bracelet } from "../../services/braceletService";
import { AddBraceletBottomSheet } from "../../components/AddBraceletBottomSheet";
import { useTheme } from "../../contexts/ThemeContext";
import { useI18n } from "../../contexts/I18nContext";
import { getColors } from "../../constants/Colors";
import { BraceletCard } from "../../components/BraceletCard";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);

  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // Configuration Header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // On fait notre propre header custom
    });
  }, [navigation]);

  // Fetch Logic
  useEffect(() => {
    fetchBracelets();
    const pollInterval = setInterval(async () => {
      try {
        const data = await braceletService.getBracelets();
        setBracelets(data);
      } catch (error) {
        console.log("[HomeScreen] Polling error");
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  const fetchBracelets = async () => {
    try {
      const data = await braceletService.getBracelets();
      setBracelets(data);
    } catch (error: any) {
      // Gérer l'erreur silencieusement ou avec un toast
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteBracelet = (braceletId: number) => {
    Alert.alert(
      t("bracelet.deleteConfirmTitle"),
      t("bracelet.deleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await braceletService.deleteBracelet(braceletId);
              fetchBracelets();
            } catch (error) {
              Alert.alert(t("common.error"));
            }
          },
        },
      ]
    );
  };

  const activeBracelets = bracelets.filter((b) => b.status === "active").length;
  const emergencyBracelets = bracelets.filter(
    (b) => b.status === "emergency"
  ).length;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- HEADER CUSTOM --- */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Mes Bracelets
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {bracelets.length} appareil{bracelets.length > 1 ? "s" : ""}{" "}
            connecté{bracelets.length > 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setBottomSheetVisible(true)}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* --- SUMMARY PILLS --- */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryPill, { backgroundColor: colors.white }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
            {activeBracelets} Actifs
          </Text>
        </View>
        {emergencyBracelets > 0 && (
          <View
            style={[
              styles.summaryPill,
              { backgroundColor: colors.danger + "15" },
            ]}
          >
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.summaryText, { color: colors.danger }]}>
              {emergencyBracelets} Alertes
            </Text>
          </View>
        )}
      </View>

      {/* --- LIST --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBracelets();
            }}
          />
        }
      >
        {bracelets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.mediumBg },
              ]}
            >
              <Ionicons
                name="watch-outline"
                size={48}
                color={colors.textSecondary}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
              Aucun bracelet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Appuyez sur le + pour ajouter votre premier appareil.
            </Text>
          </View>
        ) : (
          bracelets.map((item) => (
            <BraceletCard
              key={item.id}
              id={item.id}
              name={item.alias || item.unique_code}
              uniqueCode={item.unique_code}
              latitude={item.last_latitude || undefined}
              longitude={item.last_longitude || undefined}
              batteryLevel={item.battery_level}
              accuracy={item.last_accuracy || undefined}
              lastUpdate={item.updated_at}
              // Mapping simple du status venant du backend
              status={
                item.status === "emergency"
                  ? "danger"
                  : item.status === "active"
                  ? "safe"
                  : "warning"
              }
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/notifications",
                  params: { braceletId: item.id.toString() },
                })
              }
              onViewOnMap={() =>
                router.push({
                  pathname: "/(tabs)/map-view",
                  params: { braceletId: item.id.toString() },
                })
              }
              onEditLocation={() => console.log("Edit location")}
              onBraceletUpdated={fetchBracelets}
              onDelete={() => handleDeleteBracelet(item.id)}
            />
          ))
        )}
      </ScrollView>

      <AddBraceletBottomSheet
        isOpen={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onBraceletAdded={fetchBracelets}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
