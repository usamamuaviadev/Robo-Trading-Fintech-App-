import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Portfolio {
  id: string;
  title: string;
  amount: number;
  change: number;
  changePercent: number;
  barColor: string;
  progress: number;
  totalValue: number;
}

interface InvestmentPortfoliosSectionProps {
  onOpen?: (id: string) => void;
  portfolioComposition?: any;
}

export const InvestmentPortfoliosSection: React.FC<InvestmentPortfoliosSectionProps> = ({ 
  onOpen, 
  portfolioComposition 
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPortfolios = async () => {
      setIsLoading(true);
      try {
        let composition = portfolioComposition;
        
        if (!composition) {
          const response = await apiService.getPortfolioComposition();
          if (response.success && response.data) {
            composition = response.data;
          }
        }

        const portfolioList: Portfolio[] = [];

        // Main Portfolio (based on user's risk profile)
        if (user?.investmentProfile?.riskProfile) {
          const riskProfile = user.investmentProfile.riskProfile;
          const totalValue = composition?.totalValue || 0;
          const totalProfitLoss = composition?.totalProfitLoss || 0;
          const totalCost = composition?.totalCost || 0;
          const profitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

          // Portfolio name based on risk profile
          const portfolioNames: Record<string, string> = {
            conservative: isRTL ? 'محفظة محافظة' : 'Conservative Portfolio',
            balanced: isRTL ? 'محفظة متوازنة' : 'Balanced Portfolio',
            advanced: isRTL ? 'محفظة متقدمة' : 'Advanced Portfolio',
            aggressive: isRTL ? 'محفظة عدوانية' : 'Aggressive Portfolio',
            adventure: isRTL ? 'محفظة مغامرة' : 'Adventure Portfolio',
          };

          const portfolioColors: Record<string, string> = {
            conservative: '#10B981',
            balanced: '#3B82F6',
            advanced: '#F59E0B',
            aggressive: '#F59E0B',
            adventure: '#EF4444',
          };

          portfolioList.push({
            id: 'main',
            title: portfolioNames[riskProfile] || (isRTL ? 'محفظتي' : 'My Portfolio'),
            amount: totalValue,
            change: totalProfitLoss,
            changePercent: profitLossPercent,
            barColor: portfolioColors[riskProfile] || '#3B82F6',
            progress: 100, // Main portfolio is always 100%
            totalValue: totalValue
          });
        }

        // Retirement Portfolio (if user has retirement goal)
        if (user?.investmentProfile?.primaryGoal === 'retirement' || !user?.investmentProfile?.primaryGoal) {
          // Create a retirement portfolio entry
          const retirementValue = composition?.totalValue ? composition.totalValue * 0.5 : 0; // Example: 50% of total
          const retirementCost = composition?.totalCost ? composition.totalCost * 0.5 : 0;
          const retirementProfitLoss = retirementValue - retirementCost;
          const retirementProfitPercent = retirementCost > 0 ? (retirementProfitLoss / retirementCost) * 100 : 0;

          portfolioList.push({
            id: 'retirement',
            title: isRTL ? 'محفظة التقاعد' : 'Retirement Portfolio',
            amount: retirementValue,
            change: retirementProfitLoss,
            changePercent: retirementProfitPercent,
            barColor: '#10B981',
            progress: 50, // Example progress
            totalValue: retirementValue
          });
        }

        // If no portfolios created, create a default one
        if (portfolioList.length === 0) {
          portfolioList.push({
            id: 'default',
            title: isRTL ? 'محفظتي' : 'My Portfolio',
            amount: composition?.totalValue || 0,
            change: composition?.totalProfitLoss || 0,
            changePercent: composition?.totalCost > 0 
              ? ((composition.totalProfitLoss || 0) / composition.totalCost) * 100 
              : 0,
            barColor: '#3B82F6',
            progress: 100,
            totalValue: composition?.totalValue || 0
          });
        }

        setPortfolios(portfolioList);
      } catch (error) {
        if (__DEV__) console.warn('Error loading portfolios:', error);
        // Fallback to default portfolio
        setPortfolios([{
          id: 'default',
          title: isRTL ? 'محفظتي' : 'My Portfolio',
          amount: 0,
          change: 0,
          changePercent: 0,
          barColor: '#3B82F6',
          progress: 0,
          totalValue: 0
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolios();
  }, [portfolioComposition, user?.investmentProfile, isRTL]);

  if (isLoading) {
    return (
      <View className="px-5 mx-5 py-6 rounded-md border border-neutral-200 mb-6">
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="text-body text-gray-600 mt-4">{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-5 mx-5 py-6 rounded-md border border-neutral-200 mb-6">
      {/* Section Header */}
      <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
        <Text className="text-body-lg font-semibold text-gray-900">
          {t('portfolio.investmentPortfoliosTitle')}
        </Text>
      </View>

      {/* Portfolios List */}
      {portfolios.length > 0 ? (
        <View className="gap-4">
          {portfolios.map((portfolio) => (
            <Pressable
              key={portfolio.id}
              className="bg-white rounded-2xl p-5 active:opacity-90"
              onPress={() => onOpen?.(portfolio.id)}
            >
              {/* Header Row */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start justify-between mb-3`}>
                <View className={`flex-1 ${isRTL ? 'items-end' : 'items-start'}`}>
                  <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {portfolio.title}
                  </Text>
                  <Text className="text-h4 font-bold text-gray-900" riyal riyalColor='black'>
                    {portfolio.amount.toFixed(2)}
                  </Text>
                </View>
                <View className={isRTL ? 'items-start ml-4' : 'items-end mr-0'}>
                  <View className={`flex-row py-1 px-2 rounded-full ${portfolio.changePercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center mb-1`}>
                    {portfolio.changePercent >= 0 ? (
                      <TrendingUp size={14} color="#10B981" />
                    ) : (
                      <TrendingDown size={14} color="#EF4444" />
                    )}
                    <Text className={`text-body-sm ${portfolio.changePercent >= 0 ? 'text-green-600' : 'text-red-600'} ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {portfolio.changePercent >= 0 ? '+' : ''}{portfolio.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="w-full relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                <View 
                  className="h-full rounded-full" 
                  style={{ 
                    backgroundColor: `${portfolio.barColor}20`,
                    width: '100%' 
                  }}
                />
                <View 
                  className={`absolute h-2 rounded-full ${isRTL ? 'right-0' : 'left-0'}`} 
                  style={{ 
                    backgroundColor: portfolio.barColor,
                    width: `${Math.min(portfolio.progress, 100)}%` 
                  }} 
                />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="py-8 items-center">
          <Text className={`text-body text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'لا توجد محافظ' : 'No portfolios found'}
          </Text>
        </View>
      )}
    </View>
  );
};
