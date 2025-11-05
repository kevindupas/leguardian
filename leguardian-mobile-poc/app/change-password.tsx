import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { getColors } from '../constants/Colors';
import { authService } from '../services/auth';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getColors(isDark);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!currentPassword) {
      Alert.alert(t('common.error'), t('password.currentPassword'));
      return false;
    }

    if (!newPassword) {
      Alert.alert(t('common.error'), t('password.newPassword'));
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('password.passwordTooShort'));
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('password.passwordMismatch'));
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert(t('common.success'), t('password.success'), [
        {
          text: t('common.ok'),
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || t('password.error');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.white }]}
      edges={['left', 'right', 'top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.mediumBg }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('password.title')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Password */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('password.currentPassword')}
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.mediumBg,
                  backgroundColor: colors.lightBg,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: colors.textPrimary },
                ]}
                placeholder={t('password.currentPassword')}
                placeholderTextColor={colors.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                editable={!loading}
                selectTextOnFocus={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('password.newPassword')}
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.mediumBg,
                  backgroundColor: colors.lightBg,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: colors.textPrimary },
                ]}
                placeholder={t('password.newPassword')}
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                editable={!loading}
                selectTextOnFocus={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('password.confirmPassword')}
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.mediumBg,
                  backgroundColor: colors.lightBg,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: colors.textPrimary },
                ]}
                placeholder={t('password.confirmPassword')}
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                selectTextOnFocus={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Text */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.primary + '10' },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={18}
              color={colors.primary}
            />
            <Text
              style={[
                styles.infoText,
                { color: colors.textSecondary },
              ]}
            >
              {t('password.passwordTooShort')}
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <SafeAreaView
          style={[
            styles.actionContainer,
            { borderTopColor: colors.mediumBg },
          ]}
          edges={['left', 'right', 'bottom']}
        >
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { borderColor: colors.primary },
            ]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.primary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.changeButton,
              { backgroundColor: colors.primary },
              loading && styles.buttonLoading,
            ]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.changeButtonText}>
                {t('password.change')}
              </Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  changeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonLoading: {
    opacity: 0.6,
  },
});
