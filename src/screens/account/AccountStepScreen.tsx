import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, ScrollView, TouchableOpacity, TextInput as RNTextInput, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, TextInput, Checkbox, PhoneInput } from '@/components';
import { useTranslation } from 'react-i18next';
import { accountSteps, AccountStep } from './AccountFlowConfig';
import { ChevronRight, X as CloseIcon, Scale, ChevronLeft, Phone, Lock, Check } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import Graph from '@/assets/images/account/graph.svg';
import { AssetPerformanceChart } from '@/components';
import UpGraph from '@/assets/images/account/upgraph.svg';
import Stack from '@/assets/images/account/stack.svg';
import { GoogleIcon } from '@/assets/icons/GoogleIcon';
import SuccessIllustration from '@/assets/images/account/success.svg';
import DashboardIllustration from '@/assets/images/account/dashboard.svg';
import FinalSuccessIllustration from '@/assets/images/account/final.svg';
import Growth from '@/assets/icons/growth.svg';
import Pot from '@/assets/icons/pot.svg';
import { apiService } from '@/services/api';
import { setAccountData, getAccountData, getUserData } from '@/utils/storage';
import { useAuth } from '@/context/AuthContext';
interface AccountStepScreenProps {
  stepKey: string;
  onNext: () => void;
  onBack?: () => void;
  onClose?: () => void;
  onSelectOption?: (id: string) => void;
  selected?: string[];
  onGoToStep?: (key: string) => void;
}

const maskPhone = (raw: string) => {
  // Basic masking: keep country code and first 4 digits then mask middle leaving last 2
  // Assumes raw already without plus and may include country code digits.
  const cleaned = raw.replace(/[^0-9]/g,'');
  if (cleaned.length < 6) return '+' + cleaned;
  // Detect country code (assume first 3 digits for simplicity)
  const country = cleaned.slice(0,3);
  const firstBlock = cleaned.slice(3,7); // next 4 digits
  const lastTwo = cleaned.slice(-2);
  return `+${country} ${firstBlock} ****** ${lastTwo}`;
};

