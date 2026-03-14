import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const variantStyles = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
    neutral: 'bg-neutral-200 text-neutral-700',
  };

  const sizeStyles = {
    sm: 'px-sm py-xs text-caption-sm',
    md: 'px-md py-sm text-label-sm',
  };

  return (
    <View
      className={`
        inline-flex items-center justify-center rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      <Text className="font-medium">{label}</Text>
    </View>
  );
};
