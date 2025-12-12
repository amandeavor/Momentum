import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import BreathingExercise from './BreathingExercise';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface UrgeSurfingProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type ToolType = 'breathing' | 'grounding' | 'affirmation';

const AFFIRMATIONS = [
  "This feeling will pass. I am stronger than this urge.",
  "I choose my actions. My urges don't control me.",
  "Every moment I resist, I become stronger.",
  "I am building the life I want, one choice at a time.",
  "This discomfort is temporary. My growth is permanent.",
  "I respect myself enough to wait.",
  "I can observe this feeling without acting on it.",
  "My future self will thank me for this choice.",
];

export const UrgeSurfing: React.FC<UrgeSurfingProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [currentAffirmation, setCurrentAffirmation] = useState(0);

  const handleToolSelect = (tool: ToolType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTool(tool);
  };

  const handleBack = () => {
    setSelectedTool(null);
  };

  const handleNextAffirmation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentAffirmation((prev) => (prev + 1) % AFFIRMATIONS.length);
  };

  const handleBreathingComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete?.();
  };

  const renderToolContent = () => {
    switch (selectedTool) {
      case 'breathing':
        return (
          <BreathingExercise
            onClose={handleBack}
            onComplete={handleBreathingComplete}
            cycles={3}
          />
        );
      
      case 'grounding':
        return (
          <View style={styles.toolContent}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.dark.text} />
            </Pressable>
            <Text style={styles.toolTitle}>5-4-3-2-1 Grounding</Text>
            <Text style={styles.toolDescription}>
              Focus on your senses to bring yourself to the present moment.
            </Text>
            
            <View style={styles.groundingList}>
              <GroundingStep number={5} sense="SEE" prompt="Name 5 things you can see" />
              <GroundingStep number={4} sense="TOUCH" prompt="Name 4 things you can feel" />
              <GroundingStep number={3} sense="HEAR" prompt="Name 3 things you can hear" />
              <GroundingStep number={2} sense="SMELL" prompt="Name 2 things you can smell" />
              <GroundingStep number={1} sense="TASTE" prompt="Name 1 thing you can taste" />
            </View>
          </View>
        );
      
      case 'affirmation':
        return (
          <View style={styles.toolContent}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.dark.text} />
            </Pressable>
            <Text style={styles.toolTitle}>Affirmations</Text>
            
            <View style={styles.affirmationContainer}>
              <Ionicons name="sparkles" size={32} color={colors.dark.pastelPurple} />
              <Text style={styles.affirmationText}>
                {AFFIRMATIONS[currentAffirmation]}
              </Text>
            </View>
            
            <Pressable style={styles.nextButton} onPress={handleNextAffirmation}>
              <Text style={styles.nextButtonText}>Next Affirmation</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.dark.background} />
            </Pressable>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {selectedTool ? (
          renderToolContent()
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Urge Surfing</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.dark.text} />
              </Pressable>
            </View>

            {/* Introduction */}
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Ionicons name="water" size={40} color={colors.dark.pastelBlue} />
              </View>
              <Text style={styles.introText}>
                Urges are like waves - they rise, peak, and eventually pass. 
                Choose a tool below to help you ride through this moment.
              </Text>
            </View>

            {/* Tools */}
            <View style={styles.tools}>
              <ToolCard
                icon="fitness"
                title="Breathing"
                description="4-4-4-2 box breathing to calm your nervous system"
                color={colors.dark.pastelBlue}
                onPress={() => handleToolSelect('breathing')}
              />
              <ToolCard
                icon="eye"
                title="5-4-3-2-1 Grounding"
                description="Use your senses to anchor to the present"
                color={colors.dark.pastelGreen}
                onPress={() => handleToolSelect('grounding')}
              />
              <ToolCard
                icon="sparkles"
                title="Affirmations"
                description="Remind yourself of your strength and values"
                color={colors.dark.pastelPurple}
                onPress={() => handleToolSelect('affirmation')}
              />
            </View>

            {/* Tip */}
            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={20} color={colors.dark.warning} />
              <Text style={styles.tipText}>
                Most urges pass within 15-20 minutes. You've got this!
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

// Tool Card Component
interface ToolCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, color, onPress }) => (
  <Pressable
    style={({ pressed }) => [styles.toolCard, pressed && styles.toolCardPressed]}
    onPress={onPress}
  >
    <View style={[styles.toolIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <View style={styles.toolInfo}>
      <Text style={styles.toolCardTitle}>{title}</Text>
      <Text style={styles.toolCardDescription}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.dark.textTertiary} />
  </Pressable>
);

// Grounding Step Component
interface GroundingStepProps {
  number: number;
  sense: string;
  prompt: string;
}

const GroundingStep: React.FC<GroundingStepProps> = ({ number, sense, prompt }) => (
  <View style={styles.groundingStep}>
    <View style={styles.groundingNumber}>
      <Text style={styles.groundingNumberText}>{number}</Text>
    </View>
    <View style={styles.groundingInfo}>
      <Text style={styles.groundingSense}>{sense}</Text>
      <Text style={styles.groundingPrompt}>{prompt}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.dark.text,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.lg,
    padding: spacing.xs,
    zIndex: 10,
  },
  intro: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dark.pastelBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  introText: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  tools: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  toolCardPressed: {
    opacity: 0.7,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  toolInfo: {
    flex: 1,
  },
  toolCardTitle: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  toolCardDescription: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.dark.warning + '15',
    borderRadius: radii.md,
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.dark.warning,
    flex: 1,
  },
  // Tool Content
  toolContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  toolTitle: {
    ...typography.h2,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  toolDescription: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  // Grounding
  groundingList: {
    gap: spacing.md,
  },
  groundingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  groundingNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dark.pastelGreen + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  groundingNumberText: {
    ...typography.h2,
    color: colors.dark.pastelGreen,
  },
  groundingInfo: {
    flex: 1,
  },
  groundingSense: {
    ...typography.caption,
    color: colors.dark.pastelGreen,
    fontWeight: '700',
    letterSpacing: 1,
  },
  groundingPrompt: {
    ...typography.body,
    color: colors.dark.text,
  },
  // Affirmation
  affirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  affirmationText: {
    ...typography.h3,
    color: colors.dark.text,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 32,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dark.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
    marginBottom: spacing.xl,
  },
  nextButtonText: {
    ...typography.body,
    color: colors.dark.background,
    fontWeight: '600',
  },
});

export default UrgeSurfing;