export const AccountStepScreen: React.FC<AccountStepScreenProps> = ({
  stepKey,
  onNext,
  onBack,
  onClose,
  onSelectOption,
  selected = [],
  onGoToStep,
}) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, refreshUser, register: registerUser } = useAuth();
  const isRTL = !!(i18n.language && i18n.language.startsWith('ar'));
  const step: AccountStep | undefined = accountSteps.find((s) => s.key === stepKey);
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const [allocations, setAllocations] = useState<Record<string, number>>(
    step?.assetAllocation?.reduce((acc, asset) => ({ ...acc, [asset.id]: asset.percentage }), {}) || {}
  );
  const [sheetMode, setSheetMode] = useState<'asset' | 'portfolio' | 'consent' | null>(null);
  
  // Input states for phone and password steps
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // User data for display
  const [displayUserData, setDisplayUserData] = useState<any>(null);
  // Identity (step 17)
  const [identityValue, setIdentityValue] = useState('');
  // Bank details (step 21)
  const [bankWahiqNumber, setBankWahiqNumber] = useState('');
  const [bankIbanNumber, setBankIbanNumber] = useState('');
  // Funding (step 25)
  const [fundingFrequency, setFundingFrequency] = useState('monthly');
  const [fundingTimes, setFundingTimes] = useState('once-per-month');
  const [fundingAmount, setFundingAmount] = useState('');
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showTimesDropdown, setShowTimesDropdown] = useState(false);
  // OTP state (step 14, 18, 22)
  const [otpCode, setOtpCode] = useState('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const otpInputRef = useRef<RNTextInput | null>(null);
  
  // API loading states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Load saved data from user or account data when component mounts or step changes
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // First try to get from authenticated user
        let savedData: any = {};
        if (isAuthenticated && user) {
          savedData = {
            phoneNumber: user.phoneNumber,
            email: user.email,
            fullName: user.fullName,
            ...user.investmentProfile,
            ...user.fundingPreferences,
          };
        }
        
        // Also load from account data (for in-progress flows)
        const accountData = await getAccountData() || {};
        savedData = { ...savedData, ...accountData };
        
        // Pre-fill form fields based on step
        if (stepKey === 'account-12' && savedData.phoneNumber) {
          setPhoneNumber(savedData.phoneNumber);
        }
        if (stepKey === 'account-13') {
          if (savedData.password) setPassword(savedData.password);
          if (savedData.fullName) setFullName(savedData.fullName);
          if (savedData.email) setEmail(savedData.email);
        }
        if (stepKey === 'account-24') {
          // Load user data for bank success screen
          const accountData = await getAccountData() || {};
          setDisplayUserData({
            fullName: savedData.fullName || user?.fullName || accountData.fullName,
            wahiqNumber: savedData.wahiqNumber || user?.wahiqNumber || accountData.wahiqNumber || bankWahiqNumber,
            iban: savedData.iban || user?.iban || accountData.iban || bankIbanNumber
          });
        }
        if (stepKey === 'account-17' && savedData.nationalId) {
          setIdentityValue(savedData.nationalId);
        }
        if (stepKey === 'account-21') {
          if (savedData.wahiqNumber) setBankWahiqNumber(savedData.wahiqNumber);
          if (savedData.iban) setBankIbanNumber(savedData.iban);
        }
        if (stepKey === 'account-25') {
          if (savedData.fundingFrequency) setFundingFrequency(savedData.fundingFrequency);
          if (savedData.fundingTimes) setFundingTimes(savedData.fundingTimes);
          if (savedData.fundingAmount) setFundingAmount(savedData.fundingAmount);
        }
        
        // Pre-fill selected options for multi-select steps
        if (step?.options && savedData[stepKey]) {
          const savedSelections = Array.isArray(savedData[stepKey]) 
            ? savedData[stepKey] 
            : [savedData[stepKey]].filter(Boolean);
          if (savedSelections.length > 0) {
            setLocalSelected(savedSelections);
          }
        }
        
        // Pre-fill allocations if available
        if (step?.assetAllocation && savedData.assetAllocation) {
          setAllocations(savedData.assetAllocation);
        }
      } catch (error) {
        if (__DEV__) console.warn('Error loading saved data:', error);
      }
    };
    
    loadSavedData();
  }, [stepKey, isAuthenticated, user, step]);

  // Reset OTP state when entering an OTP-type step
  useEffect(() => {
    if (step?.type === 'otp') {
      setOtpStatus('idle');
      setIsVerifyingOtp(false);
      setErrorMessage(null);
      
      // Auto-send OTP when entering OTP screen (only if we have phone number and no demo code yet)
      const loadAndSendOTP = async () => {
        // Check if we already have a demo code - if so, ensure it's filled
        if (demoOtpCode && !otpCode) {
          setOtpCode(demoOtpCode);
          console.log(`✅ Auto-filled demo OTP: ${demoOtpCode}`);
        } else if (!demoOtpCode) {
          // Only send new OTP if we don't have a demo code
          const accountData = await getAccountData() || {};
          const phone = phoneNumber || accountData.phoneNumber;
          if (phone && !isSendingOtp) {
            const purpose = step.key === 'account-14' ? 'registration' 
              : step.key === 'account-18' ? 'identity-verification'
              : step.key === 'account-22' ? 'bank-verification'
              : 'registration';
            // Small delay to ensure state is reset
            setTimeout(() => {
              handleSendOTP(phone, undefined, purpose, 'phone');
            }, 300);
          }
        }
      };
      loadAndSendOTP();
      // focus will be requested by the hidden input's autoFocus
    }
  }, [stepKey]);

  // This is now handled in the main loadSavedData useEffect above

  // Chart data for bottom sheet (simple mock growth path 2020-2025)
  // Slightly fewer abrupt jumps for nicer smoothing
  const chartPoints = [10, 10.4, 10.9, 11.3, 11.6, 12.4, 13.1, 13.6, 14.8, 15.2, 16.1, 16.9, 17.6, 19.2, 21];
  

  if (!step) return null;

  const totalProgressSteps = accountSteps.filter(s => s.showProgress).length;
  const progressIndex = accountSteps.filter(s => s.showProgress).findIndex(s => s.key === stepKey);
  const progressPercent = ((progressIndex + 1) / totalProgressSteps) * 100;

  const handleSelect = (id: string) => {
    if (step.multiSelect) {
      const newSelected = localSelected.includes(id)
        ? localSelected.filter(s => s !== id)
        : [...localSelected, id];
      setLocalSelected(newSelected);
      onSelectOption?.(id);
    } else {
      setLocalSelected([id]);
      onSelectOption?.(id);
      
      // Store selection in account data
      const storeSelection = async () => {
        const accountData = await getAccountData() || {};
        const stepKey = step.key.replace('account-', '');
        accountData[`step${stepKey}`] = id;
        await setAccountData(accountData);
      };
      storeSelection();
      
      // Auto-advance for single-select options
      if (step.type === 'options' || !step.type) {
        setTimeout(() => {
          onNext();
        }, 200);
      }
    }
  };

  // Handle sending OTP
  const handleSendOTP = async (phone: string, email?: string, purpose: string = 'registration', type: 'phone' | 'email' = 'phone') => {
    setIsSendingOtp(true);
    setErrorMessage(null);
    setDemoOtpCode(null);
    setDebugInfo(`📤 Sending OTP...\nPhone: ${phone}\nPurpose: ${purpose}\nType: ${type}`);
    
    try {
      const response = await apiService.sendOTP(phone, email, purpose, type);
      
      // Log full response for debugging
      console.log('📥 Full API Response:', JSON.stringify(response, null, 2));
      setDebugInfo(`📥 API Response:\n${JSON.stringify(response, null, 2)}`);
      
      if (response.success) {
        // In demo mode, show the OTP code prominently
        const responseData = response.data as any;
        console.log('📦 Response Data:', JSON.stringify(responseData, null, 2));
        
        // Check multiple possible locations for demo code
        const responseAny = response as any;
        const demoCode = responseData?.code || responseData?.sms?.code || responseAny?.code;
        const isDemo = responseData?.demo || responseData?.sms?.demo || responseAny?.demo;
        
        console.log('🔍 Checking for demo code:', { 
          'responseData.code': responseData?.code,
          'responseData.demo': responseData?.demo,
          'responseData.sms': responseData?.sms,
          'demoCode': demoCode,
          'isDemo': isDemo
        });
        
        // In demo mode, always use static code "12345" if no code in response
        const finalCode = (isDemo && demoCode) ? demoCode.toString().trim() : (isDemo ? '12345' : null);
        
        if (isDemo && finalCode) {
          // Store the phone number used for sending OTP so we use the same for verification
          await setAccountData({ phoneNumber: phone, lastOtpCode: finalCode });
          const debugMsg = `✅ Demo OTP: ${finalCode}\nPhone: ${phone}\nPurpose: ${purpose}\n\n💡 Using static code 12345 for demo mode`;
          console.log(debugMsg);
          setDebugInfo(debugMsg);
          setDemoOtpCode(finalCode);
          // Auto-fill OTP in demo mode for easier testing - user can just click verify
          setOtpCode(finalCode);
          console.log(`✅ Auto-filled OTP code: ${finalCode}`);
        } else if (!isDemo) {
          const noDemoMsg = `⚠️ No demo code found in response\nResponse: ${JSON.stringify(responseData, null, 2)}`;
          console.warn(noDemoMsg);
          setDebugInfo(noDemoMsg);
        }
        return true;
      } else {
        const errorMsg = `❌ Failed to send OTP:\n${response.message || 'Unknown error'}\nPhone: ${phone}`;
        setDebugInfo(errorMsg);
        setErrorMessage(response.message || 'Failed to send OTP');
        return false;
      }
    } catch (error: any) {
      const errorMsg = `❌ Send OTP Error:\n${error.message || 'Unknown error'}\nPhone: ${phone}`;
      if (__DEV__) console.warn(errorMsg, error);
      setDebugInfo(errorMsg);
      setErrorMessage(error.message || 'Failed to send OTP');
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOTP = async (phone: string, code: string, email?: string, purpose: string = 'registration') => {
    setIsVerifyingOtp(true);
    setOtpStatus('idle');
    setErrorMessage(null);
    
    try {
      // Ensure code is exactly 5 digits
      const cleanCode = code.replace(/[^0-9]/g, '').slice(0, 5);
      if (cleanCode.length !== 5) {
        setOtpStatus('error');
        setErrorMessage(isRTL ? 'يجب أن يكون رمز التحقق 5 أرقام' : 'OTP code must be 5 digits');
        return false;
      }
      
      const verifyDebugMsg = `🔍 Verifying OTP:\nPhone: ${phone}\nCode: ${cleanCode}\nPurpose: ${purpose}`;
      console.log(verifyDebugMsg);
      setDebugInfo(verifyDebugMsg);
      
      const response = await apiService.verifyOTP(phone, cleanCode, email, purpose);
      
      if (response.success) {
        const successMsg = `✅ OTP Verified Successfully!\nPhone: ${phone}\nCode: ${cleanCode}`;
        console.log(successMsg);
        setDebugInfo(successMsg);
        setOtpStatus('success');
        setErrorMessage(null); // Clear error immediately
        // Force clear error message state
        setTimeout(() => {
          setErrorMessage(null);
        }, 100);
        return true;
      } else {
        const errorMsg = `❌ Verification Failed:\n${response.message || 'Invalid or expired OTP code'}\nPhone: ${phone}\nCode: ${cleanCode}`;
        if (__DEV__) console.warn(errorMsg);
        setDebugInfo(errorMsg);
        setOtpStatus('error');
        setErrorMessage(response.message || (isRTL ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired OTP code'));
        return false;
      }
    } catch (error: any) {
      const errorDebugMsg = `❌ Verification Error:\n${error.message || 'Unknown error'}\nPhone: ${phone}\nCode: ${code}`;
      if (__DEV__) console.warn(errorDebugMsg, error);
      setDebugInfo(errorDebugMsg);
      setOtpStatus('error');
      const errorMsg = error.message || (isRTL ? 'فشل التحقق من رمز التحقق' : 'Failed to verify OTP');
      setErrorMessage(errorMsg);
      return false;
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const accountData = await getAccountData() || {};
      const phone = phoneNumber || accountData.phoneNumber;
      const code = otpCode || accountData.lastOtpCode; // Use stored OTP code if available
      const userPassword = password || accountData.password;
      const userFullName = fullName || accountData.fullName;
      const userEmail = email || accountData.email;
      
      console.log('📝 Registration data:', {
        hasPhone: !!phone,
        hasPassword: !!userPassword,
        hasCode: !!code,
        hasFullName: !!userFullName,
        hasEmail: !!userEmail,
        phone: phone,
        codeLength: code?.length
      });
      
      if (!phone || !userPassword || !code || !userFullName) {
        const missing = [];
        if (!phone) missing.push('phone');
        if (!userPassword) missing.push('password');
        if (!code) missing.push('code');
        if (!userFullName) missing.push('fullName');
        if (__DEV__) console.warn('Missing required information:', missing);
        setErrorMessage(isRTL ? `معلومات مفقودة: ${missing.join(', ')}` : `Missing required information: ${missing.join(', ')}`);
        return false;
      }
      
      // Build investment profile from account data
      const investmentProfile = {
        primaryGoal: accountData.step4 || accountData.primaryGoal,
        withdrawalTimeline: accountData.step5 || accountData.withdrawalTimeline,
        monthlyDepositDescription: accountData.step6 || accountData.monthlyDepositDescription,
        investmentObjective: accountData.step7 || accountData.investmentObjective,
        riskTolerance: accountData.step8 || accountData.riskTolerance,
        portfolioType: accountData.step9 || accountData.portfolioType,
        assetAllocation: allocations || accountData.assetAllocation || {},
      };
      
      console.log('📝 Calling register API via AuthContext...');
      const result = await registerUser(phone, userPassword, code, userEmail || undefined, userFullName, investmentProfile);
      console.log('📝 Register result:', result);
      
      if (result.success) {
        console.log('✅ Registration successful!');
        
        // Save user data to account data for future reference
        const accountDataToSave = {
          ...accountData,
          phoneNumber: phone,
          fullName: userFullName,
          email: userEmail,
          password: userPassword,
        };
        await setAccountData(accountDataToSave);
        return true;
      } else {
        if (__DEV__) console.warn('Registration failed:', result.message);
        // Show detailed error message
        const errorMsg = result.message || 'Registration failed';
        setErrorMessage(errorMsg);
        setDebugInfo(`❌ Registration Failed:\n${errorMsg}`);
        return false;
      }
    } catch (error: any) {
      if (__DEV__) console.warn('Registration error:', error);
      const errorMsg = error.message || 'Registration failed';
      setErrorMessage(errorMsg);
      setDebugInfo(`❌ Registration Error:\n${errorMsg}\n\n${error.stack || ''}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: step.type === 'funding-success-modal' ? '#3B2C7A' : 'white' }}>
      {/* Header with back/close buttons */}
      <View className="flex-row  items-center justify-between px-4 pt-3 pb-2">
        {
          !isRTL && onBack && step.type !== 'funding-success-modal' && (
            <TouchableOpacity onPress={onBack} className="">
              <ChevronLeft size={24} color="#000" width={40} className='' />
            </TouchableOpacity>
          )
        }
        <View  className="p-2">
          {step.type === 'funding-success-modal' && (
            <TouchableOpacity onPress={onNext} className="p-2">
              <CloseIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        {isRTL && onBack && step.type !== 'funding-success-modal' && (
          <TouchableOpacity onPress={onBack} className="p-2">
            <ChevronRight size={24} color="#000" style={{ transform: [{ scaleX: isRTL ? 1 : -1 }] }} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      {step.showProgress && (
        <View className="h-1 bg-neutral-200 mx-4 mb-4">
          <View className="h-full bg-primary-500" style={{ width: `${progressPercent}%` }} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: step.type === 'funding-success-modal' ? 20 : 30, paddingBottom: 40 }}>
        {/* TYPE: Funding Success Modal (account-27) - Full screen modal with illustration */}
        {step.type === 'funding-success-modal' && (
          <View className="flex-1 items-center justify-center" style={{ minHeight: 600 }}>
            {/* 3D Checkmark Illustration */}
            <View className="mb-8 mt-20 items-center">
              <FinalSuccessIllustration width={361} height={242} />
            </View>

            {/* Title */}
            <Text className="text-h2 font-bold text-white text-center mb-4 px-4">
              {t(step.titleKey)}
            </Text>

            {/* Subtitle */}
            {step.subtitleKey && (
              <Text className="text-body text-white text-center px-6 opacity-90 leading-6">
                {t(step.subtitleKey)}
              </Text>
            )}
          </View>
        )}

        {/* TYPE: features (account-3) illustration first */}
        {step.type === 'features' && (
          <View className="w-full h-52 bg-neutral-100 mb-6 rounded-md" />
        )}

        {/* TYPE: Bank failure (account-23) - gray box at top */}
        {step.type === 'bank-failure' && (
          <View className="w-full h-64 bg-neutral-200 mb-6 mt-2 rounded-md" />
        )}

        {/* TYPE: Bank success (account-24) - party icon at top */}
        {step.type === 'bank-success' && (
          <Text className="text-center text-[100px] font-bold mt-10 mb-6">🎉</Text>
        )}

        {step.type === 'success' && <Text className="text-center text-success-600 text-[100px] font-bold mt-[200px]">🎉</Text>}
        {step.key === 'account-16' && <View className='flex justify-center items-center' ><DashboardIllustration width={350} height={200} className="self-center mt-10 mb-6" /></View>}
        {/* Title */}
        {step.type !== 'funding-success-modal' && (
          <Text className={`text-h2 font-bold mt-6 mb-2 ${step.centeredHeading ? "text-center" : isRTL ? step.showProgress  ? "text-center" : 'text-right' : 'text-left'} `}>
            {t(step.titleKey)}
          </Text>
        )}

        {/* Subtitle */}
        {step.subtitleKey && step.subtitleKey.trim() && step.type !== 'funding-success-modal' && (
          <Text className={`text-body text-gray-900  mb-6 ${step.centeredHeading ? "text-center" : isRTL ? step.showProgress || step.centeredHeading ? "text-center" : 'text-right' : 'text-left'}`}>
            {t(step.subtitleKey)}
          </Text>
        )}

        {/* Description */}
        {step.descriptionKey && (
          <Text className={`text-body text-gray-600 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t(step.descriptionKey)}
          </Text>
        )}

        {/* TYPE: options (render when type omitted or explicitly options) */}
        {step.options && (step.type === 'options' || !step.type) && (
          <View className="gap-3 mb-8">
            {step.options.map((opt,index) => {
              const active = localSelected.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => handleSelect(opt.id)}
                  className={`border rounded-lg px-4 py-4 flex-row justify-center items-center gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'
                    } ${active ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white'}`}
                >
                  {step.key === 'account-1' && <View className='w-10 h-10  '>
                    {index===0?<Growth width={40} height={40} />:<Pot width={40} height={40} />}
                  </View>}
                  <View className="flex-1">
                    <Text className={`text-body font-semibold ${isRTL ? step.showProgress ? "text-center" : 'text-right' : 'text-left'} ${active ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                      {t(opt.labelKey)}
                    </Text>
                    {opt.description && (
                      <Text className={`text-body-sm text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t(opt.description)}
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={20} color={active ? '#A795FE' : '#D4D4D4'} style={{ transform: [{ scaleX: isRTL ? -1 : 1 }], marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }} />
                </Pressable>
              );
            })}
            
            {/* Login Link for account-1 */}
            {step.key === 'account-1' && (
              <View className={`mt-4 flex-row items-center justify-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <Text className="text-body text-gray-600">
                  {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
                </Text>
                <Pressable 
                  onPress={() => onGoToStep?.('login')}
                  className={isRTL ? 'mr-2' : 'ml-2'}
                >
                  <Text className="text-body font-semibold text-primary-600">
                    {isRTL ? 'تسجيل الدخول' : 'Login'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* TYPE: timeline */}
        {step.type === 'timeline' && step.timelineSteps && (
          <View className={`mb-8 self-stretch relative`}>
            {/* Vertical line behind indicators */}
            <View className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-2 bottom-2 w-px bg-neutral-300`} />
            {step.timelineSteps.map((ts,index) => {
              const isActive = ts.index === (step.key==='account-11'?2:1); // highlight first only per design
              const activeSteps = step.key==='account-20'?3:step.key==='account-11'?2:1;
  
              return (
                <View key={ts.index} className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} gap-2 mb-8`}>
                  {/* Text block */}
                  <View className={`${isRTL ? 'ml-4' : 'mr-4'} flex-1`}>
                    <Text className={`text-body font-semibold ${isRTL ? 'text-right' : 'text-left'} ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>{t(ts.titleKey)}</Text>
                    {ts.descriptionKey && (
                      <Text className={`text-body-sm mt-1 ${isRTL ? 'text-right' : 'text-left'} ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>{t(ts.descriptionKey)}</Text>
                    )}
                  </View>
                  {/* Indicator */}
                  <View className={`items-center justify-start ${isRTL ? 'ml-2' : 'mr-2'}`}>
                    <View className={`w-8 h-8 rounded-full border-3 items-center justify-center ${index < activeSteps ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-white'}`}>
                      <Text className={`text-body-sm font-semibold ${index < activeSteps ? 'text-primary-600' : 'text-neutral-400'}`}>{ts.index}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TYPE: features */}
        {step.type === 'features' && step.features && (
          <View className="mt-2 mb-8 gap-6">
            {step.features.map(f => (
              <View key={f.titleKey} className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                <View className={`${isRTL ? 'ml-4' : 'mr-4'} mt-1`}>
                  {/* Simple icon placeholder using emoji until proper SVG/icon mapping */}
                  <Text className="text-h4">{f.icon === 'zap' ? '⚡' : '🔒'}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-body font-semibold mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t(f.titleKey)}</Text>
                  <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t(f.descriptionKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TYPE: recommendation */}
        {step.type === 'recommendation' && step.portfolioOptions && (
          <View className="mb-8">
            {step.portfolioOptions.map(portfolio => (
              <View key={portfolio.id} className="bg-primary-50 rounded-2xl p-5 mb-4">
                <Pressable onPress={() => onGoToStep?.('account-10')} className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3`}>
                  <Text className="text-primary-600 underline">{t('createAccount.step9.edit', 'تعديل')}</Text>
                </Pressable>
                {/* Header with icon centered */}
                <View className={` flex ${isRTL ? 'items-end' : 'items-start'} mb-4`}>
                  <View className="w-12 h-12 bg-white rounded-full items-center justify-center mb-2">
                    <Scale size={24} color={'#6D6D6D'} />
                  </View>
                  <Text className="text-body-sm text-gray-500 mb-1">
                    {isRTL ? 'مختارة متوسطة' : 'Medium Risk'}
                  </Text>
                  <Text className="text-h3 font-bold text-center mb-0">
                    {t(portfolio.titleKey)}
                  </Text>
                  <Text className="text-body-sm text-gray-600 text-center">
                    {t(portfolio.descriptionKey)}
                  </Text>
                </View>

                {/* Stats rows - RTL right-aligned */}
                <View className="space-y-2 mb-4">
                  <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-1`}>
                    <Text className={`text-body-sm font-semibold text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                      {t('createAccount.step9.portfolio.stats.expectedReturnValue')}
                    </Text>
                    <Text className={`text-body-sm text-gray-700 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('createAccount.step9.portfolio.stats.expectedReturn')}
                    </Text>
                  </View>
                  <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-1`}>
                    <Text className={`text-body-sm font-semibold text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                      {t('createAccount.step9.portfolio.stats.belowAverageValue')}
                    </Text>
                    <Text className={`text-body-sm text-gray-700 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('createAccount.step9.portfolio.stats.belowAverage')}
                    </Text>
                  </View>
                  <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-1`}>
                    <Text className={`text-body-sm font-semibold text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                      {t('createAccount.step9.portfolio.stats.aboveAverageValue')}
                    </Text>
                    <Text className={`text-body-sm text-gray-700 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('createAccount.step9.portfolio.stats.aboveAverage')}
                    </Text>
                  </View>
                </View>

                {/* Assets badges in rows */}
                <View className="mb-4">
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse justify-between' : 'flex-row justify-start'} flex-wrap gap-2 mb-2`}>
                    <Pressable onPress={() => setSheetMode('asset')} className={` rounded-lg w-[45%] px-3 py-2 flex-row gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                      <View className='w-[60px] h-[60px] flex justify-center items-center bg-success-400 rounded-lg'>
                        <Graph width={30} height={30} />
                      </View>
                      <View className={`flex ${isRTL ? 'items-end' : 'items-start'}`}>
                      <Text className={`text-body-lg font-semibold text-gray-700 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                        {t('createAccount.step9.portfolio.assets.bonds')}
                      </Text>
                      <Text className="text-body-sm font-semibold text-gray-500">
                        {t('createAccount.step9.portfolio.assets.bondsPercent')}
                      </Text>
                      </View>
                    </Pressable>
                    <View className={` rounded-lg w-[45%] px-3 py-2 flex-row gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                      <View className='w-[60px] h-[60px] flex justify-center items-center bg-secondary-500 rounded-lg'>
                      <UpGraph width={30} height={30} />
                      </View>
                      <View className={`flex ${isRTL ? 'items-end' : 'items-start'}`}>
                      <Text className={`text-body-lg font-semibold text-gray-700 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                        {t('createAccount.step9.portfolio.assets.stocks')}
                      </Text>
                      <Text className="text-body-sm font-semibold text-gray-500">
                        {t('createAccount.step9.portfolio.assets.stocksPercent')}
                      </Text>
                      </View>
                    </View>
                
                  </View>
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse justify-between' : 'flex-row justify-start'} flex-wrap gap-2`}>
                    <View className={` rounded-lg w-[45%] px-3 py-2 flex-row gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                      <View className='w-[60px] h-[60px] flex justify-center items-center bg-yellow-500 rounded-lg'>
                      <Stack width={30} height={30} />
                      </View>
                      <View className={`flex ${isRTL ? 'items-end' : 'items-start'}`}>
                      <Text className={`text-body-lg font-semibold text-gray-700 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                        {t('createAccount.step9.portfolio.assets.gold')}
                      </Text>
                      <Text className="text-body-sm font-semibold text-gray-500">
                        {t('createAccount.step9.portfolio.assets.goldPercent')}
                      </Text>
                      </View>
                    </View>
                    <View className={` rounded-lg w-[45%] px-3 py-2 flex-row gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                      <View className='w-[60px] h-[60px] flex justify-center items-center bg-yellow-500 rounded-lg'>
                      <Stack width={30} height={30} />
                      </View>
                      <View className={`flex ${isRTL ? 'items-end' : 'items-start'}`}>
                      <Text className={`text-body-lg font-semibold text-gray-700 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                        {t('createAccount.step9.portfolio.assets.gold')}
                      </Text>
                      <Text className="text-body-sm font-semibold text-gray-500">
                        {t('createAccount.step9.portfolio.assets.goldPercent')}
                      </Text>
                      </View>
                    </View>
                   
                    
                  </View>
                </View>

                {/* Learn more link centered opens detail sheet */}
                <Pressable className="items-center py-2" onPress={() => setSheetMode('portfolio')}>
                  <Text className="text-body-MD text-primary-600 font-medium underline">
                    {t('createAccount.step9.learnMore')}
                  </Text>
                </Pressable>
              </View>
            ))}

            {/* Wait message centered */}
            <Text className="text-body-sm text-gray-600 text-center mb-2">
              {t('createAccount.step9.waitMessage')}
            </Text>
          </View>
        )}

        {/* TYPE: allocation */}
        {step.type === 'allocation' && step.assetAllocation && (
          <View className="mb-8">
            {/* Header row: Reset (left) and remaining (right) with divider */}
            {(() => {
              const total = Object.values(allocations).reduce((a, b) => a + b, 0);
              const remaining = Math.max(0, 100 - total);
              const remainingText = isRTL ? `الباقي ٪${remaining}` : `Remaining ${remaining}%`;
              return (
                <View className={`flex-row items-center justify-between pb-3 mb-3 border-b border-neutral-200`}>
                  <Pressable onPress={() => setAllocations(step.assetAllocation!.reduce((acc, a) => ({ ...acc, [a.id]: a.percentage }), {}))}>
                    <Text className="text-primary-600 underline">{t('createAccount.step10.reset')}</Text>
                  </Pressable>
                  <Text className="text-body text-gray-600">{remainingText}</Text>
                </View>
              );
            })()}

            {/* Asset rows (minus on left, plus on right; for stocks swap to match screenshot) */}
            {step.assetAllocation.map((asset) => {
              const currentValue = allocations[asset.id] ?? asset.percentage;
              const leftIsPlus = asset.id === 'stocks';
              return (
                <View key={asset.id} className="py-2 border-b border-neutral-200">
                  <View className={`flex-row items-center justify-between`}>
                    {/* Left button */}
                    <Pressable
                      className="w-[40px] h-[40px] rounded-xl bg-secondary-500 items-center justify-center"
                      onPress={() => {
                        const delta = leftIsPlus ? +5 : -5;
                        const newVal = Math.min(100, Math.max(0, currentValue + delta));
                        setAllocations({ ...allocations, [asset.id]: newVal });
                      }}
                    >
                      <Text className="text-body-lg text-white   font-bold">{leftIsPlus ? '+' : '-'}</Text>
                    </Pressable>

                    {/* Center stack */}
                    <View className="items-center">
                      <View className={`w-12 h-12 rounded-lg items-center justify-center mb-2 ${asset.id === 'bonds' ? 'bg-success-400' : asset.id === 'stocks' ? 'bg-secondary-500' : 'bg-yellow-500'}`}>
                        {asset.id === 'bonds' && <Graph width={28} height={28} />}
                        {asset.id === 'stocks' && <UpGraph width={28} height={28} />}
                        {asset.id === 'gold' && <Stack width={28} height={28} />}
                      </View>
                      <Text className="text-body text-gray-700">{t(asset.labelKey)}</Text>
                      <Text className="text-h4 font-bold text-gray-900">٪{currentValue}</Text>
                    </View>

                    {/* Right button */}
                    <Pressable
                      className="w-[40px] h-[40px] rounded-xl bg-secondary-500 items-center justify-center"
                      onPress={() => {
                        const delta = leftIsPlus ? -5 : +5;
                        const newVal = Math.min(100, Math.max(0, currentValue + delta));
                        setAllocations({ ...allocations, [asset.id]: newVal });
                      }}
                    >
                      <Text className="text-body-lg text-white font-bold">{leftIsPlus ? '-' : '+'}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TYPE: phone input (step 12) */}
        {step.key === 'account-12' && (
          <View className="mb-8 mt-4">
            <PhoneInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              isRTL={isRTL}
              placeholder={t('createAccount.step12.placeholder')}
            />

            {/* Continue Button - Opens consent bottom sheet */}
            <View className="mt-6">
              {errorMessage && (
                <Text className={`text-body-sm text-error-500 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {errorMessage}
                </Text>
              )}
              <Button
                title={isSendingOtp ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : t('createAccount.step12.continue', isRTL ? 'متابعة' : 'Continue')}
                onPress={async () => {
                  // Send OTP first
                  const sent = await handleSendOTP(phoneNumber, undefined, 'registration', 'phone');
                  if (sent) {
                    setSheetMode('consent');
                  }
                }}
                variant="primary"
                size="lg"
                disabled={!phoneNumber || phoneNumber.length < 9 || isSendingOtp}
              />
            </View>
          </View>
        )}

        {/* TYPE: Name, Email, Password, and Register (step 13) */}
        {step.key === 'account-13' && (
          <View className="mb-8 mt-4">
            {/* Full Name Field */}
            <View className="mb-4">
              <Text className={`text-body font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step13.nameLabel', isRTL ? 'الاسم الكامل' : 'Full Name')}
              </Text>
              <TextInput
                placeholder={t('createAccount.step13.namePlaceholder', isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name')}
                value={fullName}
                onChangeText={setFullName}
                isRTL={isRTL}
              />
            </View>

            {/* Email Field */}
            <View className="mb-4">
              <Text className={`text-body font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step13.emailLabel', isRTL ? 'البريد الإلكتروني' : 'Email (Optional)')}
              </Text>
              <TextInput
                placeholder={t('createAccount.step13.emailPlaceholder', isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email')}
                value={email}
                onChangeText={setEmail}
                isRTL={isRTL}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View className="mb-2">
              <Text className={`text-body font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step13.passwordLabel')}
              </Text>
              <TextInput
                type="password"
                placeholder={t('createAccount.step13.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                isRTL={isRTL}
                leftIcon={!isRTL ? <Lock size={20} color="#9CA3AF" /> : undefined}
                rightIcon={isRTL ? <Lock size={20} color="#9CA3AF" /> : undefined}
              />
            </View>

            {/* Password Requirements */}
            {(() => {
              const { evaluatePassword, allRulesPass } = require('@/utils/passwordValidation');
              const state = evaluatePassword(password);
              const row = (passed: boolean, textKey: string) => (
                <View key={textKey} className={`flex-row items-start mb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <View className={`${isRTL ? 'ml-2' : 'mr-2'} mt-[2px]`}>
                    {passed ? <Check size={16} color="#059669" /> : <CloseIcon size={16} color="#6B7280" />}
                  </View>
                  <Text className={`text-body-sm flex-1 ${passed ? 'text-success-600' : 'text-gray-600'} ${isRTL ? 'text-right' : 'text-left'}`}>{t(textKey)}</Text>
                </View>
              );
              return (
                <View className="mb-6">
                  {row(state.length, 'createAccount.step13.requirement1')}
                  {row(state.number, 'createAccount.step13.requirement2')}
                  {row(state.special, 'createAccount.step13.requirement3')}
                  {row(state.upperLower, 'createAccount.step13.requirement4')}
                  
                  {/* Register Button */}
                  {errorMessage && (
                    <Text className={`text-body-sm text-error-500 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {errorMessage}
                    </Text>
                  )}
                  <Button
                    title={isLoading ? (isRTL ? 'جاري التسجيل...' : 'Registering...') : t('createAccount.step13.register', isRTL ? 'تسجيل' : 'Register')}
                    onPress={async () => {
                      if (!allRulesPass(state)) {
                        setErrorMessage(isRTL ? 'يرجى إكمال جميع متطلبات كلمة المرور' : 'Please complete all password requirements');
                        return;
                      }
                      if (!fullName.trim()) {
                        setErrorMessage(isRTL ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name');
                        return;
                      }
                      
                      // Call register API
                      const registered = await handleRegister();
                      if (registered) {
                        // Navigate to bank linking (account-21)
                        onGoToStep?.('account-21');
                      }
                    }}
                    variant="primary"
                    size="lg"
                    disabled={!allRulesPass(state) || !fullName.trim() || isLoading}
                  />
                </View>
              );
            })()}
          </View>
        )}

        {/* TYPE: Identity input (step 17) */}
        {step.type === 'identity' && (
          <View className="mb-8 mt-4">
            <View className="mb-4">
              <Text className={`text-body font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step17.inputLabel')}
              </Text>
              <TextInput
                placeholder={t('createAccount.step17.inputPlaceholder')}
                value={identityValue}
                onChangeText={(txt:string) => setIdentityValue(txt.replace(/[^0-9A-Za-z]/g, ''))}
                isRTL={isRTL}
                keyboardType="default"
                maxLength={20}
              />
            </View>
            <Button
              title={t('createAccount.step17.continue')}
              onPress={async () => {
                // Send OTP for identity verification
                const accountData = await getAccountData() || {};
                const phone = accountData.phoneNumber || phoneNumber;
                const sent = await handleSendOTP(phone, undefined, 'identity-verification', 'phone');
                if (sent) {
                  await setAccountData({ nationalId: identityValue });
                  onNext();
                }
              }}
              variant="primary"
              size="lg"
              disabled={!identityValue || identityValue.length < 6 || isSendingOtp}
            />
          </View>
        )}

        {/* TYPE: Bank linking (step 21) */}
        {step.type === 'bank' && (
          <View className="mb-8 mt-4">
            <View className="mb-4">
              <Text className={`text-body font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step21.wahiqLabel')}
              </Text>
              <TextInput
                placeholder={t('createAccount.step21.wahiqPlaceholder')}
                value={bankWahiqNumber}
                onChangeText={(txt:string) => setBankWahiqNumber(txt.replace(/[^0-9]/g, ''))}
                isRTL={isRTL}
                keyboardType="numeric"
              />
            </View>
            <View className="mb-4">
              <Text className={`text-body font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step21.ibanLabel')}
              </Text>
              <TextInput
                placeholder={t('createAccount.step21.ibanPlaceholder')}
                value={bankIbanNumber}
                onChangeText={(txt:string) => setBankIbanNumber(txt.toUpperCase())}
                isRTL={isRTL}
                keyboardType="default"
              />
            </View>
            <Text className={`text-body-sm text-gray-600 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('createAccount.step21.note')}
            </Text>
            {errorMessage && (
              <Text className={`text-body-sm text-error-500 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {errorMessage}
              </Text>
            )}
            <Button
              title={isLoading ? (isRTL ? 'جاري الربط...' : 'Linking...') : t('createAccount.step21.continue')}
              onPress={async () => {
                setIsLoading(true);
                setErrorMessage(null);
                
                try {
                  // Link bank with static OTP code for demo mode (phone already verified during registration)
                  // Use static code "12345" for demo mode - NO OTP API CALL NEEDED
                  console.log('🔗 Linking bank account with static OTP code 12345 (no send-otp API call)');
                  const response = await apiService.linkBank(bankIbanNumber, bankWahiqNumber, '12345');
                  
                  if (response.success) {
                    // Save bank data
                    await setAccountData({ wahiqNumber: bankWahiqNumber, iban: bankIbanNumber });
                    // Refresh user data to get updated bank status
                    await refreshUser();
                    // Set display data for success screen
                    setDisplayUserData({
                      fullName: user?.fullName || fullName,
                      wahiqNumber: bankWahiqNumber,
                      iban: bankIbanNumber
                    });
                    // Navigate directly to bank success (skip OTP step)
                    onGoToStep?.('account-24');
                  } else {
                    setErrorMessage(response.message || (isRTL ? 'فشل ربط الحساب البنكي' : 'Failed to link bank account'));
                  }
                } catch (error: any) {
                  if (__DEV__) console.warn('Bank linking error:', error);
                  setErrorMessage(error.message || (isRTL ? 'فشل ربط الحساب البنكي' : 'Failed to link bank account'));
                } finally {
                  setIsLoading(false);
                }
              }}
              variant="primary"
              size="lg"
              disabled={!bankWahiqNumber || !bankIbanNumber || bankIbanNumber.length < 22 || isLoading}
            />
          </View>
        )}

        {/* TYPE: OTP verification (step 14, 18, and 22) */}
        {step.type === 'otp' && (
          <View className="mb-8 mt-4">
            {/* Debug Info Display - Always visible for debugging */}
            {debugInfo && (
              <View className="mb-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                <Text className={`text-xs font-semibold text-blue-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? 'معلومات التصحيح:' : 'Debug Info:'}
                </Text>
                <Text className={`text-xs font-mono text-blue-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {debugInfo}
                </Text>
              </View>
            )}
            
            {/* Demo OTP Code Display - Enhanced */}
            {demoOtpCode && (
              <View className="mb-6 p-5 bg-primary-50 rounded-2xl border-2 border-primary-400" style={{ shadowColor: '#6D28D9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-3`}>
                  <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                    <View className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text className={`text-body font-bold text-primary-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'وضع التجربة - رمز التحقق' : 'Demo Mode - OTP Code'}
                    </Text>
                  </View>
                </View>
                
                {/* Large OTP Display */}
                <View className="bg-white rounded-xl p-4 mb-3 border border-primary-200">
                  <Text className="text-h1 font-black text-primary-900 text-center tracking-widest">
                    {demoOtpCode}
                  </Text>
                </View>
                
                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      // Ensure OTP is filled (in case it was cleared)
                      setOtpCode(demoOtpCode);
                      otpInputRef.current?.blur();
                    }}
                    className="flex-1 bg-primary-600 rounded-lg py-3 px-4 active:bg-primary-700"
                  >
                    <Text className="text-body font-semibold text-white text-center">
                      {isRTL ? 'استخدم هذا الرمز' : 'Use This Code'}
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={() => {
                      // Just show the code again in alert for easy viewing
                      Alert.alert(
                        isRTL ? 'رمز التحقق' : 'OTP Code',
                        `${isRTL ? 'رمز التحقق هو:' : 'Your OTP code is:'}\n\n${demoOtpCode}`,
                        [{ text: isRTL ? 'حسناً' : 'OK' }]
                      );
                    }}
                    className="flex-1 bg-white border-2 border-primary-300 rounded-lg py-3 px-4 active:bg-primary-50"
                  >
                    <Text className="text-body font-semibold text-primary-700 text-center">
                      {isRTL ? 'عرض الرمز' : 'Show Code'}
                    </Text>
                  </Pressable>
                </View>
                
                <Text className={`text-body-xs text-primary-600 mt-3 text-center`}>
                  {isRTL 
                    ? '⚠️ وضع التجربة: لم يتم إرسال الرمز فعلياً عبر SMS أو البريد الإلكتروني' 
                    : '⚠️ Demo Mode: Code was not actually sent via SMS or Email'}
                </Text>
              </View>
            )}
            
            {/* Error Message - Only show if OTP status is error, not success */}
            {errorMessage && otpStatus === 'error' && (
              <View className="mb-4 p-3 bg-error-50 rounded-lg border border-error-200">
                <Text className={`text-body-sm text-error-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {errorMessage}
                </Text>
              </View>
            )}
            
            {/* Success Message */}
            {otpStatus === 'success' && !errorMessage && (
              <View className="mb-4 p-3 bg-success-50 rounded-lg border border-success-200">
                <Text className={`text-body-sm text-success-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? '✓ تم التحقق بنجاح' : '✓ OTP verified successfully!'}
                </Text>
              </View>
            )}
            
           
            
            {/* Hidden capturing input - must be rendered and focusable */}
            <RNTextInput
              ref={otpInputRef}
              value={otpCode}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9]/g, '').slice(0,5);
                setOtpCode(sanitized);
                setOtpStatus('idle');
              }}
              keyboardType="number-pad"
              autoFocus
              caretHidden
              style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                opacity: 0.01,
                color: 'transparent'
              }}
            />
            
            {/* Boxes - always left-to-right fill order */}
            <Pressable onPress={() => otpInputRef.current?.focus()} className="flex-row justify-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => {
                const digit = otpCode[i] ?? '';
                const isActive = i === otpCode.length && otpCode.length < 5; // next position to fill
                const isFilled = digit !== '';
                let borderColor = 'border-neutral-300';
                let textColor = 'text-gray-900';
                if (otpStatus === 'success') {
                  borderColor = 'border-success-600';
                  textColor = 'text-success-600';
                } else if (otpStatus === 'error') {
                  borderColor = 'border-error-500';
                  textColor = 'text-error-600';
                } else if (isActive) {
                  borderColor = 'border-primary-600';
                }
                return (
                  <View
                    key={i}
                    className={`w-14 h-14 rounded-md border ${borderColor} bg-white mx-1 items-center justify-center`}
                  >
                    <Text className={`text-h4 font-semibold ${textColor}`}>{digit}</Text>
                  </View>
                );
              })}
            </Pressable>
            {/* Messages */}
            {(() => { 
              const otpPrefix = step.key === 'account-18' ? 'createAccount.step18' : (step.key === 'account-22' ? 'createAccount.step22' : 'createAccount.step14'); 
              return (
                otpStatus === 'error' && (
                  <Text className={`text-body-sm mb-2 ${isRTL ? 'text-right' : 'text-left'} text-error-600`}>{t(`${otpPrefix}.error`)}</Text>
                )
              ); 
            })()}
            <View className={`flex-row mb-6 ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-center`}>
              {(() => { 
                const otpPrefix = step.key === 'account-18' ? 'createAccount.step18' : (step.key === 'account-22' ? 'createAccount.step22' : 'createAccount.step14'); 
                return (
                  <>
                  <Text className={`text-body-sm ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600`}>{t(`${otpPrefix}.notReceived`)}</Text>
                  <Pressable 
                    onPress={async () => { 
                      setOtpCode(''); 
                      setOtpStatus('idle');
                      setErrorMessage(null);
                      setDemoOtpCode(null);
                      
                      // Resend OTP
                      const accountData = await getAccountData() || {};
                      const phone = phoneNumber || accountData.phoneNumber;
                      const purpose = step.key === 'account-14' ? 'registration' 
                        : step.key === 'account-18' ? 'identity-verification'
                        : step.key === 'account-22' ? 'bank-verification'
                        : 'registration';
                      
                      await handleSendOTP(phone, undefined, purpose, 'phone');
                      otpInputRef.current?.focus();
                    }}
                    disabled={isSendingOtp}
                  >
                    <Text className={`text-body-sm text-primary-600 underline ${isSendingOtp ? 'opacity-50' : ''}`}>
                      {isSendingOtp ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : t(`${otpPrefix}.resend`)}
                    </Text>
                  </Pressable>
                  </>
                ); 
              })()}
            </View>
            {/* Verify button inline */}
            <Pressable
              disabled={otpCode.length !== 5 || isVerifyingOtp}
              onPress={async () => {
                if (otpCode.length !== 5) return;
                
                const accountData = await getAccountData() || {};
                // Use the exact same phone number that was used to send the OTP
                const phone = accountData.phoneNumber || phoneNumber || accountData.phoneNumber;
                const purpose = step.key === 'account-14' ? 'registration' 
                  : step.key === 'account-18' ? 'identity-verification'
                  : step.key === 'account-22' ? 'bank-verification'
                  : 'registration';
                
                // Update debug info with exact values being sent
                const verifyDebugMsg = `🔍 Verifying OTP:\nPhone: ${phone}\nCode: ${otpCode}\nPurpose: ${purpose}\n\nMake sure phone matches the one used to send OTP!`;
                setDebugInfo(verifyDebugMsg);
                
                // For identity verification (account-18), use the verify-identity endpoint
                let verified = false;
                if (step.key === 'account-18' && purpose === 'identity-verification') {
                  const accountData = await getAccountData() || {};
                  const nationalId = accountData.nationalId || identityValue;
                  if (nationalId) {
                    try {
                      const response = await apiService.verifyIdentity(nationalId, otpCode);
                      verified = response.success;
                      if (verified) {
                        // Refresh user data to get updated isIdentityVerified flag
                        await refreshUser();
                      } else {
                        // Set error message from API response
                        setErrorMessage(response.message || (isRTL ? 'فشل التحقق من الهوية' : 'Identity verification failed'));
                        setOtpStatus('error');
                        if (__DEV__) console.warn('Identity verification failed:', response.message);
                      }
                    } catch (error: any) {
                      verified = false;
                      setErrorMessage(error.message || (isRTL ? 'فشل التحقق من الهوية' : 'Identity verification failed'));
                      setOtpStatus('error');
                      if (__DEV__) console.warn('Identity verification error:', error);
                    }
                  } else {
                    setErrorMessage(isRTL ? 'يرجى إدخال رقم الهوية أولاً' : 'Please enter your national ID first');
                    return;
                  }
                } else {
                  verified = await handleVerifyOTP(phone, otpCode, undefined, purpose);
                }
                
                if (verified) {
                  // Clear any error messages immediately on success
                  setErrorMessage(null);
                  setOtpStatus('success');
                  
                  console.log('✅ OTP verified, proceeding to next step...');
                  
                  // For registration step (account-14), go to account-13 (Name/Email/Password/Register)
                  if (step.key === 'account-14') {
                    console.log('✅ OTP verified, proceeding to registration form...');
                    // Navigate to account-13 (Name/Email/Password/Register screen)
                    onGoToStep?.('account-13');
                  } else {
                    // OTP verified successfully, proceed to next step
                    console.log('✅ OTP verified for non-registration step, calling onNext()...');
                    // Small delay to ensure state is updated
                    setTimeout(() => {
                      onNext();
                    }, 300);
                  }
                } else {
                  // Verification failed - error message should already be set
                  if (!errorMessage) {
                    setErrorMessage(isRTL ? 'رمز التحقق غير صحيح' : 'Invalid OTP code');
                  }
                  setOtpStatus('error');
                  if (__DEV__) console.warn('OTP verification failed');
                }
              }}
              className={`w-full rounded-xl py-4 items-center justify-center ${otpCode.length === 5 && !isVerifyingOtp ? 'bg-primary-500' : 'bg-neutral-200'}`}
            >
              {isVerifyingOtp ? (
                <ActivityIndicator color="#6B46C1" />
              ) : (
                (() => { 
                  const otpPrefix = step.key === 'account-18' ? 'createAccount.step18' : (step.key === 'account-22' ? 'createAccount.step22' : 'createAccount.step14'); 
                  return (
                    <Text className={`text-body font-semibold ${otpCode.length === 5 ? 'text-white' : 'text-gray-500'}`}>{t(`${otpPrefix}.verify`)}</Text>
                  ); 
                })()
              )}
            </Pressable>
          </View>
        )}

        {/* TYPE: Success final screen (step 16) - Complete setup with features */}
        {step.key === 'account-16' && step.features && (
          <View className="mt-4 mb-8 gap-6">
            {step.features.map((f, index) => (
              <View key={f.titleKey} className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                <View className={`${isRTL ? 'ml-4' : 'mr-4'} mt-1`}>
                  {/* Icon with background */}
                  <View className="w-10 h-10 rounded-lg  items-center justify-center">
                    <Text className="text-h5">{f.icon === 'zap' ? '⚡' : '🔒'}</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className={`text-body font-semibold mb-1 text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{t(f.titleKey)}</Text>
                  <Text className={`text-body-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t(f.descriptionKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TYPE: Bank success (account-24) - Bank information section */}
        {step.type === 'bank-success' && (
          <View className="mt-1 mb-8">
            {/* Section header */}
            <Text className={`text-h4 font-bold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('createAccount.step24.sectionTitle')}
            </Text>
            
            {/* Info rows */}
            <View className="space-y-4 border border-neutral-200 rounded-lg p-4 bg-white">
              {/* Full Name */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3 border-b border-neutral-200`}>
                <Text className={`text-body text-gray-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t('createAccount.step24.fullName')}
                </Text>
                <Text className={`text-body font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {displayUserData?.fullName || user?.fullName || '-'}
                </Text>
              </View>
              
              {/* Wahiq Number */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3 border-b border-neutral-200`}>
                <Text className={`text-body text-gray-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t('createAccount.step24.wahiqNumber')}
                </Text>
                <Text className={`text-body font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {displayUserData?.wahiqNumber || bankWahiqNumber || user?.wahiqNumber || '-'}
                </Text>
              </View>
              
              {/* IBAN */}
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3`}>
                <Text className={`text-body text-gray-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                  IBAN
                </Text>
                <Text className={`text-body font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {displayUserData?.iban || bankIbanNumber || user?.iban || '-'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TYPE: Funding transfer form (account-25) */}
        {step.type === 'funding' && (
          <View className="mt-6 mb-8">
            {/* From Bank Card */}
            <View className="mb-4">
              <Text className={`text-body text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step25.from')}
              </Text>
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center bg-purple-50 rounded-xl p-4`}>
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center flex-1`}>
                  <View className="w-10 h-10 bg-primary-500 rounded-full items-center justify-center">
                    <Text className="text-white text-sm font-bold">نقر</Text>
                  </View>
                  <Text className={`text-body font-medium text-gray-900 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                    {t('createAccount.step25.fromBank')}
                  </Text>
                </View>
                <Text className="text-h4 font-bold text-gray-900">$1000.00</Text>
              </View>
            </View>

            {/* To Portfolio Card */}
            <View className="mb-6">
              <Text className={`text-body text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step25.to')}
              </Text>
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center bg-neutral-50 rounded-xl p-4`}>
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center flex-1`}>
                  <View className="w-10 h-10 bg-neutral-200 rounded-lg items-center justify-center">
                    <Text className="text-xs font-bold">Logo</Text>
                  </View>
                  <Text className={`text-body font-medium text-gray-900 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                    {t('createAccount.step25.toPortfolio')}
                  </Text>
                </View>
                <Text className="text-h4 font-bold text-gray-900">$0.00</Text>
              </View>
            </View>

            {/* Frequency Dropdown */}
            <View className="mb-4">
              <Pressable 
                onPress={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3 border-b border-neutral-200`}
              >
                <Text className={`text-body text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t(`createAccount.step25.frequency.${fundingFrequency}`)}
                </Text>
                <Text className={`text-body font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('createAccount.step25.frequencyLabel')}
                </Text>
              </Pressable>
            </View>

            {/* Times per period Dropdown */}
            <View className="mb-6">
              <Pressable 
                onPress={() => setShowTimesDropdown(!showTimesDropdown)}
                className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-3 border-b border-neutral-200`}
              >
                <Text className={`text-body text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t(`createAccount.step25.times.${fundingTimes}`)}
                </Text>
                <Text className={`text-body font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('createAccount.step25.timesLabel')}
                </Text>
              </Pressable>
            </View>

            {/* Amount Input */}
            <View className="mb-6">
              <Text className={`text-body font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step25.amountLabel')}
              </Text>
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center border border-neutral-300 rounded-lg px-4 py-3`}>
                <Text className="text-body font-medium text-gray-500">ريال</Text>
                <RNTextInput
                  value={fundingAmount}
                  onChangeText={setFundingAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  className={`flex-1 text-body ${isRTL ? 'text-right mr-3' : 'text-left ml-3'}`}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                />
              </View>
            </View>

            {/* Next Button */}
            <Button
              title={t('createAccount.step25.next')}
              onPress={onNext}
              variant="primary"
              size="lg"
            />
          </View>
        )}

        {/* TYPE: Funding review (account-26) */}
        {step.type === 'funding-review' && (
          <View className="mt-6 mb-8">
            {/* From */}
            <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-4 border-b border-neutral-200`}>
              <Text className={`text-body text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('createAccount.step25.fromBank')}
              </Text>
              <Text className={`text-body font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step26.fromLabel')}
              </Text>
            </View>

            {/* To */}
            <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-4 border-b border-neutral-200`}>
              <Text className={`text-body text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('createAccount.step25.toPortfolio')}
              </Text>
              <Text className={`text-body font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step26.toLabel')}
              </Text>
            </View>

            {/* Frequency */}
            <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-4 border-b border-neutral-200`}>
              <Text className={`text-body text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                {t(`createAccount.step25.frequency.${fundingFrequency}`)}
              </Text>
              <Text className={`text-body font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step25.frequencyLabel')}
              </Text>
            </View>

            {/* Times */}
            <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-4 border-b border-neutral-200`}>
              <Text className={`text-body text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                {t(`createAccount.step25.times.${fundingTimes}`)}
              </Text>
              <Text className={`text-body font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step25.timesLabel')}
              </Text>
            </View>

            {/* Amount */}
            <View className={`flex-row ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center py-4`}>
              <Text className={`text-body text-gray-900 ${isRTL ? 'text-left' : 'text-right'}`}>
                ريال {fundingAmount || '120000'}
              </Text>
              <Text className={`text-body font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('createAccount.step26.amountLabel')}
              </Text>
            </View>

            {/* Next Button */}
            <View className="mt-6">
              <Button
                title={t('createAccount.step26.next')}
                onPress={onNext}
                variant="primary"
                size="lg"
              />
            </View>
          </View>
        )}

       
      </ScrollView>

      {/* Consent Bottom Sheet for phone step */}
      {step.key === 'account-12' && (
        <BottomSheet visible={sheetMode === 'consent'} onClose={() => setSheetMode(null)} height={520}>
          <View className="flex-1 px-4">
            {/* Handle bar indicator */}
            <View className="w-12 h-1 bg-neutral-300 rounded-full self-center mb-4" />
            
            <Text className="text-h4 font-bold text-center mb-4" style={{ writingDirection: isRTL ? 'rtl' : 'ltr' }}>
              {t('createAccount.step12.consentSheet.title')}
            </Text>
            
            <ScrollView className="flex-1 mb-4">
              <Text className={`text-body text-gray-700 leading-7 mb-4 ${isRTL ? 'text-right' : 'text-left'}`} style={{ writingDirection: isRTL ? 'rtl' : 'ltr' }}>
                {t('createAccount.step12.consentSheet.description')}
              </Text>
              
              <Text className={`text-body text-gray-700 leading-7 ${isRTL ? 'text-right' : 'text-left'}`} style={{ writingDirection: isRTL ? 'rtl' : 'ltr' }}>
                {t('createAccount.step12.consentSheet.details')}
              </Text>
            </ScrollView>
            
            <View className="pb-4">
              <Button
                title={t('createAccount.step12.consentSheet.agree')}
                onPress={async () => {
                  setSheetMode(null);
                  // Store phone number in account data
                  await setAccountData({ phoneNumber });
                  onNext();
                }}
                variant="primary"
                size="lg"
              />
              <View className="mt-3">
                <Button
                  title={t('createAccount.step12.consentSheet.cancel')}
                  onPress={() => setSheetMode(null)}
                  variant="outline"
                  size="lg"
                />
              </View>
            </View>
          </View>
        </BottomSheet>
      )}

      {/* Bottom Sheet: asset detail or learn-more portfolio overview */}
      {step.type === 'recommendation' && (
        <BottomSheet visible={sheetMode !== null} onClose={() => setSheetMode(null)} height={sheetMode==="portfolio"?830:700}>
          {sheetMode === 'asset' && (
            <View className="flex-1">
              <View className="items-center mb-4">
                <View className="w-14 h-14 rounded-xl bg-success-400 items-center justify-center mb-3">
                  <Graph width={36} height={36} />
                </View>
                <Text className="text-h4 font-bold mb-3">{t('createAccount.step9.sheet.title')}</Text>
                <Text className="text-body-sm text-gray-700 leading-6 mb-4 text-center" style={{ writingDirection: isRTL ? 'rtl':'ltr' }}>
                  {t('createAccount.step9.sheet.description')}
                </Text>
                <Text className="text-body font-semibold text-gray-900 mb-4 text-center" style={{ writingDirection: isRTL ? 'rtl':'ltr' }}>
                  {t('createAccount.step9.sheet.question')}
                </Text>
              </View>
              <View className="px-3 pt-4 pb-6 mb-6">
                <AssetPerformanceChart
                  data={chartPoints}
                  labels={[
                    t('createAccount.step9.sheet.year2020'),
                    t('createAccount.step9.sheet.year2022'),
                    t('createAccount.step9.sheet.year2023'),
                    t('createAccount.step9.sheet.year2024'),
                    t('createAccount.step9.sheet.year2025'),
                  ]}
                  isRTL={isRTL}
                />
              </View>
              <Button title={t('createAccount.step9.sheet.confirm')} variant="primary" size="lg" onPress={() => setSheetMode(null)} />
            </View>
          )}
          {sheetMode === 'portfolio' && (
            <View className="flex-1">
              <View className="items-center mb-4">
                <View className="w-14 h-14 rounded-xl bg-secondary-100 items-center justify-center mb-3">
                  <Scale size={32} color="#444" />
                </View>
                <Text className="text-h4 font-bold mb-3">{t('createAccount.step9.portfolioSheet.title')}</Text>
                <Text className="text-body-sm text-gray-700 leading-6 mb-4 text-center" style={{ writingDirection: isRTL ? 'rtl':'ltr' }}>
                  {t('createAccount.step9.portfolioSheet.description')}
                </Text>
                <Text className="text-body px-20 font-semibold text-gray-900 mb-4 text-center" style={{ writingDirection: isRTL ? 'rtl':'ltr' }}>
                  {t('createAccount.step9.portfolioSheet.question')}
                </Text>
              </View>
              <View className="px-3 flex-1">
                <View className={`flex-col bg-red-500`}>
                  <View className="items-center flex-1">
                    <Text className="text-body-sm text-gray-500 mb-1">{t('createAccount.step9.portfolioSheet.expectedReturnLabel')}</Text>
                    <Text className="text-body font-bold text-gray-900">{t('createAccount.step9.portfolioSheet.expectedReturnValue')}</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-body-sm text-gray-500 mb-1">{t('createAccount.step9.portfolioSheet.expectedValueLabel')}</Text>
                    <Text className="text-body font-bold text-gray-900">{t('createAccount.step9.portfolioSheet.expectedValue')}</Text>
                  </View>
                </View>
                <AssetPerformanceChart
                  data={chartPoints}
                  labels={[
                    t('createAccount.step9.sheet.year2020'),
                    t('createAccount.step9.sheet.year2022'),
                    t('createAccount.step9.sheet.year2023'),
                    t('createAccount.step9.sheet.year2024'),
                    t('createAccount.step9.sheet.year2025'),
                  ]}
                  isRTL={isRTL}
                />
                <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between mt-4 mb-6`}>
                  <View className="flex-1 items-center">
                    <Text className="text-body-sm text-gray-600 mb-1">{t('createAccount.step9.portfolioSheet.averageAnnualLabel')}</Text>
                    <Text className="text-body-sm font-bold text-success-600">{t('createAccount.step9.portfolioSheet.averageAnnualValue')}</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-body-sm text-gray-600 mb-1">{t('createAccount.step9.portfolioSheet.historicalBestLabel')}</Text>
                    <Text className="text-body-sm font-bold text-success-600">{t('createAccount.step9.portfolioSheet.historicalBestValue')}</Text>
                  </View>
                </View>
                <Text className={`text-body font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('createAccount.step9.portfolioSheet.fundsHeading')}</Text>
                <View className="mb-4 border-b border-neutral-200 pb-4">
                  <Text className={`text-body font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('createAccount.step9.portfolioSheet.fund1Name')}</Text>
                  <Text className={`text-body-xs text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('createAccount.step9.portfolioSheet.fund1Allocation')}</Text>
                </View>
                <View className="mb-6 border-b border-neutral-200 pb-4">
                  <Text className={`text-body font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('createAccount.step9.portfolioSheet.fund2Name')}</Text>
                  <Text className={`text-body-xs text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('createAccount.step9.portfolioSheet.fund2Allocation')}</Text>
                </View>
              </View>
            </View>
          )}
        </BottomSheet>
      )}

      {/* Bottom buttons */}
      <View className="px-4 pb-6 pt-3  border-neutral-100">
        {step.type === 'recommendation' ? (
          <Button
            title={t('createAccount.step9.register')}
            onPress={onNext}
            variant="primary"
            size="lg"
          />
        ) : step.type === 'allocation' ? (
          <Button
            title={t('createAccount.step10.save')}
            onPress={onNext}
            variant="primary"
            size="lg"
          />
        ) : step.type === 'success' ? (
          <Button
            title={t(step.key === 'account-19' ? 'createAccount.step19.continue' : 'createAccount.step15.continue')}
            onPress={onNext}
            variant="primary"
            size="lg"
          />
        ) : step.type === 'success-final' ? (
          <Button
            title={t('createAccount.step16.next')}
            onPress={onNext}
            variant="primary"
            size="lg"
          />
        ) : step.type === 'bank-failure' ? (
          <Button
            title={t('createAccount.step23.retry')}
            onPress={onNext}
            variant="primary"
            size="lg"
          />
        ) : step.type === 'bank-success' ? (
          <Button
            title={t('createAccount.step24.continue', isRTL ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard')}
            onPress={onNext}
            variant="primary"
            size="lg"
          />
        ) : step.type === 'funding-success-modal' ? (
          <View className="px-4">
            <Pressable
              onPress={onNext}
              className="w-full rounded-lg py-4 items-center justify-center"
              style={{ backgroundColor: 'rgba(145, 122, 238, 0.84)' }}
            >
              <Text className="text-body font-semibold text-white">
                {t('createAccount.step27.continue')}
              </Text>
            </Pressable>
          </View>
        ) : step.type === 'phone' || step.type === 'password' || step.type === 'otp' || step.type === 'identity' || step.type === 'bank' || step.type === 'funding' || step.type === 'funding-review' || step.type === 'options' ? (
          // Phone, password, otp, identity, bank, funding, funding-review, and options steps have inline buttons or auto-advance
          null
        ) : (
          <Button
            title={t('next')}
            onPress={onNext}
            variant="primary"
            size="lg"
          />
        )}
        
      </View>
    </View>
  );
};
