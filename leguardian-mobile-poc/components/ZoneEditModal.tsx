import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const ZONE_ICONS = [
  'home',
  'school',
  'briefcase',
  'alert-circle',
  'leaf',
  'bicycle',
  'navigate',
];

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface ZoneEditModalProps {
  visible: boolean;
  zone?: {
    id: number;
    name: string;
    icon: string;
    coordinates: Coordinate[];
  };
  colors: any;
  onSave: (name: string, icon: string, coordinates: Coordinate[]) => Promise<void>;
  onCancel: () => void;
}

export const ZoneEditModal: React.FC<ZoneEditModalProps> = ({
  visible,
  zone,
  colors,
  onSave,
  onCancel,
}) => {
  const mapRef = useRef<MapView>(null);
  const [zoneName, setZoneName] = useState(zone?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(zone?.icon || 'home');
  const [coordinates, setCoordinates] = useState<Coordinate[]>(zone?.coordinates || []);
  const [isDrawing, setIsDrawing] = useState(!zone); // Edit mode = false drawing
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (zone) {
      setZoneName(zone.name);
      setSelectedIcon(zone.icon);
      setCoordinates(zone.coordinates);
      setIsDrawing(false);
    } else {
      setZoneName('');
      setSelectedIcon('home');
      setCoordinates([]);
      setIsDrawing(true);
    }
  }, [zone, visible]);

  const handleMapPress = (e: any) => {
    if (!isDrawing) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoordinates([...coordinates, { latitude, longitude }]);
  };

  const handleRemovePoint = (index: number) => {
    setCoordinates(coordinates.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!zoneName.trim()) {
      Alert.alert('Erreur', 'Le nom de la zone est requis');
      return;
    }

    if (coordinates.length < 3) {
      Alert.alert('Erreur', 'La zone doit avoir au moins 3 points');
      return;
    }

    setSaving(true);
    try {
      await onSave(zoneName, selectedIcon, coordinates);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.lightBg }]}>
          <TouchableOpacity onPress={onCancel} disabled={saving}>
            <Text style={[styles.headerBtn, { color: colors.primary }]}>Annuler</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {zone ? 'Éditer' : 'Nouvelle'} Zone
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.headerBtn, { color: colors.primary }]}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            onPress={handleMapPress}
            initialRegion={{
              latitude: coordinates[0]?.latitude || 48.8566,
              longitude: coordinates[0]?.longitude || 2.3522,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Draw polygon if zone editing */}
            {coordinates.length > 0 && (
              <>
                {coordinates.map((coord, idx) => (
                  <Marker
                    key={idx}
                    coordinate={coord}
                    title={`Point ${idx + 1}`}
                    onPress={() => handleRemovePoint(idx)}
                  >
                    <View style={[styles.markerDot, { backgroundColor: colors.primary }]} />
                  </Marker>
                ))}
                {coordinates.length > 2 && (
                  <Polygon
                    coordinates={coordinates}
                    fillColor={colors.primary + '30'}
                    strokeColor={colors.primary}
                    strokeWidth={2}
                  />
                )}
              </>
            )}
          </MapView>

          {/* Map Instructions */}
          {isDrawing && (
            <View style={[styles.mapInfo, { backgroundColor: colors.lightBg }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[styles.mapInfoText, { color: colors.textPrimary }]}>
                Appuyez sur la carte pour ajouter des points ({coordinates.length}/3+)
              </Text>
            </View>
          )}
        </View>

        {/* Form */}
        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          {/* Zone Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Nom de la zone</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.primary,
                  backgroundColor: colors.lightBg,
                },
              ]}
              placeholder="Ex: Maison, École..."
              placeholderTextColor={colors.textSecondary}
              value={zoneName}
              onChangeText={setZoneName}
              editable={!saving}
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Icône</Text>
            <View style={styles.iconGrid}>
              {ZONE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  disabled={saving}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        selectedIcon === icon ? colors.primary + '20' : colors.lightBg,
                      borderColor: selectedIcon === icon ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={selectedIcon === icon ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Points Display */}
          {coordinates.length > 0 && (
            <View style={styles.formGroup}>
              <View style={styles.pointsHeader}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  Points ({coordinates.length})
                </Text>
                {isDrawing && (
                  <TouchableOpacity
                    onPress={() => setCoordinates([])}
                    disabled={saving}
                    style={styles.clearBtn}
                  >
                    <Text style={[styles.clearBtnText, { color: colors.danger }]}>Effacer</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.pointsList, { backgroundColor: colors.lightBg }]}>
                {coordinates.map((coord, idx) => (
                  <View key={idx} style={styles.pointItem}>
                    <Text style={[styles.pointText, { color: colors.textPrimary }]}>
                      {idx + 1}. {coord.latitude.toFixed(4)}, {coord.longitude.toFixed(4)}
                    </Text>
                    {isDrawing && (
                      <TouchableOpacity onPress={() => handleRemovePoint(idx)}>
                        <Ionicons name="close" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
    fontSize: 18,
    fontWeight: '700',
  },
  mapContainer: {
    height: 250,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsList: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  pointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointText: {
    fontSize: 12,
    fontFamily: 'Courier New',
  },
});
