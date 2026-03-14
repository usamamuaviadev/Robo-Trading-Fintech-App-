import React from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';

export interface AvatarProps {
  source: ImageSourcePropType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: any;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'md',
  style,
}) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const dimensions = sizeMap[size];

  return (
    <View
      className="rounded-full overflow-hidden bg-neutral-200"
      style={[
        {
          width: dimensions,
          height: dimensions,
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          width: dimensions,
          height: dimensions,
        }}
        resizeMode="cover"
      />
    </View>
  );
};
