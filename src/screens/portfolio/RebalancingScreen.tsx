import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Card } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, RefreshCw, Calculator, CheckCircle } from 'lucide-react-native';
import { apiService } from '@/services/api';

interface RebalancingScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export const RebalancingScreen: React.FC<RebalancingScreenProps> = ({ onBack, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [rebalancing, setRebalancing] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadRebalancing();
  }, []);

  const loadRebalancing = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.checkRebalancing(5);
      if (response.success && response.data) {
        setRebalancing(response.data);
      }
    } catch (error) {
      if (__DEV__) console.warn('Error loading rebalancing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await apiService.simulateRebalancing({
        threshold: 5,
        includeTaxImpact: true,
        includeTransactionCosts: true,
        transactionCostPercent: 0.1
      });
      if (response.success && response.data) {
        setSimulation(response.data);
      }
    } catch (error) {
      if (__DEV__) console.warn('Error simulating rebalancing:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل محاكاة إعادة التوازن' : 'Failed to simulate rebalancing'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-body text-gray-600 mt-4">{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="items-center px-5 pt-4 pb-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
        <Pressable onPress={onBack} hitSlop={10} className="p-2">
          {isRTL ? <ChevronRight size={24} color="#111827" /> : <ChevronLeft size={24} color="#111827" />}
        </Pressable>
        <Text className="text-h3 font-bold text-gray-900 flex-1 text-center">
          {isRTL ? 'إعادة التوازن' : 'Rebalancing'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-5 mt-6">
          {/* Rebalancing Status */}
          {rebalancing && (
            <Card variant="bordered" className="p-5 mb-6">
              <Text className={`text-h4 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'حالة إعادة التوازن' : 'Rebalancing Status'}
              </Text>

              {rebalancing.needsRebalancing ? (
                <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center mb-2`}>
                    <RefreshCw size={20} color="#F59E0B" style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
                    <Text className={`text-body font-semibold text-yellow-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'إعادة التوازن مطلوبة' : 'Rebalancing Required'}
                    </Text>
                  </View>
                  <Text className={`text-body-sm text-yellow-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL 
                      ? 'المحفظة تحتاج إلى إعادة توازن للعودة إلى التوزيع المستهدف'
                      : 'Portfolio needs rebalancing to return to target allocation'
                    }
                  </Text>
                </View>
              ) : (
                <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                    <CheckCircle size={20} color="#10B981" style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
                    <Text className={`text-body font-semibold text-green-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'المحفظة متوازنة' : 'Portfolio Balanced'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Drift Details */}
              {rebalancing.drift && Object.keys(rebalancing.drift).length > 0 && (
                <View className="mt-4">
                  <Text className={`text-body font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'الانحرافات' : 'Drifts'}
                  </Text>
                  {Object.entries(rebalancing.drift).map(([assetClass, drift]: [string, any]) => (
                    <View key={assetClass} className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-2`}>
                        <Text className={`text-body font-semibold text-gray-900 capitalize ${isRTL ? 'text-right' : 'text-left'}`}>
                          {assetClass}
                        </Text>
                        {drift.action === 'reduce' ? (
                          <TrendingDown size={16} color="#EF4444" />
                        ) : (
                          <TrendingUp size={16} color="#10B981" />
                        )}
                      </View>
                      <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between`}>
                        <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'الحالي' : 'Current'}: {drift.current.toFixed(1)}%
                        </Text>
                        <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'المستهدف' : 'Target'}: {drift.target.toFixed(1)}%
                        </Text>
                      </View>
                      <Text className={`text-body-sm font-semibold text-primary-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? 'الإجراء' : 'Action'}: {drift.action === 'reduce' ? (isRTL ? 'تقليل' : 'Reduce') : (isRTL ? 'زيادة' : 'Increase')} {drift.amount.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Simulation Section */}
          <Card variant="bordered" className="p-5 mb-6">
            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
              <Text className={`text-h4 font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'محاكاة إعادة التوازن' : 'Rebalancing Simulation'}
              </Text>
              <Pressable onPress={runSimulation} disabled={isSimulating}>
                <Calculator size={20} color="#7C3AED" className={isSimulating ? 'opacity-50' : ''} />
              </Pressable>
            </View>

            {isSimulating ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text className="text-body-sm text-gray-600 mt-2">{isRTL ? 'جاري المحاكاة...' : 'Simulating...'}</Text>
              </View>
            ) : simulation ? (
              <View>
                <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <Text className={`text-body-sm text-blue-800 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'إجمالي التكلفة' : 'Total Cost'}: {simulation.rebalancing.totalCost.toFixed(2)} SAR
                  </Text>
                  {simulation.rebalancing.taxImpact > 0 && (
                    <Text className={`text-body-sm text-blue-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'التأثير الضريبي' : 'Tax Impact'}: {simulation.rebalancing.taxImpact.toFixed(2)} SAR
                    </Text>
                  )}
                </View>

                {simulation.rebalancing.trades && simulation.rebalancing.trades.length > 0 && (
                  <View>
                    <Text className={`text-body font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'الصفقات المقترحة' : 'Proposed Trades'}
                    </Text>
                    {simulation.rebalancing.trades.map((trade: any, index: number) => (
                      <View key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between`}>
                          <Text className={`text-body font-semibold text-gray-900 capitalize ${isRTL ? 'text-right' : 'text-left'}`}>
                            {trade.assetClass}
                          </Text>
                          <Text className={`text-body-sm font-semibold ${trade.action === 'buy' ? 'text-green-600' : 'text-red-600'} ${isRTL ? 'text-right' : 'text-left'}`}>
                            {trade.action === 'buy' ? (isRTL ? 'شراء' : 'Buy') : (isRTL ? 'بيع' : 'Sell')} {trade.amount.toFixed(2)} SAR
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <Button
                title={isRTL ? 'تشغيل المحاكاة' : 'Run Simulation'}
                onPress={runSimulation}
                variant="outline"
              />
            )}
          </Card>

          {/* Actions */}
          <Button
            title={isRTL ? 'تحديث' : 'Refresh'}
            onPress={loadRebalancing}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
};
