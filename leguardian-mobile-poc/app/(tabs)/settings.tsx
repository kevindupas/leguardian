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
  Modal,
  FlatList,
  Switch,
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
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Paramètres
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Bracelet Selector */}
      {bracelets.length > 1 && (
        <View style={[styles.braceletSelector, { borderBottomColor: colors.lightBg }]}>
          <FlatList
            data={bracelets}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedBraceletId(item.id)}
                style={[
                  styles.braceletTab,
                  {
                    backgroundColor:
                      selectedBraceletId === item.id
                        ? colors.primary
                        : colors.lightBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.braceletTabText,
                    {
                      color:
                        selectedBraceletId === item.id
                          ? "white"
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {item.alias || item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { borderBottomColor: colors.lightBg }]}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <TabButton
          icon="map"
          label="Zones"
          active={activeTab === "zones"}
          onPress={() => setActiveTab("zones")}
          colors={colors}
        />
        <TabButton
          icon="share-social"
          label="Partage"
          active={activeTab === "sharing"}
          onPress={() => setActiveTab("sharing")}
          colors={colors}
        />
        <TabButton
          icon="notifications"
          label="Notifications"
          active={activeTab === "notifications"}
          onPress={() => setActiveTab("notifications")}
          colors={colors}
        />
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        {activeTab === "zones" && (
          <ZonesSection zones={zones} colors={colors} braceletId={selectedBraceletId} />
        )}
        {activeTab === "sharing" && (
          <SharingSection
            sharedGuardians={sharedGuardians}
            pendingInvitations={pendingInvitations}
            colors={colors}
            onShare={shareWithGuardian}
            onAccept={acceptInvitation}
            onDecline={declineInvitation}
            onRevoke={revokeAccess}
            braceletId={selectedBraceletId}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsSection colors={colors} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ icon, label, active, onPress, colors }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tab,
        active && {
          borderBottomColor: colors.primary,
          borderBottomWidth: 2,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.tabText,
          {
            color: active ? colors.primary : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ZonesSection({ zones, colors, braceletId }: any) {
  const handleDeleteZone = (zoneId: number, zoneName: string) => {
    Alert.alert(
      "Supprimer la zone",
      `Êtes-vous sûr de vouloir supprimer "${zoneName}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          onPress: () => {
            // TODO: Call delete zone API
            console.log("Delete zone:", zoneId);
            Alert.alert("Succès", "Zone supprimée");
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Zones de sécurité ({zones.length})
      </Text>

      {zones.map((zone: any) => (
        <View
          key={zone.id}
          style={[styles.card, { backgroundColor: colors.lightBg }]}
        >
          <View style={styles.zoneHeader}>
            <View style={styles.zoneInfo}>
              <Ionicons name={zone.icon} size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneName, { color: colors.textPrimary }]}>
                  {zone.name}
                </Text>
                <Text
                  style={[
                    styles.zoneSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {zone.coordinates?.length || 0} points
                </Text>
              </View>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity
                onPress={() => {
                  // TODO: Navigate to edit zone
                  Alert.alert("À venir", "Édition de zone non implémentée");
                }}
              >
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteZone(zone.id, zone.name)}
              >
                <Ionicons name="trash" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {zones.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Aucune zone créée
        </Text>
      )}
    </View>
  );
}

function SharingSection({
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

  const handleShare = async () => {
    if (!email.trim()) return;
    setSharing(true);
    try {
      await onShare(email);
      setEmail("");
      Alert.alert("Succès", "Invitation envoyée à " + email);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de partager");
    } finally {
      setSharing(false);
    }
  };

  return (
    <View>
      {/* Share Form */}
      <View style={[styles.shareForm, { backgroundColor: colors.lightBg }]}>
        <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
          Partager ce bracelet
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.textPrimary, borderColor: colors.primary },
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
            styles.shareButton,
            {
              backgroundColor: colors.primary,
              opacity: sharing || !email.trim() ? 0.5 : 1,
            },
          ]}
        >
          {sharing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.shareButtonText}>Envoyer invitation</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Invitations reçues
          </Text>
          {pendingInvitations.map((invitation: any) => (
            <View
              key={invitation.bracelet_id}
              style={[styles.card, { backgroundColor: colors.lightBg }]}
            >
              <Text style={[styles.invitationText, { color: colors.textPrimary }]}>
                {invitation.bracelet_name}
              </Text>
              <Text style={[styles.invitationFrom, { color: colors.textSecondary }]}>
                De: {invitation.shared_by || "Utilisateur"}
              </Text>
              <View style={styles.invitationActions}>
                <TouchableOpacity
                  onPress={() => onAccept(invitation.bracelet_id)}
                  style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.btnText}>Accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDecline(invitation.bracelet_id)}
                  style={[styles.declineBtn, { backgroundColor: colors.lightBg }]}
                >
                  <Text style={[styles.btnText, { color: colors.danger }]}>
                    Refuser
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Shared With */}
      {sharedGuardians.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Partagé avec ({sharedGuardians.length})
          </Text>
          {sharedGuardians.map((guardian: any) => (
            <View
              key={guardian.id}
              style={[styles.card, { backgroundColor: colors.lightBg }]}
            >
              <View style={styles.guardianInfo}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.guardianName, { color: colors.textPrimary }]}
                  >
                    {guardian.name}
                  </Text>
                  <Text
                    style={[
                      styles.guardianEmail,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {guardian.email}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Révoquer l'accès",
                      `Êtes-vous sûr de révoquer l'accès à ${guardian.name} ?`,
                      [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Révoquer",
                          onPress: () => onRevoke(guardian.id),
                          style: "destructive",
                        },
                      ]
                    )
                  }
                >
                  <Ionicons name="close" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {sharedGuardians.length === 0 && pendingInvitations.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Aucun partage
        </Text>
      )}
    </View>
  );
}

function NotificationsSection({ colors }: any) {
  const [notifications, setNotifications] = useState({
    zoneEntry: true,
    zoneExit: true,
    emergencyAlert: true,
    braceletSharing: true,
  });

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Alertes et notifications
      </Text>

      <NotificationToggle
        icon="map"
        title="Entrée zone"
        subtitle="Alerte quand le bracelet entre dans une zone"
        value={notifications.zoneEntry}
        onToggle={(val) =>
          setNotifications({ ...notifications, zoneEntry: val })
        }
        colors={colors}
      />

      <NotificationToggle
        icon="exit"
        title="Sortie zone"
        subtitle="Alerte quand le bracelet quitte une zone"
        value={notifications.zoneExit}
        onToggle={(val) =>
          setNotifications({ ...notifications, zoneExit: val })
        }
        colors={colors}
      />

      <NotificationToggle
        icon="alert-circle"
        title="Alerte d'urgence"
        subtitle="Notification en cas d'urgence"
        value={notifications.emergencyAlert}
        onToggle={(val) =>
          setNotifications({ ...notifications, emergencyAlert: val })
        }
        colors={colors}
      />

      <NotificationToggle
        icon="share-social"
        title="Partage de bracelet"
        subtitle="Notification quand quelqu'un partage un bracelet"
        value={notifications.braceletSharing}
        onToggle={(val) =>
          setNotifications({ ...notifications, braceletSharing: val })
        }
        colors={colors}
      />
    </View>
  );
}

function NotificationToggle({ icon, title, subtitle, value, onToggle, colors }: any) {
  return (
    <View
      style={[styles.card, { backgroundColor: colors.lightBg, marginBottom: 12 }]}
    >
      <View style={styles.notificationRow}>
        <View style={styles.notificationInfo}>
          <View style={styles.notificationIcon}>
            <Ionicons name={icon} size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>
              {title}
            </Text>
            <Text style={[styles.notificationSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{
            false: colors.lightBg,
            true: colors.primary + "40",
          }}
          thumbColor={value ? colors.primary : colors.textSecondary}
        />
      </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  braceletSelector: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  braceletTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  braceletTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabsContainer: {
    borderBottomWidth: 1,
    paddingTop: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 20,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zoneInfo: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  zoneName: {
    fontSize: 15,
    fontWeight: "600",
  },
  zoneSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  zoneActions: {
    flexDirection: "row",
    gap: 12,
  },
  shareForm: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  shareButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  shareButtonText: {
    color: "white",
    fontWeight: "600",
  },
  invitationText: {
    fontSize: 15,
    fontWeight: "600",
  },
  invitationFrom: {
    fontSize: 13,
    marginTop: 4,
  },
  invitationActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  guardianInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  guardianName: {
    fontSize: 15,
    fontWeight: "600",
  },
  guardianEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  notificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationInfo: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    alignItems: "center",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  notificationSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  danger: {
    color: "#ef4444",
  },
});
