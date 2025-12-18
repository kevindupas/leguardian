import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ZoneEditModal } from './ZoneEditModal';
import { ZoneShareModal } from './ZoneShareModal';
import { useSafetyZonesContext } from '../contexts/SafetyZonesContext';
import { useZoneSharing } from '../hooks/useZoneSharing';

interface Zone {
  id: number;
  name: string;
  icon?: string | null | undefined;
  coordinates: Array<{ latitude: number; longitude: number }>;
}

interface SettingsZonesTabProps {
  braceletId: number | null;
  zones: Zone[];
  colors: any;
  sharedGuardians: any[];
}

export const SettingsZonesTab: React.FC<SettingsZonesTabProps> = ({
  braceletId,
  zones,
  colors,
  sharedGuardians,
}) => {
  const { createZone: createZoneContext, updateZoneInContext, deleteZoneFromContext } = useSafetyZonesContext();
  const { shareWithGuardian } = useZoneSharing(braceletId, null);

  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [sharingZone, setSharingZone] = useState<Zone | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setIsEditModalVisible(true);
  };

  const handleShareZone = (zone: Zone) => {
    setSharingZone(zone);
    setIsShareModalVisible(true);
  };

  const handleDeleteZone = (zone: Zone) => {
    Alert.alert(
      'Supprimer la zone',
      `Êtes-vous sûr de vouloir supprimer "${zone.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            if (!braceletId) return;
            setUpdating(true);
            try {
              const success = await deleteZoneFromContext(braceletId, zone.id);
              if (success) {
                Alert.alert('Succès', 'Zone supprimée');
              }
            } finally {
              setUpdating(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSaveZone = async (
    name: string,
    icon: string,
    coordinates: Array<{ latitude: number; longitude: number }>
  ) => {
    if (!braceletId) return;

    setUpdating(true);
    try {
      if (editingZone) {
        // Update zone
        const success = await updateZoneInContext(braceletId, editingZone.id, {
          name,
          icon,
          coordinates,
        });
        if (success) {
          Alert.alert('Succès', 'Zone mise à jour');
          setIsEditModalVisible(false);
          setEditingZone(null);
        }
      } else {
        // Create new zone
        const result = await createZoneContext(braceletId, {
          name,
          icon,
          coordinates,
          notify_on_entry: true,
          notify_on_exit: true,
        });
        if (result) {
          Alert.alert('Succès', 'Zone créée');
          setIsEditModalVisible(false);
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la zone');
    } finally {
      setUpdating(false);
    }
  };

  const handleShareZoneWithGuardian = async (
    guardianId: number,
    permissions: any
  ) => {
    if (!braceletId || !sharingZone) return;

    try {
      const success = await shareWithGuardian(guardianId, permissions);
      if (!success) {
        Alert.alert('Erreur', 'Impossible de partager la zone');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager la zone');
    }
  };

  if (updating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        ZONES DE SÉCURITÉ ({zones.length})
      </Text>

      {zones.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.white }]}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.lightBg }]}>
            <Ionicons
              name="map-outline"
              size={32}
              color={colors.textSecondary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Aucune zone définie
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Créez des zones sûres sur la carte pour être alerté des entrées et sorties.
          </Text>
        </View>
      ) : (
        <View style={[styles.cardGroup, { backgroundColor: colors.white }]}>
          {zones.map((zone, index) => (
            <View key={zone.id}>
              <View style={styles.listItem}>
                <View
                  style={[
                    styles.listIcon,
                    { backgroundColor: colors.primary + '15' },
                  ]}
                >
                  <Ionicons
                    name={(zone.icon || 'navigate') as any}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.listTextContainer}>
                  <Text
                    style={[styles.listTitle, { color: colors.textPrimary }]}
                  >
                    {zone.name}
                  </Text>
                  <Text
                    style={[
                      styles.listSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {zone.coordinates?.length || 0} points de contrôle
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleShareZone(zone)}
                    style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                  >
                    <Ionicons
                      name="share-social"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEditZone(zone)}
                    style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                  >
                    <Ionicons
                      name="pencil"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteZone(zone)}
                    style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {index < zones.length - 1 && (
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

      {/* Edit Modal */}
      <ZoneEditModal
        visible={isEditModalVisible}
        zone={editingZone || undefined}
        colors={colors}
        onSave={handleSaveZone}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingZone(null);
        }}
      />

      {/* Share Modal */}
      {sharingZone && (
        <ZoneShareModal
          visible={isShareModalVisible}
          zoneName={sharingZone.name}
          guardians={sharedGuardians}
          colors={colors}
          onShare={handleShareZoneWithGuardian}
          onCancel={() => {
            setIsShareModalVisible(false);
            setSharingZone(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
});
