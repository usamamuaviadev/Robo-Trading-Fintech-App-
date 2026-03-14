import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { Bell, TrendingUp } from 'lucide-react-native';
import { AllocationChart } from './components/AllocationChart';
import { FundsSection } from './components/FundsSection';
import { InvestmentPortfoliosSection } from './components/InvestmentPortfoliosSection';
import { BottomNavigation } from '../home/components/BottomNavigation';
import { NotificationsBottomSheet } from '../home/components/NotificationsBottomSheet';
import { ProfileHeader } from '@/components/ProfileHeader';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface PortfolioScreenProps {
  onNavigate?: (screen: 'home' | 'portfolio' | 'portfolio-details' | 'risk-profile' | 'rebalancing' | 'diversification' | 'conversions' | 'account') => void;
}

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [showNotifications, setShowNotifications] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [portfolioComposition, setPortfolioComposition] = useState<any>(null);
  const [rebalancingStatus, setRebalancingStatus] = useState<any>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

  // Fetch wallet balance and portfolio data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingBalance(true);
      setIsLoadingPortfolio(true);
      try {
        // Fetch wallet balance
        const balanceResponse = await apiService.getWalletBalance();
        if (balanceResponse.success && balanceResponse.data) {
          const responseData = balanceResponse.data as any;
          setWalletBalance(responseData.balance || 0);
        }

        // Fetch portfolio composition
        try {
          const compositionResponse = await apiService.getPortfolioComposition();
          if (compositionResponse.success && compositionResponse.data) {
            setPortfolioComposition(compositionResponse.data);
          }
        } catch (error) {
          if (__DEV__) console.warn('Error fetching portfolio composition:', error);
        }

        // Fetch rebalancing status
        try {
          const rebalancingResponse = await apiService.checkRebalancing(5);
          if (rebalancingResponse.success && rebalancingResponse.data) {
            setRebalancingStatus(rebalancingResponse.data);
          }
        } catch (error) {
          if (__DEV__) console.warn('Error fetching rebalancing status:', error);
        }
      } catch (error) {
        if (__DEV__) console.warn('Error fetching data:', error);
        setWalletBalance(0);
      } finally {
        setIsLoadingBalance(false);
        setIsLoadingPortfolio(false);
      }
    };
    fetchData();
  }, []);

  return (
    <View className="flex-1 bg-white">
        <ProfileHeader />
      {/* Header */}

      {/* Main Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between px-5 pt-3 pb-4`}>
          <Text className="text-h1 font-bold text-gray-900">
            {t('portfolio.title')}
          </Text>
        </View>

        {/* Portfolio Value Card */}
        <View className="px-5 mb-4">
          <View className="bg-primary-800 rounded-2xl p-5">
            {/* Header Row */}
            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
              <Text className="text-body-lg font-semibold text-white opacity-90">
                {t('home.portfolioValue')}
              </Text>
              <Pressable className="px-3 py-1 bg-white rounded-sm">
                <Text className="text-body-sm text-primary-800 font-medium">
                  {t('home.details')}
                </Text>
              </Pressable>
            </View>

            {/* Portfolio Value */}
            {isLoadingBalance ? (
              <Text className={`text-h1 ${isRTL ? 'text-right' : 'text-left'} font-bold text-white mb-2`}>
                {isRTL ? 'جاري التحميل...' : 'Loading...'}
              </Text>
            ) : (
              <Text 
                riyal={true} 
                riyalSize={40} 
                riyalClass={`justify-${!isRTL ? 'start' : 'end'}`} 
                className={`text-h1 ${isRTL ? 'text-right' : 'text-left'} font-bold text-white mb-2`}
              >
                {(walletBalance || 0).toFixed(2)}
              </Text>
            )}

            {/* Return Info */}
            {portfolioComposition && portfolioComposition.totalProfitLoss !== undefined && (
              <View className={`flex-row gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                {portfolioComposition.totalProfitLoss >= 0 ? (
                  <TrendingUp size={16} color="#10B981" />
                ) : (
                  <TrendingDown size={16} color="#EF4444" />
                )}
                <Text riyal={true} riyalSize={20} className='text-white'>
                  {portfolioComposition.totalProfitLoss >= 0 ? '+' : ''}{portfolioComposition.totalProfitLoss.toFixed(2)}
                </Text>
                <Text className={`text-body-sm text-white ${isRTL ? 'mr-2' : 'ml-2'}`}>
                  {portfolioComposition.totalCost > 0 
                    ? `${portfolioComposition.totalProfitLoss >= 0 ? '+' : ''}${((portfolioComposition.totalProfitLoss / portfolioComposition.totalCost) * 100).toFixed(2)}%`
                    : '0.00%'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Allocation Distribution & Details */}
        <AllocationChart portfolioComposition={portfolioComposition} />

        {/* Portfolio Management Actions */}
        <View className="px-5 mb-4">
          <View className="bg-white rounded-2xl border border-neutral-200 p-4">
            <Text className={`text-h5 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'إدارة المحفظة' : 'Portfolio Management'}
            </Text>
            <View className="gap-3">
              <Pressable
                onPress={() => onNavigate?.('risk-profile')}
                className="flex-row items-center justify-between p-4 bg-primary-50 rounded-xl active:opacity-80"
                style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
              >
                <View className="flex-1" style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'ملف المخاطر' : 'Risk Profile'}
                  </Text>
                  {user?.investmentProfile?.riskProfile && (
                    <Text className={`text-body-sm text-gray-600 capitalize mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {user.investmentProfile.riskProfile}
                    </Text>
                  )}
                </View>
                <Text className="text-body-sm text-primary-600">
                  {isRTL ? 'عرض' : 'View'} →
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onNavigate?.('rebalancing')}
                className="flex-row items-center justify-between p-4 bg-blue-50 rounded-xl active:opacity-80"
                style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
              >
                <View className="flex-1" style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'إعادة التوازن' : 'Rebalancing'}
                  </Text>
                  {rebalancingStatus && (
                    <Text className={`text-body-sm ${rebalancingStatus.needsRebalancing ? 'text-yellow-600' : 'text-green-600'} mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {rebalancingStatus.needsRebalancing 
                        ? (isRTL ? 'مطلوب' : 'Required')
                        : (isRTL ? 'متوازن' : 'Balanced')
                      }
                    </Text>
                  )}
                </View>
                <Text className="text-body-sm text-blue-600">
                  {isRTL ? 'عرض' : 'View'} →
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Funds Section */}

        {/* Investment Portfolios Section */}
        <InvestmentPortfoliosSection 
          onOpen={() => onNavigate?.('portfolio-details')} 
          portfolioComposition={portfolioComposition}
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="portfolio" onTabChange={onNavigate} />

      {/* Notifications Bottom Sheet */}
      <NotificationsBottomSheet
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
};
