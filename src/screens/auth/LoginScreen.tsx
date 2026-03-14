import React, { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, Button, TextInput, PhoneInput } from '@/components';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { showErrorPopup } from '@/utils/errorPopup';
import { Lock, ArrowLeft } from 'lucide-react-native';

interface LoginScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { login, user } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    // Reset error message
    setErrorMessage(null);

    // Validation
    if (!phoneNumber.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone number');
      return;
    }

    if (!password.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      setErrorMessage(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(phoneNumber.trim(), password);
      
      if (result.success) {
        // Login successful - navigation will be handled by RootNavigator
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const msg = result.message || (isRTL ? 'فشل تسجيل الدخول' : 'Login failed');
        setErrorMessage(msg);
        showErrorPopup(msg, t('common.error'));
      }
    } catch (error: any) {
      const msg = error.message || (isRTL ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during login');
      setErrorMessage(msg);
      showErrorPopup(msg, t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        {onBack && (
          <Pressable 
            onPress={onBack}
            className={`mb-6 ${isRTL ? 'self-start' : 'self-start'}`}
          >
            <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <ArrowLeft 
                size={24} 
                color="#374151" 
                style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}}
              />
              <Text className={`text-body font-medium text-gray-700 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                {isRTL ? 'رجوع' : 'Back'}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Title */}
        <View className="mb-8">
          <Text className={`text-h1 font-bold text-gray-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'تسجيل الدخول' : 'Login'}
          </Text>
          <Text className={`text-body text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL 
              ? 'أدخل رقم هاتفك وكلمة المرور للدخول إلى حسابك'
              : 'Enter your phone number and password to access your account'
            }
          </Text>
        </View>

        {/* Error Message */}
        {errorMessage && (
          <View className="mb-4 p-3 bg-error-50 rounded-lg border border-error-200">
            <Text className={`text-body-sm text-error-700 ${isRTL ? 'text-right' : 'text-left'}`}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Phone Number Input */}
        <View className="mb-4">
          <Text className={`text-body-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'رقم الهاتف' : 'Phone Number'}
          </Text>
          <PhoneInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder={isRTL ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
            isRTL={isRTL}
          />
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <TextInput
            label={isRTL ? 'كلمة المرور' : 'Password'}
            type="password"
            value={password}
            onChangeText={setPassword}
            placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter your password'}
            isRTL={isRTL}
            leftIcon={<Lock size={20} color="#9CA3AF" />}
          />
        </View>

        {/* Forgot Password Link */}
        <Pressable className={`mb-6 ${isRTL ? 'self-start' : 'self-end'}`}>
          <Text className="text-body-sm text-primary-600 font-medium">
            {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </Text>
        </Pressable>

        {/* Login Button */}
        <Button
          title={isLoading ? (isRTL ? 'جاري تسجيل الدخول...' : 'Logging in...') : (isRTL ? 'تسجيل الدخول' : 'Login')}
          onPress={handleLogin}
          variant="primary"
          size="lg"
          disabled={isLoading || !phoneNumber.trim() || !password.trim()}
        />

        {/* Register Link */}
        <View className={`mt-6 flex-row items-center justify-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <Text className="text-body text-gray-600">
            {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}
          </Text>
          <Pressable 
            onPress={onBack}
            className={isRTL ? 'mr-2' : 'ml-2'}
          >
            <Text className="text-body font-semibold text-primary-600">
              {isRTL ? 'سجل الآن' : 'Register Now'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
