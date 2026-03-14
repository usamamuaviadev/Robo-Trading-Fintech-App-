import React from 'react';
import { View, Pressable, Modal } from 'react-native';
import { Text, Button } from '@/components';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react-native';
import { BottomSheet } from '@/components';
interface ConversionDetailsSheetProps {
  visible: boolean;
  conversion: any;
  onClose: () => void;
}

export const ConversionDetailsSheet: React.FC<ConversionDetailsSheetProps> = ({ 
  visible, 
  conversion, 
  onClose 
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (!conversion) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={700}

    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white flex-1 ">
         

          <View className="px-5 pb-8">
            {/* Amount Section */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-2xl bg-purple-100 items-center justify-center mb-4">
                <ArrowUpRight size={32} color="#7C3AED" />
              </View>
              <Text riyal riyalColor='black' riyalSize={40} className="text-h1 font-bold text-gray-900 mb-1" >
                {conversion.amount}
              </Text>
              <Text className="text-body text-gray-600">
                {t('conversions.receiveWaiting')}
              </Text>
            </View>

            {/* Details Section */}
            <View className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6">
              {/* Company Row */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3 border-b border-neutral-200`}>
                <Text className={`text-body text-gray-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t('conversions.company')}
                </Text>
                <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {conversion.company}
                </Text>
              </View>

              {/* Method Row */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3 border-b border-neutral-200`}>
                <Text className={`text-body text-gray-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t('conversions.method')}
                </Text>
                <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {conversion.method}
                </Text>
              </View>

              {/* Date Row */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3`}>
                <Text className={`text-body text-gray-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t('conversions.submissionDate')}
                </Text>
                <Text className={`text-body font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {conversion.submissionDate}
                </Text>
              </View>
            </View>

            {/* Download Button */}
            <Button
              title={t('conversions.download')}
              onPress={onClose}
              variant="primary"
              size="lg"
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};
