import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { braceletService } from "../services/braceletService";
import { BraceletCustomizationModal } from "./BraceletCustomizationModal";

interface AddBraceletBottomSheetProps {
  onBraceletAdded: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AddBraceletBottomSheet = ({
  onBraceletAdded,
  isOpen,
  onClose,
}: AddBraceletBottomSheetProps) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<
    "checking" | "granted" | "denied"
  >("checking");
  const [showAliasInput, setShowAliasInput] = useState(false);
  const [alias, setAlias] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);
  const [justAddedBraceletId, setJustAddedBraceletId] = useState<number | null>(null);

  const resetForm = useCallback(() => {
    setScanning(false);
    setShowManualInput(false);
    setQrInput("");
    setUniqueCode("");
    setCameraPermission("checking");
    setShowAliasInput(false);
    setAlias("");
    setScannedCode("");
    onClose();
  }, [onClose]);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setCameraPermission("granted");
      return true;
    } else {
      setCameraPermission("denied");
      return false;
    }
  };

  const handleStartScanning = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      setScanning(true);
    } else {
      Alert.alert(
        "Permission refusée",
        "Vous devez autoriser l'accès à la caméra pour scanner les QR codes"
      );
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanning && data) {
      setScanning(false);
      setQrInput(data);
    }
  };

  const handleQRScan = () => {
    const code = qrInput.trim();
    if (!code) {
      Alert.alert("Erreur", "Veuillez scanner ou entrer un code QR");
      return;
    }

    setScannedCode(code);
    setShowAliasInput(true);
  };

  const handleManualRegister = () => {
    const code = uniqueCode.trim();
    if (!code) {
      Alert.alert("Erreur", "Veuillez entrer un code unique");
      return;
    }

    setScannedCode(code);
    setShowAliasInput(true);
  };

  const handleAddBraceletWithAlias = async () => {
    if (!scannedCode) {
      Alert.alert("Erreur", "Code invalide");
      return;
    }

    setSubmitting(true);
    try {
      const response: any = await braceletService.registerBracelet(
        scannedCode.toUpperCase(),
        alias || undefined
      );
      const braceletId = response?.id;
      setJustAddedBraceletId(braceletId);
      setShowCustomization(true);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible d'ajouter le bracelet"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomizationComplete = () => {
    Alert.alert("Succès", `Bracelet enregistré avec succès`);
    resetForm();
    setShowCustomization(false);
    onBraceletAdded();
  };

  return (
    <Modal
      visible={isOpen}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un bracelet</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {showAliasInput ? (
            /* Alias Input Screen */
            <View>
              <Text style={styles.subtitle}>Donner un nom au bracelet</Text>
              <Text style={styles.hint}>Code: {scannedCode}</Text>
              <TextInput
                style={styles.aliasInput}
                placeholder="Ex: Bracelet grand-mère"
                value={alias}
                onChangeText={setAlias}
                maxLength={50}
              />
              <Text style={styles.hint}>
                Vous pouvez laisser vide pour utiliser le code automatiquement
              </Text>

              <TouchableOpacity
                style={styles.cancelAliasButton}
                onPress={() => setShowAliasInput(false)}
              >
                <Text style={styles.cancelAliasButtonText}>Retour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleAddBraceletWithAlias}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      Ajouter le bracelet
                    </Text>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Mode Selection Screen */
            <>
              <Text style={styles.subtitle}>
                Sélectionnez un mode d'enregistrement
              </Text>

              {/* Mode Selection Cards */}
              <View style={styles.modeSelection}>
                {/* QR Code Mode */}
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    !showManualInput && styles.modeCardActive,
                  ]}
                  onPress={() => {
                    setShowManualInput(false);
                    setScanning(false);
                  }}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      !showManualInput && styles.modeIconActive,
                    ]}
                  >
                    <Ionicons
                      name="qr-code"
                      size={24}
                      color={!showManualInput ? "#fff" : "#333"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.modeTitle,
                      !showManualInput && styles.modeTitleActive,
                    ]}
                  >
                    QR Code
                  </Text>
                  <Text style={styles.modeDescription}>
                    Scanner le QR code du bracelet
                  </Text>
                </TouchableOpacity>

                {/* Manual Mode */}
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    showManualInput && styles.modeCardActive,
                  ]}
                  onPress={() => {
                    setShowManualInput(true);
                    setScanning(false);
                  }}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      showManualInput && styles.modeIconActive,
                    ]}
                  >
                    <Ionicons
                      name="keypad"
                      size={24}
                      color={showManualInput ? "#fff" : "#333"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.modeTitle,
                      showManualInput && styles.modeTitleActive,
                    ]}
                  >
                    Manuel
                  </Text>
                  <Text style={styles.modeDescription}>
                    Entrer le code manuellement
                  </Text>
                </TouchableOpacity>
              </View>

              {scanning && cameraPermission === "granted" ? (
                /* Camera Scanner View */
                <View style={styles.scannerContainer}>
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={handleBarCodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ["qr"],
                    }}
                  >
                    <View style={styles.scannerOverlay}>
                      <View style={styles.scannerFrame} />
                      <Text style={styles.scannerText}>
                        Positionnez le QR code dans le cadre
                      </Text>
                    </View>
                  </CameraView>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setScanning(false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              ) : scanning && cameraPermission === "denied" ? (
                /* Permission Denied View */
                <View style={styles.permissionContainer}>
                  <Ionicons name="camera" size={64} color="#f44336" />
                  <Text style={styles.permissionDeniedText}>
                    Permission caméra refusée
                  </Text>
                  <Text style={styles.permissionDeniedSubtext}>
                    Veuillez autoriser l'accès à la caméra dans vos paramètres
                  </Text>
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={() => setScanning(false)}
                  >
                    <Text style={styles.permissionButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              ) : !showManualInput ? (
                /* QR Code Mode Form */
                <View style={styles.formContainer}>
                  <Text style={styles.formLabel}>Scanner le QR Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Le code apparaîtra ici..."
                    value={qrInput}
                    onChangeText={setQrInput}
                    autoCapitalize="characters"
                    editable={false}
                  />
                  <Text style={styles.formHint}>
                    Le QR code se trouve sur le bracelet ou son emballage
                  </Text>

                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={handleStartScanning}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.scanButtonText}>
                      Commencer à scanner
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!qrInput.trim() || submitting) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleQRScan}
                    disabled={!qrInput.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Suivant</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Manual Mode Form */
                <View style={styles.formContainer}>
                  <Text style={styles.formLabel}>Code unique du bracelet</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ex: BR001ABC"
                    value={uniqueCode}
                    onChangeText={(text) => setUniqueCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={20}
                  />
                  <Text style={styles.formHint}>
                    Entrez le code unique à 12 caractères du bracelet
                  </Text>
                  <Text style={styles.formHint}>
                    Le code se trouve à l'arrière du bracelet ou sur l'emballage
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!uniqueCode.trim() || submitting) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleManualRegister}
                    disabled={!uniqueCode.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Suivant</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {showCustomization && justAddedBraceletId && (
        <BraceletCustomizationModal
          isOpen={showCustomization}
          onClose={handleCustomizationComplete}
          braceletId={justAddedBraceletId}
          braceletName={alias || scannedCode}
          onCustomizationSaved={handleCustomizationComplete}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginVertical: 12,
  },
  modeSelection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  modeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  modeCardActive: {
    borderColor: "#2196F3",
    backgroundColor: "#e3f2fd",
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modeIconActive: {
    backgroundColor: "#2196F3",
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  modeTitleActive: {
    color: "#2196F3",
  },
  modeDescription: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
  scannerContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  camera: {
    flex: 1,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 12,
    height: 300,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  scannerText: {
    position: "absolute",
    bottom: -40,
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#f44336",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  permissionDeniedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  permissionDeniedSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  formHint: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  scanButton: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
    marginTop: 4,
  },
  aliasInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
    marginTop: 8,
    backgroundColor: "#f9f9f9",
  },
  cancelAliasButton: {
    backgroundColor: "#e0e0e0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  cancelAliasButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});
