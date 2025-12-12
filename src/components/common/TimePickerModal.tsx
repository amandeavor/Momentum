import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Button from './Button';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string; // HH:MM format
  onSave: (time: string) => void;
  title?: string;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  value,
  onSave,
  title = 'Select Time',
}) => {
  // Parse initial time
  const [hours, minutes] = value.split(':').map(Number);
  const initialDate = new Date();
  initialDate.setHours(hours || 22, minutes || 0, 0, 0);

  const [selectedTime, setSelectedTime] = useState(initialDate);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handleChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleSave = () => {
    const h = selectedTime.getHours().toString().padStart(2, '0');
    const m = selectedTime.getMinutes().toString().padStart(2, '0');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(`${h}:${m}`);
    onClose();
  };

  const formatDisplayTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${ampm}`;
  };

  if (Platform.OS === 'android' && !visible) {
    return null;
  }

  // Android uses inline picker
  if (Platform.OS === 'android') {
    return visible ? (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={(event, date) => {
          if (event.type === 'set' && date) {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            onSave(`${h}:${m}`);
          }
          onClose();
        }}
      />
    ) : null;
  }

  // iOS uses modal
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
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false}
              display="spinner"
              onChange={handleChange}
              textColor={colors.dark.text}
              themeVariant="dark"
              style={styles.picker}
            />
          </View>

          <Text style={styles.selectedTime}>
            {formatDisplayTime(selectedTime)}
          </Text>

          <View style={styles.buttons}>
            <Button
              label="Cancel"
              variant="ghost"
              onPress={onClose}
              style={styles.button}
            />
            <Button
              label="Save"
              variant="primary"
              onPress={handleSave}
              style={styles.button}
            />
          </View>
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
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.dark.text,
  },
  pickerContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  picker: {
    width: 280,
    height: 180,
  },
  selectedTime: {
    ...typography.h2,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});

export default TimePickerModal;
