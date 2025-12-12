import React from 'react';
import { Image, View, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { colors } from '@/theme/colors';

export interface AvatarProps {
  source?: ImageSourcePropType; // Image source (for backwards compatibility)
  uri?: string | null; // Image URI
  name?: string; // Name for initials fallback
  size?: number; // Size of the avatar
}

// Generate a consistent color from a name string
const getColorFromName = (name: string): string => {
  const pastelColors = [
    colors.dark.pastelPink,
    colors.dark.pastelBlue,
    colors.dark.pastelGreen,
    colors.dark.pastelPurple,
    colors.dark.pastelPeach,
    colors.dark.pastelOrange,
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return pastelColors[Math.abs(hash) % pastelColors.length];
};

// Get initials from a name
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ source, uri, name = 'User', size = 50 }) => {
  const hasImage = source || uri;
  const bgColor = getColorFromName(name);
  const initials = getInitials(name);
  const fontSize = size * 0.4;
  
  // Resolve image source
  const imageSource = source || (uri ? { uri } : null);
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size,
          borderRadius: size / 2,
          backgroundColor: hasImage ? colors.dark.surface : bgColor,
        }
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Avatar for ${name}`}
    >
      {imageSource ? (
        <Image 
          source={imageSource} 
          style={[
            styles.image, 
            { 
              width: size, 
              height: size,
              borderRadius: size / 2,
            }
          ]} 
        />
      ) : (
        <Text 
          style={[
            styles.initials, 
            { fontSize }
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: colors.dark.background,
    fontWeight: '600',
  },
});

export default Avatar;