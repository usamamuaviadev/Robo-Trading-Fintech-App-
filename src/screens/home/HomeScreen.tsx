import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { PortfolioCard } from './components/PortfolioCard';
import { InvestmentsSection } from './components/InvestmentsSection';
import { ConversionsSection } from './components/ConversionsSection';
import { CalculatorCard } from './components/CalculatorCard';
import { StocksCard } from './components/StocksCard';
import { ChatCard } from './components/ChatCard';
import { AccountsSection } from './components/AccountsSection';
import { BottomNavigation } from './components/BottomNavigation';
import { NotificationsBottomSheet } from './components/NotificationsBottomSheet';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useAuth } from '@/context/AuthContext';
import { showErrorPopup } from '@/utils/errorPopup';

interface HomeScreenProps {
  onNavigate?: (screen: 'home' | 'portfolio' | 'conversions' | 'account' | 'calculator' | 'chat' | 'stocks') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user profile data when component mounts (only once, not on every render)
  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        await refreshUser();
      } catch (error: any) {
        showErrorPopup(
          error?.message || t('stocks.errorLoad'),
          t('common.error')
        );
      }
    };
    
    if (mounted) {
      loadUser();
    }
    
    return () => {
      mounted = false;
    };
  }, [refreshUser, t]); // Run on mount

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <ProfileHeader />

      {/* Main Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Portfolio Card */}
        <View className="px-5 mb-4">
          <PortfolioCard />
        </View>

        {/* Investments Section */}
        <InvestmentsSection />

        {/* Conversions Section */}
        <ConversionsSection />

        {/* Calculator Card */}
        <View className="px-5 mb-4">
          <CalculatorCard onPress={() => onNavigate?.('calculator')} />
        </View>

        {/* Stocks Card */}
        <View className="px-5 mb-4">
          <StocksCard onPress={() => onNavigate?.('stocks')} />
        </View>

        {/* Chat Card */}
        <View className="px-5 mb-4">
          <ChatCard onPress={() => onNavigate?.('chat')} />
        </View>

        {/* Accounts Section */}
        <AccountsSection />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" onTabChange={onNavigate} />

      {/* Notifications Bottom Sheet */}
      <NotificationsBottomSheet
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
};
