import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { LoadingScreen, SplashScreen, OnboardingScreen } from '../screens';
import { AccountStepScreen } from '@/screens/account/AccountStepScreen';
import { LoginScreen } from '@/screens/auth';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { PortfolioScreen } from '@/screens/portfolio/PortfolioScreen';
import { PortfolioDetailsScreen } from '@/screens/portfolio/PortfolioDetailsScreen';
import { RiskProfileScreen } from '@/screens/portfolio/RiskProfileScreen';
import { RebalancingScreen } from '@/screens/portfolio/RebalancingScreen';
import { ROICalculatorScreen } from '@/screens/calculator/ROICalculatorScreen';
import { AffiliateScreen } from '@/screens/affiliate/AffiliateScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { StocksScreen } from '@/screens/stocks';
import { ConversionsScreen } from '@/screens/conversions/ConversionsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { DepositScreen, WithdrawScreen } from '@/screens/wallet';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';
import { LanguageScreen } from '@/screens/profile/LanguageScreen';
import { NotificationsScreen } from '@/screens/profile/NotificationsScreen';
import { SecurityScreen } from '@/screens/profile/SecurityScreen';
import { ChangePhoneScreen } from '@/screens/profile/ChangePhoneScreen';
import { VerifyPhoneScreen } from '@/screens/profile/VerifyPhoneScreen';
import { Text } from '@/components';
import { accountSteps } from '@/screens/account/AccountFlowConfig';
import { useTranslation } from 'react-i18next';
import { Edit } from 'lucide-react-native';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import ChangeEmailScreen from '@/screens/profile/ChangeEmailScreen';
import DeleteAccountScreen from '@/screens/profile/DeleteAccountScreen';
import AccountsScreen from '@/screens/profile/AccountsScreen';
import { useAuth } from '@/context/AuthContext';
import { getAccountData, setAccountData } from '@/utils/storage';

export type NavigationState =
  | 'loading'
  | 'splash'
  | 'onboarding-1'
  | 'onboarding-2'
  | 'onboarding-3'
  | 'login'
  | 'account-1'
  | 'account-2'
  | 'account-3'
  | 'account-4'
  | 'account-5'
  | 'account-6'
  | 'account-7'
  | 'account-8'
  | 'account-9'
  | 'account-10'
  | 'account-11'
  | 'account-12'
  | 'account-13'
  | 'account-14'
  | 'account-15'
  | 'account-16'
  | 'account-17'
  | 'account-18'
  | 'account-19'
  | 'account-20'
  | 'account-21'
  | 'account-22'
  | 'account-23'
  | 'account-24'
  | 'account-25'
  | 'account-26'
  | 'account-27'
  | 'home'
  | 'portfolio'
  | 'portfolio-details'
  | 'risk-profile'
  | 'rebalancing'
  | 'diversification'
  | 'conversions'
  | 'account'
  | 'profile-settings'
  | 'profile-accounts'
  | 'profile-language'
  | 'profile-notifications'
  | 'profile-security'
  | 'profile-change-phone'
  | 'profile-verify-phone'
  | 'profile-change-email'
  | 'profile-edit'
  | 'profile-add-account'
  | 'profile-change-password'
  | 'profile-logout-confirm'
  | 'profile-delete-confirm'
  | 'deposit'
  | 'withdraw'
  | 'calculator'
  | 'affiliate'
  | 'chat'
  | 'stocks';

