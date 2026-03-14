import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import Pot from '@/assets/icons/pot.svg';
import { ArrowRight, ChevronRight } from 'lucide-react-native';

interface CalculatorCardProps {
  onPress?: () => void;
}

export const CalculatorCard: React.FC<CalculatorCardProps> = ({ onPress }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Pressable 
      onPress={onPress}
      className={` rounded-2xl p-5 ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 border border-gray-900/20 items-center justify-between active:opacity-80`}
    >
        <View className="flex-1 flex-row gap-2">
      <View className="flex-1">
        <Text className={`text-h4 font-bold text-black  ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('home.calculatorTitle')}
        </Text>
        <Text className={`text-body text-black opacity-90 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('home.calculatorDesc')}
        </Text>
      </View>
      <Pot/>
        </View>
        <ChevronRight size={30} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
    </Pressable>
  );
};
