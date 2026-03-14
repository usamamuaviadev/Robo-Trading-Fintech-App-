const axios = require('axios');
const KnowledgeBase = require('../models/KnowledgeBase');

/**
 * Gemini Service
 * Handles AI chatbot orchestration with compliance filters and context-aware processing
 * Uses direct REST API calls to Gemini
 */

// Gemini API configuration
// gemini-1.5-flash, gemini-1.5-pro → v1 API; others → v1beta
const apiKey = process.env.GEMINI_API_KEY;
const rawModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const modelName = rawModel === 'gemini-pro' ? 'gemini-1.5-flash' : rawModel;
const GEMINI_BASE_V1 = 'https://generativelanguage.googleapis.com/v1';
const GEMINI_BASE_V1BETA = 'https://generativelanguage.googleapis.com/v1beta';
const isV1Model = /^gemini-1\.5-/.test(modelName);
const GEMINI_BASE = isV1Model ? GEMINI_BASE_V1 : GEMINI_BASE_V1BETA;
const geminiApiUrl = `${GEMINI_BASE}/models/${modelName}:generateContent`;
/** Fallback for 404: v1beta models; optionally gemini-1.5-flash on v1 */
const FALLBACK_V1BETA = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const FALLBACK_V1_MODEL = 'gemini-1.5-flash';

if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim() !== '') {
  console.log('✅ Gemini API configured');
  console.log(`   Model: ${modelName}${!process.env.GEMINI_MODEL ? ' (default)' : ''}`);
  console.log(`   API URL: ${geminiApiUrl}`);
} else {
  console.warn('⚠️ Gemini API key not configured. AI features will use fallback responses.');
  console.warn('   Set GEMINI_API_KEY in .env file to enable AI features.');
}

/**
 * Strict compliance system prompt for trading/investment app
 */
const SYSTEM_PROMPT = `You are a helpful support assistant for a robo-advisor investment and trading platform. This is a FINANCIAL TRADING APPLICATION where users can invest, trade, and manage their portfolios.

PLATFORM CONTEXT:
- This is a robo-advisor investment platform
- Users can invest in stocks, bonds, gold, REITs, and Sukuk
- The platform uses automated algorithms to manage investments based on risk profiles
- Users have portfolios, wallets, and can make deposits/withdrawals
- The platform supports halal-compliant investments

YOUR CAPABILITIES:
- Help users navigate the trading and investment app
- Answer questions about trading features and investment tools
- Explain how portfolio management works
- Guide users through account setup and verification
- Help with wallet operations (deposits, withdrawals, transactions)
- Explain risk profiles and portfolio allocation
- Provide onboarding assistance for new investors
- Offer technical support for app features
- Explain how the robo-advisor algorithms work

STRICT PROHIBITIONS - YOU MUST NEVER:
- Provide specific investment advice or recommendations
- Recommend specific stocks, bonds, or assets to buy/sell
- Suggest buy/sell decisions or timing
- Give financial planning or investment strategy advice
- Predict market movements or price changes
- Recommend specific portfolio allocations
- Suggest which assets to invest in
- Execute or facilitate trades
- Provide tax or legal advice
- Guarantee returns or performance

COMPLIANCE RULES:
1. If asked about what to invest in: "I cannot provide investment advice. The platform's robo-advisor automatically manages your portfolio based on your risk profile. You can adjust your risk profile in settings."
2. If asked about trading decisions: "I cannot provide trading advice. The platform uses automated algorithms to manage investments. You can view your portfolio and transactions in the app."
3. If asked about specific assets: "I cannot recommend specific investments. The platform's algorithms select assets based on your risk profile and halal compliance requirements."
4. Always maintain a helpful, professional tone while enforcing these restrictions.
5. You can explain HOW the platform works, but not WHAT to invest in.

RESPONSE FORMAT:
- Be concise and helpful
- Reference that this is a trading/investment platform
- Explain app features related to trading and investing
- Reference user's context when relevant (risk profile, portfolio)
- Always end with an offer to help with app features`;

/**
 * Compliance filter - checks if query or response violates restrictions
 * @param {string} text - Query or response text
 * @param {boolean} isQuery - Whether this is a user query (true) or AI response (false)
 * @returns {object} Compliance check result
 */
