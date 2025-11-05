import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface LocationCardProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  lastUpdate?: string;
  onEdit?: () => void;
  onViewOnMap?: () => void;
  title?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  latitude,
  longitude,
  accuracy,
  lastUpdate,
  onEdit,
  onViewOnMap,
  title = 'Localisation',
}) => {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);
  return (
    <View style={[styles.container, { backgroundColor: colors.lightBg, borderColor: colors.mediumBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        <Ionicons name="map" size={18} color={colors.textSecondary} />
      </View>

      {/* Coordinates */}
      <View style={[styles.coordinatesBox, { backgroundColor: colors.mediumBg }]}>
        <View style={styles.coordRow}>
          <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>{t('bracelet.latitude')}</Text>
          <Text style={[styles.coordValue, { color: colors.textPrimary }]}>{latitude.toFixed(6)}°</Text>
        </View>
        <View style={styles.coordRow}>
          <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>{t('bracelet.longitude')}</Text>
          <Text style={[styles.coordValue, { color: colors.textPrimary }]}>{longitude.toFixed(6)}°</Text>
        </View>
        {accuracy && (
          <View style={styles.coordRow}>
            <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>{t('bracelet.precision')}</Text>
            <Text style={[styles.coordValue, { color: colors.textPrimary }]}>±{Math.round(accuracy)}m</Text>
          </View>
        )}
      </View>

      {/* Metadata */}
      {lastUpdate && (
        <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
          {t('bracelet.lastUpdate')} {new Date(lastUpdate).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </Text>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        {onEdit && (
          <TouchableOpacity style={[styles.buttonEdit, { backgroundColor: colors.lightBg, borderColor: colors.primary }]} onPress={onEdit}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={[styles.buttonEditText, { color: colors.primary }]}>{t('bracelet.edit')}</Text>
          </TouchableOpacity>
        )}
        {onViewOnMap && (
          <TouchableOpacity style={[styles.buttonMap, { backgroundColor: colors.primary }]} onPress={onViewOnMap}>
            <Ionicons name="map" size={16} color={colors.white} />
            <Text style={[styles.buttonMapText, { color: colors.white }]}>{t('bracelet.viewOnMap')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  coordinatesBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  coordRow__last: {
    marginBottom: 0,
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  lastUpdate: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  buttonEditText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonMap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonMapText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
