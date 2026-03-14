import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ChevronRight, ArrowUp, Plus, Zap } from 'lucide-react-native';
import { apiService } from '@/services/api';

export const ConversionsSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [conversions, setConversions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getTransactions(1, 2); // Get latest 2 transactions
        if (response.success && response.data) {
          const responseData = response.data as any;
          const transactions = responseData.transactions || [];
          
          // Map API transactions to conversion format
          const mappedConversions = transactions.map((tx: any, index: number) => {
            let displayType = 'deposit';
            let title = t('home.deposit');
            let description = tx.description || t('home.depositDesc');

            if (tx.type === 'withdrawal') {
              displayType = 'receive';
              title = t('home.receive');
              description = tx.description || t('home.receiveDesc');
            } else if (tx.type === 'trade_buy') {
              displayType = 'receive';
              title = isRTL ? 'شراء أصل' : 'Asset Purchase';
              description = tx.description || (isRTL ? 'شراء أصل مالي' : 'Financial asset purchase');
            } else if (tx.type === 'trade_sell') {
              displayType = 'deposit';
              title = isRTL ? 'بيع أصل' : 'Asset Sale';
              description = tx.description || (isRTL ? 'بيع أصل مالي' : 'Financial asset sale');
            } else if (tx.type === 'settlement') {
              displayType = tx.amount > 0 ? 'deposit' : 'receive';
              title = isRTL ? 'تسوية' : 'Settlement';
              description = tx.description || (isRTL ? 'تسوية معاملة' : 'Trade settlement');
            }

            return {
              id: tx._id || tx.id || `conversion-${index}`,
              type: displayType,
              title,
              description,
              amount: Math.abs(tx.amount || 0).toFixed(2),
              status: tx.status === 'completed' 
                ? (isRTL ? 'مكتمل' : 'Completed')
                : tx.status === 'processing'
                ? (isRTL ? 'قيد المعالجة' : 'Processing')
                : tx.status === 'pending'
                ? t('home.waiting')
                : tx.status || t('home.waiting'),
            };
          });

          // If we have less than 2 transactions, pad with empty state or show what we have
          setConversions(mappedConversions);
        } else {
          // Fallback to empty array if API fails
          setConversions([]);
        }
      } catch (error) {
        if (__DEV__) console.warn('Error fetching transactions:', error);
        setConversions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [t, isRTL]);

  return (
    <View className="mb-6 mx-4 border border-gray-900/20 rounded-2xl py-4">
      {/* Section Header */}
      <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between px-5 mb-3`}>
        <View className={`flex flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2`} >
            <Zap size={30} color="rgba(124, 58, 237, 1)" />
  <Text className="text-h4 font-bold text-gray-900">
          {t('home.conversions')}
        </Text>
        </View>
      
        <Pressable className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
          <Text className="text-body text-primary-800 font-medium">
            {t('home.viewMore')}
          </Text>
          {isRTL ? (
            <ChevronRight size={20} color="#7C3AED" style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <ChevronRight size={20} color="#7C3AED" />
          )}
        </Pressable>
      </View>

      {/* Conversion Items */}
      <View className="px-5">
        {isLoading ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator size="small" color="#7C3AED" />
          </View>
        ) : conversions.length === 0 ? (
          <View className="py-4">
            <Text className={`text-body text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'لا توجد معاملات حديثة' : 'No recent transactions'}
            </Text>
          </View>
        ) : (
          conversions.map((item, index) => (
            <Pressable
              key={item.id}
              className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between py-4 `}
            >
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center flex-1`}>
                <View className={`w-12 h-12 rounded-md bg-purple-50 items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}>
                  {item.type === 'receive' ? <ArrowUp size={20} color="#7C3AED" /> : <Plus size={20} color="#7C3AED" />}
                </View>
                <View className={`flex-1 b ${isRTL ? 'items-end' : ' items-start'}`}>
                  <Text className={`text-body-lg font-semibold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {item.title}
                  </Text>
                  <Text className={`text-body-xs w-3/4 text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <View className={isRTL ? 'items-end' : 'items-start'}>
                <Text riyal={true} riyalColor='gray' className="text-body font-bold text-gray-500 mb-1">
                  {item.amount}
                </Text>
                <Text className="text-body-sm font-bold text-gray-900">{item.status}</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
};
