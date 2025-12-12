import React, { useEffect } from 'react';
import { 
  Modal as RNModal, 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  SlideInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  content?: React.ReactNode;
  children?: React.ReactNode;
  showCloseButton?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const ModalContent: React.FC<Omit<ModalProps, 'visible'>> = ({
  onClose,
  title,
  content,
  children,
  showCloseButton,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={SlideInDown.duration(300).easing(Easing.out(Easing.quad))}
        style={[
          styles.modalContainer,
          { marginBottom: insets.bottom || spacing.lg },
          animatedStyle
        ]}
      >
        {/* Handle Bar */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        {(title || showCloseButton) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {showCloseButton && (
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
              </Pressable>
            )}
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {content || children}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const Modal: React.FC<ModalProps> = ({ 
  visible, 
  onClose, 
  title,
  content,
  children,
  showCloseButton = true,
}) => {
  return (
    <RNModal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        {visible && (
          <ModalContent
            onClose={onClose}
            title={title}
            content={content}
            showCloseButton={showCloseButton}
          >
            {children}
          </ModalContent>
        )}
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h4,
    color: colors.dark.text,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  content: {
    paddingTop: spacing.sm,
  },
});

export default Modal;