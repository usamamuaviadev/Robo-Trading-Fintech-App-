import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import i18n from '../i18n';

export const fonts = {
  arabic: {
    regular: 'NotoKufiArabic-Regular',
    bold: 'NotoKufiArabic-Bold',
    light: 'NotoKufiArabic-Light',
    medium: 'NotoKufiArabic-Medium',
    semibold: 'NotoKufiArabic-SemiBold',
    thin: 'NotoKufiArabic-Thin',
  },
};

let installed = false;

const applyDefaults = (Base: any, family?: string, className?: string) => {
  Base.defaultProps = Base.defaultProps || {};

  // Style: remove any previous fontFamily we injected, then add new
  const prev = Base.defaultProps.style;
  let cleaned = prev;
  if (Array.isArray(prev)) {
    cleaned = prev.filter((s) => !(s && (s as any).fontFamily));
  } else if (prev && (prev as any).fontFamily) {
    cleaned = undefined;
  }
  Base.defaultProps.style = family ? [cleaned, { fontFamily: family }] : cleaned || undefined;

  // NativeWind className: ensure font-arabic added/removed globally
  const prevClass: string = (Base.defaultProps as any).className || '';
  const withoutArabic = prevClass
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('font-arabic'))
    .join(' ');
  (Base.defaultProps as any).className = className ? `${withoutArabic} ${className}`.trim() : withoutArabic || undefined;
};

export const installArabicFontObserver = () => {
  if (installed) return;
  installed = true;

  const apply = () => {
    const isArabic = !!(i18n.language && i18n.language.startsWith('ar'));
    if (isArabic) {
      applyDefaults(RNText, fonts.arabic.regular, 'font-arabic');
      applyDefaults(RNTextInput, fonts.arabic.regular, 'font-arabic');
    } else {
      applyDefaults(RNText, undefined, undefined);
      applyDefaults(RNTextInput, undefined, undefined);
    }
  };

  apply();
  i18n.on('languageChanged', apply);
};