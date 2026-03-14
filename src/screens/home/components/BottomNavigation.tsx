import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { Home, BriefcaseBusiness, ArrowLeftRight, UserRound } from 'lucide-react-native';

interface BottomNavigationProps {
  activeTab: 'home' | 'portfolio' | 'conversions' | 'account';
  onTabChange?: (tab: 'home' | 'portfolio' | 'conversions' | 'account') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const tabs = [
    { id: 'home' as const, icon: Home, label: t('home.navHome') },
    { id: 'conversions' as const, icon: ArrowLeftRight, label: t('home.navConversions') },
    { id: 'portfolio' as const, icon: BriefcaseBusiness, label: t('home.navPortfolio') },
    { id: 'account' as const, icon: UserRound, label: t('home.navAccount') },
  ];

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200"
      style={{ paddingBottom: 20, zIndex: 1000, elevation: 8 }}
      pointerEvents="box-none"
    >
      <View 
        className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-around py-3`}
        pointerEvents="box-none"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                console.log('📱 BottomNavigation tab pressed:', tab.id);
                if (onTabChange) {
                  console.log('✅ Calling onTabChange with:', tab.id);
                  onTabChange(tab.id);
                } else {
                  console.warn('⚠️ onTabChange is not defined');
                }
              }}
              className="items-center justify-center px-4 py-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon 
                size={24} 
                color={isActive ? '#7C3AED' : '#9CA3AF'}
              />
              <Text 
                className={`text-body-sm mt-1 ${isActive ? 'text-primary-800 font-semibold' : 'text-gray-500'}`}
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
