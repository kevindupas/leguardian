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
    small: { container: 40, fontSize: 12 },
    medium: { container: 60, fontSize: 14 },
    large: { container: 100, fontSize: 18 },
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
          backgroundColor: color,
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
        <Text style={[styles.initials, { fontSize: config.fontSize }]}>
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
  },
  photo: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
