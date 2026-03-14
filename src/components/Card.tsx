import React from 'react';
import { View, ViewStyle } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  style?: ViewStyle;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  testID,
}) => {
  const variantStyles = {
    default: 'bg-neutral-50 rounded-lg shadow-md p-md',
    elevated: 'bg-neutral-50 rounded-lg shadow-lg p-lg',
    bordered: 'bg-neutral-50 rounded-lg border border-neutral-200 p-md',
  };

  return (
    <View
      className={variantStyles[variant]}
      style={style}
      testID={testID}
    >
      {children}
    </View>
  );
};
