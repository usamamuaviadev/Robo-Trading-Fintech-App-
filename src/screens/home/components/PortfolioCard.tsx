import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { apiService } from '@/services/api';

export const PortfolioCard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [portfolioData, setPortfolioData] = useState<any>(null);
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
      } catch (error) {
        if (__DEV__) console.warn('Error fetching wallet balance:', error);
        setWalletBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }

      try {
        // Fetch portfolio composition for return calculation
        const portfolioResponse = await apiService.getPortfolioComposition();
        if (portfolioResponse.success && portfolioResponse.data) {
          setPortfolioData(portfolioResponse.data);
        }
      } catch (error) {
        if (__DEV__) console.warn('Error fetching portfolio composition:', error);
        setPortfolioData(null);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate total portfolio value (wallet + investments)
  const portfolioValue = (walletBalance || 0) + (portfolioData?.totalValue || 0);
  const totalCost = portfolioData?.totalCost || 0;
  const totalProfitLoss = portfolioData?.totalProfitLoss || 0;
  const returnPercent = totalCost > 0 ? ((totalProfitLoss / totalCost) * 100) : 0;
  const hasPositiveReturn = totalProfitLoss >= 0;

  return (
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
          {portfolioValue.toFixed(2)}
        </Text>
      )}

      {/* Return Info */}
      {!isLoadingPortfolio && (
        <View className={`flex-row gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
          {hasPositiveReturn ? (
            <TrendingUp size={16} color="#10B981" />
          ) : (
            <TrendingDown size={16} color="#EF4444" />
          )}
          <Text riyal={true} riyalSize={20} className='text-white'>
            {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)}
          </Text>
          <Text className={`text-body-sm text-white ${isRTL ? 'mr-2' : 'ml-2'}`}>
            ({totalProfitLoss >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%) {t('home.returnInfo')}
          </Text>
        </View>
      )}
    </View>
  );
};
