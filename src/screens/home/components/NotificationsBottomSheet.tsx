import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/BottomSheet';
import { X } from 'lucide-react-native';

interface NotificationsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsBottomSheet: React.FC<NotificationsBottomSheetProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-5 py-6">
        {/* Header */}
        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-6`}>
          <Text className="text-h3 font-bold text-gray-900">
            {t('home.notifications')}
          </Text>
          <Pressable onPress={onClose} className="w-8 h-8 items-center justify-center">
            <X size={24} color="#1F2937" />
          </Pressable>
        </View>

        {/* Notifications Content */}
        <View className="py-8 items-center">
          <View className="w-20 h-20 rounded-full bg-purple-50 items-center justify-center mb-4">
            <Text className="text-4xl">🔔</Text>
          </View>
          <Text className="text-h4 font-bold text-gray-900 mb-2 text-center">
            {t('home.noNotifications')}
          </Text>
          <Text className="text-body text-gray-600 text-center">
            {t('home.noNotificationsDesc')}
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
};
