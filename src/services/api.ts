import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import { getAuthToken, setAuthToken, removeAuthToken } from '@/utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await getAuthToken();
      const fullUrl = `${this.baseURL}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers as Record<string, string>),
      };

      console.log(`🌐 API Request: ${options.method || 'GET'} ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText} for ${endpoint}`);

      // Check if response has content before parsing
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      // If response is empty or not JSON, handle error
      if (!text || !contentType?.includes('application/json')) {
        if (__DEV__) console.warn('Invalid response format', response.status, text.substring(0, 100));
        return {
          success: false,
          message: response.status === 404 
            ? `API endpoint not found: ${endpoint}. Please ensure the backend server is running and the route is registered.` 
            : response.status >= 500
            ? 'Server error. Please try again later.'
            : `Invalid response from server (${response.status})`,
        };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        if (__DEV__) console.warn('JSON Parse Error', parseError);
        return {
          success: false,
          message: 'Invalid response format from server',
        };
      }

      if (!response.ok) {
        if (__DEV__) console.warn('API Error', response.status, data.message);
        return {
          success: false,
          message: data.message || `Request failed (${response.status})`,
          errors: data.errors,
        };
      }

      console.log(`✅ API Success: ${endpoint}`);
      return data;
    } catch (error: any) {
      if (__DEV__) console.warn('API Network Error', error);
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection.',
      };
    }
  }

  // Auth Methods
  async sendOTP(phoneNumber: string, email?: string, purpose: string = 'registration', type: 'phone' | 'email' | 'both' = 'phone') {
    return this.request(API_ENDPOINTS.SEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, email, purpose, type }),
    });
  }

  async verifyOTP(phoneNumber: string, code: string, email?: string, purpose: string = 'registration') {
    return this.request(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code, email, purpose }),
    });
  }

  async register(phoneNumber: string, password: string, code: string, email?: string, fullName?: string, investmentProfile?: any) {
    const response = await this.request<{ user: any; token: string }>(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password, code, email, fullName, investmentProfile }),
    });

    if (response.success && response.data?.token) {
      await setAuthToken(response.data.token);
    }

    return response;
  }

  async login(phoneNumber: string, password: string) {
    const response = await this.request<{ user: any; token: string }>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });

    if (response.success && response.data?.token) {
      await setAuthToken(response.data.token);
    }

    return response;
  }

  async verifyPhone(code: string) {
    return this.request(API_ENDPOINTS.VERIFY_PHONE, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getCurrentUser() {
    return this.request(API_ENDPOINTS.GET_ME);
  }

  async logout() {
    await removeAuthToken();
  }

  // User Methods
  async updateProfile(data: { fullName?: string; email?: string; investmentProfile?: any }) {
    return this.request(API_ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async verifyIdentity(nationalId: string, code: string) {
    return this.request(API_ENDPOINTS.VERIFY_IDENTITY, {
      method: 'POST',
      body: JSON.stringify({ nationalId, code }),
    });
  }

  async linkBank(iban: string, wahiqNumber?: string, code?: string) {
    return this.request(API_ENDPOINTS.LINK_BANK, {
      method: 'POST',
      body: JSON.stringify({ iban, wahiqNumber, ...(code && { code }) }),
    });
  }

  async updateFundingPreferences(data: { frequency?: string; times?: string; amount?: number }) {
    return this.request(API_ENDPOINTS.FUNDING_PREFERENCES, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Wallet Methods
  async getWalletBalance() {
    return this.request(API_ENDPOINTS.WALLET_BALANCE);
  }

  async deposit(amount: number, method: 'bank_transfer' | 'card' | 'iban', reference?: string, description?: string) {
    return this.request(API_ENDPOINTS.WALLET_DEPOSIT, {
      method: 'POST',
      body: JSON.stringify({ amount, method, reference, description }),
    });
  }

  async withdraw(amount: number, method: 'bank_transfer' | 'iban', description?: string) {
    return this.request(API_ENDPOINTS.WALLET_WITHDRAW, {
      method: 'POST',
      body: JSON.stringify({ amount, method, description }),
    });
  }

  async getTransactions(page: number = 1, limit: number = 20) {
    return this.request(`${API_ENDPOINTS.WALLET_TRANSACTIONS}?page=${page}&limit=${limit}`);
  }

  // Reconciliation Methods
  async reconcileAll() {
    return this.request(API_ENDPOINTS.RECONCILIATION_ALL);
  }

  async reconcileEscrow(masterEscrowId: string) {
    return this.request(`${API_ENDPOINTS.RECONCILIATION_ESCROW}/${masterEscrowId}`);
  }

  async reconcileWallet() {
    return this.request(API_ENDPOINTS.RECONCILIATION_WALLET);
  }

  async autoFixDiscrepancy(masterEscrowId: string, tolerance?: number) {
    return this.request(`${API_ENDPOINTS.RECONCILIATION_AUTO_FIX}/${masterEscrowId}`, {
      method: 'POST',
      body: JSON.stringify({ tolerance }),
    });
  }

  // Portfolio Methods
  async calculateRiskScore(answers: any) {
    return this.request(API_ENDPOINTS.PORTFOLIO_CALCULATE_RISK, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getRiskProfiles() {
    return this.request(API_ENDPOINTS.PORTFOLIO_PROFILES);
  }

  async getRiskProfile(profileName: string) {
    return this.request(`${API_ENDPOINTS.PORTFOLIO_PROFILE}/${profileName}`);
  }

  async getPortfolioComposition() {
    return this.request(API_ENDPOINTS.PORTFOLIO_COMPOSITION);
  }

  async getDiversificationAnalysis() {
    return this.request(API_ENDPOINTS.PORTFOLIO_DIVERSIFICATION);
  }

  async checkRebalancing(threshold?: number) {
    const url = threshold 
      ? `${API_ENDPOINTS.PORTFOLIO_REBALANCING}?threshold=${threshold}`
      : API_ENDPOINTS.PORTFOLIO_REBALANCING;
    return this.request(url);
  }

  async checkReassessment() {
    return this.request(API_ENDPOINTS.PORTFOLIO_REASSESSMENT);
  }

  async constructPortfolio(totalAmount: number, constraints?: any) {
    return this.request(API_ENDPOINTS.PORTFOLIO_CONSTRUCT, {
      method: 'POST',
      body: JSON.stringify({ totalAmount, constraints }),
    });
  }

  async optimizeAllocation(marketData?: any) {
    return this.request(API_ENDPOINTS.PORTFOLIO_OPTIMIZE, {
      method: 'POST',
      body: JSON.stringify({ marketData }),
    });
  }

  async checkDiversificationRules(rules?: any) {
    const url = rules
      ? `${API_ENDPOINTS.PORTFOLIO_DIVERSIFICATION_RULES}?rules=${encodeURIComponent(JSON.stringify(rules))}`
      : API_ENDPOINTS.PORTFOLIO_DIVERSIFICATION_RULES;
    return this.request(url);
  }

  async simulateRebalancing(options?: any) {
    return this.request(API_ENDPOINTS.PORTFOLIO_SIMULATE_REBALANCING, {
      method: 'POST',
      body: JSON.stringify({ options }),
    });
  }

  async processDynamicQuestionnaire(answers: any, weights?: any) {
    return this.request(API_ENDPOINTS.PORTFOLIO_DYNAMIC_QUESTIONNAIRE, {
      method: 'POST',
      body: JSON.stringify({ answers, weights }),
    });
  }

  // Calculator Methods
  async calculateLumpSumROI(principal: number, annualReturn?: number, years?: number, inflationRate?: number) {
    return this.request(API_ENDPOINTS.CALCULATOR_LUMP_SUM, {
      method: 'POST',
      body: JSON.stringify({ principal, annualReturn, years, inflationRate }),
    });
  }

  async calculateRecurringROI(monthlyAmount: number, annualReturn?: number, years?: number, inflationRate?: number) {
    return this.request(API_ENDPOINTS.CALCULATOR_RECURRING, {
      method: 'POST',
      body: JSON.stringify({ monthlyAmount, annualReturn, years, inflationRate }),
    });
  }

  async calculateComprehensiveROI(params: {
    investmentType: 'lump_sum' | 'recurring';
    principal?: number;
    monthlyAmount?: number;
    years: number;
    riskProfile?: string;
    includeMonteCarlo?: boolean;
    simulations?: number;
    marketAssumptions?: any;
  }) {
    return this.request(API_ENDPOINTS.CALCULATOR_COMPREHENSIVE, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async calculateTimeHorizons(params: {
    investmentType: 'lump_sum' | 'recurring';
    principal?: number;
    monthlyAmount?: number;
    riskProfile?: string;
  }) {
    return this.request(API_ENDPOINTS.CALCULATOR_TIME_HORIZONS, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async runMonteCarloSimulation(params: {
    investmentType: 'lump_sum' | 'recurring';
    principal?: number;
    monthlyAmount?: number;
    years: number;
    simulations?: number;
    riskProfile?: string;
  }) {
    return this.request(API_ENDPOINTS.CALCULATOR_MONTE_CARLO, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Affiliate Methods
  async getAffiliateStats() {
    return this.request(API_ENDPOINTS.AFFILIATE_STATS);
  }

  async getReferralHistory(filters?: { status?: string; startDate?: string; endDate?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.AFFILIATE_REFERRALS}?${queryParams.toString()}`
      : API_ENDPOINTS.AFFILIATE_REFERRALS;
    return this.request(url);
  }

  async getCommissionHistory(filters?: { status?: string; commissionType?: string; startDate?: string; endDate?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.commissionType) queryParams.append('commissionType', filters.commissionType);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.AFFILIATE_COMMISSIONS}?${queryParams.toString()}`
      : API_ENDPOINTS.AFFILIATE_COMMISSIONS;
    return this.request(url);
  }

  async initializeAffiliate() {
    return this.request(API_ENDPOINTS.AFFILIATE_INITIALIZE, {
      method: 'POST',
    });
  }

  // Chatbot Methods
  async sendChatMessage(message: string, sessionId?: string) {
    return this.request(API_ENDPOINTS.CHATBOT_MESSAGE, {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async getChatSessions() {
    return this.request(API_ENDPOINTS.CHATBOT_SESSIONS);
  }

  async getChatHistory(sessionId?: string, limit?: number) {
    const queryParams = new URLSearchParams();
    if (sessionId) queryParams.append('sessionId', sessionId);
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.CHATBOT_HISTORY}?${queryParams.toString()}`
      : API_ENDPOINTS.CHATBOT_HISTORY;
    return this.request(url);
  }

  async archiveChatSession(sessionId: string) {
    return this.request(`${API_ENDPOINTS.CHATBOT_ARCHIVE_SESSION}/${sessionId}/archive`, {
      method: 'POST',
    });
  }

  async searchFAQ(query?: string, category?: string) {
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('query', query);
    if (category) queryParams.append('category', category);
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.CHATBOT_FAQ_SEARCH}?${queryParams.toString()}`
      : API_ENDPOINTS.CHATBOT_FAQ_SEARCH;
    return this.request(url);
  }

  // Health check
  async healthCheck() {
    return this.request(API_ENDPOINTS.HEALTH);
  }

  // Market / Stocks
  async getHalalStocks(limit: number = 100) {
    const url = `${API_ENDPOINTS.MARKET_HALAL_STOCKS}?limit=${Math.min(limit, 500)}`;
    return this.request<{
      halalStocks: Array<{
        symbol: string;
        price: number | null;
        change?: number | null;
        changePercent?: number | null;
        isHalal: boolean;
        confidence?: number;
        timestamp?: string | null;
      }>;
      count: number;
      checked?: number;
      zoyaUnavailable?: boolean;
    }>(url);
  }
}

export const apiService = new ApiService();
