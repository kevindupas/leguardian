import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, {
  Marker,
  Polygon,
  Circle,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { findBestInsertionIndex, Coordinate } from "../utils/geoUtils";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const ZONE_ICONS = [
  "home",
  "school",
  "briefcase",
  "alert-circle",
  "leaf",
  "bicycle",
  "navigate",
];

export const ZoneEditModal: React.FC<any> = ({
  visible,
  zone,
  colors,
  onSave,
  onCancel,
}) => {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const [zoneName, setZoneName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("home");
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [saving, setSaving] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Type de zone (polygon ou circle) - modifiable par l'utilisateur
  const [zoneType, setZoneType] = useState<"polygon" | "circle">("polygon");
  const [circleRadius, setCircleRadius] = useState(500);

  // 1. Initialisation des données
  useEffect(() => {
    if (visible) {
      setZoneName(zone?.name || "");
      setSelectedIcon(zone?.icon || "home");
      setCoordinates(zone?.coordinates || []);
      setZoneType((zone?.type as "polygon" | "circle") || "polygon");
      setCircleRadius(zone?.radius || 500);
      setSearchQuery("");
    }
  }, [visible, zone]);

  // 2. LOGIQUE DE ZOOM AUTOMATIQUE
  useEffect(() => {
    if (visible && isMapReady && coordinates.length > 0) {
      // On attend un tout petit peu que la carte soit stable
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
          animated: true,
        });
      }, 300);
    }
  }, [visible, isMapReady]);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  // --- RECHERCHE ---
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_API_KEY}&language=fr`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK") {
        animate();
        setSuggestions(data.predictions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectPlace = async (placeId: string, desc: string) => {
    setSearchQuery(desc);
    setSuggestions([]);
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK") {
        const { lat, lng } = data.result.geometry.location;
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  // --- MAP LOGIC ---
  const handleMapPress = (e: any) => {
    if (suggestions.length > 0 || Keyboard.isVisible()) {
      setSuggestions([]);
      Keyboard.dismiss();
      return;
    }
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newPoint = { latitude, longitude };

    // Pour les cercles : définir le centre (un seul point)
    if (zoneType === "circle") {
      setCoordinates([newPoint]);
      return;
    }

    // Pour les polygones : ajouter des points
    if (coordinates.length < 3) {
      setCoordinates((prev) => [...prev, newPoint]);
    } else {
      const idx = findBestInsertionIndex(coordinates, newPoint);
      const newCoords = [...coordinates];
      newCoords.splice(idx, 0, newPoint);
      setCoordinates(newCoords);
    }
  };

  const handleSave = async () => {
    if (!zoneName.trim()) {
      Alert.alert("Nom requis", "Donnez un nom à cette zone");
      return;
    }
    if (zoneType === "circle") {
      // For circles, we only need center point
      if (coordinates.length < 1) {
        Alert.alert("Zone incomplète", "Définissez un centre pour le cercle");
        return;
      }
    } else {
      // For polygons, we need at least 3 points
      if (coordinates.length < 3) {
        Alert.alert("Zone incomplète", "Il faut au moins 3 points");
        return;
      }
    }
    setSaving(true);
    try {
      if (zoneType === "circle") {
        // Pass circle data with radius
        await onSave(zoneName, selectedIcon, coordinates, {
          type: "circle",
          radius: circleRadius,
        });
      } else {
        // Pass polygon data
        await onSave(zoneName, selectedIcon, coordinates, { type: "polygon" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={
            Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
          }
          onPress={handleMapPress}
          onMapReady={() => setIsMapReady(true)}
          initialRegion={{
            latitude: 48.8566,
            longitude: 2.3522,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {zoneType === "circle" && coordinates.length > 0 ? (
            <>
              <Circle
                center={coordinates[0]}
                radius={circleRadius}
                strokeColor={colors.primary}
                fillColor={`${colors.primary}33`}
                strokeWidth={3}
              />
              <Marker
                coordinate={coordinates[0]}
                draggable
                onDragEnd={(e) => {
                  const newCoords = [...coordinates];
                  newCoords[0] = e.nativeEvent.coordinate;
                  setCoordinates(newCoords);
                }}
              >
                <View
                  style={[styles.dot, { backgroundColor: colors.primary }]}
                />
              </Marker>
            </>
          ) : zoneType === "polygon" && coordinates.length > 0 ? (
            <>
              <Polygon
                coordinates={coordinates}
                fillColor={`${colors.primary}33`}
                strokeColor={colors.primary}
                strokeWidth={3}
              />
              {coordinates.map((coord, idx) => (
                <Marker
                  key={`p-${idx}`}
                  coordinate={coord}
                  draggable
                  onDragEnd={(e) => {
                    const newCoords = [...coordinates];
                    newCoords[idx] = e.nativeEvent.coordinate;
                    setCoordinates(newCoords);
                  }}
                  onPress={(e) => {
                    e.stopPropagation();
                    setCoordinates((prev) => prev.filter((_, i) => i !== idx));
                  }}
                >
                  <View
                    style={[styles.dot, { backgroundColor: colors.primary }]}
                  />
                </Marker>
              ))}
            </>
          ) : null}
        </MapView>

        {/* TOP BAR : RECHERCHE & RETOUR */}
        <View
          style={[styles.topBar, { top: insets.top + 10 }]}
          pointerEvents="box-none"
        >
          <View style={styles.searchRow}>
            <TouchableOpacity onPress={onCancel} style={styles.blurBtn}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={colors.textSecondary}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Chercher une adresse..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {isSearching && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginRight: 10 }}
                />
              )}
            </View>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsCard}>
              <ScrollView keyboardShouldPersistTaps="always">
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.place_id}
                    style={styles.suggestionItem}
                    onPress={() => selectPlace(s.place_id, s.description)}
                  >
                    <Ionicons
                      name="location-sharp"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {s.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* BOTTOM FLOATING CARD */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.bottomWrapper}
          pointerEvents="box-none"
        >
          <View style={styles.floatingCard}>
            {/* Ligne Infos : Nom + Compteur de points */}
            <View style={styles.infoRow}>
              <TextInput
                style={[
                  styles.nameInput,
                  { backgroundColor: colors.lightBg, flex: 1 },
                ]}
                placeholder="Nom de la zone"
                placeholderTextColor={colors.textSecondary}
                value={zoneName}
                onChangeText={setZoneName}
              />
              <View
                style={[
                  styles.pointBadge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.pointText, { color: colors.primary }]}>
                  {zoneType === "circle"
                    ? "Cercle"
                    : `${coordinates.length} pts`}
                </Text>
              </View>
            </View>

            {/* Sélecteur de type de zone */}
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: colors.lightBg,
                marginBottom: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderBottomWidth: zoneType === "polygon" ? 2 : 0,
                  borderBottomColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  setZoneType("polygon");
                  setCoordinates([]);
                }}
              >
                <Ionicons
                  name="share-social"
                  size={18}
                  color={
                    zoneType === "polygon"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={{
                    color:
                      zoneType === "polygon"
                        ? colors.primary
                        : colors.textSecondary,
                    fontWeight: zoneType === "polygon" ? "700" : "500",
                    fontSize: 12,
                  }}
                >
                  Polygone ({coordinates.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderBottomWidth: zoneType === "circle" ? 2 : 0,
                  borderBottomColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  setZoneType("circle");
                  setCoordinates([]);
                }}
              >
                <Ionicons
                  name="radio-button-off"
                  size={18}
                  color={
                    zoneType === "circle"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={{
                    color:
                      zoneType === "circle"
                        ? colors.primary
                        : colors.textSecondary,
                    fontWeight: zoneType === "circle" ? "700" : "500",
                    fontSize: 12,
                  }}
                >
                  Cercle
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contrôle du rayon si cercle */}
            {zoneType === "circle" && coordinates.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 4,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  Rayon :{" "}
                  <Text
                    style={{ fontWeight: "800", color: colors.textPrimary }}
                  >
                    {(circleRadius / 1000).toFixed(1)} km
                  </Text>
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() =>
                      setCircleRadius(Math.max(100, circleRadius - 100))
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#F5F5F5",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="remove" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCircleRadius(circleRadius + 100)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#F5F5F5",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Sélecteur d'icônes avec padding pour éviter le crop */}
            <View style={styles.iconListWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconListContent}
              >
                {ZONE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor:
                          selectedIcon === icon
                            ? colors.primary
                            : colors.lightBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={
                        selectedIcon === icon ? "white" : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Boutons d'action */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setCoordinates([])}
                style={[styles.btn, styles.btnDelete]}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={styles.btnDeleteText}>Vider</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.btn,
                  styles.btnSave,
                  { backgroundColor: colors.primary },
                ]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.btnSaveText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  topBar: { position: "absolute", left: 15, right: 15, zIndex: 10 },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  blurBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  searchContainer: {
    flex: 1,
    height: 45,
    borderRadius: 15,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: "#333" },
  suggestionsCard: {
    marginTop: 8,
    borderRadius: 15,
    backgroundColor: "white",
    maxHeight: 200,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  suggestionText: { fontSize: 14, color: "#333", flex: 1 },

  bottomWrapper: { position: "absolute", bottom: 30, left: 15, right: 15 },
  floatingCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  nameInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: "600",
  },
  pointBadge: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  pointText: { fontSize: 12, fontWeight: "800" },

  iconListWrapper: { marginBottom: 20 },
  iconListContent: { gap: 15, paddingVertical: 5, paddingHorizontal: 2 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  buttonRow: { flexDirection: "row", gap: 12 },
  btn: {
    height: 54,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnDelete: { flex: 0.35, backgroundColor: "#FF3B3012" },
  btnDeleteText: { color: "#FF3B30", fontWeight: "700", fontSize: 15 },
  btnSave: { flex: 0.65 },
  btnSaveText: { color: "white", fontWeight: "700", fontSize: 16 },
});
