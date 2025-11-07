import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { braceletService } from "../services/braceletService";
import { LeGuardianColors } from "../constants/Colors";

interface EditBraceletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBraceletUpdated: () => void;
  braceletId?: number;
  currentAlias?: string;
  currentCode?: string;
}

export const EditBraceletModal = ({
  isOpen,
  onClose,
  onBraceletUpdated,
  braceletId,
  currentAlias,
  currentCode,
}: EditBraceletModalProps) => {
  const [alias, setAlias] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentAlias) {
      setAlias(currentAlias);
    } else {
      setAlias("");
    }
  }, [isOpen, currentAlias]);

  const handleClose = () => {
    setAlias("");
    onClose();
  };

  const handleUpdateBracelet = async () => {
    if (!braceletId) {
      Alert.alert("Erreur", "ID du bracelet manquant");
      return;
    }

    if (!alias.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom pour le bracelet");
      return;
    }

    setSubmitting(true);
    try {
      await braceletService.updateBracelet(braceletId, {
        alias: alias.trim(),
      });
      Alert.alert("Succès", "Bracelet modifié avec succès");
      handleClose();
      onBraceletUpdated();
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message ||
          "Impossible de mettre à jour le bracelet"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      onRequestClose={handleClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color={LeGuardianColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le bracelet</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.subtitle}>Modifier le nom du bracelet</Text>

            {currentCode && (
              <View style={styles.codeInfo}>
                <Ionicons name="information-circle" size={20} color={LeGuardianColors.primary} />
                <Text style={styles.codeText}>Code: {currentCode}</Text>
              </View>
            )}

            <Text style={styles.label}>Nom du bracelet</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bracelet grand-mère"
              value={alias}
              onChangeText={setAlias}
              maxLength={50}
              placeholderTextColor={LeGuardianColors.textSecondary}
              editable={!submitting}
            />
            <Text style={styles.hint}>
              Entrez un nom descriptif pour identifier facilement ce bracelet
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!alias.trim() || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleUpdateBracelet}
                disabled={!alias.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={LeGuardianColors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={LeGuardianColors.white} />
                    <Text style={styles.submitButtonText}>Mettre à jour</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: LeGuardianColors.mediumBg,
    backgroundColor: LeGuardianColors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: LeGuardianColors.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: LeGuardianColors.lightBg,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  content: {
    backgroundColor: LeGuardianColors.white,
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: LeGuardianColors.textPrimary,
    marginBottom: 16,
  },
  codeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: LeGuardianColors.lightBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "600",
    color: LeGuardianColors.textSecondary,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: LeGuardianColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: LeGuardianColors.mediumBg,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: LeGuardianColors.lightBg,
    color: LeGuardianColors.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: LeGuardianColors.textSecondary,
    marginBottom: 24,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: LeGuardianColors.mediumBg,
    backgroundColor: LeGuardianColors.white,
    alignItems: "center",
  },
  cancelButtonText: {
    color: LeGuardianColors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: LeGuardianColors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: LeGuardianColors.mediumBg,
    opacity: 0.6,
  },
  submitButtonText: {
    color: LeGuardianColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
