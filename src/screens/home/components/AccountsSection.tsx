import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Landmark } from 'lucide-react-native';
import BankAdd from '@/assets/icons/bankadd.svg';
export const AccountsSection: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    return (
        <Pressable className="px-5 border mx-6 rounded-md border-gray-200 mb-6">
            {/* Section Header */}
            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between py-3`}>
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                    <Landmark size={30} color="rgba(141, 98, 210, 1)" />
                    <Text className="text-h4 font-bold text-gray-900">
                        {t('home.accounts')}
                    </Text>
                </View>

                <BankAdd/>
            </View>


        </Pressable>
    );
};
