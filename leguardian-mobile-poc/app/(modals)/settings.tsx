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
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { getColors } from "../../constants/Colors";
import { braceletService } from "../../services/braceletService";
import { useSafetyZones } from "../../hooks/useSafetyZones";
import { useBraceletSharing } from "../../hooks/useBraceletSharing";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [selectedBraceletId, setSelectedBraceletId] = useState<number | null>(null);
  const [bracelets, setBracelets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"zones" | "sharing" | "notifications">("zones");

  const { zones } = useSafetyZones(selectedBraceletId);
  const {
    sharedGuardians,
    pendingInvitations,
    shareWithGuardian,
    acceptInvitation,
    declineInvitation,
    revokeAccess,
  } = useBraceletSharing(selectedBraceletId);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadBracelets();
  }, []);

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.lightBg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Paramètres
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bracelet Selector */}
      {bracelets.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.braceletScroll, { borderBottomColor: colors.lightBg }]}
          contentContainerStyle={styles.braceletScrollContent}
        >
          {bracelets.map((bracelet) => (
            <TouchableOpacity
              key={bracelet.id}
              onPress={() => setSelectedBraceletId(bracelet.id)}
              style={[
                styles.braceletBadge,
                {
                  backgroundColor:
                    selectedBraceletId === bracelet.id
                      ? colors.primary
                      : colors.lightBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.braceletBadgeText,
                  {
                    color:
                      selectedBraceletId === bracelet.id
                        ? "white"
                        : colors.textPrimary,
                  },
                ]}
              >
                {bracelet.alias || bracelet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tab Navigation */}
      <View style={[styles.tabNav, { backgroundColor: colors.lightBg }]}>
        <TabNavButton
          icon="map"
          label="Zones"
          active={activeTab === "zones"}
          onPress={() => setActiveTab("zones")}
          colors={colors}
        />
        <TabNavButton
          icon="share-social"
          label="Partage"
          active={activeTab === "sharing"}
          onPress={() => setActiveTab("sharing")}
          colors={colors}
        />
        <TabNavButton
          icon="notifications"
          label="Alertes"
          active={activeTab === "notifications"}
          onPress={() => setActiveTab("notifications")}
          colors={colors}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "zones" && (
          <ZonesContent zones={zones} colors={colors} />
        )}
        {activeTab === "sharing" && (
          <SharingContent
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
      </ScrollView>
    </SafeAreaView>
  );
}

function TabNavButton({ icon, label, active, onPress, colors }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabNavButton,
        active && { backgroundColor: colors.white },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.tabNavLabel,
          { color: active ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ZonesContent({ zones, colors }: any) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Zones de sécurité
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeNumber}>{zones.length}</Text>
        </View>
      </View>

      {zones.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.lightBg }]}>
          <Ionicons name="map-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucune zone créée
          </Text>
        </View>
      ) : (
        zones.map((zone: any) => (
          <View
            key={zone.id}
            style={[styles.zoneItem, { backgroundColor: colors.lightBg }]}
          >
            <View style={styles.zoneLeft}>
              <View
                style={[
                  styles.zoneIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name={zone.icon}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneName, { color: colors.textPrimary }]}>
                  {zone.name}
                </Text>
                <Text
                  style={[
                    styles.zonePoints,
                    { color: colors.textSecondary },
                  ]}
                >
                  {zone.coordinates?.length || 0} points
                </Text>
              </View>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  Alert.alert(
                    "Supprimer",
                    `Êtes-vous sûr de vouloir supprimer "${zone.name}" ?`,
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        onPress: () => console.log("Delete"),
                        style: "destructive",
                      },
                    ]
                  )
                }
              >
                <Ionicons name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function SharingContent({
  sharedGuardians,
  pendingInvitations,
  colors,
  onShare,
  onAccept,
  onDecline,
  onRevoke,
}: any) {
  const [email, setEmail] = useState("");
  const [sharing, setSharing] = useState(false);

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

  return (
    <View>
      {/* Share Form */}
      <View style={[styles.shareCard, { backgroundColor: colors.lightBg }]}>
        <Text style={[styles.shareTitle, { color: colors.textPrimary }]}>
          Partager ce bracelet
        </Text>
        <TextInput
          style={[
            styles.shareInput,
            {
              color: colors.textPrimary,
              borderColor: colors.primary,
              backgroundColor: colors.white,
            },
          ]}
          placeholder="email@exemple.com"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          editable={!sharing}
        />
        <TouchableOpacity
          onPress={handleShare}
          disabled={sharing || !email.trim()}
          style={[
            styles.shareBtn,
            {
              backgroundColor: colors.primary,
              opacity: sharing || !email.trim() ? 0.5 : 1,
            },
          ]}
        >
          {sharing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.shareBtnText}>Envoyer</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pending */}
      {pendingInvitations.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Invitations reçues
          </Text>
          {pendingInvitations.map((inv: any) => (
            <View
              key={inv.bracelet_id}
              style={[styles.inviteCard, { backgroundColor: colors.lightBg }]}
            >
              <View>
                <Text style={[styles.inviteTitle, { color: colors.textPrimary }]}>
                  {inv.bracelet_name}
                </Text>
                <Text style={[styles.inviteFrom, { color: colors.textSecondary }]}>
                  De {inv.shared_by}
                </Text>
              </View>
              <View style={styles.inviteActions}>
                <TouchableOpacity
                  onPress={() => onAccept(inv.bracelet_id)}
                  style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="checkmark" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDecline(inv.bracelet_id)}
                  style={[styles.declineBtn, { borderColor: colors.danger }]}
                >
                  <Ionicons name="close" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Shared With */}
      {sharedGuardians.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Partagé avec
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeNumber}>{sharedGuardians.length}</Text>
            </View>
          </View>
          {sharedGuardians.map((g: any) => (
            <View
              key={g.id}
              style={[
                styles.guardianCard,
                { backgroundColor: colors.lightBg },
              ]}
            >
              <View style={styles.guardianLeft}>
                <View
                  style={[
                    styles.guardianAvatar,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {g.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.guardianName, { color: colors.textPrimary }]}>
                    {g.name}
                  </Text>
                  <Text style={[styles.guardianEmail, { color: colors.textSecondary }]}>
                    {g.email}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Révoquer", `Révoquer l'accès à ${g.name} ?`, [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Révoquer",
                      onPress: () => onRevoke(g.id),
                      style: "destructive",
                    },
                  ])
                }
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {sharedGuardians.length === 0 && pendingInvitations.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.lightBg }]}>
          <Ionicons name="share-social-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Pas de partage
          </Text>
        </View>
      )}
    </View>
  );
}

