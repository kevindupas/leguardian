import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationPermissions, NotificationSchedule } from '../utils/types';

const DAYS = [
  { label: 'Lun', value: 0 },
  { label: 'Mar', value: 1 },
  { label: 'Mer', value: 2 },
  { label: 'Jeu', value: 3 },
  { label: 'Ven', value: 4 },
  { label: 'Sam', value: 5 },
  { label: 'Dim', value: 6 },
];

interface BraceletNotificationPermissionsModalProps {
  visible: boolean;
  guardianName: string;
  initialPermissions: NotificationPermissions;
  colors: any;
  onSave: (permissions: NotificationPermissions) => Promise<void>;
  onCancel: () => void;
}

export const BraceletNotificationPermissionsModal: React.FC<
  BraceletNotificationPermissionsModalProps
> = ({ visible, guardianName, initialPermissions, colors, onSave, onCancel }) => {
  const [permissions, setPermissions] = useState<NotificationPermissions>(
    initialPermissions
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [visible, initialPermissions]);

  const toggleNotifications = (value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      enabled: value,
    }));
  };

  const toggleNotificationType = (
    type: 'zone_entry' | 'zone_exit' | 'emergency' | 'low_battery',
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: value,
      },
    }));
  };

  const toggleDay = (day: number) => {
    setPermissions((prev) => {
      const allowed_days = prev.schedule.allowed_days.includes(day)
        ? prev.schedule.allowed_days.filter((d) => d !== day)
        : [...prev.schedule.allowed_days, day].sort();

      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          allowed_days,
        },
      };
    });
  };

  const setStartHour = (hour: number) => {
    setPermissions((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        start_hour: hour,
      },
    }));
  };

  const setEndHour = (hour: number) => {
    setPermissions((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        end_hour: hour,
      },
    }));
  };

  const toggleSchedule = (value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        enabled: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(permissions);
      Alert.alert('Succès', 'Permissions mises à jour');
      onCancel();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les permissions');
    } finally {
      setSaving(false);
    }
  };

  const getScheduleText = (): string => {
    if (!permissions.schedule.enabled) {
      return 'Pas de restriction horaire';
    }

    const days = permissions.schedule.allowed_days.length;
    const daysPerWeek = days === 7 ? 'Tous les jours' : `${days} jours/semaine`;
    const hours = `${permissions.schedule.start_hour}h - ${permissions.schedule.end_hour}h`;

    return `${daysPerWeek}, ${hours}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.lightBg }]} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Notifications pour {guardianName}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              { backgroundColor: saving ? colors.mediumBg : colors.primary },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="checkmark" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Main Toggle */}
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <View style={styles.row}>
              <View>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  Activer les notifications
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Si désactivé, aucune notification ne sera reçue
                </Text>
              </View>
              <Switch
                value={permissions.enabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.lightBg, true: colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>

          {permissions.enabled && (
            <>
              {/* Notification Types */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  TYPES DE NOTIFICATIONS
                </Text>
                <View style={[styles.card, { backgroundColor: colors.white }]}>
                  <NotificationTypeRow
                    icon="enter-outline"
                    color="#4CAF50"
                    title="Entrée de zone"
                    description="Alerté quand elle entre dans une zone"
                    value={permissions.types.zone_entry}
                    onToggle={() =>
                      toggleNotificationType('zone_entry', !permissions.types.zone_entry)
                    }
                    colors={colors}
                  />
                  <Divider colors={colors} />

                  <NotificationTypeRow
                    icon="exit-outline"
                    color="#FF9800"
                    title="Sortie de zone"
                    description="Alerté quand elle sort d'une zone"
                    value={permissions.types.zone_exit}
                    onToggle={() =>
                      toggleNotificationType('zone_exit', !permissions.types.zone_exit)
                    }
                    colors={colors}
                  />
                  <Divider colors={colors} />

                  <NotificationTypeRow
                    icon="alert-circle"
                    color="#F44336"
                    title="SOS / Urgence"
                    description="Alerté en cas d'urgence"
                    value={permissions.types.emergency}
                    onToggle={() =>
                      toggleNotificationType('emergency', !permissions.types.emergency)
                    }
                    colors={colors}
                  />
                  <Divider colors={colors} />

                  <NotificationTypeRow
                    icon="battery-dead"
                    color={colors.textSecondary}
                    title="Batterie faible"
                    description="Alerté quand la batterie est faible"
                    value={permissions.types.low_battery}
                    onToggle={() =>
                      toggleNotificationType('low_battery', !permissions.types.low_battery)
                    }
                    colors={colors}
                    isLast
                  />
                </View>
              </View>

              {/* Schedule Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  HORAIRES
                </Text>

                <View style={[styles.card, { backgroundColor: colors.white }]}>
                  <View style={styles.row}>
                    <View>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>
                        Limiter par horaire
                      </Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {getScheduleText()}
                      </Text>
                    </View>
                    <Switch
                      value={permissions.schedule.enabled}
                      onValueChange={toggleSchedule}
                      trackColor={{ false: colors.lightBg, true: colors.primary }}
                      thumbColor="white"
                    />
                  </View>
                </View>

                {permissions.schedule.enabled && (
                  <>
                    {/* Time Selectors */}
                    <View style={[styles.card, { backgroundColor: colors.white }]}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                        Heures
                      </Text>

                      <View style={styles.timeRow}>
                        <View style={styles.timeSection}>
                          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                            De
                          </Text>
                          <HourSelector
                            value={permissions.schedule.start_hour}
                            onChange={setStartHour}
                            colors={colors}
                          />
                        </View>

                        <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>
                          à
                        </Text>

                        <View style={styles.timeSection}>
                          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                            À
                          </Text>
                          <HourSelector
                            value={permissions.schedule.end_hour}
                            onChange={setEndHour}
                            colors={colors}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Days Selector */}
                    <View style={[styles.card, { backgroundColor: colors.white }]}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                        Jours de la semaine
                      </Text>

                      <View style={styles.daysGrid}>
                        {DAYS.map((day) => (
                          <TouchableOpacity
                            key={day.value}
                            onPress={() => toggleDay(day.value)}
                            style={[
                              styles.dayButton,
                              {
                                backgroundColor: permissions.schedule.allowed_days.includes(
                                  day.value
                                )
                                  ? colors.primary
                                  : colors.lightBg,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayLabel,
                                {
                                  color: permissions.schedule.allowed_days.includes(day.value)
                                    ? 'white'
                                    : colors.textSecondary,
                                },
                              ]}
                            >
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Summary */}
              <View
                style={[
                  styles.card,
                  styles.summaryCard,
                  { backgroundColor: colors.primary + '10' },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Ionicons
                    name="information-circle"
                    size={24}
                    color={colors.primary}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                      Récapitulatif
                    </Text>
                    <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                      {permissions.enabled
                        ? `Notifications ${permissions.schedule.enabled ? `limitées à ${getScheduleText().toLowerCase()}` : 'sans restriction'}`
                        : 'Notifications désactivées'}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Sub-components

const NotificationTypeRow = ({
  icon,
  color,
  title,
  description,
  value,
  onToggle,
  colors,
  isLast = false,
}: any) => (
  <>
    <View style={styles.notifRow}>
      <View style={[styles.notifIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="white" />
      </View>
      <View style={styles.notifInfo}>
        <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.notifDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.lightBg, true: color }}
        thumbColor="white"
      />
    </View>
    {!isLast && <Divider colors={colors} />}
  </>
);

const HourSelector = ({ value, onChange, colors }: any) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.hourSelector}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(0, value - 1))}
        style={[styles.hourArrow, { backgroundColor: colors.lightBg }]}
      >
        <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={[styles.hourValue, { color: colors.textPrimary }]}>
        {String(value).padStart(2, '0')}:00
      </Text>

      <TouchableOpacity
        onPress={() => onChange(Math.min(23, value + 1))}
        style={[styles.hourArrow, { backgroundColor: colors.lightBg }]}
      >
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const Divider = ({ colors }: any) => (
  <View style={[styles.divider, { backgroundColor: colors.lightBg }]} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Notification Types
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  notifIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  notifDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
  },

  // Time Selectors
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  timeSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  hourSelector: {
    alignItems: 'center',
    gap: 8,
  },
  hourArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourValue: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
  },

  // Days
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Summary
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
