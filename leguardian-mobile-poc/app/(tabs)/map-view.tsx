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
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import MapView, {
  Marker,
  Polygon,
  Circle,
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
import { useSafetyZonesContext } from "../../contexts/SafetyZonesContext";
import { BraceletMapCard } from "../../components/BraceletMapCard";
import { ZonePickerTopSheet } from "@/components/ZonePickerBottomSheet";

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

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function MapViewScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  // States
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

  // Pickers
  const [showMapTypePicker, setShowMapTypePicker] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);

  // Recherche & Suggestions
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Hooks
  const {
    isDrawingMode,
    drawingType,
    setDrawingType,
    zoneCoordinates,
    circleCenter,
    circleRadius,
    setCircleRadius,
    startDrawing,
    stopDrawing,
    addPoint,
    updatePoint,
    resetZone,
    hasEnoughPoints,
  } = useZoneDrawing();
  const { zones: allZones, loadZones, createZone } = useSafetyZonesContext();
  const zones = selectedBraceletId ? allZones[selectedBraceletId] || [] : [];

  // Zone Modal
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [selectedZoneIcon, setSelectedZoneIcon] = useState("home");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBraceletId) loadZones(selectedBraceletId);
  }, [selectedBraceletId]);

  // Auto-select first bracelet and zoom to it when data loads
  useEffect(() => {
    if (bracelets.length > 0 && !selectedBraceletId) {
      const firstBracelet = bracelets[0];
      console.log('[MapView] Auto-selecting first bracelet:', firstBracelet.id);
      setSelectedBraceletId(firstBracelet.id);
    }
  }, [bracelets]);

  // Zoom to selected bracelet whenever it changes (on swipe or auto-select)
  useEffect(() => {
    if (selectedBraceletId && bracelets.length > 0) {
      const selectedBracelet = bracelets.find((b) => b.id === selectedBraceletId);
      if (selectedBracelet && selectedBracelet.last_latitude && selectedBracelet.last_longitude) {
        console.log('[MapView] Zooming to bracelet:', selectedBraceletId);
        mapRef.current?.animateToRegion(
          {
            latitude: parseFloat(selectedBracelet.last_latitude as any),
            longitude: parseFloat(selectedBracelet.last_longitude as any),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );

        // Scroll FlatList to show the selected bracelet
        const index = bracelets.findIndex((b) => b.id === selectedBraceletId);
        if (index !== -1) {
          flatListRef.current?.scrollToIndex({ index, animated: true });
        }
      }
    }
  }, [selectedBraceletId, bracelets]);

  // Focus on selected bracelet function
  const focusOnBracelet = () => {
    if (selectedBraceletId && bracelets.length > 0) {
      const selectedBracelet = bracelets.find((b) => b.id === selectedBraceletId);
      if (selectedBracelet && selectedBracelet.last_latitude && selectedBracelet.last_longitude) {
        console.log('[MapView] Focusing on bracelet:', selectedBraceletId);
        mapRef.current?.animateToRegion(
          {
            latitude: parseFloat(selectedBracelet.last_latitude as any),
            longitude: parseFloat(selectedBracelet.last_longitude as any),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );
      }
    }
  };

  // Refocus on bracelet when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('[MapView] Screen focused, refocusing on bracelet');
      focusOnBracelet();
    }, [selectedBraceletId, bracelets])
  );

  // Conversion cercle en polygone pour le backend
  const circleToPolygon = (
    center: { latitude: number; longitude: number },
    radiusInMeters: number
  ) => {
    const points = [];
    const numberOfPoints = 32;
    for (let i = 0; i < numberOfPoints; i++) {
      const angle = (i * 360) / numberOfPoints;
      const distanceInDegree = radiusInMeters / 111320;
      const lat =
        center.latitude + distanceInDegree * Math.cos((angle * Math.PI) / 180);
      const lng =
        center.longitude +
        (distanceInDegree * Math.sin((angle * Math.PI) / 180)) /
          Math.cos((center.latitude * Math.PI) / 180);
      points.push({ latitude: lat, longitude: lng });
    }
    return points;
  };

  // --- LOGIQUE AUTOCOMPLETE ---
  const handleTextChange = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_API_KEY}&language=fr`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK") {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Autocomplete error:", error);
    }
  };

  const handleSelectSuggestion = async (
    placeId: string,
    description: string
  ) => {
    setSearchQuery(description);
    setShowSuggestions(false);
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK" && data.result.geometry) {
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
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger ce lieu.");
    } finally {
      setIsSearching(false);
    }
  };

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
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const onMarkerPress = (bracelet: Bracelet, index: number) => {
    if (isDrawingMode) return;
    setSelectedBraceletId(bracelet.id);
    flatListRef.current?.scrollToIndex({ index, animated: true });
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

  const toggleDrawingMode = () => {
    if (isDrawingMode) {
      stopDrawing();
      setSearchQuery("");
      setShowSuggestions(false);
    } else {
      if (!selectedBraceletId) {
        Alert.alert("Sélectionnez un bracelet", "Vous devez d'abord sélectionner un bracelet en cliquant sur un marker.");
        return;
      }
      startDrawing("polygon");
    }
  };

  const saveZone = async () => {
    console.log("[MapView] saveZone called");
    console.log("[MapView] selectedBraceletId:", selectedBraceletId);
    console.log("[MapView] newZoneName:", newZoneName);

    if (!selectedBraceletId || !newZoneName.trim()) {
      console.log("[MapView] Early return: missing braceletId or zone name");
      return;
    }

    let finalCoords =
      drawingType === "circle" && circleCenter
        ? circleToPolygon(circleCenter, circleRadius)
        : zoneCoordinates.map((c) => ({
            latitude: c.latitude,
            longitude: c.longitude,
          }));

    console.log("[MapView] Final coordinates:", finalCoords);

    try {
      console.log("[MapView] Calling createZone...");
      const zonePayload: any = {
        name: newZoneName,
        icon: selectedZoneIcon,
        coordinates: finalCoords,
        notify_on_entry: true,
        notify_on_exit: true,
        type: drawingType,
      };

      // Add radius if it's a circle
      if (drawingType === "circle") {
        zonePayload.radius = circleRadius;
      }

      const result = await createZone(selectedBraceletId, zonePayload);
      console.log("[MapView] createZone result:", result);
      if (result) {
        setShowZoneModal(false);
        stopDrawing();
        setNewZoneName("");
        Alert.alert("Succès", "Zone créée !");
      }
    } catch (error) {
      console.error("[MapView] saveZone error:", error);
      Alert.alert("Erreur", "Création impossible");
    }
  };

  const filteredZones = selectedZoneId
    ? zones.filter((zone) => zone.id === selectedZoneId)
    : zones;

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

  if (loading)
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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        mapType={mapType}
        onPress={(e) => {
          if (showSuggestions) {
            setShowSuggestions(false);
            Keyboard.dismiss();
          } else if (isDrawingMode) {
            addPoint(e.nativeEvent.coordinate);
          }
        }}
        zoomEnabled={true}
        scrollEnabled={true}
        showsUserLocation={true}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {markers}

        {filteredZones.map((zone) => (
          <Polygon
            key={`zone-${zone.id}`}
            coordinates={zone.coordinates}
            strokeColor="#4CAF50"
            fillColor="#4CAF5040"
            strokeWidth={2}
          />
        ))}

        {/* DESSIN POLYGONE */}
        {isDrawingMode &&
          drawingType === "polygon" &&
          zoneCoordinates.length > 0 && (
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
                  onDragEnd={(e) =>
                    updatePoint(index, e.nativeEvent.coordinate)
                  }
                  anchor={{ x: 0.5, y: 0.5 }}
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

        {/* DESSIN CERCLE */}
        {isDrawingMode && drawingType === "circle" && circleCenter && (
          <>
            <Circle
              center={circleCenter}
              radius={circleRadius}
              strokeColor={colors.primary}
              fillColor={colors.primary + "40"}
              strokeWidth={2}
            />
            <Marker
              coordinate={circleCenter}
              draggable
              onDragEnd={(e) => updatePoint(0, e.nativeEvent.coordinate)}
            >
              <View
                style={[
                  styles.drawingPointBig,
                  { borderColor: colors.primary },
                ]}
              >
                <Ionicons name="move" size={14} color={colors.primary} />
              </View>
            </Marker>
          </>
        )}
      </MapView>

      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.topLayoutRow} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: colors.white }]}
            onPress={() => router.push("/(modals)/settings")}
          >
            <Ionicons
              name="settings-sharp"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.centerContainer} pointerEvents="box-none">
            {isDrawingMode ? (
              <View style={styles.searchWrapper}>
                <View
                  style={[
                    styles.searchContainer,
                    { backgroundColor: colors.white },
                  ]}
                >
                  <Ionicons name="search" size={18} color={colors.primary} />
                  <TextInput
                    placeholder="Chercher une adresse..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={handleTextChange}
                    style={styles.searchInput}
                  />
                  {isSearching ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : searchQuery ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery("");
                        setSuggestions([]);
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {showSuggestions && suggestions.length > 0 && (
                  <View
                    style={[
                      styles.suggestionsList,
                      { backgroundColor: colors.white },
                    ]}
                  >
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      style={{ maxHeight: 200 }}
                    >
                      {suggestions.map((item) => (
                        <TouchableOpacity
                          key={item.place_id}
                          style={styles.suggestionItem}
                          onPress={() =>
                            handleSelectSuggestion(
                              item.place_id,
                              item.description
                            )
                          }
                        >
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.suggestionText,
                              { color: colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {item.description}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.zoneFakeSelect,
                  { backgroundColor: colors.white },
                ]}
                activeOpacity={0.8}
                onPress={() => setShowZonePicker(true)}
              >
                <View style={styles.zoneSelectContent}>
                  <View
                    style={[
                      styles.zoneIconSmall,
                      {
                        backgroundColor:
                          zones.length === 0
                            ? colors.mediumBg
                            : colors.primary + "15",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedZoneId
                          ? (zones.find((z) => z.id === selectedZoneId)
                              ?.icon as any)
                          : "layers"
                      }
                      size={14}
                      color={
                        zones.length === 0
                          ? colors.textSecondary
                          : colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[styles.zoneValue, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {zones.length === 0
                      ? "Aucune zone"
                      : selectedZoneId
                      ? zones.find((z) => z.id === selectedZoneId)?.name
                      : "Vue globale"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rightColumn} pointerEvents="box-none">
            <TouchableOpacity
              style={[styles.circleButton, { backgroundColor: colors.white }]}
              onPress={() => router.push("/(tabs)/notifications")}
            >
              <Ionicons name="notifications" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleButton, { backgroundColor: colors.white }]}
              onPress={() => setShowMapTypePicker(true)}
            >
              <Ionicons name="map" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleButton, { backgroundColor: colors.white }]}
              onPress={focusOnBracelet}
            >
              <Ionicons name="navigate" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.circleButton,
                {
                  backgroundColor: colors.white,
                  borderColor: isDrawingMode ? colors.danger : "transparent",
                  borderWidth: isDrawingMode ? 2 : 0,
                },
              ]}
              onPress={toggleDrawingMode}
            >
              <Ionicons
                name={isDrawingMode ? "close" : "shield-checkmark"}
                size={24}
                color={isDrawingMode ? colors.danger : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Drawing Controls Bottom */}
      <View
        style={[styles.bottomContainer, { bottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        {isDrawingMode ? (
          <View
            style={[styles.drawingControls, { backgroundColor: colors.white }]}
          >
            {/* SÉLECTEUR DE FORME */}
            <View style={styles.shapeSelector}>
              <TouchableOpacity
                onPress={() => setDrawingType("polygon")}
                style={[
                  styles.shapeBtn,
                  drawingType === "polygon" && {
                    backgroundColor: colors.primary + "15",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="shape-polygon-plus"
                  size={18}
                  color={
                    drawingType === "polygon"
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.shapeBtnText,
                    {
                      color:
                        drawingType === "polygon"
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  Polygone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDrawingType("circle")}
                style={[
                  styles.shapeBtn,
                  drawingType === "circle" && {
                    backgroundColor: colors.primary + "15",
                  },
                ]}
              >
                <Ionicons
                  name="radio-button-off"
                  size={18}
                  color={
                    drawingType === "circle"
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.shapeBtnText,
                    {
                      color:
                        drawingType === "circle"
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  Cercle
                </Text>
              </TouchableOpacity>
            </View>

            {/* CONTRÔLE DU RAYON SI CERCLE */}
            {drawingType === "circle" && circleCenter && (
              <View style={styles.radiusControlRow}>
                <Text
                  style={[styles.radiusText, { color: colors.textSecondary }]}
                >
                  Rayon :{" "}
                  <Text
                    style={{ fontWeight: "800", color: colors.textPrimary }}
                  >
                    {(circleRadius / 1000).toFixed(1)} km
                  </Text>
                </Text>
                <View style={styles.radiusButtons}>
                  <TouchableOpacity
                    onPress={() =>
                      setCircleRadius(Math.max(100, circleRadius - 100))
                    }
                    style={styles.radiusBtn}
                  >
                    <Ionicons name="remove" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCircleRadius(circleRadius + 100)}
                    style={styles.radiusBtn}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.drawingHeader}>
              <Ionicons
                name={drawingType === "circle" ? "radio-button-on" : "create"}
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
                {drawingType === "circle"
                  ? circleCenter
                    ? "Ajustez le centre"
                    : "Placez le centre"
                  : zoneCoordinates.length === 0
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
                onPress={() => hasEnoughPoints && setShowZoneModal(true)}
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
            snapToInterval={CARD_WIDTH + 10}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            scrollEnabled={bracelets.length > 1}
            contentContainerStyle={{
              paddingHorizontal: bracelets.length === 1
                ? Dimensions.get("window").width / 2 - (CARD_WIDTH / 2)
                : SPACING_FOR_CARD_INSET,
              justifyContent: bracelets.length === 1 ? 'center' : 'flex-start',
            }}
            onMomentumScrollEnd={(event) => {
              if (bracelets.length > 1) {
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(contentOffsetX / (CARD_WIDTH + 10));
                if (bracelets[index]) {
                  const bracelet = bracelets[index];
                  console.log('[MapView] Swiped to bracelet:', bracelet.id);
                  onMarkerPress(bracelet, index);
                }
              }
            }}
            renderItem={({ item }) => (
              <BraceletMapCard
                item={item}
                isSelected={selectedBraceletId === item.id}
                onPress={() => {}}
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
      <ZonePickerTopSheet
        isVisible={showZonePicker}
        onClose={() => setShowZonePicker(false)}
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelectZone={(id) => {
          setSelectedZoneId(id);
          setShowZonePicker(false);
        }}
        isDark={isDark}
      />

      {/* Modal de création */}
      <Modal visible={showZoneModal} transparent={true} animationType="slide">
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
    elevation: 5,
  },
  drawingPointCenter: { width: 8, height: 8, borderRadius: 4 },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topLayoutRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  centerContainer: { flex: 1 },
  searchWrapper: { flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500" },
  suggestionsList: {
    marginTop: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 8,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
    gap: 10,
  },
  suggestionText: { fontSize: 14, flex: 1 },
  zoneFakeSelect: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  zoneSelectContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  zoneIconSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  zoneValue: { fontSize: 13, fontWeight: "700", flex: 1 },
  rightColumn: { flexDirection: "column", gap: 12 },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    elevation: 4,
  },
  bottomContainer: { position: "absolute", left: 0, right: 0, bottom: 0 },
  drawingControls: {
    marginHorizontal: 16,
    padding: 12, // Réduit un peu le padding pour gagner de la place
    borderRadius: 20,
    gap: 8, // Réduit l'espace entre les éléments
    shadowColor: "#000",
    elevation: 5,
    marginBottom: Platform.OS === "ios" ? -25 : 10, // Un peu d'espace supplémentaire en bas
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
  shapeSelector: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
  },
  shapeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  shapeBtnText: { fontSize: 13, fontWeight: "600" },
  radiusControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  radiusText: { fontSize: 14 },
  radiusButtons: { flexDirection: "row", gap: 8 },
  radiusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
});
