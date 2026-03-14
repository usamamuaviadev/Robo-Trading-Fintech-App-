import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { Bot, ChevronRight } from 'lucide-react-native';

interface ChatCardProps {
  onPress?: () => void;
}

export const ChatCard: React.FC<ChatCardProps> = ({ onPress }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Pressable 
      onPress={onPress}
      className={`rounded-2xl p-5 ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 border border-gray-900/20 items-center justify-between active:opacity-80 bg-primary-50`}
    >
      <View className="flex-1 flex-row gap-3 items-center">
        <View className="w-12 h-12 rounded-full bg-primary-600 items-center justify-center">
          <Bot size={24} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className={`text-h4 font-bold text-black ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'المساعد الذكي' : 'AI Assistant'}
          </Text>
          <Text className={`text-body text-black opacity-90 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'احصل على المساعدة في أي وقت' : 'Get help anytime'}
          </Text>
        </View>
      </View>
      <ChevronRight size={30} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
    </Pressable>
  );
};
