import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, TextInput, Card } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calculator, TrendingUp, TrendingDown, BarChart3, Zap } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { showErrorPopup } from '@/utils/errorPopup';

interface ROICalculatorScreenProps {
  onBack?: () => void;
}

export const ROICalculatorScreen: React.FC<ROICalculatorScreenProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [investmentType, setInvestmentType] = useState<'lump_sum' | 'recurring'>('lump_sum');
  const [principal, setPrincipal] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [years, setYears] = useState('10');
  const [results, setResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeMonteCarlo, setIncludeMonteCarlo] = useState(false);

  const riskProfile = user?.investmentProfile?.riskProfile || 'balanced';

  const handleCalculate = async () => {
    if (investmentType === 'lump_sum' && !principal) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال المبلغ الأولي' : 'Please enter principal amount'
      );
      return;
    }

    if (investmentType === 'recurring' && !monthlyAmount) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال المبلغ الشهري' : 'Please enter monthly amount'
      );
      return;
    }

    if (!years || parseFloat(years) <= 0) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال عدد سنوات صحيح' : 'Please enter a valid number of years'
      );
      return;
    }

    setIsCalculating(true);
    try {
      const params = {
        investmentType,
        principal: investmentType === 'lump_sum' ? parseFloat(principal) : undefined,
        monthlyAmount: investmentType === 'recurring' ? parseFloat(monthlyAmount) : undefined,
        years: parseInt(years),
        riskProfile,
        includeMonteCarlo,
        simulations: 1000
      };

      const response = await apiService.calculateComprehensiveROI(params);
      console.log('ROI Calculator Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        // Validate response structure
        const data = response.data;
        if (!data.baseCalculation || !data.baseCalculation.futureValue) {
          showErrorPopup(
            isRTL ? 'استجابة غير صالحة من الخادم' : 'Invalid response from server',
            t('common.error')
          );
          return;
        }
        setResults(data);
      } else {
        showErrorPopup(
          response.message || (isRTL ? 'فشل الحساب' : 'Calculation failed'),
          t('common.error')
        );
      }
    } catch (error: any) {
      showErrorPopup(
        error.message || (isRTL ? 'حدث خطأ أثناء الحساب' : 'An error occurred during calculation'),
        t('common.error')
      );
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="items-center px-5 pt-4 pb-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
        <Pressable onPress={onBack} hitSlop={10} className="p-2">
          {isRTL ? <ChevronRight size={24} color="#111827" /> : <ChevronLeft size={24} color="#111827" />}
        </Pressable>
        <View className="flex-1 flex-row items-center justify-center gap-2">
          <Calculator size={24} color="#7C3AED" />
          <Text className="text-h3 font-bold text-gray-900">
            {isRTL ? 'حاسبة العائد على الاستثمار' : 'ROI Calculator'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-5 mt-6">
          {/* Investment Type Selection */}
          <Card variant="bordered" className="p-5 mb-6">
            <Text className={`text-h5 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'نوع الاستثمار' : 'Investment Type'}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setInvestmentType('lump_sum')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                  investmentType === 'lump_sum'
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <Text className={`text-body font-semibold text-center ${
                  investmentType === 'lump_sum' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isRTL ? 'مبلغ مقطوع' : 'Lump Sum'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInvestmentType('recurring')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                  investmentType === 'recurring'
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <Text className={`text-body font-semibold text-center ${
                  investmentType === 'recurring' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isRTL ? 'استثمار شهري' : 'Monthly'}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Input Fields */}
          <Card variant="bordered" className="p-5 mb-6">
            <Text className={`text-h5 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'تفاصيل الاستثمار' : 'Investment Details'}
            </Text>

            {investmentType === 'lump_sum' ? (
              <TextInput
                label={isRTL ? 'المبلغ الأولي' : 'Principal Amount'}
                value={principal}
                onChangeText={setPrincipal}
                placeholder="10000"
                keyboardType="decimal-pad"
                isRTL={isRTL}
                className="mb-4"
              />
            ) : (
              <TextInput
                label={isRTL ? 'المبلغ الشهري' : 'Monthly Amount'}
                value={monthlyAmount}
                onChangeText={setMonthlyAmount}
                placeholder="1000"
                keyboardType="decimal-pad"
                isRTL={isRTL}
                className="mb-4"
              />
            )}

            <TextInput
              label={isRTL ? 'عدد السنوات' : 'Time Horizon (Years)'}
              value={years}
              onChangeText={setYears}
              placeholder="10"
              keyboardType="number-pad"
              isRTL={isRTL}
              className="mb-4"
            />

            {/* Risk Profile Display */}
            <View className="mb-4 p-3 bg-primary-50 rounded-lg">
              <Text className={`text-body-sm text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'ملف المخاطر' : 'Risk Profile'}
              </Text>
              <Text className={`text-body font-semibold text-primary-700 capitalize ${isRTL ? 'text-right' : 'text-left'}`}>
                {riskProfile}
              </Text>
            </View>

            {/* Advanced Options */}
            <Pressable
              onPress={() => setShowAdvanced(!showAdvanced)}
              className="flex-row items-center justify-between py-2"
              style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
            >
              <Text className={`text-body-sm text-primary-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'خيارات متقدمة' : 'Advanced Options'}
              </Text>
              <Zap size={16} color="#7C3AED" />
            </Pressable>

            {showAdvanced && (
              <View className="mt-3 p-3 bg-gray-50 rounded-lg">
                <Pressable
                  onPress={() => setIncludeMonteCarlo(!includeMonteCarlo)}
                  className="flex-row items-center"
                  style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                >
                  <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                    includeMonteCarlo ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                  }`}>
                    {includeMonteCarlo && <Text className="text-white text-xs">✓</Text>}
                  </View>
                  <Text className={`text-body-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'محاكاة مونت كارلو (متقدم)' : 'Monte Carlo Simulation (Advanced)'}
                  </Text>
                </Pressable>
              </View>
            )}
          </Card>

          {/* Calculate Button */}
          <Button
            title={isCalculating ? (isRTL ? 'جاري الحساب...' : 'Calculating...') : (isRTL ? 'احسب العائد' : 'Calculate ROI')}
            onPress={handleCalculate}
            disabled={isCalculating}
            variant="primary"
            className="mb-6"
          />

          {/* Results */}
          {results && results.summary && results.baseCalculation && (
            <View className="gap-4">
              {/* Summary Card */}
              <Card variant="bordered" className="p-5">
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2 mb-4`}>
                  <BarChart3 size={20} color="#7C3AED" />
                  <Text className={`text-h5 font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'ملخص النتائج' : 'Results Summary'}
                  </Text>
                </View>

                {/* Base Case */}
                <View className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <Text className={`text-body-sm text-gray-600 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'القيمة المتوقعة' : 'Expected Value'}
                  </Text>
                  <Text riyal riyalSize={28} className={`text-h3 font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {(results.summary?.baseCase ?? results.baseCalculation?.futureValue ?? 0).toFixed(2)}
                  </Text>
                  <Text className={`text-body-sm text-primary-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'العائد المتوقع' : 'Expected ROI'}: {(results.baseCalculation?.roiPercent ?? 0).toFixed(2)}%
                  </Text>
                </View>

                {/* Best/Worst Case */}
                {results.summary?.bestCase !== undefined && results.summary?.worstCase !== undefined && (
                  <View className="flex-row gap-3">
                    <View className="flex-1 p-3 bg-green-50 rounded-lg">
                      <Text className={`text-body-xs text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? 'أفضل سيناريو' : 'Best Case'}
                      </Text>
                      <Text riyal riyalSize={20} className={`text-h4 font-bold text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {(results.summary.bestCase ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-1 p-3 bg-red-50 rounded-lg">
                      <Text className={`text-body-xs text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? 'أسوأ سيناريو' : 'Worst Case'}
                      </Text>
                      <Text riyal riyalSize={20} className={`text-h4 font-bold text-red-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {(results.summary.worstCase ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </Card>

              {/* Risk Scenarios */}
              {results.riskModeling && results.riskModeling.scenarios && (
                <Card variant="bordered" className="p-5">
                  <Text className={`text-h5 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'سيناريوهات المخاطر' : 'Risk Scenarios'}
                  </Text>
                  {Object.entries(results.riskModeling.scenarios).map(([scenario, data]: [string, any]) => (
                    data && (
                      <View key={scenario} className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-2`}>
                          <Text className={`text-body font-semibold text-gray-900 capitalize ${isRTL ? 'text-right' : 'text-left'}`}>
                            {scenario === 'base' ? (isRTL ? 'الأساسي' : 'Base') :
                             scenario === 'optimistic' ? (isRTL ? 'متفائل' : 'Optimistic') :
                             (isRTL ? 'متشائم' : 'Pessimistic')}
                          </Text>
                          <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {(data.annualReturn ?? 0).toFixed(2)}% {isRTL ? 'سنوياً' : 'p.a.'}
                          </Text>
                        </View>
                        <Text riyal riyalSize={20} className={`text-h4 font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {(data.futureValue ?? 0).toFixed(2)}
                        </Text>
                        <Text className={`text-body-sm ${(data.roiPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'} mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {(data.roiPercent ?? 0) >= 0 ? '+' : ''}{(data.roiPercent ?? 0).toFixed(2)}% ROI
                        </Text>
                      </View>
                    )
                  ))}
                </Card>
              )}

              {/* Time Horizons */}
              {results.timeHorizons && results.timeHorizons.results && Array.isArray(results.timeHorizons.results) && (
                <Card variant="bordered" className="p-5">
                  <Text className={`text-h5 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'آفاق زمنية مختلفة' : 'Different Time Horizons'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-3">
                      {results.timeHorizons.results.map((horizon: any) => (
                        horizon && (
                          <View key={horizon.years} className="w-32 p-3 bg-primary-50 rounded-lg">
                            <Text className={`text-body-xs text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {horizon.years} {isRTL ? 'سنة' : 'years'}
                            </Text>
                            <Text riyal riyalSize={16} className={`text-body font-bold text-primary-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {(horizon.futureValue ?? 0).toFixed(0)}
                            </Text>
                            <Text className={`text-body-xs text-primary-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {(horizon.roiPercent ?? 0).toFixed(1)}%
                            </Text>
                          </View>
                        )
                      ))}
                    </View>
                  </ScrollView>
                </Card>
              )}

              {/* Monte Carlo Results */}
              {results.monteCarlo && results.monteCarlo.statistics && (
                <Card variant="bordered" className="p-5">
                  <Text className={`text-h5 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'محاكاة مونت كارلو' : 'Monte Carlo Simulation'}
                  </Text>
                  <View className="gap-3">
                    <View className="p-3 bg-gray-50 rounded-lg">
                      <Text className={`text-body-sm text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? 'القيمة المتوسطة' : 'Mean Value'}
                      </Text>
                      <Text riyal riyalSize={20} className={`text-h4 font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {(results.monteCarlo.statistics.mean ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    {results.monteCarlo.statistics.p90 !== undefined && results.monteCarlo.statistics.p10 !== undefined && (
                      <View className="flex-row gap-3">
                        <View className="flex-1 p-3 bg-green-50 rounded-lg">
                          <Text className={`text-body-xs text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {isRTL ? '90% (أفضل)' : '90th (Best)'}
                          </Text>
                          <Text riyal riyalSize={16} className={`text-body font-bold text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {(results.monteCarlo.statistics.p90 ?? 0).toFixed(0)}
                          </Text>
                        </View>
                        <View className="flex-1 p-3 bg-red-50 rounded-lg">
                          <Text className={`text-body-xs text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {isRTL ? '10% (أسوأ)' : '10th (Worst)'}
                          </Text>
                          <Text riyal riyalSize={16} className={`text-body font-bold text-red-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {(results.monteCarlo.statistics.p10 ?? 0).toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    )}
                    {results.monteCarlo.probabilityOfLoss !== undefined && (
                      <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? 'احتمالية الخسارة' : 'Probability of Loss'}: {(results.monteCarlo.probabilityOfLoss ?? 0).toFixed(1)}%
                      </Text>
                    )}
                  </View>
                </Card>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
