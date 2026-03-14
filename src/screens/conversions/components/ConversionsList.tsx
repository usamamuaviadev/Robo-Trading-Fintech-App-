import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowUpRight } from 'lucide-react-native';
import { apiService } from '@/services/api';

interface ConversionsListProps {
  activeTab: 'all' | 'deposit' | 'receive' | 'transfer';
  onSelectConversion: (conversion: any) => void;
}

export const ConversionsList: React.FC<ConversionsListProps> = ({ activeTab, onSelectConversion }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [conversions, setConversions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getTransactions(1, 50);
        if (response.success && response.data) {
          const responseData = response.data as any;
          const transactions = responseData.transactions || [];
          // Map API transactions to conversion format
          const mappedTransactions = transactions.map((tx: any) => {
            // Determine transaction type and display info
            let displayType = 'deposit';
            let title = t('conversions.depositTitle');
            let description = tx.description || t('conversions.depositDesc');
            let company = isRTL ? 'البنك راجحي' : 'Al Rajhi Bank';
            let method = isRTL ? 'تحويل بنكي' : 'Bank Transfer';
            let color = '#7C3AED';

            if (tx.type === 'withdrawal') {
              displayType = 'receive';
              title = t('conversions.receiveTitle');
              description = tx.description || t('conversions.receiveDesc');
            } else if (tx.type === 'trade_buy') {
              displayType = 'receive';
              title = isRTL ? 'شراء أصل' : 'Asset Purchase';
              description = tx.description || (isRTL ? 'شراء أصل مالي' : 'Financial asset purchase');
              company = tx.metadata?.assetSymbol || (isRTL ? 'أصل مالي' : 'Asset');
              method = isRTL ? 'تسوية' : 'Settlement';
              color = '#10B981';
            } else if (tx.type === 'trade_sell') {
              displayType = 'deposit';
              title = isRTL ? 'بيع أصل' : 'Asset Sale';
              description = tx.description || (isRTL ? 'بيع أصل مالي' : 'Financial asset sale');
              company = tx.metadata?.assetSymbol || (isRTL ? 'أصل مالي' : 'Asset');
              method = isRTL ? 'تسوية' : 'Settlement';
              color = '#EF4444';
            } else if (tx.type === 'settlement') {
              displayType = tx.amount > 0 ? 'deposit' : 'receive';
              title = isRTL ? 'تسوية' : 'Settlement';
              description = tx.description || (isRTL ? 'تسوية معاملة' : 'Trade settlement');
              company = tx.metadata?.assetSymbol || (isRTL ? 'تسوية' : 'Settlement');
              method = isRTL ? 'تسوية' : 'Settlement';
              color = '#6366F1';
            }

            // Handle payment method for regular deposits/withdrawals
            if (tx.type === 'deposit' || tx.type === 'withdrawal') {
              if (tx.method === 'bank_transfer') {
                company = isRTL ? 'البنك راجحي' : 'Al Rajhi Bank';
                method = isRTL ? 'تحويل بنكي' : 'Bank Transfer';
              } else if (tx.method === 'iban') {
                company = 'IBAN';
                method = 'IBAN';
              } else if (tx.method === 'card') {
                company = isRTL ? 'بطاقة' : 'Card';
                method = isRTL ? 'بطاقة' : 'Card';
              }
            }

            return {
              id: tx._id || tx.id,
              type: displayType,
              title,
              description,
              amount: tx.amount?.toFixed(2) || '0.00',
              status: tx.status === 'completed' 
                ? (isRTL ? 'مكتمل' : 'Completed')
                : tx.status === 'processing'
                ? (isRTL ? 'قيد المعالجة' : 'Processing')
                : tx.status === 'pending'
                ? t('conversions.waiting')
                : tx.status || t('conversions.waiting'),
              date: new Date(tx.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { 
                year: 'numeric', 
                month: 'long' 
              }),
              company,
              method,
              submissionDate: new Date(tx.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
              reference: tx.reference,
              color,
            };
          });
          setConversions(mappedTransactions);
        } else {
          setError(response.message || (isRTL ? 'فشل تحميل المعاملات' : 'Failed to load transactions'));
        }
      } catch (error: any) {
        if (__DEV__) console.warn('Error fetching transactions:', error);
        setError(error.message || (isRTL ? 'حدث خطأ أثناء تحميل المعاملات' : 'An error occurred while loading transactions'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [activeTab, isRTL, t]);

  const filteredConversions = activeTab === 'all' 
    ? conversions 
    : conversions.filter(c => c.type === activeTab);

  if (isLoading) {
    return (
      <View className="px-5 mx-5 py-10 items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className={`text-body text-gray-600 mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-5 mx-5 py-10 items-center justify-center">
        <Text className={`text-body text-error-600 ${isRTL ? 'text-right' : 'text-left'}`}>
          {error}
        </Text>
      </View>
    );
  }

  if (filteredConversions.length === 0) {
    return (
      <View className="px-5 mx-5 py-10 items-center justify-center">
        <Text className={`text-body text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
          {isRTL ? 'لا توجد معاملات' : 'No transactions found'}
        </Text>
      </View>
    );
  }

  // Group transactions by date
  const groupedByDate = filteredConversions.reduce((acc: any, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <View className="px-5 mx-5">
      {/* Conversions List */}
      {Object.entries(groupedByDate).map(([date, items]: [string, any]) => (
        <View key={date} className="mb-6">
          {/* Date Section */}
          <Text className={`text-body font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            {date}
          </Text>

          <View className="gap-3">
            {items.map((item: any) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectConversion(item)}
                className="bg-white rounded-2xl border border-neutral-200 p-4"
              >
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between`}>
                  {/* Left Side: Icon + Info */}
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center flex-1`}>
                    <View 
                      className={`w-10 h-10 rounded-lg items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      {item.type !== 'deposit' ? <ArrowUpRight size={20} color={item.color} /> : <Plus size={20} color={item.color} />}
                    </View>
                    <View className="flex-1">
                      <Text className={`text-body font-semibold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {item.title}
                      </Text>
                      <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  {/* Right Side: Amount + Status */}
                  <View className={isRTL ? 'items-start ml-3' : 'items-end mr-0'}>
                    <Text className="text-body font-bold text-gray-900 mb-1" riyal>
                      {item.amount}
                    </Text>
                    <Text className="text-body-sm text-gray-500">{item.status}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};