function checkCompliance(text, isQuery = false) {
  const violations = [];
  let isCompliant = true;
  const lowerText = text.toLowerCase();

  // Prohibited keywords that indicate advisory/trading requests
  const prohibitedKeywords = [
    'trading',
    'trade',
    'invest',
    'investment advice',
    'buy stock',
    'sell stock',
    'which stock',
    'what to invest',
    'should i invest',
    'recommend stock',
    'best stock',
    'best investment',
    'guaranteed return',
    'guarantee profit',
    'predict price',
    'price will',
    'market will',
    'should buy',
    'should sell',
    'when to buy',
    'when to sell'
  ];

  // Check for prohibited keywords in user queries
  if (isQuery) {
    const foundKeywords = prohibitedKeywords.filter(keyword => lowerText.includes(keyword));
    if (foundKeywords.length > 0) {
      violations.push(...foundKeywords);
      isCompliant = false;
    }
  } else {
    // For AI responses, check for advisory language
    const advisoryPatterns = [
      /you should (invest|buy|sell)/i,
      /i recommend/i,
      /i suggest/i,
      /you must (invest|buy|sell)/i,
      /guaranteed/i,
      /will definitely/i,
      /sure to (profit|gain|make money)/i
    ];

    const foundPatterns = advisoryPatterns.filter(pattern => pattern.test(text));
    if (foundPatterns.length > 0) {
      violations.push('advisory_language');
      isCompliant = false;
    }
  }

  return {
    isCompliant,
    violations,
    userQueryFlagged: isQuery && !isCompliant
  };
}

/**
 * Filter response to remove non-compliant content
 * @param {string} response - AI response
 * @returns {string} Filtered response
 */
function filterResponse(response) {
  // Replace non-compliant content with generic message
  return "I understand you're asking about investments or trading. I cannot provide investment or trading advice. I can help you with app features, navigation, and technical support. What would you like to know about using the platform?";
}

/**
 * Search knowledge base (not used - all queries go to Gemini)
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Knowledge base results
 */
async function searchKnowledgeBase(query, limit = 3) {
  // Not used - all queries go directly to Gemini
  return [];
}

/**
 * Build user context string
 * @param {object} user - User object
 * @param {Array} recentMessages - Recent chat messages
 * @returns {string} Context string
 */
function buildContext(user, recentMessages = []) {
  const contextParts = [];

  if (user) {
    if (user.fullName) {
      contextParts.push(`User: ${user.fullName}`);
    }
    if (user.email) {
      contextParts.push(`Email: ${user.email}`);
    }
    if (user.riskProfile) {
      contextParts.push(`Risk Profile: ${user.riskProfile}`);
    }
  }

  if (recentMessages && recentMessages.length > 0) {
    const recentTopics = recentMessages
      .slice(-3)
      .map(msg => msg.message || msg.text)
      .join('; ');
    contextParts.push(`Recent conversation topics: ${recentTopics}`);
  }

  return contextParts.length > 0 ? contextParts.join('\n') : '';
}

/**
 * Get AI response with Gemini
 * @param {string} userMessage - User's message
 * @param {object} options - Options (user, sessionId, recentMessages, knowledgeBase)
 * @returns {Promise<object>} AI response with compliance check
 */
