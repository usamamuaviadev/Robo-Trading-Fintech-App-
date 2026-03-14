import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Pressable, Modal, ScrollView } from 'react-native';
import { Text } from './Text';
import { ChevronDown } from 'lucide-react-native';

export interface Country {
  code: string;
  dialCode: string;
  name: string;
  nameAr: string;
  flag: string; // emoji for now, can be replaced with image URLs
}

export interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onChangeCountry?: (country: Country) => void;
  isRTL?: boolean;
  placeholder?: string;
  error?: string;
}

// Country data with Arabic names
const COUNTRIES: Country[] = [
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', flag: '🇸🇦' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', flag: '🇦🇪' },
  { code: 'KW', dialCode: '+965', name: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼' },
  { code: 'QA', dialCode: '+974', name: 'Qatar', nameAr: 'قطر', flag: '🇶🇦' },
  { code: 'BH', dialCode: '+973', name: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭' },
  { code: 'OM', dialCode: '+968', name: 'Oman', nameAr: 'عمان', flag: '🇴🇲' },
  { code: 'EG', dialCode: '+20', name: 'Egypt', nameAr: 'مصر', flag: '🇪🇬' },
  { code: 'JO', dialCode: '+962', name: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴' },
  { code: 'LB', dialCode: '+961', name: 'Lebanon', nameAr: 'لبنان', flag: '🇱🇧' },
  { code: 'US', dialCode: '+1', name: 'United States', nameAr: 'الولايات المتحدة', flag: '🇺🇸' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  onChangeCountry,
  isRTL = false,
  placeholder = '',
  error,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChangeCountry?.(country);
    setShowCountryPicker(false);
  };

  return (
    <>
      <View className="mb-4">
        <View
          className={`flex-row items-center border border-neutral-300 rounded-xl ${
            error ? 'border-error-500' : 'border-neutral-300'
          } bg-white overflow-hidden`}
          style={{ minHeight: 48 }}
        >
          {/* Phone Number Input - Left side for RTL */}
          {isRTL && (
            <RNTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              keyboardType="phone-pad"
              className="flex-1 px-4 text-body text-gray-400 text-right"
              style={{ 
                writingDirection: 'rtl',
                textAlignVertical: 'center',
                paddingTop: 0,
                paddingBottom: 0,
                paddingVertical: 12,
                includeFontPadding: false,
              }}
              placeholderTextColor="#D1D5DB"
            />
          )}

          {/* Country Code Selector - Right side for RTL */}
          {isRTL && (
            <Pressable
              onPress={() => setShowCountryPicker(true)}
              className="flex-row items-center px-4 py-4 border-l border-neutral-200"
            >
              <ChevronDown size={20} color="#6B7280" />
              <View className="  overflow-hidden mx-2.5  items-center justify-center bg-white">
                <Text className="text-2xl leading-none">{selectedCountry.flag}</Text>
              </View>
              <Text className="text-body text-gray-900 font-medium">
                {selectedCountry.dialCode}
              </Text>
            </Pressable>
          )}

          {/* Country Code Selector - Left side for LTR */}
          {!isRTL && (
            <Pressable
              onPress={() => setShowCountryPicker(true)}
              className="flex-row items-center px-4 py-4 border-r border-neutral-200"
            >
              <Text className="text-body text-gray-900 font-medium">
                {selectedCountry.dialCode}
              </Text>
              <View className="w-9 h-6 rounded-sm overflow-hidden mx-2.5 items-center justify-center bg-white">
                <Text className="text-2xl leading-none">{selectedCountry.flag}</Text>
              </View>
              <ChevronDown size={20} color="#6B7280" />
            </Pressable>
          )}

          {/* Phone Number Input - Right side for LTR */}
          {!isRTL && (
            <RNTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              keyboardType="phone-pad"
              className="flex-1 px-4 text-body text-black text-left"
              style={{ 
                writingDirection: 'ltr',
                textAlignVertical: 'center',
                paddingTop: 0,
                paddingBottom: 0,
                paddingVertical: 12,
                includeFontPadding: false,
              }}
              placeholderTextColor="#D1D5DB"
            />
          )}
        </View>
        {error && (
          <Text className={`text-body-sm text-error-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            {error}
          </Text>
        )}
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowCountryPicker(false)}
        >
          <Pressable className="bg-white rounded-t-3xl max-h-[70%]" onPress={(e) => e.stopPropagation()}>
            <View className="p-4 border-b border-neutral-200">
              <Text className="text-h4 font-bold text-center">
                {isRTL ? 'اختر الدولة' : 'Select Country'}
              </Text>
            </View>
            <ScrollView className="px-4">
              {COUNTRIES.map((country) => (
                <Pressable
                  key={country.code}
                  onPress={() => handleCountrySelect(country)}
                  className={`flex-row items-center py-4 border-b border-neutral-100 ${
                    isRTL ? 'flex-row-reverse' : 'flex-row'
                  } ${selectedCountry.code === country.code ? 'bg-primary-50' : ''}`}
                >
                  <View className="w-10 h-7 rounded-sm overflow-hidden border border-neutral-200 bg-white items-center justify-center">
                    <Text className="text-2xl leading-none">{country.flag}</Text>
                  </View>
                  <View className={`flex-1 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                    <Text className={`text-body text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? country.nameAr : country.name}
                    </Text>
                  </View>
                  <Text className={`text-body text-gray-600 ${isRTL ? 'ml-3' : 'mr-3'}`}>
                    {country.dialCode}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
