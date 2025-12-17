import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import MapView, {
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { braceletService, type Bracelet } from "../../services/braceletService";
import { braceletCustomizationService } from "../../services/BraceletCustomizationService";
import { useTheme } from "../../contexts/ThemeContext";
import { getColors } from "../../constants/Colors";
import { CustomMapMarker } from "../../components/CustomMapMarker";
import { MapTypePickerBottomSheet } from "../../components/MapTypePickerBottomSheet";
import { useZoneDrawing } from "../../hooks/useZoneDrawing";
import { useSafetyZones } from "../../hooks/useSafetyZones";
import { BraceletMapCard } from "../../components/BraceletMapCard";

const CARD_WIDTH = Dimensions.get("window").width * 0.85;
const SPACING_FOR_CARD_INSET = Dimensions.get("window").width * 0.075 - 10;
const ZONE_ICONS = [
  "home",
  "school",
  "briefcase",
  "alert-circle",
  "leaf",
  "bicycle",
  "navigate",
];

export default function MapViewScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  // Ref pour empêcher le recentrage automatique après le premier chargement
  const hasCenteredMap = useRef(false);

  // --- States ---
  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [customizations, setCustomizations] = useState<
    Record<number, { color: string; photoUri?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedBraceletId, setSelectedBraceletId] = useState<number | null>(
    null
  );
  const [mapType, setMapType] = useState<
    "standard" | "satellite" | "hybrid" | "terrain"
  >("standard");
  const [showMapTypePicker, setShowMapTypePicker] = useState(false);

  // --- Drawing Hook ---
  const {
    isDrawingMode,
    zoneCoordinates,
    startDrawing,
    stopDrawing,
    addPoint,
    updatePoint,
    resetZone,
    hasEnoughPoints,
  } = useZoneDrawing();

  // --- Safety Zones Hook ---
  const { zones, createZone } = useSafetyZones(selectedBraceletId);

  // Modal Zone
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [selectedZoneIcon, setSelectedZoneIcon] = useState("home");
  const [savingZone, setSavingZone] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Chargement
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const data = await braceletService.getBracelets();
      const validBracelets = data.filter(
        (b) => b.last_latitude && b.last_longitude
      );
      setBracelets(validBracelets);

      const customizationData: Record<
        number,
        { color: string; photoUri?: string }
      > = {};
      for (const bracelet of data) {
        const customization =
          await braceletCustomizationService.getCustomization(bracelet.id);
        customizationData[bracelet.id] = {
          color: customization?.color || "#2196F3",
          photoUri: customization?.photoUri,
        };
      }
      setCustomizations(customizationData);

      // CORRECTIF : On ne centre qu'une seule fois au tout début (grâce à la ref)
      if (
        !hasCenteredMap.current &&
        validBracelets.length > 0 &&
        !isDrawingMode
      ) {
        hasCenteredMap.current = true;
        setSelectedBraceletId(validBracelets[0].id);
        animateToBracelet(validBracelets[0]);
      }
    } catch (error) {
      console.log("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const animateToBracelet = (bracelet: Bracelet) => {
    // Si on dessine, INTERDIT de bouger la carte
    if (isDrawingMode) return;

    if (!bracelet.last_latitude || !bracelet.last_longitude) return;

    mapRef.current?.animateToRegion(
      {
        latitude: parseFloat(bracelet.last_latitude as any),
        longitude: parseFloat(bracelet.last_longitude as any),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  const onMomentumScrollEnd = (e: any) => {
    if (isDrawingMode) return;
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + 10));

    const targetBracelet = bracelets[index];

    // CORRECTIF CRUCIAL : On ne bouge la carte QUE si l'ID a changé.
    // Cela empêche le polling (rafraîchissement auto) de reset le zoom.
    if (targetBracelet && targetBracelet.id !== selectedBraceletId) {
      setSelectedBraceletId(targetBracelet.id);
      animateToBracelet(targetBracelet);
    }
  };

  const onMarkerPress = (bracelet: Bracelet, index: number) => {
    if (isDrawingMode) return;
    // Ici on force le mouvement car c'est une action utilisateur explicite
    setSelectedBraceletId(bracelet.id);
    flatListRef.current?.scrollToIndex({ index, animated: true });
    animateToBracelet(bracelet);
  };

  // --- Actions Dessin ---
  const toggleDrawingMode = () => {
    if (isDrawingMode) stopDrawing();
    else startDrawing();
  };

  const handleValidateZone = () => {
    if (!hasEnoughPoints) {
      Alert.alert("Zone incomplète", "Il faut au moins 3 points.");
      return;
    }
    setShowZoneModal(true);
  };

  const saveZone = async () => {
    if (!selectedBraceletId || !newZoneName.trim()) {
      Alert.alert("Erreur", "Bracelet ou nom de zone manquant");
      return;
    }

    setSavingZone(true);
    try {
      const result = await createZone({
        name: newZoneName,
        icon: selectedZoneIcon,
        coordinates: zoneCoordinates.map((coord) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
        })),
        notify_on_entry: true,
        notify_on_exit: true,
      });

      if (result) {
        setShowZoneModal(false);
        stopDrawing();
        setNewZoneName("");
        setSelectedZoneIcon("home");
        Alert.alert("Succès", "Zone de sécurité créée !");
      } else {
        Alert.alert("Erreur", "Impossible de créer la zone");
      }
    } catch (error) {
      Alert.alert("Erreur", "Erreur lors de la sauvegarde de la zone");
      console.error("Error saving zone:", error);
    } finally {
      setSavingZone(false);
    }
  };

  // Optimisation : On mémorise les markers pour éviter qu'ils ne clignotent/reloadent la map
  const markers = useMemo(() => {
    if (isDrawingMode) return null;

    return bracelets.map((bracelet, index) => {
      const isSelected = selectedBraceletId === bracelet.id;
      const custom = customizations[bracelet.id];

      return (
        <Marker
          key={bracelet.id}
          coordinate={{
            latitude: parseFloat(bracelet.last_latitude as any),
            longitude: parseFloat(bracelet.last_longitude as any),
          }}
          onPress={() => onMarkerPress(bracelet, index)}
          zIndex={isSelected ? 999 : 1}
        >
          <CustomMapMarker
            color={custom?.color || colors.primary}
            initials={(bracelet.alias || "B").substring(0, 2)}
            photoUri={custom?.photoUri}
            size={isSelected ? 60 : 48}
          />
        </Marker>
      );
    });
  }, [
    bracelets,
    selectedBraceletId,
    customizations,
    isDrawingMode,
    colors.primary,
  ]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        mapType={mapType}
        // Ajout d'une protection pour ne pas ajouter de points si on ne dessine pas
        onPress={(e) => isDrawingMode && addPoint(e.nativeEvent.coordinate)}
        showsUserLocation={true}
        showsMyLocationButton={false}
        // Ces props permettent de garder le contrôle pendant le dessin
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={!isDrawingMode}
        pitchEnabled={!isDrawingMode}
      >
        {/* Affichage optimisé des markers */}
        {markers}

        {/* Zones sauvegardées */}
        {!isDrawingMode && zones.map((zone) => (
          <Polygon
            key={`zone-${zone.id}`}
            coordinates={zone.coordinates}
            strokeColor="#4CAF50"
            fillColor="#4CAF5040"
            strokeWidth={2}
          />
        ))}

        {/* Zone de dessin */}
        {isDrawingMode && zoneCoordinates.length > 0 && (
          <>
            <Polygon
              coordinates={zoneCoordinates}
              strokeColor={colors.primary}
              fillColor={colors.primary + "40"}
              strokeWidth={2}
            />
            {zoneCoordinates.map((coord, index) => (
              <Marker
                key={`point-${index}`}
                coordinate={coord}
                draggable
                onDragEnd={(e) => updatePoint(index, e.nativeEvent.coordinate)}
                anchor={{ x: 0.5, y: 0.5 }}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                zIndex={1000}
              >
                <View
                  style={[
                    styles.drawingPointBig,
                    { borderColor: colors.primary },
                  ]}
                >
                  <View
                    style={[
                      styles.drawingPointCenter,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </Marker>
            ))}
          </>
        )}
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: colors.white }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: colors.white }]}
          onPress={() => setShowMapTypePicker(true)}
        >
          <Ionicons name="layers" size={24} color={colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Right Tools */}
      <View style={[styles.rightTools, { top: insets.top + 80 }]}>
        <TouchableOpacity
          style={[
            styles.toolButton,
            { backgroundColor: isDrawingMode ? colors.primary : colors.white },
          ]}
          onPress={toggleDrawingMode}
        >
          <Ionicons
            name="shapes"
            size={24}
            color={isDrawingMode ? colors.white : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Container */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom + 20 }]}>
        {isDrawingMode ? (
          <View
            style={[styles.drawingControls, { backgroundColor: colors.white }]}
          >
            <View style={styles.drawingHeader}>
              <Ionicons
                name="create-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={{
                  color: colors.textPrimary,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {zoneCoordinates.length === 0
                  ? "Touchez la carte"
                  : `${zoneCoordinates.length} points`}
              </Text>
            </View>
            <View style={styles.drawingButtons}>
              <TouchableOpacity
                onPress={resetZone}
                style={[
                  styles.smallButton,
                  { backgroundColor: colors.lightBg },
                ]}
              >
                <Text style={{ color: colors.danger, fontWeight: "600" }}>
                  Effacer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleValidateZone}
                disabled={!hasEnoughPoints}
                style={[
                  styles.smallButton,
                  {
                    backgroundColor: !hasEnoughPoints ? "#ccc" : colors.primary,
                    flex: 1.5,
                  },
                ]}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Valider
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={bracelets}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH + 10}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING_FOR_CARD_INSET,
            }}
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH + 10,
              offset: (CARD_WIDTH + 10) * index,
              index,
            })}
            onMomentumScrollEnd={onMomentumScrollEnd}
            renderItem={({ item, index }) => (
              <BraceletMapCard
                item={item}
                isSelected={selectedBraceletId === item.id}
                onPress={() => {
                  const idx = bracelets.indexOf(item);
                  onMarkerPress(item, idx);
                }}
                customization={customizations[item.id]}
                isDark={isDark}
              />
            )}
          />
        )}
      </View>

      <MapTypePickerBottomSheet
        isVisible={showMapTypePicker}
        onClose={() => setShowMapTypePicker(false)}
        currentMapType={mapType}
        onMapTypeChange={setMapType}
        isDark={isDark}
      />

      {/* Modal Création Zone */}
      <Modal
        visible={showZoneModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowZoneModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[styles.zoneModalContent, { backgroundColor: colors.white }]}
          >
            <Text
              style={[styles.zoneModalTitle, { color: colors.textPrimary }]}
            >
              Nouvelle Zone
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Nom
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.lightBg,
                  },
                ]}
                placeholder="Ex: Maison..."
                placeholderTextColor="#999"
                value={newZoneName}
                onChangeText={setNewZoneName}
                autoFocus
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Icône
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxHeight: 60 }}
              >
                <View
                  style={{ flexDirection: "row", gap: 12, paddingVertical: 5 }}
                >
                  {ZONE_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setSelectedZoneIcon(icon)}
                      style={[
                        styles.iconOption,
                        { backgroundColor: colors.lightBg },
                        selectedZoneIcon === icon && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={24}
                        color={
                          selectedZoneIcon === icon
                            ? "white"
                            : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowZoneModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.lightBg },
                ]}
              >
                <Text style={{ color: colors.textPrimary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveZone}
                disabled={!newZoneName.trim()}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: !newZoneName.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Enregistrer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  drawingPointBig: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawingPointCenter: { width: 8, height: 8, borderRadius: 4 },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  rightTools: { position: "absolute", right: 16, gap: 12 },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomContainer: { position: "absolute", left: 0, right: 0, height: 140 },
  drawingControls: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  drawingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  drawingButtons: { flexDirection: "row", gap: 12, width: "100%" },
  smallButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  zoneModalContent: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  zoneModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10 },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
