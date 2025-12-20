import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NotificationPermissions } from "../utils/types";
import { DEFAULT_PERMISSIONS } from "../hooks/useBraceletNotificationPermissions";

// Activation des animations sur Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAYS = [
  { label: "Lundi", short: "Lun", value: 0 },
  { label: "Mardi", short: "Mar", value: 1 },
  { label: "Mercredi", short: "Mer", value: 2 },
  { label: "Jeudi", short: "Jeu", value: 3 },
  { label: "Vendredi", short: "Ven", value: 4 },
  { label: "Samedi", short: "Sam", value: 5 },
  { label: "Dimanche", short: "Dim", value: 6 },
];

export const BraceletNotificationPermissionsModal: React.FC<any> = ({
  visible,
  guardianName,
  initialPermissions,
  colors,
  onSave,
  onCancel,
}) => {
  const [permissions, setPermissions] =
    useState<NotificationPermissions>(initialPermissions || DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(0); // Lundi par défaut

  useEffect(() => {
    if (visible && initialPermissions) {
      const prep = { ...initialPermissions };
      // Ensure schedule object exists
      if (!prep.schedule) {
        prep.schedule = {
          enabled: false,
          allowed_days: [0, 1, 2, 3, 4, 5, 6],
          daily_config: {},
        };
      }
      // Initialisation de la structure quotidienne si elle n'existe pas
      if (!prep.schedule.daily_config) {
        prep.schedule.daily_config = {};
        DAYS.forEach((d) => {
          prep.schedule.daily_config![d.value] =
            prep.schedule.allowed_days.includes(d.value)
              ? [
                  ...(prep.schedule.time_blocks || [
                    { start_hour: 8, end_hour: 18 },
                  ]),
                ]
              : [];
        });
      }
      setPermissions(prep);
    }
  }, [visible, initialPermissions]);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  // --- ACTIONS ---
  const addBlock = (day: number) => {
    animate();
    setPermissions((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        daily_config: {
          ...prev.schedule.daily_config,
          [day]: [
            ...(prev.schedule.daily_config?.[day] || []),
            { start_hour: 9, end_hour: 17 },
          ],
        },
      },
    }));
  };

  const updateBlock = (
    day: number,
    idx: number,
    key: "start_hour" | "end_hour",
    val: number
  ) => {
    setPermissions((prev) => {
      const newBlocks = [...prev.schedule.daily_config![day]];
      newBlocks[idx] = { ...newBlocks[idx], [key]: val };
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          daily_config: { ...prev.schedule.daily_config, [day]: newBlocks },
        },
      };
    });
  };

  const removeBlock = (day: number, idx: number) => {
    animate();
    setPermissions((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        daily_config: {
          ...prev.schedule.daily_config,
          [day]: prev.schedule.daily_config![day].filter((_, i) => i !== idx),
        },
      },
    }));
  };

  const copyToAll = () => {
    Alert.alert(
      "Copier le planning",
      `Appliquer les horaires de ${DAYS[activeDay].label} à tous les autres jours ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Copier",
          onPress: () => {
            animate();
            const source = permissions.schedule.daily_config![activeDay];
            setPermissions((prev) => {
              const newConf = { ...prev.schedule.daily_config };
              DAYS.forEach((d) => {
                newConf[d.value] = [...source];
              });
              return {
                ...prev,
                schedule: { ...prev.schedule, daily_config: newConf },
              };
            });
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log(
        "[BraceletNotificationPermissionsModal] Saving permissions:",
        JSON.stringify(permissions, null, 2)
      );
      await onSave(permissions);
      console.log("[BraceletNotificationPermissionsModal] Save successful");
      onCancel();
    } catch (err) {
      console.error("[BraceletNotificationPermissionsModal] Save failed:", err);
      Alert.alert("Erreur", "Impossible de sauvegarder");
    } finally {
      setSaving(false);
    }
  };

  const currentDayBlocks = permissions.schedule.daily_config?.[activeDay] || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={[styles.container, { backgroundColor: colors.lightBg }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.mediumBg }]}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
              Annuler
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Planning des alertes
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Enregistrer
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* SECTION 1: ACTIVATION GÉNÉRALE */}
          <View style={styles.section}>
            <View style={[styles.card, { backgroundColor: colors.white }]}>
              <View style={styles.row}>
                <View style={styles.labelGroup}>
                  <Text
                    style={[styles.cardTitle, { color: colors.textPrimary }]}
                  >
                    Notifications actives
                  </Text>
                  <Text
                    style={[styles.cardSub, { color: colors.textSecondary }]}
                  >
                    Recevoir des alertes sur ce téléphone
                  </Text>
                </View>
                <Switch
                  value={permissions.enabled}
                  onValueChange={(v) =>
                    setPermissions((p) => ({ ...p, enabled: v }))
                  }
                  trackColor={{ false: colors.mediumBg, true: colors.primary }}
                />
              </View>
              {permissions.enabled && (
                <>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.lightBg },
                    ]}
                  />
                  <View style={styles.row}>
                    <Text
                      style={[styles.cardTitle, { color: colors.textPrimary }]}
                    >
                      Utiliser un planning
                    </Text>
                    <Switch
                      value={permissions.schedule.enabled}
                      onValueChange={(v) => {
                        animate();
                        setPermissions((p) => ({
                          ...p,
                          schedule: { ...p.schedule, enabled: v },
                        }));
                      }}
                      trackColor={{
                        false: colors.mediumBg,
                        true: colors.primary,
                      }}
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          {permissions.enabled && permissions.schedule.enabled && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  PLANNING HEBDOMADAIRE
                </Text>
                <TouchableOpacity onPress={copyToAll} style={styles.copyBtn}>
                  <Ionicons
                    name="copy-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    Copier partout
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SÉLECTEUR DE JOURS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayPicker}
              >
                {DAYS.map((d) => {
                  const isActive = activeDay === d.value;
                  const hasData =
                    (permissions.schedule.daily_config?.[d.value] || [])
                      .length > 0;
                  return (
                    <TouchableOpacity
                      key={d.value}
                      onPress={() => {
                        animate();
                        setActiveDay(d.value);
                      }}
                      style={[
                        styles.dayPill,
                        {
                          backgroundColor: isActive
                            ? colors.primary
                            : colors.white,
                        },
                        !isActive &&
                          hasData && {
                            borderColor: colors.primary + "40",
                            borderWidth: 1,
                          },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          { color: isActive ? "white" : colors.textPrimary },
                        ]}
                      >
                        {d.short}
                      </Text>
                      {hasData && (
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: isActive
                                ? "white"
                                : colors.primary,
                            },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* CRÉNEAUX DU JOUR */}
              <View style={[styles.card, { backgroundColor: colors.white }]}>
                <Text
                  style={[styles.dayIndicator, { color: colors.textPrimary }]}
                >
                  Programmation du {DAYS[activeDay].label}
                </Text>

                {currentDayBlocks.length > 0 ? (
                  currentDayBlocks.map((block: any, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.timeCard,
                        { backgroundColor: colors.lightBg },
                      ]}
                    >
                      <View style={styles.timeInputs}>
                        <TimeStep
                          title="DE"
                          value={block.start_hour}
                          onChange={(v: number) =>
                            updateBlock(activeDay, idx, "start_hour", v)
                          }
                          colors={colors}
                        />
                        <View style={styles.timeArrow}>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={colors.textSecondary}
                          />
                        </View>
                        <TimeStep
                          title="À"
                          value={block.end_hour}
                          onChange={(v: number) =>
                            updateBlock(activeDay, idx, "end_hour", v)
                          }
                          colors={colors}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => removeBlock(activeDay, idx)}
                        style={styles.removeIcon}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyDay}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontStyle: "italic",
                      }}
                    >
                      Aucune alerte ce jour-là
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.addBtn, { borderColor: colors.primary }]}
                  onPress={() => addBlock(activeDay)}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>
                    Ajouter un créneau
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SECTION TYPES D'ALERTES */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              TYPES D'ALERTES
            </Text>
            <View style={[styles.card, { backgroundColor: colors.white }]}>
              <NotifToggle
                icon="enter-outline"
                label="Entrée de zone"
                value={permissions.types.zone_entry}
                onToggle={(v: any) =>
                  setPermissions((p) => ({
                    ...p,
                    types: { ...p.types, zone_entry: v },
                  }))
                }
                color="#4CAF50"
                colors={colors}
              />
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.lightBg, marginLeft: 44 },
                ]}
              />
              <NotifToggle
                icon="exit-outline"
                label="Sortie de zone"
                value={permissions.types.zone_exit}
                onToggle={(v: any) =>
                  setPermissions((p) => ({
                    ...p,
                    types: { ...p.types, zone_exit: v },
                  }))
                }
                color="#FF9800"
                colors={colors}
              />
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.lightBg, marginLeft: 44 },
                ]}
              />
              <NotifToggle
                icon="alert-circle-outline"
                label="SOS / Urgence"
                value={permissions.types.emergency}
                onToggle={(v: any) =>
                  setPermissions((p) => ({
                    ...p,
                    types: { ...p.types, emergency: v },
                  }))
                }
                color="#F44336"
                colors={colors}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// --- MINI COMPOSANTS ---

const TimeStep = ({ title, value, onChange, colors }: any) => (
  <View style={styles.timeStepContainer}>
    <Text style={styles.timeStepTitle}>{title}</Text>
    <View style={[styles.timePicker, { backgroundColor: colors.white }]}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(0, value - 1))}
        style={styles.timeBtn}
      >
        <Ionicons name="remove" size={14} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.timeVal, { color: colors.textPrimary }]}>
        {value}h
      </Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(23, value + 1))}
        style={styles.timeBtn}
      >
        <Ionicons name="add" size={14} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  </View>
);

const NotifToggle = ({ icon, label, value, onToggle, color, colors }: any) => (
  <View style={styles.row}>
    <View style={styles.iconLabel}>
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        {label}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.mediumBg, true: colors.primary }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "white",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelGroup: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },
  dayPicker: { flexDirection: "row", marginBottom: 15 },
  dayPill: {
    width: 52,
    height: 65,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "white",
  },
  dayPillText: { fontSize: 14, fontWeight: "800" },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  dayIndicator: { fontSize: 15, fontWeight: "700", marginBottom: 5 },
  timeCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeInputs: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  timeStepContainer: { alignItems: "center", gap: 6 },
  timeStepTitle: { fontSize: 10, fontWeight: "bold", color: "#999" },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 4,
  },
  timeBtn: { padding: 6 },
  timeVal: { fontSize: 16, fontWeight: "800", width: 40, textAlign: "center" },
  timeArrow: { marginTop: 16 },
  removeIcon: { marginLeft: 10 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1.5,
    marginTop: 8,
    gap: 8,
  },
  emptyDay: { padding: 20, alignItems: "center" },
  iconLabel: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
