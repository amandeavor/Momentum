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

export default function TermsOfService() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { paddingBottom: insets.bottom + spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using Momentum, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. Use License</Text>
        <Text style={styles.paragraph}>
          Permission is granted to temporarily download one copy of the materials (information or software) on Momentum for personal, non-commercial transitory viewing only.
        </Text>

        <Text style={styles.sectionTitle}>3. Disclaimer</Text>
        <Text style={styles.paragraph}>
          The materials on Momentum are provided "as is". Momentum makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </Text>

        <Text style={styles.sectionTitle}>4. Limitations</Text>
        <Text style={styles.paragraph}>
          In no event shall Momentum or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Momentum.
        </Text>

        <Text style={styles.sectionTitle}>5. Revisions and Errata</Text>
        <Text style={styles.paragraph}>
          The materials appearing on Momentum could include technical, typographical, or photographic errors. Momentum does not warrant that any of the materials on its website are accurate, complete, or current.
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
