import React from 'react';
import { Pressable, ViewStyle, TextStyle } from 'react-native';
import { Text } from './Text';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const variantStyles: Record<string,string> = {
    primary: disabled ? 'bg-neutral-200' : 'bg-primary-600 active:bg-primary-500',
    secondary: disabled ? 'bg-neutral-200' : 'bg-secondary-500 active:bg-secondary-600',
    outline: 'border-2 border-primary-500 bg-transparent',
    ghost: 'bg-transparent text-secondary-500',
    danger: disabled ? 'bg-neutral-200' : 'bg-error-500 active:bg-error-600',
  };

  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const sizeTextStyles = {
    sm: 'text-button-sm',
    md: 'text-button',
    lg: 'text-h6',
  };

  const textColor = (() => {
    if (disabled) return 'text-neutral-400';
    if (variant === 'outline' || variant === 'ghost') return 'text-black';
    if (variant === 'danger') return 'text-white';
    return 'text-white';
  })();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      className={`
        rounded-md font-arabic flex items-center justify-center transition-all duration-200
        ${sizeStyles[size]}
        ${variantStyles[variant]}
      `}
      style={style}
    >
      <Text
        className={`
          font-semibold font-arabic
          ${sizeTextStyles[size]}
          ${textColor}
        `}
        style={textStyle}
      >
        {title}
      </Text>
    </Pressable>
  );
};
