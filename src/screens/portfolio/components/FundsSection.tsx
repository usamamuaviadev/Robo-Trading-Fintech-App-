import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface FundItem {
  id: string;
  title: string;
  amount: string;
  change: string;
  investmentCount: string;
  isPositive: boolean;
  dotColor: string;
}

export const FundsSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const funds: FundItem[] = [
    {
      id: 'balanced-saudi',
      title: t('portfolio.balancedSaudiFund'),
      amount: '2400.00',
      change: '%12.50',
      investmentCount: t('portfolio.investmentCount', { count: 8 }),
      isPositive: true,
      dotColor: '#F59E0B',
    },
    {
      id: 'sukuk',
      title: t('portfolio.sukukFund'),
      amount: '2400.00',
      change: '%12.50',
      investmentCount: t('portfolio.investmentCount', { count: 8 }),
      isPositive: true,
      dotColor: '#EF4444',
    },
    {
      id: 'bonds',
      title: t('portfolio.bonds'),
      amount: '2400.00',
      change: '%12.50',
      investmentCount: t('portfolio.investmentCount', { count: 178 }),
      isPositive: true,
      dotColor: '#10B981',
    },
    {
      id: 'stocks',
      title: t('portfolio.stocksFund'),
      amount: '2400.00',
      change: '%12.50',
      investmentCount: t('portfolio.investmentCount', { count: 178 }),
      isPositive: true,
      dotColor: '#10B981',
    },
  ];

  return (
    <View className="px-5 mb-6">
      {/* Section Title */}
      <Text className={`text-h4 font-bold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t('portfolio.fundsTitle')}
      </Text>

      {/* Funds List */}
      <View className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {funds.map((fund, index) => (
          <View 
            key={fund.id}
            className={`${index !== funds.length - 1 ? 'border-b border-neutral-200' : ''}`}
          >
            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between p-4`}>
              {/* Left Side: Dot + Title + Subtitle */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center flex-1`}>
                <View 
                  className={`w-2 h-2 rounded-full ${isRTL ? 'ml-3' : 'mr-3'}`}
                  style={{ backgroundColor: fund.dotColor }}
                />
                <View className="flex-1">
                  <Text className={`text-body font-semibold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {fund.title}
                  </Text>
                  <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {fund.investmentCount}
                  </Text>
                </View>
              </View>

              {/* Right Side: Amount + Change */}
              <View className={isRTL ? 'items-start' : 'items-end'}>
                <Text className="text-body font-bold text-gray-900 mb-1" riyal>
                  {fund.amount}
                </Text>
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                  {fund.isPositive ? (
                    <TrendingUp size={14} color="#10B981" />
                  ) : (
                    <TrendingDown size={14} color="#10B981" />
                  )}
                  <Text className={`text-body-sm text-green-600 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {fund.change}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
