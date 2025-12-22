import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../constants/Colors";

interface MapSearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  suggestions: any[];
  onSelectSuggestion: (placeId: string, description: string) => void;
  isSearching: boolean;
  isDark: boolean;
}

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  suggestions,
  onSelectSuggestion,
  isSearching,
  isDark,
}) => {
  const colors = getColors(isDark);
  const showSuggestions = suggestions.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          {
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
            backgroundColor: colors.white,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.primary} />
        <TextInput
          placeholder="Chercher une adresse..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          style={{ flex: 1, fontSize: 14, fontWeight: "500" }}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : searchQuery ? (
          <TouchableOpacity
            onPress={() => {
              onSearchChange("");
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

      {showSuggestions && (
        <View
          style={{
            marginTop: 8,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            elevation: 8,
            overflow: "hidden",
            backgroundColor: colors.white,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 200 }}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#f0f0f0",
                  gap: 10,
                }}
                onPress={() =>
                  onSelectSuggestion(item.place_id, item.description)
                }
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 14,
                    flex: 1,
                    color: colors.textPrimary,
                  }}
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
  );
};
