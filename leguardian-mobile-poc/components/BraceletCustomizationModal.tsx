import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BraceletAvatar } from './BraceletAvatar';
import { braceletCustomizationService } from '../services/BraceletCustomizationService';

interface BraceletCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  braceletId: number;
  braceletName: string;
  onCustomizationSaved?: () => void;
}

export const BraceletCustomizationModal: React.FC<BraceletCustomizationModalProps> = ({
  isOpen,
  onClose,
  braceletId,
  braceletName,
  onCustomizationSaved,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('#2196F3');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentCustomization();
    }
  }, [isOpen, braceletId]);

  const loadCurrentCustomization = async () => {
    const customization = await braceletCustomizationService.getCustomization(braceletId);
    setSelectedColor(customization?.color || '#2196F3');
    setSelectedPhoto(customization?.photoUri || null);
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la caméra');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la galerie');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la photo');
      console.error('Image picker error:', error);
    }
  };

  const handleSaveCustomization = async () => {
    setIsLoading(true);
    try {
      await braceletCustomizationService.saveCustomization(braceletId, {
        color: selectedColor,
        photoUri: selectedPhoto || undefined,
      });
      Alert.alert('Succès', 'Bracelet customisé avec succès');
      onCustomizationSaved?.();
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les changements');
      console.error('Error saving customization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const colors = braceletCustomizationService.getDefaultColors();

  return (
    <Modal
      visible={isOpen}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customiser le bracelet</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Aperçu</Text>
            <View style={styles.previewContainer}>
              <BraceletAvatar
                braceletName={braceletName}
                color={selectedColor}
                photoUri={selectedPhoto || undefined}
                size="large"
              />
              <Text style={styles.previewName}>{braceletName}</Text>
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Couleur</Text>
            <View style={styles.colorGrid}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photo Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <Text style={styles.photoHint}>
              Sélectionnez une photo pour personnaliser le bracelet
            </Text>

            {selectedPhoto && (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: selectedPhoto }}
                  style={styles.photoPreview}
                />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Ionicons name="close" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handlePickImage('camera')}
              >
                <Ionicons name="camera" size={20} color="#2196F3" />
                <Text style={styles.photoButtonText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handlePickImage('gallery')}
              >
                <Ionicons name="image" size={20} color="#2196F3" />
                <Text style={styles.photoButtonText}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSaveCustomization}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  photoHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  photoPreviewContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#e3f2fd',
    borderWidth: 1.5,
    borderColor: '#2196F3',
  },
  photoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
