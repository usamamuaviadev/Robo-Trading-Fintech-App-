import React from 'react';
import { View} from 'react-native';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => onLoadingComplete && onLoadingComplete(), 1500);
    return () => clearTimeout(timer);
  }, [onLoadingComplete]);
  return (
    <View
      className="flex-1 items-center justify-center  px-lg bg-white"
    >
       <View>
        <Text className="text-black text-h1 mb-4 text-center">
          {t('LOGO')}
        </Text>
       </View>
          <LoadingSpinner className='absolute bottom-10' />
    </View>
  );
};