async function getAIResponse(userMessage, options = {}) {
  if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.trim() === '') {
    console.error('❌ Gemini API key not configured. Check GEMINI_API_KEY in .env');
    // Return a helpful fallback response instead of throwing
    return {
      response: "I'm currently unable to access the AI service. I can help you with app features, navigation, and technical support. What would you like to know about using the platform?",
      complianceCheck: { isCompliant: true, violations: [] },
      knowledgeBaseUsed: [],
      model: 'fallback',
      usage: null
    };
  }

  console.log('🤖 Calling Gemini API with message:', userMessage.substring(0, 50) + '...');

  try {
    const { user, sessionId, recentMessages = [], knowledgeBase = [] } = options;

    // Don't use knowledge base - all queries go directly to Gemini
    const kbResults = [];
    const kbContext = '';

    // Build user context
    const userContext = buildContext(user, recentMessages);

    // Build the full prompt with system instructions
    let fullPrompt = SYSTEM_PROMPT;
    if (userContext) {
      fullPrompt += `\n\nUSER CONTEXT:\n${userContext}`;
    }
    if (kbContext) {
      fullPrompt += kbContext;
    }

    // Build the message with system prompt and user context
    const messageWithContext = userContext 
      ? `${fullPrompt}\n\nUSER CONTEXT:\n${userContext}\n\nUser: ${userMessage}`
      : `${fullPrompt}\n\nUser: ${userMessage}`;

    // Send the current message using the exact format provided
    console.log('📤 Sending to Gemini:', {
      model: modelName,
      lastMessage: userMessage.substring(0, 50)
    });

    const requestBody = {
      contents: [
        {
          parts: [
            { text: messageWithContext }
          ],
        },
      ],
    };

    const response = await axios.post(
      `${geminiApiUrl}?key=${apiKey.trim()}`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
        validateStatus: (status) => status === 200 || status === 404,
      }
    );

    if (response.status === 404) {
      const errMsg = response.data?.error?.message || 'Model not found';
      console.warn('⚠️ Gemini model not found (404), trying fallbacks:', errMsg);
      let lastError = null;
      const tryFallback = (base, fallbackModel) => {
        const url = `${base}/models/${fallbackModel}:generateContent`;
        return axios.post(url + `?key=${apiKey.trim()}`, requestBody, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
      };
      if (isV1Model) {
        for (const fallbackModel of FALLBACK_V1BETA) {
          try {
            const fallback = await tryFallback(GEMINI_BASE_V1BETA, fallbackModel);
            if (fallback.data?.candidates?.[0]) {
              response.data = fallback.data;
              console.log('✅ Using fallback model:', fallbackModel, '(v1beta)');
              break;
            }
          } catch (e) {
            lastError = e;
            console.warn(`   Fallback ${fallbackModel} failed:`, e.response?.data?.error?.message || e.message);
          }
        }
      } else {
        for (const fallbackModel of FALLBACK_V1BETA) {
          if (fallbackModel === modelName) continue;
          try {
            const fallback = await tryFallback(GEMINI_BASE_V1BETA, fallbackModel);
            if (fallback.data?.candidates?.[0]) {
              response.data = fallback.data;
              console.log('✅ Using fallback model:', fallbackModel);
              break;
            }
          } catch (e) {
            lastError = e;
            console.warn(`   Fallback ${fallbackModel} failed:`, e.response?.data?.error?.message || e.message);
          }
        }
        if (!response.data?.candidates?.[0]) {
          try {
            const fallback = await tryFallback(GEMINI_BASE_V1, FALLBACK_V1_MODEL);
            if (fallback.data?.candidates?.[0]) {
              response.data = fallback.data;
              console.log('✅ Using fallback model:', FALLBACK_V1_MODEL, '(v1)');
            }
          } catch (e) {
            lastError = e;
          }
        }
      }
      if (!response.data?.candidates?.[0]) {
        throw lastError || new Error('Gemini model not available. Try GEMINI_MODEL=gemini-1.5-flash or gemini-2.5-flash in .env');
      }
    }

    if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
      const blockReason = response.data?.candidates?.[0]?.finishReason || response.data?.promptFeedback?.blockReason;
      if (blockReason) {
        console.warn('⚠️ Gemini blocked response:', blockReason);
        return {
          response: "I can't generate a response for that. How can I help you with the app features?",
          complianceCheck: { isCompliant: true, violations: [] },
          knowledgeBaseUsed: [],
          model: modelName,
          usage: null,
        };
      }
      throw new Error('Empty response from Gemini API');
    }

    const candidate = response.data.candidates[0];
    const text = candidate.content?.parts?.[0]?.text;

    if (!text || text.trim() === '') {
      const finishReason = candidate.finishReason || '';
      console.warn('⚠️ Empty text from Gemini, finishReason:', finishReason);
      return {
        response: "I couldn't generate a reply for that. Ask me about app features, portfolio, or support.",
        complianceCheck: { isCompliant: true, violations: [] },
        knowledgeBaseUsed: [],
        model: modelName,
        usage: response.data.usageMetadata || null,
      };
    }

    console.log('📥 Received from Gemini:', {
      responseLength: text?.length,
      responsePreview: text?.substring(0, 100),
      hasText: !!text,
      textLength: text?.length
    });

    // Compliance check (for AI response, isQuery=false)
    const complianceCheck = checkCompliance(text, false);

    // Filter if non-compliant
    let finalResponse = text;
    if (!complianceCheck.isCompliant) {
      finalResponse = filterResponse(text);
    }

    // No knowledge base updates - all responses from Gemini

    return {
      response: finalResponse,
      complianceCheck,
      knowledgeBaseUsed: [], // No KB used - all from Gemini
      model: modelName,
      usage: {
        promptTokens: response.data.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.data.usageMetadata?.totalTokenCount || 0
      }
    };
  } catch (error) {
    console.error('❌ Gemini API error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      response: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Fallback response
    if (error.response?.status === 429 || error.message?.includes('quota')) {
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
    
    if (error.response?.status === 401 || error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      console.error('❌ Gemini API key issue. Check GEMINI_API_KEY in .env');
      throw new Error('AI service configuration error. Please contact support.');
    }
    
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

/**
 * Simple generateContent call matching Gemini REST API (curl-style).
 * Sends exactly: POST {base}/models/{model}:generateContent?key=... with body { contents: [{ parts: [{ text }] }] }.
 * Use for one-off prompts (e.g. halal summary). Handles 404 by falling back to gemini-1.5-flash.
 * @param {string} text - Single prompt text
 * @returns {Promise<string>} Response text from Gemini
 */
async function generateContentSimple(text) {
  if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.trim() === '') {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }
  const requestBody = {
    contents: [
      {
        parts: [{ text: text || '' }]
      }
    ]
  };
  let response = await axios.post(
    `${geminiApiUrl}?key=${apiKey.trim()}`,
    requestBody,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
      validateStatus: (status) => status === 200 || status === 404
    }
  );
  const getUrlForModel = (model) => {
    const base = /^gemini-1\.5-/.test(model) ? GEMINI_BASE_V1 : GEMINI_BASE_V1BETA;
    return `${base}/models/${model}:generateContent`;
  };
  if (response.status === 404) {
    let resolved = false;
    for (const fallbackModel of FALLBACK_V1BETA) {
      try {
        const fallbackRes = await axios.post(
          `${getUrlForModel(fallbackModel)}?key=${apiKey.trim()}`,
          requestBody,
          { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );
        if (fallbackRes.data?.candidates?.[0]) {
          response = fallbackRes;
          resolved = true;
          break;
        }
      } catch (e) {
        console.warn(`generateContentSimple fallback ${fallbackModel} failed:`, e.response?.data?.error?.message || e.message);
      }
    }
    if (!resolved) {
      try {
        const fallbackRes = await axios.post(
          `${getUrlForModel(FALLBACK_V1_MODEL)}?key=${apiKey.trim()}`,
          requestBody,
          { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );
        if (fallbackRes.data?.candidates?.[0]) {
          response = fallbackRes;
          resolved = true;
        }
      } catch (e) {
        console.warn(`generateContentSimple fallback ${FALLBACK_V1_MODEL} failed:`, e.response?.data?.error?.message || e.message);
      }
    }
    if (!resolved) throw new Error('Gemini model not available. Try GEMINI_MODEL=gemini-1.5-flash or gemini-2.5-flash in .env');
  }
  const candidate = response.data?.candidates?.[0];
  const out = candidate?.content?.parts?.[0]?.text;
  if (out != null && typeof out === 'string') return out.trim();
  const blockReason = candidate?.finishReason || response.data?.promptFeedback?.blockReason;
  if (blockReason) throw new Error(`Gemini blocked: ${blockReason}`);
  throw new Error('Empty response from Gemini API');
}

/**
 * Process query with context-aware processing
 * @param {string} query - User query
 * @param {object} context - Context object (user, session, recentMessages)
 * @returns {Promise<object>} Processed response
 */
async function processQuery(query, context = {}) {
  try {
    // Pre-process query (normalize, extract intent)
    const normalizedQuery = query.trim().toLowerCase();
    
    // Check for compliance violations in user query (pass isQuery=true)
    const userQueryCompliance = checkCompliance(query, true);
    if (!userQueryCompliance.isCompliant) {
      // Provide a helpful but compliant response
      let response = "I understand you're asking about trading or investments. ";
      
      if (normalizedQuery.includes('trading') || normalizedQuery.includes('trade')) {
        response += "I cannot provide trading advice or recommendations. However, I can help you understand how the robo-advisor platform works, navigate the app features, or assist with technical support. The platform's automated system manages investments based on your risk profile. Would you like help with something else?";
      } else if (normalizedQuery.includes('invest')) {
        response += "I cannot provide investment advice. For investment recommendations, please consult with a licensed financial advisor. I can help you with app features, setting up your account, or understanding how the platform works. How can I assist you?";
      } else {
        response += "I cannot provide investment or trading advice. I can help you with app features, navigation, and technical support. What would you like to know about using the platform?";
      }
      
      return {
        response,
        complianceCheck: {
          isCompliant: true,
          violations: userQueryCompliance.violations,
          userQueryFlagged: true
        },
        knowledgeBaseUsed: [],
        model: 'compliance_filter',
        usage: null
      };
    }

    // Get AI response with context
    const aiResponse = await getAIResponse(query, {
      user: context.user,
      sessionId: context.sessionId,
      recentMessages: context.recentMessages || [],
      knowledgeBase: context.knowledgeBase || []
    });

    return aiResponse;
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  getAIResponse,
  processQuery,
  generateContentSimple,
  checkCompliance,
  filterResponse,
  searchKnowledgeBase,
  buildContext
};

// Make checkCompliance available for direct use
module.exports.checkCompliance = checkCompliance;
