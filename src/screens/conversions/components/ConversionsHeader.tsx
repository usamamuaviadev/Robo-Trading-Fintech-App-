import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { ProfileHeader } from '@/components/ProfileHeader';

export const ConversionsHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <View className="px-5 pt-3 pb-4">
      {/* Top Row with Bell */}
      <ProfileHeader/>

      {/* Main Title */}
      <Text className={`text-h2 mx-4 font-bold text-gray-900 mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t('conversions.title')}
      </Text>
    </View>
  );
};
