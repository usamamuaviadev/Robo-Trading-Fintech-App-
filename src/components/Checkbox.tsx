import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from './Text';

export interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  isRTL?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  isRTL = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <View
        className={`w-6 h-6 rounded border-2 items-center justify-center ${
          checked ? 'bg-primary-500 border-primary-500' : 'bg-white border-neutral-300'
        } ${isRTL ? 'ml-3' : 'mr-3'}`}
      >
        {checked && <Check size={16} color="#fff" strokeWidth={3} />}
      </View>
      {label && (
        <Text className={`text-body text-gray-700 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};
