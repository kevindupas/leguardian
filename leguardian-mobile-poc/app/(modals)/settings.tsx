import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { getColors } from "../../constants/Colors";
import { braceletService } from "../../services/braceletService";
import { useSafetyZonesContext } from "../../contexts/SafetyZonesContext";
import { useBraceletSharing } from "../../hooks/useBraceletSharing";
import { SettingsZonesTab } from "../../components/SettingsZonesTab";
import { BraceletNotificationPermissionsModal } from "../../components/BraceletNotificationPermissionsModal";
import { useBraceletNotificationPermissions } from "../../hooks/useBraceletNotificationPermissions";
import { NotificationPermissions } from "../../utils/types";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [selectedBraceletId, setSelectedBraceletId] = useState<number | null>(
    null
  );
  const [bracelets, setBracelets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "zones" | "sharing" | "notifications"
  >("zones");

  const { zones: allZones, loadZones } = useSafetyZonesContext();
  const {
    sharedGuardians,
    pendingInvitations,
    shareWithGuardian,
    acceptInvitation,
    declineInvitation,
    revokeAccess,
  } = useBraceletSharing(selectedBraceletId);

  // Zones pour le bracelet sélectionné
  const zones = selectedBraceletId ? (allZones[selectedBraceletId] || []) : [];

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadBracelets();
  }, []);

  // Charger les zones quand un bracelet est sélectionné
  useEffect(() => {
    if (selectedBraceletId) {
      loadZones(selectedBraceletId);
    }
  }, [selectedBraceletId]);

  const loadBracelets = async () => {
    try {
      const data = await braceletService.getBracelets();
      setBracelets(data);
      if (data.length > 0) {
        setSelectedBraceletId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading bracelets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.lightBg,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={["top"]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Réglages
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* SECTION 1: SÉLECTEUR DE BRACELET (CAROUSEL) */}
        {bracelets.length > 0 && (
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              {bracelets.map((bracelet) => {
                const isSelected = selectedBraceletId === bracelet.id;
                return (
                  <TouchableOpacity
                    key={bracelet.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedBraceletId(bracelet.id)}
                    style={[
                      styles.deviceCard,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.white,
                      },
                      isSelected && styles.deviceCardSelectedShadow,
                    ]}
                  >
                    <View
                      style={[
                        styles.deviceIcon,
                        {
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.2)"
                            : colors.lightBg,
                        },
                      ]}
                    >
                      <Ionicons
                        name="watch"
                        size={20}
                        color={isSelected ? "white" : colors.textSecondary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.deviceName,
                          { color: isSelected ? "white" : colors.textPrimary },
                        ]}
                      >
                        {bracelet.alias || "Appareil"}
                      </Text>
                      <Text
                        style={[
                          styles.deviceCode,
                          {
                            color: isSelected
                              ? "rgba(255,255,255,0.8)"
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {bracelet.unique_code}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="white"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* SECTION 2: TABS (SEGMENTED CONTROL) */}
        <View style={styles.tabContainer}>
          <View style={[styles.segmentTrack, { backgroundColor: "#e5e5ea" }]}>
            {/* Note: j'utilise une couleur hardcodée pour le track gris clair style iOS, tu peux adapter */}
            {[
              { key: "zones", label: "Zones", icon: "map" },
              { key: "sharing", label: "Partage", icon: "people" },
              { key: "notifications", label: "Alertes", icon: "notifications" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  style={[
                    styles.segmentBtn,
                    isActive && styles.segmentBtnActive,
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isActive
                          ? colors.textPrimary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: CONTENU DYNAMIQUE */}
        <View style={styles.contentContainer}>
          {activeTab === "zones" && (
            <SettingsZonesTab
              braceletId={selectedBraceletId}
              zones={zones}
              colors={colors}
              sharedGuardians={sharedGuardians}
            />
          )}
          {activeTab === "sharing" && (
            <SharingContent
              braceletId={selectedBraceletId}
              sharedGuardians={sharedGuardians}
              pendingInvitations={pendingInvitations}
              colors={colors}
              onShare={shareWithGuardian}
              onAccept={acceptInvitation}
              onDecline={declineInvitation}
              onRevoke={revokeAccess}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsContent colors={colors} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- SOUS-COMPOSANTS ---

function SharingContent({
  sharedGuardians,
  pendingInvitations,
  colors,
  onShare,
  onAccept,
  onDecline,
  onRevoke,
  braceletId,
}: any) {
  const [email, setEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);

  const { permissions, updatePermissions } = useBraceletNotificationPermissions(
    braceletId,
    selectedGuardian?.id
  );

  const handleShare = async () => {
    if (!email.trim()) return;
    setSharing(true);
    try {
      await onShare(email);
      setEmail("");
      Alert.alert("Succès", "Invitation envoyée");
    } catch {
      Alert.alert("Erreur", "Impossible de partager");
    } finally {
      setSharing(false);
    }
  };

  const handleEditPermissions = (guardian: any) => {
    setSelectedGuardian(guardian);
    setPermissionsModalVisible(true);
  };

  const handleSavePermissions = async (newPermissions: NotificationPermissions) => {
    const success = await updatePermissions(newPermissions);
    if (success) {
      setPermissionsModalVisible(false);
      setSelectedGuardian(null);
    }
  };

  return (
    <View style={{ gap: 24 }}>
      {/* CARD D'INVITATION */}
      <View style={[styles.inviteBox, { backgroundColor: colors.white }]}>
        <View style={styles.inviteHeader}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="person-add" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Ajouter un gardien
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: colors.textSecondary }]}
            >
              Il pourra voir la position et recevoir les alertes.
            </Text>
          </View>
        </View>

        <View style={[styles.inputRow, { backgroundColor: colors.lightBg }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Email du gardien..."
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing || !email.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  sharing || !email.trim() ? colors.mediumBg : colors.primary,
              },
            ]}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* INVITATIONS REÇUES */}
      {pendingInvitations.length > 0 && (
        <View>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            DEMANDES EN ATTENTE
          </Text>
          <View style={[styles.cardGroup, { backgroundColor: colors.white }]}>
            {pendingInvitations.map((inv: any, index: number) => (
              <View key={inv.bracelet_id}>
                <View style={styles.listItem}>
                  <View
                    style={[
                      styles.listIcon,
                      { backgroundColor: colors.warning + "15" },
                    ]}
                  >
                    <Ionicons
                      name="mail-unread"
                      size={20}
                      color={colors.warning}
                    />
                  </View>
                  <View style={styles.listTextContainer}>
                    <Text
                      style={[styles.listTitle, { color: colors.textPrimary }]}
                    >
                      {inv.bracelet_name}
                    </Text>
                    <Text
                      style={[
                        styles.listSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      De: {inv.shared_by}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => onDecline(inv.bracelet_id)}
                      style={[
                        styles.actionCircle,
                        { backgroundColor: colors.danger + "15" },
                      ]}
                    >
                      <Ionicons name="close" size={18} color={colors.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onAccept(inv.bracelet_id)}
                      style={[
                        styles.actionCircle,
                        { backgroundColor: colors.success + "15" },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.success}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {index < pendingInvitations.length - 1 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.lightBg },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* GARDIENS ACTIFS */}
      <View>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          GARDIENS ACTIFS ({sharedGuardians.length})
        </Text>
        {sharedGuardians.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: colors.textSecondary,
              marginTop: 10,
              fontStyle: "italic",
            }}
          >
            Ce bracelet n'est partagé avec personne.
          </Text>
        ) : (
          <View style={[styles.cardGroup, { backgroundColor: colors.white }]}>
            {sharedGuardians.map((g: any, index: number) => (
              <View key={g.id}>
                <View style={styles.listItem}>
                  <View
                    style={[
                      styles.avatarBox,
                      { backgroundColor: colors.mediumBg },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.textSecondary,
                      }}
                    >
                      {g.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.listTextContainer}>
                    <Text
                      style={[styles.listTitle, { color: colors.textPrimary }]}
                    >
                      {g.name}
                    </Text>
                    <Text
                      style={[
                        styles.listSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {g.email}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleEditPermissions(g)}
                      style={[
                        styles.actionCircle,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Ionicons
                        name="settings-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onRevoke(g.id)}
                      style={[
                        styles.actionCircle,
                        { backgroundColor: colors.danger + "15" },
                      ]}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {index < sharedGuardians.length - 1 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.lightBg },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Notification Permissions Modal */}
      {selectedGuardian && permissions && (
        <BraceletNotificationPermissionsModal
          visible={permissionsModalVisible}
          guardianName={selectedGuardian.name}
          initialPermissions={permissions}
          colors={colors}
          onSave={handleSavePermissions}
          onCancel={() => {
            setPermissionsModalVisible(false);
            setSelectedGuardian(null);
          }}
        />
      )}
    </View>
  );
}

function NotificationsContent({ colors }: any) {
  const [notifs, setNotifs] = useState({
    zoneEntry: true,
    zoneExit: true,
    emergencyAlert: true,
    batteryLow: false,
  });

  const toggle = (key: string) =>
    setNotifs((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof notifs],
    }));

  return (
    <View>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        PRÉFÉRENCES DE NOTIFICATION
      </Text>

      <View style={[styles.cardGroup, { backgroundColor: colors.white }]}>
        <NotificationRow
          icon="enter-outline"
          color="#4CAF50"
          title="Entrée de zone"
          value={notifs.zoneEntry}
          onValueChange={() => toggle("zoneEntry")}
          colors={colors}
        />
        <View style={[styles.separator, { backgroundColor: colors.lightBg }]} />
        <NotificationRow
          icon="exit-outline"
          color="#FF9800"
          title="Sortie de zone"
          value={notifs.zoneExit}
          onValueChange={() => toggle("zoneExit")}
          colors={colors}
        />
        <View style={[styles.separator, { backgroundColor: colors.lightBg }]} />
        <NotificationRow
          icon="alert-circle"
          color="#F44336"
          title="SOS / Urgence"
          value={notifs.emergencyAlert}
          onValueChange={() => toggle("emergencyAlert")}
          colors={colors}
        />
        <View style={[styles.separator, { backgroundColor: colors.lightBg }]} />
        <NotificationRow
          icon="battery-dead"
          color={colors.textSecondary}
          title="Batterie faible"
          value={notifs.batteryLow}
          onValueChange={() => toggle("batteryLow")}
          colors={colors}
        />
      </View>
      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        Vous recevrez des notifications push sur cet appareil pour les
        événements sélectionnés.
      </Text>
    </View>
  );
}

const NotificationRow = ({
  icon,
  color,
  title,
  value,
  onValueChange,
  colors,
}: any) => (
  <View style={styles.listItem}>
    <View style={[styles.notifIconBox, { backgroundColor: color }]}>
      <Ionicons name={icon} size={18} color="white" />
    </View>
    <Text style={[styles.listTitle, { flex: 1, color: colors.textPrimary }]}>
      {title}
    </Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.lightBg, true: colors.primary }}
      thumbColor={"white"}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },

  // CAROUSEL BRACELETS
  carouselContainer: {
    marginBottom: 20,
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingRight: 16,
    borderRadius: 16,
    gap: 12,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceCardSelectedShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "700",
  },
  deviceCode: {
    fontSize: 11,
    fontWeight: "500",
  },
  checkIcon: {
    marginLeft: "auto",
  },

  // TABS
  tabContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  segmentTrack: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    height: 44,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // CONTENT GENERIC
  contentContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  cardGroup: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  listSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 60, // Indent for ios style
  },
  deleteAction: {
    padding: 4,
  },

  // EMPTY STATE
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  // SHARING
  inviteBox: {
    borderRadius: 16,
    padding: 16,
  },
  inviteHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // NOTIFICATIONS
  notifIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});
