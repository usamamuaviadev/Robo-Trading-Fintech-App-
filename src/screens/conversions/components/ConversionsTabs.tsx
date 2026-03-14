import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';

interface ConversionsTabsProps {
  activeTab: 'all' | 'deposit' | 'receive' | 'transfer';
  onTabChange: (tab: 'all' | 'deposit' | 'receive' | 'transfer') => void;
}

export const ConversionsTabs: React.FC<ConversionsTabsProps> = ({ activeTab, onTabChange }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const tabs = [
    { id: 'all' as const, label: t('conversions.all') },
    { id: 'deposit' as const, label: t('conversions.deposit') },
    { id: 'receive' as const, label: t('conversions.receive') },
    { id: 'transfer' as const, label: t('conversions.transfer') },
  ];

  return (
    <View className="px-5 mx-5 mb-4">
      <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between gap-2`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              className={`px-6 py-2 rounded-full ${
                isActive ? 'bg-primary-500' : 'bg-neutral-100'
              }`}
            >
              <Text
                className={`text-body font-medium ${
                  isActive ? 'text-white' : 'text-gray-700'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
