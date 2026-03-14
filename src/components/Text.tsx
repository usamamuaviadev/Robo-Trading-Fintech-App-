import React, { PropsWithChildren } from 'react';
import { Text as RNText, TextProps as RNTextProps, View } from 'react-native';
import Riyal from '@/assets/icons/riyal.svg';

type TextProps = PropsWithChildren<RNTextProps> & { className?: string,riyal?: boolean, riyalClass?: string, riyalSize?: number | string, brightness?: number,riyalColor?: string };


export const Text: React.FC<TextProps> = ({className, riyal,brightness, riyalClass, riyalSize, riyalColor,   ...props}) => {
  // Normalize className to map weight utilities to Arabic font-family variants.
  // Many places use `font-bold` or `font-semibold`; for custom Arabic fonts the
  // correct approach is to switch the font-family (e.g. NotoKufiArabic-Bold).
  // We keep `font-arabic` as the default regular family and map weight classes
  // to `font-arabic-<weight>` so NativeWind will apply the proper font family.
  const incoming = className || '';

  // Map plain weight classes to Arabic font-family utilities. This preserves other classes.
  const weightMap: Record<string,string> = {
    'font-black': 'font-arabic-black',
    'font-extrabold': 'font-arabic-extrabold',
    'font-bold': 'font-arabic-bold',
    'font-semibold': 'font-arabic-semibold',
    'font-medium': 'font-arabic-medium',
    'font-light': 'font-arabic-light',
  };

  let mapped = incoming;
  Object.keys(weightMap).forEach(k => {
    const mappedClass = weightMap[k];
    // replace the weight token with the mapped font family token (but keep both if needed)
    const regex = new RegExp(`\\b${k}\\b`, 'g');
    if (regex.test(mapped)) {
      mapped = mapped.replace(regex, `${k} ${mappedClass}`);
    }
  });

  const baseArabic = 'font-arabic';
  const finalClass = `${baseArabic} leading-relaxed ${mapped}`.trim();

  return !riyal ? (
    <RNText className={finalClass} {...props} />
  ) : (
    <View className={`flex flex-row items-center gap-2 ${riyalClass}`}>
      <Riyal width={riyalSize || 20} height={riyalSize || 20} color={riyalColor || 'white'} />
      <RNText className={`leading-relaxed  ${className || ''}`} {...props} />
    </View>
  );
};

export default Text;