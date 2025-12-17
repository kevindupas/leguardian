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
import { useTheme } from "../contexts/ThemeContext";
import { getColors } from "../constants/Colors";

interface AddBraceletBottomSheetProps {
  onBraceletAdded: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const SCANNER_SIZE = 250;

export const AddBraceletBottomSheet = ({
  onBraceletAdded,
  isOpen,
  onClose,
}: AddBraceletBottomSheetProps) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [showManualInput, setShowManualInput] = useState(false);
  const [uniqueCode, setUniqueCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<
    "checking" | "granted" | "denied"
  >("checking");

  const [showAliasInput, setShowAliasInput] = useState(false);
  const [alias, setAlias] = useState("");

  const [showCustomization, setShowCustomization] = useState(false);
  const [justAddedBraceletId, setJustAddedBraceletId] = useState<number | null>(
    null
  );

  const resetForm = useCallback(() => {
    setScanning(false);
    setShowManualInput(false);
    setUniqueCode("");
    setScannedCode("");
    setCameraPermission("checking");
    setShowAliasInput(false);
    setAlias("");
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
    setScannedCode("");
    const granted = await requestCameraPermission();
    if (granted) {
      setScanning(true);
    } else {
      Alert.alert("Permission", "Accès caméra requis.");
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanning && data) {
      setScanning(false);
      setScannedCode(data);
    }
  };

  const handleProceedToAlias = () => {
    const code = showManualInput ? uniqueCode : scannedCode;
    if (!code.trim()) {
      Alert.alert("Erreur", "Aucun code valide.");
      return;
    }
    setShowAliasInput(true);
  };

  const handleAddBracelet = async () => {
    const finalCode = showManualInput ? uniqueCode : scannedCode;

    if (!finalCode) return;

    setSubmitting(true);
    try {
      const response: any = await braceletService.registerBracelet(
        finalCode.toUpperCase(),
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
    resetForm();
    setShowCustomization(false);
    onBraceletAdded();
  };

  return (
    <Modal
      visible={isOpen}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: colors.white }}
      >
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.lightBg }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Nouveau Bracelet
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.lightBg }]}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
        >
          {showAliasInput ? (
            /* --- ETAPE 2: NOM (ALIAS) --- */
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.iconCircleBig,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="pricetag" size={32} color={colors.primary} />
              </View>

              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                Donnez-lui un nom
              </Text>
              <Text
                style={[styles.stepSubtitle, { color: colors.textSecondary }]}
              >
                Code :{" "}
                <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                  {showManualInput ? uniqueCode : scannedCode}
                </Text>
              </Text>

              <View style={styles.inputWrapper}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Nom (Optionnel)
                </Text>
                <TextInput
                  style={[
                    styles.modernInput,
                    {
                      backgroundColor: colors.lightBg,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Ex: Montre de Tom"
                  placeholderTextColor={colors.textSecondary + "80"}
                  value={alias}
                  onChangeText={setAlias}
                  maxLength={50}
                  autoFocus
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: colors.lightBg },
                  ]}
                  onPress={() => setShowAliasInput(false)}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Retour
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: submitting ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleAddBracelet}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Terminer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* --- ETAPE 1: CHOIX DU MODE + SCANNER --- */
            <View style={styles.stepContainer}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Méthode de connexion
              </Text>

              {/* CARTES DE SÉLECTION */}
              <View style={styles.modeGrid}>
                {/* Carte QR Code */}
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: !showManualInput
                        ? colors.primary + "10"
                        : colors.lightBg,
                      borderColor: !showManualInput
                        ? colors.primary
                        : "transparent",
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    setShowManualInput(false);
                    setScanning(false);
                  }}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      {
                        backgroundColor: !showManualInput
                          ? colors.primary
                          : colors.white,
                      },
                    ]}
                  >
                    <Ionicons
                      name="qr-code"
                      size={24}
                      color={
                        !showManualInput ? colors.white : colors.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.modeCardTitle,
                      {
                        color: !showManualInput
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    Scanner QR
                  </Text>
                </TouchableOpacity>

                {/* Carte Manuel */}
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: showManualInput
                        ? colors.primary + "10"
                        : colors.lightBg,
                      borderColor: showManualInput
                        ? colors.primary
                        : "transparent",
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    setShowManualInput(true);
                    setScanning(false);
                  }}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      {
                        backgroundColor: showManualInput
                          ? colors.primary
                          : colors.white,
                      },
                    ]}
                  >
                    <Ionicons
                      name="keypad"
                      size={24}
                      color={
                        showManualInput ? colors.white : colors.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.modeCardTitle,
                      {
                        color: showManualInput
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    Code Manuel
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CONTENU VARIABLE SELON LE MODE */}
              {!showManualInput ? (
                /* --- MODE SCANNER --- */
                <View style={styles.scannerSection}>
                  {scanning && cameraPermission === "granted" ? (
                    <>
                      {/* CAMÉRA CARRÉE */}
                      <View style={styles.cameraContainer}>
                        <CameraView
                          style={StyleSheet.absoluteFill}
                          facing="back"
                          onBarcodeScanned={handleBarCodeScanned}
                          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                        />
                        {/* Overlay de visée */}
                        <View style={styles.maskOverlay}>
                          <View style={styles.maskRow} />
                          <View style={styles.maskCenter}>
                            <View style={styles.maskCol} />
                            <View style={styles.scanWindow}>
                              <View style={[styles.corner, styles.tl]} />
                              <View style={[styles.corner, styles.tr]} />
                              <View style={[styles.corner, styles.bl]} />
                              <View style={[styles.corner, styles.br]} />
                            </View>
                            <View style={styles.maskCol} />
                          </View>
                          <View style={styles.maskRow} />
                        </View>
                      </View>

                      {/* BOUTON ANNULER ROUGE (EN DEHORS) */}
                      <TouchableOpacity
                        onPress={() => setScanning(false)}
                        style={[
                          styles.cancelScanButton,
                          {
                            backgroundColor: colors.danger + "15",
                            borderColor: colors.danger,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cancelScanText,
                            { color: colors.danger },
                          ]}
                        >
                          Annuler le scan
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    /* RÉSULTAT OU ATTENTE */
                    <View
                      style={[
                        styles.placeholderBox,
                        {
                          backgroundColor: colors.lightBg,
                          borderColor: colors.mediumBg,
                        },
                      ]}
                    >
                      {scannedCode ? (
                        <View style={{ alignItems: "center" }}>
                          <View
                            style={[
                              styles.successCircle,
                              { backgroundColor: colors.success + "20" },
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={40}
                              color={colors.success}
                            />
                          </View>
                          <Text
                            style={[
                              styles.codeLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Code détecté
                          </Text>
                          <Text
                            style={[
                              styles.codeValue,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {scannedCode}
                          </Text>

                          <TouchableOpacity
                            onPress={handleStartScanning}
                            style={styles.redoButton}
                          >
                            <Ionicons
                              name="refresh"
                              size={16}
                              color={colors.primary}
                            />
                            <Text
                              style={[
                                styles.redoText,
                                { color: colors.primary },
                              ]}
                            >
                              Scanner à nouveau
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ alignItems: "center" }}>
                          <Ionicons
                            name="scan-outline"
                            size={48}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={{
                              color: colors.textSecondary,
                              marginTop: 10,
                            }}
                          >
                            En attente de scan...
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {!scanning && !scannedCode && (
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary, marginTop: 20 },
                      ]}
                      onPress={handleStartScanning}
                    >
                      <Ionicons
                        name="camera"
                        size={20}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.primaryButtonText}>
                        Ouvrir la caméra
                      </Text>
                    </TouchableOpacity>
                  )}

                  {!scanning && scannedCode !== "" && (
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary, marginTop: 20 },
                      ]}
                      onPress={handleProceedToAlias}
                    >
                      <Text style={styles.primaryButtonText}>Continuer</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#fff"
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                /* --- MODE MANUEL --- */
                <View style={styles.manualSection}>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Identifiant Unique (UID)
                    </Text>
                    <TextInput
                      style={[
                        styles.modernInput,
                        {
                          backgroundColor: colors.lightBg,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="Ex: BR-1234-ABCD"
                      placeholderTextColor={colors.textSecondary + "80"}
                      value={uniqueCode}
                      onChangeText={(text) => setUniqueCode(text.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={20}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: !uniqueCode.trim() ? 0.5 : 1,
                        marginTop: 20,
                      },
                    ]}
                    onPress={handleProceedToAlias}
                    disabled={!uniqueCode.trim()}
                  >
                    <Text style={styles.primaryButtonText}>Continuer</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#fff"
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL PERSONNALISATION */}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 10,
  },

  // MODE GRID
  modeGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  // CAMERA CARRÉE
  cameraContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "black",
  },
  maskOverlay: { ...StyleSheet.absoluteFillObject },
  maskRow: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  maskCenter: { height: SCANNER_SIZE, flexDirection: "row" },
  maskCol: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  scanWindow: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "white",
    borderWidth: 4,
  },
  tl: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  tr: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  br: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },

  // BOUTON ANNULER SCAN (Hors de la caméra)
  cancelScanButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelScanText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // RESULTATS
  placeholderBox: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  codeLabel: { fontSize: 13, fontWeight: "600", textTransform: "uppercase" },
  codeValue: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 20,
  },
  redoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
  },
  redoText: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // COMMON
  iconCircleBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: { fontSize: 14, textAlign: "center", marginBottom: 30 },
  inputWrapper: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  modernInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: "600" },
  actionButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
  scannerSection: { marginTop: 10 },
  manualSection: { marginTop: 20 },
});