export const RootNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<NavigationState>('account-1');
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Handle logout - reset navigation when user logs out
  useEffect(() => {
    if (!authLoading && !isAuthenticated && hasInitialized) {
      // User has logged out - reset to account-1
      console.log('🚪 User logged out, resetting navigation');
      setCurrentScreen('account-1');
      setHasInitialized(false); // Allow re-initialization on next login
    }
  }, [isAuthenticated, authLoading, hasInitialized]);

  // Handle login - navigate to appropriate screen when user logs in
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && currentScreen === 'login') {
      // User just logged in - navigate based on completion status
      console.log('🔐 User logged in, navigating based on completion status');
      if (user.isPhoneVerified && user.isIdentityVerified && user.isBankLinked) {
        // All steps completed - go to home
        setCurrentScreen('home');
      } else if (user.isPhoneVerified && user.isIdentityVerified) {
        // Need bank linking
        setCurrentScreen('account-21');
      } else if (user.isPhoneVerified) {
        // Need identity verification
        setCurrentScreen('account-17');
      } else {
        // Need phone verification
        setCurrentScreen('account-12');
      }
    }
  }, [isAuthenticated, authLoading, user, currentScreen]);

  // Determine starting step based on user registration status and completion
  // Only run once on initial load, not on every user update
  useEffect(() => {
    const initializeScreen = async () => {
      if (authLoading || hasInitialized) return; // Wait for auth to load and only initialize once
      
      // Don't reset if already on a main screen (user is navigating) or on login screen
      const mainScreens: NavigationState[] = ['home', 'portfolio', 'conversions', 'account', 'login'];
      if (mainScreens.includes(currentScreen)) {
        console.log('🚫 Skipping initialization - already on main screen:', currentScreen);
        setIsInitializing(false);
        setHasInitialized(true);
        return;
      }
      
      try {
        if (isAuthenticated && user) {
          // User is registered - load their data and determine starting step
          const accountData = await getAccountData() || {};
          
          // Load user data into account data for pre-filling
          const userAccountData = {
            phoneNumber: user.phoneNumber,
            email: user.email,
            fullName: user.fullName,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            isIdentityVerified: user.isIdentityVerified,
            isBankLinked: user.isBankLinked,
            accountStatus: user.accountStatus,
            ...user.investmentProfile,
            ...user.fundingPreferences,
            ...accountData, // Keep any existing account data
          };
          
          await setAccountData(userAccountData);
          
          // Determine starting step based on completion status
          let startStep: NavigationState = 'account-1';
          
          if (user.isPhoneVerified && user.isIdentityVerified && user.isBankLinked) {
            // All steps completed - go to home
            startStep = 'home';
          } else if (user.isPhoneVerified && user.isIdentityVerified) {
            // Need bank linking - start at account-21
            startStep = 'account-21';
          } else if (user.isPhoneVerified) {
            // Need identity verification - start at account-17
            startStep = 'account-17';
          } else {
            // Need phone verification - start at account-12
            startStep = 'account-12';
          }
          
          console.log('📍 Initializing screen to:', startStep);
          setCurrentScreen(startStep);
        } else {
          // User not registered - start from beginning
          setCurrentScreen('account-1');
        }
      } catch (error) {
        if (__DEV__) console.warn('Error initializing screen', error);
        setCurrentScreen('account-1');
      } finally {
        setIsInitializing(false);
        setHasInitialized(true);
      }
    };
    
    initializeScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]); // Only depend on authLoading - initialization should only happen once when auth loads

  const handleLoadingComplete = () => {
    // Go directly to account creation flow
    if (!isInitializing) {
      setCurrentScreen('account-1');
    }
  };

  const handleSplashNext = () => {
    if (!isInitializing) {
      setCurrentScreen('account-1');
    }
  };

  const handleOnboardingNext = (current: NavigationState) => {
    const sequence: NavigationState[] = [
      'loading', 'splash',
      'onboarding-1', 'onboarding-2', 'onboarding-3',
      'account-1', 'account-2', 'account-3', 'account-4', 'account-5', 'account-6', 'account-7', 'account-8', 'account-9', 'account-10', 'account-11', 'account-12', 'account-13', 'account-14', 'account-15', 'account-16', 'account-17', 'account-18', 'account-19', 'account-20', 'account-21', 'account-22', 'account-23', 'account-24', 'account-25', 'account-26', 'account-27',
      'home'
    ];
    const idx = sequence.indexOf(current);
    const next = sequence[Math.min(idx + 1, sequence.length - 1)];
    setCurrentScreen(next);
  };

  const handleSkip = () => {
    setCurrentScreen('onboarding-1');
  };

  // Show loading while initializing
  if (isInitializing || authLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: Platform.OS === 'android' ? 25 : 0 }}>
      {currentScreen === 'loading' && (
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      )}

      {currentScreen === 'splash' && (
        <SplashScreen 
          onNext={handleSplashNext}
          onLogin={() => setCurrentScreen('login')}
        />
      )}

      {currentScreen === 'onboarding-1' && (
        <OnboardingScreen
          title={t('onboarding.title1')}
          subtitle={t('onboarding.subtitle1')}
          description={t('onboarding.description1')}
          dotIndex={0}
          totalDots={4}
          onNext={() => handleOnboardingNext('onboarding-1')}
          onSkip={handleSkip}
        />
      )}

      {currentScreen === 'onboarding-2' && (
        <OnboardingScreen
          title={t('onboarding.title2')}
          subtitle={t('onboarding.subtitle2')}
          description={t('onboarding.description2')}
          dotIndex={1}
          totalDots={4}
          onNext={() => handleOnboardingNext('onboarding-2')}
          onSkip={handleSkip}
        />
      )}

      {currentScreen === 'onboarding-3' && (
        <OnboardingScreen
          title={t('onboarding.title3')}
          subtitle={t('onboarding.subtitle3')}
          description={t('onboarding.description3')}
          dotIndex={2}
          totalDots={4}
          onNext={() => handleOnboardingNext('onboarding-3')}
          onSkip={handleSkip}
        />
      )}

      {/* Login Screen */}
      {currentScreen === 'login' && (
        <LoginScreen
          onBack={() => setCurrentScreen('splash')}
          onSuccess={() => {
            // After successful login, navigation will be handled automatically
            // by the useEffect that watches isAuthenticated state
            console.log('✅ Login successful, waiting for auth state update...');
          }}
        />
      )}

      {/* Account creation flow */}
      {currentScreen.startsWith('account-') && (
        <AccountStepScreen
          stepKey={currentScreen}
          onNext={async () => {
            // Check if this is the last step (account-27) or bank linking success (account-24)
            if (currentScreen === 'account-27' || currentScreen === 'account-24') {
              // Clear account data to prevent stale data from showing
              await setAccountData({});
              // Refresh user data before navigating to home to ensure fresh data
              if (refreshUser) {
                await refreshUser();
              }
              setCurrentScreen('home');
            } else if (currentScreen === 'account-19') {
              // After identity verification, check if bank is already linked
              if (user?.isBankLinked) {
                // Bank already linked, clear account data, refresh user data and go directly to home
                await setAccountData({});
                if (refreshUser) {
                  await refreshUser();
                }
                setCurrentScreen('home');
              } else {
                // Bank not linked, proceed to bank linking (account-21)
                setCurrentScreen('account-21');
              }
            } else {
              handleOnboardingNext(currentScreen);
            }
          }}
          onBack={() => {
            // Simple back logic: find previous in sequence
            const sequence: NavigationState[] = [
              'loading', 'splash', 'onboarding-1', 'onboarding-2', 'onboarding-3',
              'account-1', 'account-2', 'account-3', 'account-4', 'account-5', 'account-6', 'account-7', 'account-8', 'account-9', 'account-10', 'account-11', 'account-12', 'account-13', 'account-14', 'account-15', 'account-16', 'account-17', 'account-18', 'account-19', 'account-20', 'account-21', 'account-22', 'account-23', 'account-24', 'account-25', 'account-26', 'account-27', 'home'
            ];
            const idx = sequence.indexOf(currentScreen);
            const prev = sequence[Math.max(0, idx - 1)];
            setCurrentScreen(prev);
          }}
          onGoToStep={(key) => {
            // Accept only valid account-* keys or login
            const allowed: NavigationState[] = ['account-1', 'account-2', 'account-3', 'account-4', 'account-5', 'account-6', 'account-7', 'account-8', 'account-9', 'account-10', 'account-11', 'account-12', 'account-13'];
            // Include account-14..account-27 if navigating programmatically
            allowed.push('account-14', 'account-15', 'account-16', 'account-17', 'account-18', 'account-19', 'account-20', 'account-21', 'account-22', 'account-23', 'account-24', 'account-25', 'account-26', 'account-27');
            // Also allow login navigation
            if (key === 'login') {
              setCurrentScreen('login');
            } else if (allowed.includes(key as NavigationState)) {
              setCurrentScreen(key as NavigationState);
            }
          }}
          onSelectOption={(id) => {
            // Placeholder: store selection could be added to context/state
            console.log('Selected option', id, 'for', currentScreen);
          }}
        />
      )}
      {currentScreen === 'home' && (
        <HomeScreen onNavigate={(screen) => {
          console.log('🏠 HomeScreen navigation requested:', screen);
          if (screen && ['home', 'portfolio', 'conversions', 'account', 'calculator', 'chat', 'stocks'].includes(screen)) {
            console.log('✅ Navigating to:', screen);
            setCurrentScreen(screen);
          } else {
            console.warn('⚠️ Invalid navigation screen:', screen);
          }
        }} />
      )}
      {currentScreen === 'portfolio' && (
        <PortfolioScreen onNavigate={(screen) => {
          console.log('💼 PortfolioScreen navigation requested:', screen);
          if (screen && ['home', 'portfolio', 'portfolio-details', 'risk-profile', 'rebalancing', 'diversification', 'conversions', 'account'].includes(screen)) {
            console.log('✅ Navigating to:', screen);
            setCurrentScreen(screen);
          } else {
            console.warn('⚠️ Invalid navigation screen:', screen);
          }
        }} />
      )}
      {currentScreen === 'portfolio-details' && (
        <PortfolioDetailsScreen onBack={() => setCurrentScreen('portfolio')} />
      )}
      {currentScreen === 'risk-profile' && (
        <RiskProfileScreen 
          onBack={() => setCurrentScreen('portfolio')} 
          onNavigate={(screen) => {
            if (screen && ['risk-questionnaire', 'risk-profiles'].includes(screen)) {
              // Handle navigation to questionnaire or profiles list
              console.log('Navigate to:', screen);
            }
          }}
        />
      )}
      {currentScreen === 'rebalancing' && (
        <RebalancingScreen 
          onBack={() => setCurrentScreen('portfolio')} 
          onNavigate={(screen) => {
            if (screen) {
              setCurrentScreen(screen as NavigationState);
            }
          }}
        />
      )}
      {currentScreen === 'calculator' && (
        <ROICalculatorScreen onBack={() => setCurrentScreen('home')} />
      )}
      {currentScreen === 'affiliate' && (
        <AffiliateScreen onBack={() => setCurrentScreen('account')} />
      )}
      {currentScreen === 'chat' && (
        <ChatScreen onBack={() => setCurrentScreen('home')} />
      )}
      {currentScreen === 'stocks' && (
        <StocksScreen onBack={() => setCurrentScreen('home')} />
      )}
      {currentScreen === 'conversions' && (
        <ConversionsScreen onNavigate={(screen) => {
          console.log('🔄 ConversionsScreen navigation requested:', screen);
          if (screen && ['home', 'portfolio', 'conversions', 'account', 'deposit', 'withdraw'].includes(screen)) {
            console.log('✅ Navigating to:', screen);
            setCurrentScreen(screen);
          } else {
            console.warn('⚠️ Invalid navigation screen:', screen);
          }
        }} />
      )}
      {currentScreen === 'account' && (
        <ProfileScreen onNavigate={(screen) => {
          console.log('👤 ProfileScreen navigation requested:', screen);
          console.log('✅ Navigating to:', screen);
          setCurrentScreen(screen);
        }} />
      )}
      {currentScreen === 'profile-settings' && (
        <SettingsScreen onBack={() => setCurrentScreen('account')} />
      )}
      {currentScreen === 'profile-language' && (
        <LanguageScreen onBack={() => setCurrentScreen('account')} />
      )}
      {currentScreen === 'profile-notifications' && (
        <NotificationsScreen onBack={() => setCurrentScreen('account')} />
      )}
      {currentScreen === 'profile-security' && (
        <SecurityScreen
          onBack={() => setCurrentScreen('account')}
          onNavigate={setCurrentScreen}
        />
      )}
      {currentScreen === 'profile-change-phone' && (
        <ChangePhoneScreen
          onBack={() => setCurrentScreen('profile-security')}
          onNavigate={setCurrentScreen}
        />
      )}

      {currentScreen === 'profile-verify-phone' && (
        <VerifyPhoneScreen
          onBack={() => setCurrentScreen('profile-change-phone')}
          onSuccess={() => setCurrentScreen('profile-security')}
        />
      )}
      {currentScreen === 'profile-edit' && (
        <EditProfileScreen
          onBack={() => setCurrentScreen('account')}
          onNavigate={setCurrentScreen}
        />
      )}
      {currentScreen === "profile-change-email" && (
        <ChangeEmailScreen
          onBack={() => setCurrentScreen('account')}
          onNavigate={setCurrentScreen}
        />
      )}
      {
        currentScreen === 'profile-delete-confirm' && (
          <DeleteAccountScreen
          onBack={()=>setCurrentScreen('profile-settings')}
          onDelete={()=>setCurrentScreen('loading')}
          />)
      }
      {
        currentScreen === 'profile-accounts' && (
          <AccountsScreen onBack={() => setCurrentScreen('account')} />
        )
      }
      {currentScreen === 'deposit' && (
        <DepositScreen 
          onBack={() => setCurrentScreen('conversions')}
          onSuccess={() => setCurrentScreen('conversions')}
        />
      )}
      {currentScreen === 'withdraw' && (
        <WithdrawScreen 
          onBack={() => setCurrentScreen('conversions')}
          onSuccess={() => setCurrentScreen('conversions')}
        />
      )}
    </View>
  );
};
