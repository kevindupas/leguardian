import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const colors = getColors(isDark);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await authService.getUser();
      setUser(userData);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        "Impossible de charger les informations utilisateur"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (mode: "light" | "dark" | "system") => {
    console.log("[Profile] Changing theme to:", mode);
    await setThemeMode(mode);
  };

  const handleLanguageChange = async (lang: "fr" | "en") => {
    console.log("[Profile] Changing language to:", lang);
    await setLanguage(lang);
  };

  const handleChangePassword = () => {
    router.push("/change-password");
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.white }]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t("profile.title")}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {t("profile.settings")}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.lightBg,
              borderColor: colors.mediumBg,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="person-circle" size={48} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {user?.name}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("profile.settings")}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.lightBg,
              borderColor: colors.mediumBg,
            },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="contrast" size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: colors.textPrimary }]}
                >
                  {t("profile.theme")}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {themeMode === "system"
                    ? t("profile.systemMode")
                    : themeMode === "dark"
                    ? t("profile.darkMode")
                    : t("profile.lightMode")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            {(["light", "dark", "system"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      themeMode === mode
                        ? colors.primary + "20"
                        : "transparent",
                    borderColor:
                      themeMode === mode ? colors.primary : colors.mediumBg,
                  },
                ]}
                onPress={() => handleThemeChange(mode)}
              >
                <Ionicons
                  name={
                    mode === "light"
                      ? "sunny"
                      : mode === "dark"
                      ? "moon"
                      : "contrast"
                  }
                  size={18}
                  color={
                    themeMode === mode ? colors.primary : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color:
                        themeMode === mode
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {mode === "light"
                    ? t("profile.lightMode")
                    : mode === "dark"
                    ? t("profile.darkMode")
                    : t("profile.systemMode")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.lightBg,
              borderColor: colors.mediumBg,
            },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: colors.textPrimary }]}
                >
                  {t("profile.language")}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === "fr" ? "Français" : "English"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            {(["fr", "en"] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      language === lang ? colors.primary + "20" : "transparent",
                    borderColor:
                      language === lang ? colors.primary : colors.mediumBg,
                  },
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color:
                        language === lang
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {lang === "fr" ? "Français" : "English"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Sécurité
        </Text>

        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: colors.lightBg,
              borderColor: colors.mediumBg,
            },
          ]}
          onPress={handleChangePassword}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: colors.textPrimary }]}
                >
                  {t("profile.changePassword")}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("password.title")}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          À propos
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.lightBg,
              borderColor: colors.mediumBg,
            },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.primary}
              />
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: colors.textPrimary }]}
                >
                  {t("profile.version")}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.danger }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={18} color={colors.white} />
          <Text style={styles.logoutButtonText}>{t("profile.logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
    marginBottom: 32,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
