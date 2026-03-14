import MMKVStorage from 'react-native-mmkv-storage';

const storage = new MMKVStorage.Loader().initialize();

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const ACCOUNT_DATA_KEY = 'account_data';

// Auth Token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await storage.getStringAsync(AUTH_TOKEN_KEY);
    return token || null;
  } catch (error) {
    if (__DEV__) console.warn('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await storage.setStringAsync(AUTH_TOKEN_KEY, token);
  } catch (error) {
    if (__DEV__) console.warn('Error setting auth token:', error);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await storage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    if (__DEV__) console.warn('Error removing auth token:', error);
  }
};

// User Data
export const getUserData = async (): Promise<any | null> => {
  try {
    const data = await storage.getStringAsync(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    if (__DEV__) console.warn('Error getting user data:', error);
    return null;
  }
};

export const setUserData = async (data: any): Promise<void> => {
  try {
    await storage.setStringAsync(USER_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    if (__DEV__) console.warn('Error setting user data:', error);
  }
};

export const removeUserData = async (): Promise<void> => {
  try {
    await storage.removeItem(USER_DATA_KEY);
  } catch (error) {
    if (__DEV__) console.warn('Error removing user data:', error);
  }
};

// Account Creation Data (temporary storage during flow)
export const getAccountData = async (): Promise<any | null> => {
  try {
    const data = await storage.getStringAsync(ACCOUNT_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    if (__DEV__) console.warn('Error getting account data:', error);
    return null;
  }
};

export const setAccountData = async (data: any): Promise<void> => {
  try {
    const existing = await getAccountData() || {};
    await storage.setStringAsync(ACCOUNT_DATA_KEY, JSON.stringify({ ...existing, ...data }));
  } catch (error) {
    if (__DEV__) console.warn('Error setting account data:', error);
  }
};

export const clearAccountData = async (): Promise<void> => {
  try {
    await storage.removeItem(ACCOUNT_DATA_KEY);
  } catch (error) {
    if (__DEV__) console.warn('Error clearing account data:', error);
  }
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  try {
    // Remove all keys individually to ensure complete cleanup
    await removeAuthToken();
    await removeUserData();
    await clearAccountData();
    
    // Also try to clear any other potential keys
    try {
      await storage.removeItem(AUTH_TOKEN_KEY);
      await storage.removeItem(USER_DATA_KEY);
      await storage.removeItem(ACCOUNT_DATA_KEY);
    } catch (error) {
      // Ignore errors if keys don't exist
    }
    
    console.log('✅ All storage data cleared');
  } catch (error) {
    if (__DEV__) console.warn('Error clearing all data:', error);
    // Still try to remove individual keys even if bulk clear fails
    try {
      await removeAuthToken();
      await removeUserData();
      await clearAccountData();
    } catch (e) {
      if (__DEV__) console.warn('Error in fallback clear:', e);
    }
  }
};
