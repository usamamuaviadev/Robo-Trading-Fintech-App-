import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, Share, ActivityIndicator, Clipboard } from 'react-native';
import { Text, Card, Button } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Copy, Share2, Users, TrendingUp, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface AffiliateScreenProps {
  onBack?: () => void;
}

export const AffiliateScreen: React.FC<AffiliateScreenProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [stats, setStats] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'referrals' | 'commissions'>('referrals');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Initialize affiliate if needed
      try {
        await apiService.initializeAffiliate();
      } catch (error) {
        // Already initialized or other error, continue
      }

      // Load stats
      const statsResponse = await apiService.getAffiliateStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load referrals
      const referralsResponse = await apiService.getReferralHistory({ limit: 20 });
      if (referralsResponse.success) {
        setReferrals(referralsResponse.data || []);
      }

      // Load commissions
      const commissionsResponse = await apiService.getCommissionHistory({ limit: 20 });
      if (commissionsResponse.success) {
        setCommissions(commissionsResponse.data || []);
      }
    } catch (error: any) {
      if (__DEV__) console.warn('Error loading affiliate data:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل تحميل البيانات' : 'Failed to load data')
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert(
        isRTL ? 'تم النسخ' : 'Copied',
        isRTL ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard'
      );
    } catch (error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل النسخ' : 'Failed to copy'
      );
    }
  };

  const shareReferralLink = async () => {
    if (!stats?.referralLink) return;
    
    try {
      await Share.share({
        message: isRTL 
          ? `انضم إلى منصة الاستثمار الذكي! استخدم رابط الإحالة الخاص بي: ${stats.referralLink}`
          : `Join the smart investment platform! Use my referral link: ${stats.referralLink}`,
        url: stats.referralLink
      });
    } catch (error) {
      if (__DEV__) console.warn('Error sharing:', error);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'paid':
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'cancelled':
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-gray-600 mt-4">{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
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
        <View className="flex-1 flex-row items-center justify-center gap-2">
          <Users size={24} color="#7C3AED" />
          <Text className="text-h3 font-bold text-gray-900">
            {isRTL ? 'نظام الإحالة' : 'Affiliate Program'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-5 mt-6">
          {/* Stats Cards */}
          {stats && (
            <View className="gap-4 mb-6">
              {/* Referral Link Card */}
              <Card variant="bordered" className="p-5">
                <Text className={`text-h5 font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? 'رابط الإحالة الخاص بك' : 'Your Referral Link'}
                </Text>
                <View className="p-3 bg-gray-50 rounded-lg mb-4">
                  <Text className={`text-body text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`} numberOfLines={1}>
                    {stats.referralLink || stats.referralCode}
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => copyToClipboard(stats.referralLink || stats.referralCode)}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3 bg-primary-600 rounded-lg"
                  >
                    <Copy size={18} color="#FFFFFF" />
                    <Text className="text-white font-semibold">
                      {isRTL ? 'نسخ' : 'Copy'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={shareReferralLink}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3 bg-primary-100 rounded-lg"
                  >
                    <Share2 size={18} color="#7C3AED" />
                    <Text className="text-primary-600 font-semibold">
                      {isRTL ? 'مشاركة' : 'Share'}
                    </Text>
                  </Pressable>
                </View>
              </Card>

              {/* Stats Grid */}
              <View className="flex-row flex-wrap gap-3">
                <Card variant="bordered" className="flex-1 min-w-[45%] p-4">
                  <View className={`flex-row items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Users size={20} color="#7C3AED" />
                    <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'إجمالي الإحالات' : 'Total Referrals'}
                    </Text>
                  </View>
                  <Text riyal riyalSize={24} className={`text-h4 font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {stats.totalReferrals || 0}
                  </Text>
                </Card>

                <Card variant="bordered" className="flex-1 min-w-[45%] p-4">
                  <View className={`flex-row items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <TrendingUp size={20} color="#10B981" />
                    <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'نشطة' : 'Active'}
                    </Text>
                  </View>
                  <Text riyal riyalSize={24} className={`text-h4 font-bold text-green-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {stats.activeReferrals || 0}
                  </Text>
                </Card>

                <Card variant="bordered" className="flex-1 min-w-[45%] p-4">
                  <View className={`flex-row items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <DollarSign size={20} color="#F59E0B" />
                    <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'إجمالي العمولات' : 'Total Commissions'}
                    </Text>
                  </View>
                  <Text riyal riyalSize={24} className={`text-h4 font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {stats.totalCommissions?.toFixed(2) || '0.00'}
                  </Text>
                </Card>

                <Card variant="bordered" className="flex-1 min-w-[45%] p-4">
                  <View className={`flex-row items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Clock size={20} color="#8B5CF6" />
                    <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'معلقة' : 'Pending'}
                    </Text>
                  </View>
                  <Text riyal riyalSize={24} className={`text-h4 font-bold text-yellow-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {stats.pendingCommissions?.toFixed(2) || '0.00'}
                  </Text>
                </Card>
              </View>
            </View>
          )}

          {/* Tabs */}
          <View className="flex-row gap-3 mb-4">
            <Pressable
              onPress={() => setActiveTab('referrals')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                activeTab === 'referrals'
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <Text className={`text-body font-semibold text-center ${
                activeTab === 'referrals' ? 'text-white' : 'text-gray-900'
              }`}>
                {isRTL ? 'الإحالات' : 'Referrals'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('commissions')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                activeTab === 'commissions'
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <Text className={`text-body font-semibold text-center ${
                activeTab === 'commissions' ? 'text-white' : 'text-gray-900'
              }`}>
                {isRTL ? 'العمولات' : 'Commissions'}
              </Text>
            </Pressable>
          </View>

          {/* Referrals List */}
          {activeTab === 'referrals' && (
            <View className="gap-3">
              {referrals.length === 0 ? (
                <Card variant="bordered" className="p-8 items-center">
                  <Users size={48} color="#D1D5DB" />
                  <Text className={`text-body text-gray-500 mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'لا توجد إحالات حتى الآن' : 'No referrals yet'}
                  </Text>
                  <Text className={`text-body-sm text-gray-400 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'شارك رابطك لبدء كسب العمولات' : 'Share your link to start earning commissions'}
                  </Text>
                </Card>
              ) : (
                referrals.map((referral: any) => (
                  <Card key={referral._id} variant="bordered" className="p-4">
                    <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-2`}>
                      <View className="flex-1">
                        <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {referral.referredId?.fullName || referral.referredId?.phoneNumber || 'Unknown'}
                        </Text>
                        <Text className={`text-body-sm text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {formatDate(referral.createdAt)}
                        </Text>
                      </View>
                      <View className={`items-end ${isRTL ? 'items-start' : 'items-end'}`}>
                        {referral.status === 'active' ? (
                          <CheckCircle size={20} color="#10B981" />
                        ) : referral.status === 'cancelled' ? (
                          <XCircle size={20} color="#EF4444" />
                        ) : (
                          <Clock size={20} color="#F59E0B" />
                        )}
                        <Text className={`text-body-xs mt-1 ${getStatusColor(referral.status)} ${isRTL ? 'text-right' : 'text-left'}`}>
                          {referral.status}
                        </Text>
                      </View>
                    </View>
                    {referral.hasDeposited && (
                      <View className="mt-2 pt-2 border-t border-gray-100">
                        <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'أول إيداع' : 'First Deposit'}: {referral.firstDepositAmount?.toFixed(2) || 0} {isRTL ? 'ريال' : 'SAR'}
                        </Text>
                      </View>
                    )}
                  </Card>
                ))
              )}
            </View>
          )}

          {/* Commissions List */}
          {activeTab === 'commissions' && (
            <View className="gap-3">
              {commissions.length === 0 ? (
                <Card variant="bordered" className="p-8 items-center">
                  <DollarSign size={48} color="#D1D5DB" />
                  <Text className={`text-body text-gray-500 mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'لا توجد عمولات حتى الآن' : 'No commissions yet'}
                  </Text>
                </Card>
              ) : (
                commissions.map((commission: any) => (
                  <Card key={commission._id} variant="bordered" className="p-4">
                    <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-2`}>
                      <View className="flex-1">
                        <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {commission.commissionType === 'signup' ? (isRTL ? 'تسجيل' : 'Signup') :
                           commission.commissionType === 'deposit' ? (isRTL ? 'إيداع' : 'Deposit') :
                           commission.commissionType === 'investment' ? (isRTL ? 'استثمار' : 'Investment') :
                           (isRTL ? 'مستوى' : 'Tier')} {commission.tier > 1 ? `${commission.tier}` : ''}
                        </Text>
                        <Text className={`text-body-sm text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {formatDate(commission.createdAt)}
                        </Text>
                      </View>
                      <View className={`items-end ${isRTL ? 'items-start' : 'items-end'}`}>
                        <Text riyal riyalSize={20} className={`text-h4 font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {commission.commissionAmount?.toFixed(2) || '0.00'}
                        </Text>
                        <Text className={`text-body-xs mt-1 ${getStatusColor(commission.status)} ${isRTL ? 'text-right' : 'text-left'}`}>
                          {commission.status}
                        </Text>
                      </View>
                    </View>
                    {commission.referredUserId && (
                      <Text className={`text-body-sm text-gray-600 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? 'من' : 'From'}: {commission.referredUserId?.fullName || commission.referredUserId?.phoneNumber || 'Unknown'}
                      </Text>
                    )}
                  </Card>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
