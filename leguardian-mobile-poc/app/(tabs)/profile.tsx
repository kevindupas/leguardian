import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router"; // <-- Ajout useNavigation
import { useTheme } from "../../contexts/ThemeContext";
import { useI18n } from "../../contexts/I18nContext";
import { getColors } from "../../constants/Colors";
import { authService } from "../../services/auth";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation(); // <-- Récupération navigation
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const colors = getColors(isDark);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- C'EST ICI : ON CACHE LE BANDEAU NATIF ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await authService.getUser();
      setUser(userData);
    } catch (error) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t("profile.logout"),
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.logout"),
          style: "destructive",
          onPress: async () => {
            await authService.logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.lightBg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const MenuItem = ({
    icon,
    label,
    subtext,
    onPress,
    color = colors.textPrimary,
  }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.white }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.lightBg }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        {subtext && (
          <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
            {subtext}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={["top"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER CUSTOM */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t("profile.title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: colors.primary + "15",
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.avatarInitials, { color: colors.primary }]}>
              {user?.name?.substring(0, 2).toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>

          <View
            style={[
              styles.roleBadge,
              { backgroundColor: colors.success + "15" },
            ]}
          >
            <Text style={[styles.roleText, { color: colors.success }]}>
              Compte vérifié
            </Text>
          </View>
        </View>

        {/* PRÉFÉRENCES */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("profile.settings")}
        </Text>

        {/* Thème */}
        <View
          style={[styles.selectorContainer, { backgroundColor: colors.white }]}
        >
          <Text style={[styles.selectorLabel, { color: colors.textPrimary }]}>
            {t("profile.theme")}
          </Text>
          <View
            style={[styles.segmentTrack, { backgroundColor: colors.lightBg }]}
          >
            {(["light", "dark", "system"] as const).map((mode) => {
              const isActive = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.segmentBtn,
                    isActive && styles.segmentBtnActive,
                  ]}
                  onPress={() => setThemeMode(mode)}
                >
                  <Ionicons
                    name={
                      mode === "light"
                        ? "sunny"
                        : mode === "dark"
                        ? "moon"
                        : "contrast"
                    }
                    size={16}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {mode === "light"
                      ? "Clair"
                      : mode === "dark"
                      ? "Sombre"
                      : "Auto"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Langue */}
        <View
          style={[
            styles.selectorContainer,
            { backgroundColor: colors.white, marginTop: 12 },
          ]}
        >
          <Text style={[styles.selectorLabel, { color: colors.textPrimary }]}>
            {t("profile.language")}
          </Text>
          <View
            style={[styles.segmentTrack, { backgroundColor: colors.lightBg }]}
          >
            {(["fr", "en"] as const).map((lang) => {
              const isActive = language === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.segmentBtn,
                    isActive && styles.segmentBtnActive,
                  ]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {lang === "fr" ? "Français 🇫🇷" : "English 🇬🇧"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* COMPTE */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textSecondary, marginTop: 24 },
          ]}
        >
          Compte
        </Text>

        <View style={styles.menuGroup}>
          <MenuItem
            icon="lock-closed-outline"
            label={t("profile.changePassword")}
            onPress={() => router.push("/change-password")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.lightBg }]}
          />
          <MenuItem
            icon="information-circle-outline"
            label={t("profile.version")}
            subtext="v1.0.0"
            onPress={() => {}}
          />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.white, borderColor: colors.danger },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            {t("profile.logout")}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          SafeBracelet App © 2024
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  profileCard: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "800",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  selectorContainer: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  segmentTrack: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    height: 44,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },

  menuGroup: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 30,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
    opacity: 0.5,
  },
});
