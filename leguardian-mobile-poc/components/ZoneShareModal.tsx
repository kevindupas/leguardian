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
import { ZonePermissions } from '../services/zoneShareService';

interface Guardian {
  id: number;
  name: string;
  email: string;
}

interface ZoneShareModalProps {
  visible: boolean;
  zoneName: string;
  guardians: Guardian[];
  colors: any;
  onShare: (guardianId: number, permissions: ZonePermissions) => Promise<void>;
  onCancel: () => void;
}

interface SelectedGuardian {
  guardianId: number;
  permissions: ZonePermissions;
}

export const ZoneShareModal: React.FC<ZoneShareModalProps> = ({
  visible,
  zoneName,
  guardians,
  colors,
  onShare,
  onCancel,
}) => {
  const [selectedGuardians, setSelectedGuardians] = useState<SelectedGuardian[]>([]);
  const [sharing, setSharing] = useState(false);

  const toggleGuardian = (guardianId: number) => {
    setSelectedGuardians((prev) => {
      const existing = prev.find((g) => g.guardianId === guardianId);
      if (existing) {
        return prev.filter((g) => g.guardianId !== guardianId);
      } else {
        return [
          ...prev,
          {
            guardianId,
            permissions: { can_view: true, can_edit: false, can_delete: false },
          },
        ];
      }
    });
  };

  const updatePermission = (
    guardianId: number,
    permission: keyof ZonePermissions,
    value: boolean
  ) => {
    setSelectedGuardians((prev) =>
      prev.map((g) =>
        g.guardianId === guardianId
          ? { ...g, permissions: { ...g.permissions, [permission]: value } }
          : g
      )
    );
  };

  const handleShare = async () => {
    if (selectedGuardians.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un gardien');
      return;
    }

    setSharing(true);
    try {
      for (const selected of selectedGuardians) {
        await onShare(selected.guardianId, selected.permissions);
      }
      Alert.alert('Succès', 'Zone partagée avec succès');
      onCancel();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager la zone');
    } finally {
      setSharing(false);
    }
  };

  const isGuardianSelected = (guardianId: number) =>
    selectedGuardians.some((g) => g.guardianId === guardianId);

  const getGuardianPermissions = (guardianId: number) =>
    selectedGuardians.find((g) => g.guardianId === guardianId)?.permissions;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.lightBg }]}>
          <TouchableOpacity onPress={onCancel} disabled={sharing}>
            <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>Annuler</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Partager "{zoneName}"
          </Text>
          <TouchableOpacity onPress={handleShare} disabled={sharing || selectedGuardians.length === 0}>
            {sharing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.headerBtn,
                  {
                    color: selectedGuardians.length > 0 ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                Partager
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {guardians.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun gardien avec qui partager
              </Text>
            </View>
          ) : (
            <View style={[styles.cardGroup, { backgroundColor: colors.lightBg }]}>
              {guardians.map((guardian, index) => {
                const isSelected = isGuardianSelected(guardian.id);
                const permissions = getGuardianPermissions(guardian.id);

                return (
                  <View key={guardian.id}>
                    {/* Guardian Selection */}
                    <TouchableOpacity
                      onPress={() => toggleGuardian(guardian.id)}
                      disabled={sharing}
                      style={[
                        styles.guardianItem,
                        {
                          backgroundColor: isSelected ? colors.primary + '10' : colors.white,
                        },
                      ]}
                    >
                      <View style={styles.guardianLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: colors.primary,
                              backgroundColor: isSelected ? colors.primary : 'transparent',
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </View>
                        <View style={styles.guardianInfo}>
                          <Text style={[styles.guardianName, { color: colors.textPrimary }]}>
                            {guardian.name}
                          </Text>
                          <Text style={[styles.guardianEmail, { color: colors.textSecondary }]}>
                            {guardian.email}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Permissions */}
                    {isSelected && permissions && (
                      <View style={[styles.permissions, { backgroundColor: colors.white }]}>
                        <PermissionRow
                          icon="eye"
                          title="Voir la zone"
                          description="Accès en lecture"
                          value={permissions.can_view}
                          onValueChange={(val) =>
                            updatePermission(guardian.id, 'can_view', val)
                          }
                          colors={colors}
                          disabled={sharing}
                        />
                        <PermissionRow
                          icon="pencil"
                          title="Modifier la zone"
                          description="Éditer les points et les détails"
                          value={permissions.can_edit}
                          onValueChange={(val) =>
                            updatePermission(guardian.id, 'can_edit', val)
                          }
                          colors={colors}
                          disabled={sharing}
                        />
                        <PermissionRow
                          icon="trash"
                          title="Supprimer la zone"
                          description="Accès à la suppression"
                          value={permissions.can_delete}
                          onValueChange={(val) =>
                            updatePermission(guardian.id, 'can_delete', val)
                          }
                          colors={colors}
                          disabled={sharing}
                          isDanger
                        />
                      </View>
                    )}

                    {index < guardians.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: colors.lightBg }]} />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.lightBg }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textPrimary }]}>
              Les gardiens sélectionnés auront accès à cette zone selon les permissions choisies.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

interface PermissionRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: any;
  disabled?: boolean;
  isDanger?: boolean;
}

const PermissionRow: React.FC<PermissionRowProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  colors,
  disabled,
  isDanger,
}) => (
  <View style={styles.permissionItem}>
    <View
      style={[
        styles.permissionIcon,
        { backgroundColor: isDanger ? colors.danger + '15' : colors.primary + '15' },
      ]}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={isDanger ? colors.danger : colors.primary}
      />
    </View>
    <View style={styles.permissionText}>
      <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.lightBg, true: colors.primary + '40' }}
      thumbColor={value ? colors.primary : colors.textSecondary}
    />
  </View>
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
    borderBottomWidth: 1,
  },
  headerBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '60%',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 16,
  },
  cardGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  guardianItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  guardianLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guardianInfo: {
    flex: 1,
  },
  guardianName: {
    fontSize: 15,
    fontWeight: '600',
  },
  guardianEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  permissions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  permissionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  separator: {
    height: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
