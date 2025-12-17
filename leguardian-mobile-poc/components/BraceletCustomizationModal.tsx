import React, { useState, useEffect } from "react";
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
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BraceletAvatar } from "./BraceletAvatar";
import { braceletCustomizationService } from "../services/BraceletCustomizationService";

interface BraceletCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  braceletId: number;
  braceletName: string;
  onCustomizationSaved?: () => void;
}

export const BraceletCustomizationModal: React.FC<
  BraceletCustomizationModalProps
> = ({ isOpen, onClose, braceletId, braceletName, onCustomizationSaved }) => {
  const [selectedColor, setSelectedColor] = useState<string>("#2196F3");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentCustomization();
    }
  }, [isOpen, braceletId]);

  const loadCurrentCustomization = async () => {
    const customization = await braceletCustomizationService.getCustomization(
      braceletId
    );
    setSelectedColor(customization?.color || "#2196F3");
    setSelectedPhoto(customization?.photoUri || null);
  };

  const handlePickImage = async (source: "camera" | "gallery") => {
    try {
      let result;

      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission refusée",
            "Veuillez autoriser l'accès à la caméra"
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission refusée",
            "Veuillez autoriser l'accès à la galerie"
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger la photo");
      console.error("Image picker error:", error);
    }
  };

  const handleSaveCustomization = async () => {
    setIsLoading(true);
    try {
      await braceletCustomizationService.saveCustomization(braceletId, {
        color: selectedColor,
        photoUri: selectedPhoto || undefined,
      });
      onCustomizationSaved?.();
      onClose();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les changements");
      console.error("Error saving customization:", error);
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Personnaliser</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Preview Section */}
          <View style={styles.previewSection}>
            <BraceletAvatar
              braceletName={braceletName}
              color={selectedColor}
              photoUri={selectedPhoto || undefined}
              size="large"
            />
            <Text style={styles.previewName}>{braceletName}</Text>
            <Text style={styles.previewSubtitle}>
              {selectedPhoto ? "Avec photo" : "Avec initiales"}
            </Text>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <View style={styles.photoButtonsContainer}>
              <Pressable
                onPress={() => handlePickImage("camera")}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="camera" size={20} color="#2196F3" />
                <Text style={styles.photoButtonText}>Caméra</Text>
              </Pressable>

              <Pressable
                onPress={() => handlePickImage("gallery")}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="image" size={20} color="#2196F3" />
                <Text style={styles.photoButtonText}>Galerie</Text>
              </Pressable>

              {selectedPhoto && (
                <Pressable
                  onPress={() => setSelectedPhoto(null)}
                  style={({ pressed }) => [
                    styles.photoButton,
                    styles.photoButtonDanger,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="trash" size={20} color="#f44336" />
                  <Text style={styles.photoButtonTextDanger}>Supprimer</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Color Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Couleur du bracelet</Text>
            <View style={styles.colorGrid}>
              {colors.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={({ pressed }) => [
                    styles.colorCircle,
                    { backgroundColor: color },
                    pressed && { transform: [{ scale: 0.9 }] },
                  ]}
                >
                  {selectedColor === color && (
                    <View style={styles.colorSelected}>
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="#fff"
                        weight="bold"
                      />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Pressable
            onPress={onClose}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && { opacity: 0.7 },
              isLoading && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>

          <Pressable
            onPress={handleSaveCustomization}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && { opacity: 0.85 },
              isLoading && { opacity: 0.5 },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  previewSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 24,
  },
  previewName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
  },
  previewSubtitle: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  colorSelected: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  photoSelectedContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f8ff",
    borderWidth: 1.5,
    borderColor: "#2196F3",
    borderRadius: 10,
    paddingVertical: 16,
    marginBottom: 16,
  },
  photoSelectedIcon: {
    marginBottom: 8,
  },
  photoSelectedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  removePhotoLink: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  removePhotoText: {
    fontSize: 13,
    color: "#2196F3",
    fontWeight: "600",
  },
  photoButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f0f7ff",
    borderWidth: 1.5,
    borderColor: "#2196F3",
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },
  photoButtonDanger: {
    backgroundColor: "#ffebee",
    borderColor: "#f44336",
  },
  photoButtonTextDanger: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f44336",
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "700",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
