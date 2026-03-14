import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';

export const PortfolioHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <View className="bg-white rounded-2xl border border-neutral-200 p-5">
      {/* Title and Subtitle */}
      <View className="mb-4">
        <Text className={`text-h3 font-bold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('portfolio.greeting')}
        </Text>
        <Text className={`text-body text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('portfolio.subtitle')}
        </Text>
      </View>
    </View>
  );
};