function NotificationsContent({ colors }: any) {
  const [notifs, setNotifs] = useState({
    zoneEntry: true,
    zoneExit: true,
    emergencyAlert: true,
    braceletSharing: true,
  });

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Notifications et alertes
      </Text>

      {[
        {
          key: "zoneEntry",
          icon: "arrow-forward",
          title: "Entrée de zone",
          desc: "Alerte quand le bracelet entre dans une zone",
        },
        {
          key: "zoneExit",
          icon: "arrow-back",
          title: "Sortie de zone",
          desc: "Alerte quand le bracelet quitte une zone",
        },
        {
          key: "emergencyAlert",
          icon: "alert-circle",
          title: "Alerte d'urgence",
          desc: "Notification en cas d'urgence",
        },
        {
          key: "braceletSharing",
          icon: "share-social",
          title: "Partage de bracelet",
          desc: "Quand quelqu'un partage un bracelet",
        },
      ].map((item: any) => (
        <View
          key={item.key}
          style={[styles.notifItem, { backgroundColor: colors.lightBg }]}
        >
          <View style={styles.notifLeft}>
            <View
              style={[
                styles.notifIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
                {item.desc}
              </Text>
            </View>
          </View>
          <Switch
            value={notifs[item.key as any]}
            onValueChange={(val) =>
              setNotifs({ ...notifs, [item.key]: val })
            }
            trackColor={{
              false: colors.lightBg,
              true: colors.primary + "40",
            }}
            thumbColor={notifs[item.key as any] ? colors.primary : colors.textSecondary}
          />
        </View>
      ))}
    </View>
  );
}

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
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  braceletScroll: {
    borderBottomWidth: 1,
  },
  braceletScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  braceletBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  braceletBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabNav: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  tabNavButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabNavLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
  },
  badgeNumber: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  zoneItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  zoneLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    alignItems: "center",
  },
  zoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  zoneName: {
    fontSize: 15,
    fontWeight: "600",
  },
  zonePoints: {
    fontSize: 12,
    marginTop: 4,
  },
  zoneActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  shareCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  shareInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  shareBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  shareBtnText: {
    color: "white",
    fontWeight: "600",
  },
  inviteCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  inviteFrom: {
    fontSize: 12,
    marginTop: 4,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  guardianCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  guardianLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    alignItems: "center",
  },
  guardianAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  guardianName: {
    fontSize: 15,
    fontWeight: "600",
  },
  guardianEmail: {
    fontSize: 12,
    marginTop: 4,
  },
  notifItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  notifLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    alignItems: "center",
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  notifDesc: {
    fontSize: 12,
    marginTop: 4,
  },
});
