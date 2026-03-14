import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Card } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface RiskProfileScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export const RiskProfileScreen: React.FC<RiskProfileScreenProps> = ({ onBack, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [reassessment, setReassessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkReassessment();
  }, []);

  const checkReassessment = async () => {
    setIsChecking(true);
    try {
      const response = await apiService.checkReassessment();
      if (response.success && response.data) {
        setReassessment(response.data);
      }
    } catch (error) {
      if (__DEV__) console.warn('Error checking reassessment:', error);
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  };

  const getRiskProfileLabel = (profile?: string) => {
    const labels: Record<string, string> = {
      conservative: isRTL ? 'محافظ' : 'Conservative',
      balanced: isRTL ? 'متوازن' : 'Balanced',
      advanced: isRTL ? 'متقدم' : 'Advanced',
      aggressive: isRTL ? 'عدواني' : 'Aggressive',
      adventure: isRTL ? 'مغامر' : 'Adventure',
    };
    return profile ? labels[profile] || profile : (isRTL ? 'غير محدد' : 'Not Set');
  };

  const getRiskProfileColor = (profile?: string) => {
    const colors: Record<string, string> = {
      conservative: '#10B981',
      balanced: '#3B82F6',
      advanced: '#F59E0B',
      aggressive: '#F59E0B',
      adventure: '#EF4444',
    };
    return profile ? colors[profile] || '#6B7280' : '#6B7280';
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
          {isRTL ? 'ملف المخاطر' : 'Risk Profile'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-5 mt-6">
          {/* Current Risk Profile */}
          <Card variant="bordered" className="p-5 mb-6">
            <Text className={`text-h4 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'ملف المخاطر الحالي' : 'Current Risk Profile'}
            </Text>

            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center mb-3`}>
              <View 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: getRiskProfileColor(user?.investmentProfile?.riskProfile) }}
              />
              <Text className={`text-body-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                {getRiskProfileLabel(user?.investmentProfile?.riskProfile)}
              </Text>
            </View>

            {user?.investmentProfile?.riskScore !== undefined && (
              <View className="mt-3">
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-2`}>
                  <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'نقاط المخاطر' : 'Risk Score'}
                  </Text>
                  <Text className={`text-body font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {user.investmentProfile.riskScore}/100
                  </Text>
                </View>
                <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${user.investmentProfile.riskScore}%`,
                      backgroundColor: getRiskProfileColor(user?.investmentProfile?.riskProfile)
                    }}
                  />
                </View>
              </View>
            )}
          </Card>

          {/* Reassessment Status */}
          {reassessment && (
            <Card variant="bordered" className="p-5 mb-6">
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
                <Text className={`text-h4 font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? 'حالة إعادة التقييم' : 'Reassessment Status'}
                </Text>
                <Pressable onPress={checkReassessment} disabled={isChecking}>
                  <RefreshCw size={20} color="#7C3AED" className={isChecking ? 'opacity-50' : ''} />
                </Pressable>
              </View>

              {reassessment.needsReassessment ? (
                <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center mb-2`}>
                    <AlertCircle size={20} color="#F59E0B" style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
                    <Text className={`text-body font-semibold text-yellow-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'يُنصح بإعادة التقييم' : 'Reassessment Recommended'}
                    </Text>
                  </View>
                  {reassessment.triggers.map((trigger: any, index: number) => (
                    <Text key={index} className={`text-body-sm text-yellow-700 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      • {trigger.reason}
                    </Text>
                  ))}
                </View>
              ) : (
                <View className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                    <CheckCircle size={20} color="#10B981" style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
                    <Text className={`text-body font-semibold text-green-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'ملف المخاطر محدث' : 'Risk Profile Up to Date'}
                    </Text>
                  </View>
                  {reassessment.daysSinceAssessment !== undefined && (
                    <Text className={`text-body-sm text-green-700 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL 
                        ? `آخر تقييم منذ ${reassessment.daysSinceAssessment} يوم`
                        : `Last assessed ${reassessment.daysSinceAssessment} days ago`
                      }
                    </Text>
                  )}
                </View>
              )}
            </Card>
          )}

          {/* Asset Allocation */}
          {user?.investmentProfile?.assetAllocation && (
            <Card variant="bordered" className="p-5 mb-6">
              <Text className={`text-h4 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'توزيع الأصول' : 'Asset Allocation'}
              </Text>
              {Object.entries(user.investmentProfile.assetAllocation).map(([asset, percentage]: [string, any]) => (
                <View key={asset} className="mb-3">
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-1`}>
                    <Text className={`text-body text-gray-700 capitalize ${isRTL ? 'text-right' : 'text-left'}`}>
                      {asset}
                    </Text>
                    <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {percentage}%
                    </Text>
                  </View>
                  <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View 
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Actions */}
          <View className="gap-3">
            <Button
              title={isRTL ? 'إعادة تقييم ملف المخاطر' : 'Reassess Risk Profile'}
              onPress={() => onNavigate?.('risk-questionnaire')}
              variant="primary"
            />
            <Button
              title={isRTL ? 'عرض ملفات المخاطر' : 'View Risk Profiles'}
              onPress={() => onNavigate?.('risk-profiles')}
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
