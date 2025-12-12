import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Preset avatars - simple geometric patterns
const PRESET_AVATARS = [
  { id: 'gradient1', colors: ['#8fcfff', '#c4b5fd'] },
  { id: 'gradient2', colors: ['#ffb3c7', '#fcd5b5'] },
];

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

interface AvatarPickerProps {
  visible: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  onSelectAvatar: (avatar: string | null, type: 'preset' | 'custom') => void;
  userName?: string;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  visible,
  onClose,
  currentAvatar,
  onSelectAvatar,
  userName = 'U',
}) => {
  const [loading, setLoading] = useState(false);
  const initials = userName.charAt(0).toUpperCase();

  const handlePresetSelect = (presetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectAvatar(presetId, 'preset');
    onClose();
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a custom avatar.'
        );
        return;
      }

      setLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (approximate from dimensions)
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
          Alert.alert(
            'Image Too Large',
            'Please select an image under 500KB.'
          );
          setLoading(false);
          return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSelectAvatar(asset.uri, 'custom');
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectAvatar(null, 'preset');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Avatar</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
            </Pressable>
          </View>

          {/* Current Avatar Preview */}
          <View style={styles.previewSection}>
            <View style={styles.previewAvatar}>
              {currentAvatar?.startsWith('file://') || currentAvatar?.startsWith('http') ? (
                <Image source={{ uri: currentAvatar }} style={styles.previewImage} />
              ) : currentAvatar?.startsWith('gradient') ? (
                <View
                  style={[
                    styles.previewGradient,
                    {
                      backgroundColor:
                        PRESET_AVATARS.find((p) => p.id === currentAvatar)?.colors[0] ||
                        colors.dark.elevated,
                    },
                  ]}
                >
                  <Text style={styles.previewInitials}>{initials}</Text>
                </View>
              ) : (
                <View style={styles.previewDefault}>
                  <Text style={styles.previewInitials}>{initials}</Text>
                </View>
              )}
            </View>
            <Text style={styles.previewHint}>Current avatar</Text>
          </View>

          {/* Preset Avatars */}
          <Text style={styles.sectionLabel}>Presets</Text>
          <View style={styles.presetsRow}>
            {PRESET_AVATARS.map((preset) => (
              <Pressable
                key={preset.id}
                style={[
                  styles.presetOption,
                  { backgroundColor: preset.colors[0] },
                  currentAvatar === preset.id && styles.presetSelected,
                ]}
                onPress={() => handlePresetSelect(preset.id)}
              >
                <Text style={styles.presetInitials}>{initials}</Text>
              </Pressable>
            ))}
          </View>

          {/* Upload Custom */}
          <Text style={styles.sectionLabel}>Custom</Text>
          <Pressable
            style={styles.uploadButton}
            onPress={handleImagePick}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.dark.text} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color={colors.dark.text} />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.uploadHint}>Max size: 500KB</Text>

          {/* Remove Avatar */}
          {currentAvatar && (
            <Pressable style={styles.removeButton} onPress={handleRemoveAvatar}>
              <Ionicons name="trash-outline" size={18} color={colors.dark.error} />
              <Text style={styles.removeText}>Remove Avatar</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.dark.text,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDefault: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.dark.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInitials: {
    ...typography.h1,
    color: colors.dark.text,
    fontSize: 32,
  },
  previewHint: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.dark.textSecondary,
    marginBottom: spacing.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  presetOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  presetSelected: {
    borderColor: colors.dark.text,
  },
  presetInitials: {
    ...typography.h3,
    color: colors.dark.background,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dark.elevated,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  uploadText: {
    ...typography.body,
    color: colors.dark.text,
  },
  uploadHint: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  removeText: {
    ...typography.bodySmall,
    color: colors.dark.error,
  },
});

export default AvatarPicker;
