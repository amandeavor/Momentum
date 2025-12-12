import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  style?: object;
}

const Badge: React.FC<BadgeProps> = ({ label, style }) => {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  label: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default Badge;