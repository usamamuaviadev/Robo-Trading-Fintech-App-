import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Scale, Info, Globe, BadgeCheck } from 'lucide-react-native';
import Chain from "@/assets/icons/chain.svg";
interface PortfolioDetailsScreenProps {
    onBack?: () => void;
}

export const PortfolioDetailsScreen: React.FC<PortfolioDetailsScreenProps> = ({ onBack }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center  px-5 pt-4 pb-2`}>
                <Pressable onPress={onBack} hitSlop={10} className="p-2">
                    {isRTL ? (
                        <ChevronRight size={24} color="#111827" />
                    ) : (
                        <ChevronLeft size={24} color="#111827" />
                    )}
                </Pressable>
                <Text className="text-h3 font-bold text-gray-900">
                    {t('portfolio.retirementPortfolio')}
                </Text>
                {/* spacer */}
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Balanced Portfolio Card */}
                <View className="mx-5 mt-2 mb-4 rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm">
                    <View className={`flex ${isRTL ? 'items-end' : 'items-start'} `}>
                        <View className="w-16 h-16 rounded-full bg-violet-100 items-center justify-center">
                            <Scale size={40} color="#7C3AED" />
                        </View>
                        <Text className="text-h2 font-bold text-gray-900">{t('portfolio.balancedPortfolioItem')}</Text>
                    </View>
                </View>

                {/* Goal Card */}
                <View className="mx-5 mb-5 rounded-2xl bg-white border border-neutral-200 p-4">
                    <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-2`}>
                        <Text className="text-body text-gray-900">{t('portfolio.yourGoal')}</Text>
                        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                            <View className="px-2 py-1 bg-green-100 rounded-full">
                                <Text className="text-body-sm text-green-700">{t('portfolio.onTrack')}</Text>
                            </View>
                        </View>
                    </View>
                    <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-end justify-between`}>
                        <Text className="text-h3 font-bold" riyal riyalColor='black'>26.00</Text>
                        <Text className="text-body-sm text-gray-500">15%</Text>
                    </View>
                    <View className="mt-2 w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <View className="h-full bg-green-500 rounded-full" style={{ width: '26%' }} />
                    </View>
                </View>

                {/* Funds Section */}
                <View className="mx-5  rounded-2xl bg-white border border-neutral-200">
                    <View  className="px-5 py-4"  >
                        <Text className={`text-h4 font-bold ${isRTL ? 'text-right' : 'text-left'} text-gray-900`}>{t('portfolio.portfolioFundsTitle')}</Text>
                    </View>
                    {/* Item 1 */}
                    <View className="px-5 py-4 border-t border-neutral-200">
                        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2 justify-between`}>
                                <Chain height={40} width={40} />
                            <View className={`flex-1 ${isRTL ? 'items-end' : 'items-start'}`}>

                                <Text className="text-body font-semibold text-gray-900">{t('portfolio.fundAlRajhiName')}</Text>
                                <Text className="text-body-sm text-gray-500">{t('portfolio.fundAlRajhiAllocation')}</Text>
                            </View>

                        </View>
                    </View>
                    {/* Divider */}
                    <View className="h-[1px] bg-neutral-200 mx-5" />
                    {/* Item 2 */}
                    <View className="px-5 py-4">
                        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-3 justify-between`}>
                            <Globe size={30} color="#111827" />

                            <View className={`flex-1 ${isRTL ? 'items-end' : 'items-start'}`}>
                                <Text className="text-body font-semibold text-gray-900">{t('portfolio.fundSPUSName')}</Text>
                                <Text className="text-body-sm text-gray-500">{t('portfolio.fundSPUSAllocation')}</Text>
                            </View>
                        </View>
                    </View>
                    {/* Divider */}
                    <View className="h-[1px] bg-neutral-200 mx-5" />
                    {/* Item 3 */}
                    <View className="px-5 py-4">
                        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-3 justify-between`}>
                            <Globe size={30} color="#111827" />

                            <View className={`flex-1 ${isRTL ? 'items-end' : 'items-start'}`}>
                                <Text className="text-body font-semibold text-gray-900">{t('portfolio.fundSPUSName')}</Text>
                                <Text className="text-body-sm text-gray-500">{t('portfolio.fundSPUSAllocation')}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
