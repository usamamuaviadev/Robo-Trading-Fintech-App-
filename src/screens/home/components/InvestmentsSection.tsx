import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text, Button } from '@/components';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ChevronRight } from 'lucide-react-native';
import Plant from '@/assets/icons/plant.svg';
import Weight from '@/assets/icons/weight.svg';
import Family from '@/assets/icons/family.svg';
import { apiService } from '@/services/api';

export const InvestmentsSection: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolioData = async () => {
            setIsLoading(true);
            try {
                const response = await apiService.getPortfolioComposition();
                if (response.success && response.data) {
                    setPortfolioData(response.data);
                } else {
                    setPortfolioData(null);
                }
            } catch (error) {
                if (__DEV__) console.warn('Error fetching portfolio composition:', error);
                setPortfolioData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPortfolioData();
    }, []);

    // Calculate portfolio value and return
    const portfolioValue = portfolioData?.totalValue || 0;
    const totalCost = portfolioData?.totalCost || 0;
    const totalProfitLoss = portfolioData?.totalProfitLoss || 0;
    const returnPercent = totalCost > 0 ? ((totalProfitLoss / totalCost) * 100) : 0;

    return (
        <View className="mb-6">
            {/* Section Header */}


            {/* Portfolio Card */}
            <View className="mx-5  rounded-2xl p-5 border border-gray-900/20">
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-3`}>
                    <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                        <Plant width={30} height={30} />
                        <Text className="text-h3 font-bold text-gray-900">
                            {t('home.yourInvestments')}
                        </Text>

                    </View>
                    <Pressable className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                        <Text className="text-body underline text-primary-600 font-medium">
                            {t('home.viewMore')}
                        </Text>

                    </Pressable>
                </View>
                <View className={`flex-row mt-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start justify-between mb-4`}>
                    <View className="flex-1">
                        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                            <Weight width={50} height={50} />
                            <View>
                        <Text className={`text-body font-semibold text-gray-900  ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('home.balancedPortfolio')}
                        </Text>
                        <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('home.saudiStockMarket')}
                        </Text>
                        </View>
                        </View>
                    </View>


                    <View className={`flex ${isRTL ? 'items-end' : 'items-start'}`}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#7C3AED" />
                        ) : (
                            <>
                                <Text riyal={true} className='text-body-md text-gray-600' riyalColor='rgba(118, 117, 117, 1)' >
                                    {portfolioValue.toFixed(2)}
                                </Text>
                                <Text className={`text-body-md ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                
                {/* Create Portfolio Button */}
                <Button
                    title={t('home.createPortfolio')}
                    onPress={() => { }}
                    variant="primary"
                    size="md"
                />
            </View>

            {/* Manage My Accounts Link */}
            <Pressable className={`mx-5 rounded-md mt-4 border border-gray-900/20  px-6 flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between py-4 border-b border-neutral-200`}>
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center flex-1`}>
                   
                    <View className={`flex-1 `}>
                        <Text className={`text-body font-semibold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('home.manageAccounts')}
                        </Text>
                        <Text className={`text-body-sm text-gray-600 p-0 ${isRTL ? 'text-right ' : 'text-left'}`}>
                            {t('home.manageAccountsDesc')}
                        </Text>
                        <View className={`flex-row mt-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center `}>
                        <Text className={`text-body-lg mt-3 text-primary-600 font-bold underline ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('home.manageAccountAction')}
                        </Text>
                        {
                            isRTL ? <ChevronRight size={30} color="#8b61c6ff"  style={{ transform: [{ rotate: '180deg' },{translateY: -2}] }} /> : <ChevronRight size={20} color="#a480f2ff" />
                        }
                        </View>

                    </View>
                        <Family width={48} height={50} />
                </View>
               
            </Pressable>
        </View>
    );
};
