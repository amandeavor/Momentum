import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PrivacyPolicy() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color={colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { paddingBottom: insets.bottom + spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly to us, such as when you create an account, update your profile, or use our features. This may include your name, email address, and usage data.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect Momentum and our users.
        </Text>

        <Text style={styles.sectionTitle}>3. Data Storage</Text>
        <Text style={styles.paragraph}>
          Your data is stored securely on our servers. We implement a variety of security measures to maintain the safety of your personal information.
        </Text>

        <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          We may use third-party services that collect, monitor and analyze this type of information in order to increase our service's functionality. These third-party service providers have their own privacy policies addressing how they use such information.
        </Text>

        <Text style={styles.sectionTitle}>5. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </Text>

        <Text style={styles.lastUpdated}>
          Last updated: December 6, 2025
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.dark.text,
    fontSize: 18,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 18,
  },
  paragraph: {
    ...typography.body,
    color: colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
