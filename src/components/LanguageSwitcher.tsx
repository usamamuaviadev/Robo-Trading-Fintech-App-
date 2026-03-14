import React, { useState, useCallback } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './BottomSheet';

// Simple row component for a language option
interface LanguageOptionProps {
  code: string;
  label: string;
  current: string;
  onSelect: (code: string) => void;
}

const LanguageOption: React.FC<LanguageOptionProps> = ({ code, label, current, onSelect }) => {
  const active = code === current;
  return (
    <Pressable
      onPress={() => onSelect(code)}
      className="flex flex-row items-center justify-between py-3 px-md rounded-md"
    >
      <Text className="text-h4 font-medium" style={active ? { fontWeight: '700' } : undefined}>{label}</Text>
      {active && <Text className="text-sm text-neutral-500">✓</Text>}
    </Pressable>
  );
};

export interface LanguageSwitcherProps {
  size?: number; // icon size
  color?: string; // icon color
  placementStyle?: any; // optional style for wrapper (e.g., absolute positioning)
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  size = 24,
  color = '#111827',
  placementStyle,
}) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = i18n.language || 'en';

  const toggle = useCallback(() => setOpen(o => !o), []);
  const close = useCallback(() => setOpen(false), []);

  const handleSelect = useCallback(async (code: string) => {
    if (code !== currentLang) {
      await i18n.changeLanguage(code); // languageDetector will cache into MMKV
    }
    close();
  }, [currentLang, i18n, close]);

  return (
    <View style={placementStyle} >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.changeLanguage', 'Change Language')}
        onPress={toggle}
        className="items-center justify-center p-2 rounded-full bg-white shadow"
      >
        <Globe size={size} color={color} />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={close}
        height={180}
      >
        <View className=" py-4 gap-2">
          <LanguageOption code="en" label={t('common.english', 'English')} current={currentLang} onSelect={handleSelect} />
          <LanguageOption code="ar" label={t('common.arabic', 'العربية')} current={currentLang} onSelect={handleSelect} />
        </View>
      </BottomSheet>
    </View>
  );
};

export default LanguageSwitcher;
