import React, { useState } from 'react';
import { View, TextInput as RNTextInput, TextInputProps as RNTextInputProps, Pressable } from 'react-native';
import { Text } from '@/components';
import { Eye, EyeOff } from 'lucide-react-native';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  isRTL?: boolean;
  type?: 'text' | 'password' | 'phone';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  isRTL = false,
  type = 'text',
  leftIcon,
  rightIcon,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const isPhone = type === 'phone';

  return (
    <View className="mb-4">
      {label && (
        <Text className={`text-body-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center border rounded-lg px-4 ${
          error ? 'border-error-500' : 'border-neutral-300'
        } bg-white ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
        style={{ minHeight: 48 }}
      >
        {leftIcon && !isRTL && (
          <View className="mr-2">
            {leftIcon}
          </View>
        )}
        {rightIcon && isRTL && (
          <View className="ml-2">
            {rightIcon}
          </View>
        )}
        <RNTextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={isPhone ? 'phone-pad' : props.keyboardType}
          className={`flex-1 text-body text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}
          style={{ 
            writingDirection: isRTL ? 'rtl' : 'ltr',
            textAlignVertical: 'center',
            paddingTop: 0,
            paddingBottom: 0,
            paddingVertical: 12,
            includeFontPadding: false,
          }}
          placeholderTextColor="#9CA3AF"
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} className={isRTL ? 'mr-2' : 'ml-2'}>
            {showPassword ? (
              <EyeOff size={20} color="#9CA3AF" />
            ) : (
              <Eye size={20} color="#9CA3AF" />
            )}
          </Pressable>
        )}
        {rightIcon && !isRTL && (
          <View className="ml-2">
            {rightIcon}
          </View>
        )}
        {leftIcon && isRTL && (
          <View className="mr-2">
            {leftIcon}
          </View>
        )}
      </View>
      {error && (
        <Text className={`text-body-sm text-error-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {error}
        </Text>
      )}
    </View>
  );
};
