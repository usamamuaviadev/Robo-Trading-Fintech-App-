import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { ConversionsHeader } from './components/ConversionsHeader';
import { ConversionsTabs } from './components/ConversionsTabs';
import { ConversionsList } from './components/ConversionsList';
import { ConversionDetailsSheet } from './components/ConversionDetailsSheet';
import { BottomNavigation } from '../home/components/BottomNavigation';

interface ConversionsScreenProps {
  onNavigate?: (screen: 'home' | 'portfolio' | 'conversions' | 'account' | 'deposit' | 'withdraw') => void;
}

export const ConversionsScreen: React.FC<ConversionsScreenProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'receive' | 'transfer'>('all');
  const [selectedConversion, setSelectedConversion] = useState<any>(null);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <ConversionsHeader />

      {/* Search Bar */}
      <View className="px-5 mx-5 mb-4">
        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center bg-neutral-50 rounded-xl px-4 py-3`}>
          <Search size={20} color="#9CA3AF" />
          <Text className={`flex-1 text-body text-gray-400 ${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
            {t('conversions.search')}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <ConversionsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Action Buttons */}
      <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-3 px-5 mb-4`}>
        <Pressable
          onPress={() => onNavigate?.('deposit')}
          className="flex-1 bg-primary-600 rounded-xl py-4 items-center justify-center active:opacity-80"
        >
          <Text className="text-body-lg font-semibold text-white">
            {t('conversions.deposit') || 'Deposit'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate?.('withdraw')}
          className="flex-1 bg-white border-2 border-primary-600 rounded-xl py-4 items-center justify-center active:opacity-80"
        >
          <Text className="text-body-lg font-semibold text-primary-600">
            {t('conversions.receive') || 'Withdraw'}
          </Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ConversionsList 
          activeTab={activeTab} 
          onSelectConversion={setSelectedConversion}
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="conversions" onTabChange={onNavigate} />

      {/* Conversion Details Bottom Sheet */}
      <ConversionDetailsSheet
        visible={!!selectedConversion}
        conversion={selectedConversion}
        onClose={() => setSelectedConversion(null)}
      />
    </View>
  );
};
