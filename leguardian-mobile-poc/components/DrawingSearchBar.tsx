import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DrawingSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleTextChange: (text: string) => Promise<void>;
  suggestions: any[];
  handleSelectSuggestion: (
    placeId: string,
    description: string
  ) => Promise<void>;
  isSearching: boolean;
  colors: any; // Define a more specific type if available
}

export const DrawingSearchBar: React.FC<DrawingSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  handleTextChange,
  suggestions,
  handleSelectSuggestion,
  isSearching,
  colors,
}) => {
  return (
    <View style={styles.searchWrapper}>
      <View style={[styles.searchContainer, { backgroundColor: colors.white }]}>
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
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {suggestions.length > 0 && (
        <View
          style={[styles.suggestionsList, { backgroundColor: colors.white }]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 200 }}
          >
            {suggestions.map((item: any) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.suggestionItem}
                onPress={() =>
                  handleSelectSuggestion(item.place_id, item.description)
                }
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.suggestionText, { color: colors.textPrimary }]}
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

const styles = StyleSheet.create({
  searchWrapper: { flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
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
});
