import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChartNoAxesCombined, Settings2, TrendingDown, TrendingUp } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface FundItem {
  id: string;
  title: string;
  amount: number;
  change: number;
  percentage: number;
  investmentCount: number;
  isPositive: boolean;
  dotColor: string;
  assetClass: string;
}

interface AllocationChartProps {
  portfolioComposition?: any;
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ portfolioComposition }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [funds, setFunds] = useState<FundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  // Asset class colors mapping
  const assetClassColors: Record<string, string> = {
    stocks: '#0669eaff',
    bonds: '#10B981',
    gold: '#F59E0B',
    reits: '#EF4444',
    sukuk: '#EF4444',
    default: '#6B7280'
  };

  // Asset class labels
  const assetClassLabels: Record<string, string> = {
    stocks: isRTL ? 'الأسهم' : 'Stocks',
    bonds: isRTL ? 'السندات' : 'Bonds',
    gold: isRTL ? 'الذهب' : 'Gold',
    reits: isRTL ? 'العقارات' : 'REITs',
    sukuk: isRTL ? 'الصكوك' : 'Sukuk',
  };

  useEffect(() => {
    const loadAllocationData = async () => {
      setIsLoading(true);
      try {
        // Get portfolio composition
        const compositionResponse = await apiService.getPortfolioComposition();
        let composition = portfolioComposition;
        
        if (!composition && compositionResponse.success && compositionResponse.data) {
          composition = compositionResponse.data;
        }

        // Get target allocation from user profile
        const targetAllocation = user?.investmentProfile?.assetAllocation || {
          bonds: 50,
          stocks: 35,
          gold: 10,
          reits: 5
        };

        if (composition && composition.holdings && composition.holdings.length > 0) {
          // Group holdings by asset class (simplified - would need asset class mapping)
          const assetClassMap: Record<string, { holdings: any[], totalValue: number, totalCost: number }> = {};
          
          composition.holdings.forEach((holding: any) => {
            // Determine asset class from symbol or name (simplified logic)
            let assetClass = 'stocks'; // default
            const symbol = (holding.symbol || '').toLowerCase();
            const name = (holding.name || '').toLowerCase();
            
            if (symbol.includes('bond') || name.includes('bond') || symbol.includes('sukuk') || name.includes('sukuk')) {
              assetClass = symbol.includes('sukuk') ? 'sukuk' : 'bonds';
            } else if (symbol.includes('gold') || name.includes('gold')) {
              assetClass = 'gold';
            } else if (symbol.includes('reit') || name.includes('reit') || symbol.includes('real estate')) {
              assetClass = 'reits';
            }

            if (!assetClassMap[assetClass]) {
              assetClassMap[assetClass] = { holdings: [], totalValue: 0, totalCost: 0 };
            }
            assetClassMap[assetClass].holdings.push(holding);
            assetClassMap[assetClass].totalValue += holding.currentValue || 0;
            assetClassMap[assetClass].totalCost += holding.totalCost || 0;
          });

          const totalPortfolioValue = composition.totalValue || 0;
          setTotalValue(totalPortfolioValue);

          // Create funds array from asset classes
          const fundsData: FundItem[] = Object.entries(assetClassMap).map(([assetClass, data]) => {
            const percentage = totalPortfolioValue > 0 ? (data.totalValue / totalPortfolioValue) * 100 : 0;
            const profitLoss = data.totalValue - data.totalCost;
            const profitLossPercent = data.totalCost > 0 ? (profitLoss / data.totalCost) * 100 : 0;

            return {
              id: assetClass,
              title: assetClassLabels[assetClass] || assetClass,
              amount: data.totalValue,
              change: profitLossPercent,
              percentage: percentage,
              investmentCount: data.holdings.length,
              isPositive: profitLossPercent >= 0,
              dotColor: assetClassColors[assetClass] || assetClassColors.default,
              assetClass: assetClass
            };
          });

          // Sort by percentage (descending)
          fundsData.sort((a, b) => b.percentage - a.percentage);
          setFunds(fundsData);
        } else {
          // No holdings - show target allocation
          const fundsData: FundItem[] = Object.entries(targetAllocation)
            .filter(([_, percentage]) => percentage > 0)
            .map(([assetClass, percentage]) => ({
              id: assetClass,
              title: assetClassLabels[assetClass] || assetClass,
              amount: 0,
              change: 0,
              percentage: percentage as number,
              investmentCount: 0,
              isPositive: true,
              dotColor: assetClassColors[assetClass] || assetClassColors.default,
              assetClass: assetClass
            }))
            .sort((a, b) => b.percentage - a.percentage);
          setFunds(fundsData);
        }
      } catch (error) {
        if (__DEV__) console.warn('Error loading allocation data:', error);
        // Fallback to target allocation
        const targetAllocation = user?.investmentProfile?.assetAllocation || {
          bonds: 50,
          stocks: 35,
          gold: 10,
          reits: 5
        };
        const fundsData: FundItem[] = Object.entries(targetAllocation)
          .filter(([_, percentage]) => percentage > 0)
          .map(([assetClass, percentage]) => ({
            id: assetClass,
            title: assetClassLabels[assetClass] || assetClass,
            amount: 0,
            change: 0,
            percentage: percentage as number,
            investmentCount: 0,
            isPositive: true,
            dotColor: assetClassColors[assetClass] || assetClassColors.default,
            assetClass: assetClass
          }));
        setFunds(fundsData);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllocationData();
  }, [portfolioComposition, user?.investmentProfile?.assetAllocation, isRTL]);

  if (isLoading) {
    return (
      <View className="px-5 mb-6">
        <View className="bg-white rounded-2xl border border-neutral-200 p-5">
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text className="text-body text-gray-600 mt-4">{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="px-5 mb-6">
      <View className="bg-white rounded-2xl border border-neutral-200 p-5">
        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2 mb-4`}>
          <ChartNoAxesCombined size={24} color={'#753AF4'} />
          <Text className="text-h4 font-bold text-gray-900">
            {t('portfolio.distributionAndDetails')}
          </Text>
        </View>

        {/* Circular Charts Row */}
        {funds.length > 0 && (
          <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-6`}>
            {funds.slice(0, 4).map((item) => {
              const percentage = Math.min(item.percentage, 100);
              const angle = (percentage / 100) * 360;
              
              return (
                <View key={item.id} className="items-center">
                  {/* Circular Progress */}
                  <View className="w-16 h-16 rounded-full items-center justify-center mb-2 relative" style={{ borderWidth: 4, borderColor: `${item.dotColor}20` }}>
                    <Text className="text-body-sm font-bold text-gray-900">
                      {percentage.toFixed(0)}%
                    </Text>
                    {/* Progress Arc */}
                    {percentage > 0 && (
                      <View 
                        className="absolute rounded-full"
                        style={{
                          width: 64,
                          height: 64,
                          borderWidth: 4,
                          borderColor: 'transparent',
                          borderTopColor: percentage > 0 ? item.dotColor : 'transparent',
                          borderRightColor: percentage > 25 ? item.dotColor : 'transparent',
                          borderBottomColor: percentage > 50 ? item.dotColor : 'transparent',
                          borderLeftColor: percentage > 75 ? item.dotColor : 'transparent',
                          transform: [{ rotate: '-90deg' }]
                        }}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Description Text */}
        <Text className={`text-body-sm text-gray-600 text-center leading-relaxed mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          {isRTL 
            ? 'التوزيع الكلي لأصولك بناءً على توصية الذكاء الاصطناعي. يمكنك تغييره في أي وقت.'
            : 'Total distribution of your assets based on the AI recommendation. You can change it at any time.'
          }
        </Text>

        {/* Funds List */}
        {funds.length > 0 ? (
          <View>
            {funds.map((fund, index) => (
              <View 
                key={fund.id}
                className={`${index !== funds.length - 1 ? 'border-b border-neutral-200' : ''}`}
              >
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between p-4`}>
                  {/* Left Side: Dot + Title + Subtitle */}
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start flex-1`}>
                    <View 
                      className={`w-4 h-4 rounded-full translate-y-2 ${isRTL ? 'ml-3' : 'mr-3'}`}
                      style={{ backgroundColor: fund.dotColor }}
                    />
                    <View className="flex-1">
                      <Text className={`text-body font-semibold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {fund.title}
                      </Text>
                      <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {fund.investmentCount > 0 
                          ? (isRTL ? `استثمارات ${fund.investmentCount}` : `Investments ${fund.investmentCount}`)
                          : (isRTL ? 'لا توجد استثمارات' : 'No investments')
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Right Side: Amount + Change */}
                  <View className={`flex ${isRTL ? 'items-end' : 'items-start'}`}>
                    <Text riyal riyalColor='black' className="text-body-lg font-bold text-gray-900 mb-1">
                      {fund.amount.toFixed(2)}
                    </Text>
                    <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} items-center`}>
                      {fund.isPositive ? (
                        <TrendingUp size={14} color="#10B981" />
                      ) : (
                        <TrendingDown size={14} color="#EF4444" />
                      )}
                      <Text className={`text-body-md ${fund.isPositive ? 'text-green-600' : 'text-red-600'} ${isRTL ? 'mr-1' : 'ml-1'}`}>
                        {fund.change >= 0 ? '+' : ''}{fund.change.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="py-8 items-center">
            <Text className={`text-body text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'لا توجد أصول في المحفظة' : 'No assets in portfolio'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
