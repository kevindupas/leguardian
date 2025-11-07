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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { braceletService, type Bracelet } from "../../services/braceletService";
import { AddBraceletBottomSheet } from "../../components/AddBraceletBottomSheet";
import { useTheme } from "../../contexts/ThemeContext";
import { useI18n } from "../../contexts/I18nContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { getColors } from "../../constants/Colors";
import { BraceletCard } from "../../components/BraceletCard";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { isConnected, subscribeToBracelet, unsubscribeFromBracelet } = useWebSocket();
  const colors = getColors(isDark);
  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAlias, setEditingAlias] = useState("");

  // Configure header with add button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setBottomSheetVisible(true)}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="add-circle" size={28} color={colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    fetchBracelets();
  }, []);

  // Subscribe to WebSocket updates for all bracelets
  useEffect(() => {
    if (bracelets.length === 0 || !isConnected) return;

    // Subscribe to each bracelet's updates
    bracelets.forEach((bracelet) => {
      subscribeToBracelet(bracelet.id, (update) => {
        // Update the bracelet data in the state
        setBracelets((prevBracelets) =>
          prevBracelets.map((b) =>
            b.id === update.bracelet.id
              ? {
                  ...b,
                  status: update.bracelet.status as any,
                  battery_level: update.bracelet.battery_level,
                  last_latitude: update.bracelet.last_latitude,
                  last_longitude: update.bracelet.last_longitude,
                  last_accuracy: update.bracelet.last_accuracy,
                  updated_at: new Date().toISOString(),
                }
              : b
          )
        );
      });
    });

    // Cleanup: unsubscribe from bracelets when component unmounts or bracelets change
    return () => {
      bracelets.forEach((bracelet) => {
        unsubscribeFromBracelet(bracelet.id);
      });
    };
  }, [bracelets, isConnected, subscribeToBracelet, unsubscribeFromBracelet]);

  const fetchBracelets = async () => {
    try {
      const data = await braceletService.getBracelets();
      setBracelets(data);
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.response?.data?.message || t("home.errorLoading")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBracelets();
  };

  const handleSaveAlias = async (braceletId: number) => {
    if (editingAlias.trim()) {
      try {
        await braceletService.updateBracelet(braceletId, {
          alias: editingAlias,
        });
        fetchBracelets();
        setEditingId(null);
        setEditingAlias("");
      } catch (error: any) {
        Alert.alert(
          t("common.error"),
          error.response?.data?.message || t("home.errorUpdate")
        );
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingAlias("");
  };

  const handleDeleteBracelet = (braceletId: number, braceletName: string) => {
    Alert.alert(
      t("bracelet.deleteConfirmTitle"),
      t("bracelet.deleteConfirmMessage"),
      [
        {
          text: t("common.cancel"),
          onPress: () => {},
          style: "cancel",
        },
        {
          text: t("common.delete"),
          onPress: async () => {
            try {
              await braceletService.deleteBracelet(braceletId);
              Alert.alert(t("common.success"), t("bracelet.braceletDeleted"));
              fetchBracelets();
            } catch (error: any) {
              Alert.alert(
                t("common.error"),
                error.response?.data?.message || t("common.error")
              );
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleViewNotifications = (braceletId: number) => {
    router.push({
      pathname: "/(tabs)/notifications",
      params: {
        braceletId: braceletId.toString(),
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "emergency":
        return "#f44336";
      case "active":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "emergency":
        return t("home.emergencies");
      case "active":
        return t("home.active");
      default:
        return "Inactif";
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return "#4caf50";
    if (level > 20) return "#ff9800";
    return "#f44336";
  };

  const renderBracelet = ({ item }: { item: Bracelet }) => {
    const isEditing = editingId === item.id;
    const statusMap: "safe" | "warning" | "danger" =
      item.status === "emergency"
        ? "danger"
        : item.status === "active"
        ? "safe"
        : "warning";

    if (isEditing) {
      return (
        <View style={[styles.editingCard, { backgroundColor: colors.white }]}>
          <View style={styles.editingHeader}>
            <TextInput
              style={[
                styles.aliasEditInput,
                {
                  color: colors.textPrimary,
                  borderBottomColor: colors.primary,
                },
              ]}
              value={editingAlias}
              onChangeText={setEditingAlias}
              placeholder={t("home.enterName")}
              maxLength={50}
              autoFocus
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[
                styles.cancelEditButton,
                { backgroundColor: colors.mediumBg },
              ]}
              onPress={handleCancelEdit}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveEditButton,
                { backgroundColor: colors.success },
              ]}
              onPress={() => handleSaveAlias(item.id)}
            >
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <BraceletCard
        id={item.id}
        name={item.alias || item.unique_code}
        uniqueCode={item.unique_code}
        latitude={item.last_latitude || undefined}
        longitude={item.last_longitude || undefined}
        batteryLevel={item.battery_level}
        accuracy={item.last_accuracy || undefined}
        lastUpdate={new Date().toISOString()}
        status={statusMap}
        onPress={() => handleViewNotifications(item.id)}
        onViewOnMap={() =>
          router.push({
            pathname: "/(tabs)/map-view",
            params: { braceletId: item.id.toString() },
          })
        }
        onEditLocation={() => console.log("Edit location")}
        onBraceletUpdated={fetchBracelets}
        onDelete={() => handleDeleteBracelet(item.id, item.alias || item.unique_code)}
      />
    );
  };

  const activeBracelets = bracelets.filter((b) => b.status === "active").length;
  const emergencyBracelets = bracelets.filter(
    (b) => b.status === "emergency"
  ).length;
  const avgBattery =
    bracelets.length > 0
      ? Math.round(
          bracelets.reduce((sum, b) => sum + b.battery_level, 0) /
            bracelets.length
        )
      : 0;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.lightBg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.lightBg }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <View
              style={[styles.statIcon, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="watch" size={20} color={colors.white} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {bracelets.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("home.total")}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <View
              style={[styles.statIcon, { backgroundColor: colors.success }]}
            >
              <Ionicons name="wifi" size={20} color={colors.white} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {activeBracelets}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("home.active")}
            </Text>
          </View>

          {/* <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
              <Ionicons name="battery-half" size={20} color={colors.white} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{avgBattery}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home.battery')}</Text>
          </View> */}

          <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.danger }]}>
              <Ionicons name="alert-circle" size={20} color={colors.white} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {emergencyBracelets}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("home.emergencies")}
            </Text>
          </View>
        </View>

        {/* Bracelets List */}
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.textPrimary }]}>
            {t("home.title")}
          </Text>
          <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>
            {bracelets.length}{" "}
            {bracelets.length > 1 ? t("home.bracelets") : t("home.bracelet")}{" "}
            {bracelets.length > 1
              ? t("home.registered_plural")
              : t("home.registered")}
          </Text>
        </View>

        {bracelets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="watch-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("home.noBracelets")}
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              {t("home.addBraceletPrompt")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={bracelets}
            renderItem={renderBracelet}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Add Bracelet Bottom Sheet */}
      <AddBraceletBottomSheet
        isOpen={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onBraceletAdded={fetchBracelets}
      />
    </View>
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
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  listSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  editingCard: {
    borderRadius: 14,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  editingHeader: {
    flex: 1,
  },
  aliasEditInput: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelEditButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveEditButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
  },
});
