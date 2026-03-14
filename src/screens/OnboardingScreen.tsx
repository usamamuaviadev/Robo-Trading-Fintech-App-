import React from 'react';
import { View } from 'react-native';
import { Button, LanguageSwitcher, Text } from '@/components';
import { useTranslation } from 'react-i18next';
import Img1 from '@/assets/images/onboarding/1.svg';
import Img2 from '@/assets/images/onboarding/2.svg';
import Img3 from '@/assets/images/onboarding/3.svg';

interface OnboardingScreenProps {
  title: string;
  subtitle: string;
  description: string;
  imageUrl?: string; // retained for backward compatibility, but SVGs are used
  dotIndex?: number;
  totalDots?: number;
  onNext?: () => void;
  onSkip?: () => void;
  isLast?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  title,
  subtitle,
  description,
  imageUrl = 'https://via.placeholder.com/200x200?text=Feature',
  dotIndex = 0,
  totalDots = 3,
  onNext,
  onSkip,
  isLast = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language && i18n.language.startsWith('ar');
  const dots = Array.from({ length: 3 }, (_, i) => i);
  const images = [Img1, Img2, Img3, Img3];
  const Illustration = images[Math.min(dotIndex, images.length - 1)];
  const textAlign = isRTL ? 'text-right' : 'text-left';
  const switcherPlacement = {
    position: 'absolute' as const,
    top: 16,
    [isRTL ? 'left' : 'right']: 16,
  };

  return (
    <View
      className="flex-1 bg-white justify-between py-lg px-lg"
    >
      <LanguageSwitcher placementStyle={switcherPlacement} />
      {/* Content Area */}
      <View className="flex-1 items-center justify-center px-xl">
        {/* Illustration */}
        

        

        {/* Title */}
        <Text className={`text-h1 leading-20 font-bold text-center text-black  mb-2 `}>{title}</Text>

        {/* Description */}
        <Text className={`text-body-sm text-center text-gray-600`}>{description}</Text>

        <View className="w-auto h-auto items-center justify-center mb-2">
          <Illustration width={300} height={300} />
        </View>
      </View>

      {/* Navigation Dots */}
      <View className="flex justify-center flex-row gap-2 mb-8">
        {dots.map((i) => (
          <View
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === dotIndex ? 'w-6 bg-primary-500' : 'w-2 bg-primary-300'
            }`}
          />
        ))}
      </View>

      {/* Buttons */}
      <View className="w-full gap-3">
        <Button
          title={isLast ? t('start') : t('start')}
          onPress={onNext || (() => {})}
          variant="primary"
          size="lg"
        />
        {!isLast && (
          <Button
            title={t('Login')}
            onPress={onSkip || (() => {})}
            variant="ghost"
            size="lg"
          />
        )}
      </View>
    </View>
  );
};
