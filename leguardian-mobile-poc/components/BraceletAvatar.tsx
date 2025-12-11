import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

interface BraceletAvatarProps {
  braceletName: string;
  color: string;
  photoUri?: string;
  size?: 'small' | 'medium' | 'large';
}

export const BraceletAvatar: React.FC<BraceletAvatarProps> = ({
  braceletName,
  color,
  photoUri,
  size = 'medium',
}) => {
  const sizeConfig = {
    small: { container: 36, fontSize: 11, borderWidth: 2 },
    medium: { container: 48, fontSize: 13, borderWidth: 2.5 },
    large: { container: 80, fontSize: 16, borderWidth: 3 },
  };

  const config = sizeConfig[size];

  const initials = braceletName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        {
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
          backgroundColor: photoUri ? undefined : color,
          borderWidth: config.borderWidth,
          borderColor: photoUri ? color : 'transparent',
        },
      ]}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={[
            styles.photo,
            {
              width: config.container,
              height: config.container,
              borderRadius: config.container / 2,
            },
          ]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: config.fontSize, color: '#fff' }]}>
          {initials || '?'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
