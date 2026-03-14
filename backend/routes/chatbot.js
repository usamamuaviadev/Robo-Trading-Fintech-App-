const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');
const FAQ = require('../models/FAQ');
const KnowledgeBase = require('../models/KnowledgeBase');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

const router = express.Router();

/**
 * @route   POST /api/chatbot/message
 * @desc    Send message to chatbot with Gemini integration
 * @access  Private
 */
router.post('/message',
  authenticate,
  [
    body('message').notEmpty().trim().withMessage('Message is required'),
    body('sessionId').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { message, sessionId } = req.body;
      const userId = req.user._id;

      // Get or create chat session
      let chatSession = null;
      if (sessionId) {
        chatSession = await ChatSession.findOne({ sessionId, userId });
      }
      
      if (!chatSession) {
        const newSessionId = sessionId || `session-${userId}-${Date.now()}`;
        chatSession = await ChatSession.create({
          userId,
          sessionId: newSessionId,
          title: message.substring(0, 50) || 'New Chat',
          messageCount: 0
        });
      }

      // Get user with profile
      const user = await User.findById(userId);

      // Get recent messages for context
      const recentMessages = await ChatMessage.find({
        sessionId: chatSession.sessionId,
        userId
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

      // Save user message
      const userMessage = await ChatMessage.create({
        userId,
        sessionId: chatSession.sessionId,
        message,
        sender: 'user'
      });

      let botResponse = '';
      let responseSource = 'ai';
      let complianceCheck = { isCompliant: true, violations: [] };
      let knowledgeBaseUsed = [];

      // Always use Gemini service - send all queries to Gemini
      try {
        console.log('🤖 Processing query with Gemini service:', message);
        const aiResult = await geminiService.processQuery(message, {
          user,
          sessionId: chatSession.sessionId,
          recentMessages: recentMessages.reverse(), // Reverse to chronological order
          knowledgeBase: [] // Don't use knowledge base - all queries go to Gemini
        });

        console.log('✅ Gemini result:', {
          responseLength: aiResult.response?.length,
          complianceCheck: aiResult.complianceCheck,
          model: aiResult.model,
          responsePreview: aiResult.response?.substring(0, 100)
        });

        // Ensure we have a valid response
        if (!aiResult.response || aiResult.response.trim() === '') {
          console.warn('⚠️ Empty response from Gemini, using fallback');
          botResponse = "I'm here to help with app usage and features. How can I assist you today?";
        } else {
          botResponse = aiResult.response;
        }
        complianceCheck = aiResult.complianceCheck || { isCompliant: true, violations: [] };
        knowledgeBaseUsed = []; // No KB used - all from OpenAI

          // Track compliance issues
          if (!complianceCheck.isCompliant || complianceCheck.userQueryFlagged) {
            if (!chatSession.complianceFlags) {
              chatSession.complianceFlags = [];
            }
            
            if (complianceCheck.userQueryFlagged) {
              chatSession.complianceFlags.push('advisory_attempt');
            }
            if (!complianceCheck.isCompliant) {
              chatSession.complianceFlags.push('blocked_response');
            }
            
            chatSession.hasComplianceIssues = true;
            await chatSession.save();
            console.log('⚠️ Compliance issue detected:', complianceCheck);
          }
        } catch (error) {
          console.error('❌ OpenAI service error:', {
            message: error.message,
            code: error.code,
            status: error.status,
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
          });
          
          // Check if it's a Gemini API key issue
          if (error.message && (error.message.includes('API key') || error.message.includes('Gemini') || error.message.includes('configuration'))) {
            console.error('⚠️ Gemini API key or configuration issue detected');
            botResponse = "I'm having trouble connecting to the AI service right now. I can help you with app features, navigation, and technical support. What would you like to know?";
          } else {
            // Fallback response - but still check compliance
            try {
              const complianceCheckResult = geminiService.checkCompliance(message, true);
              if (!complianceCheckResult.isCompliant) {
                if (message.toLowerCase().includes('trading') || message.toLowerCase().includes('trade')) {
                  botResponse = "I understand you're asking about trading or investments. I cannot provide trading advice or recommendations. However, I can help you understand how the robo-advisor platform works, navigate the app features, or assist with technical support. The platform's automated system manages investments based on your risk profile. Would you like help with something else?";
                } else if (message.toLowerCase().includes('invest')) {
                  botResponse = "I understand you're asking about investments. I cannot provide investment advice. For investment recommendations, please consult with a licensed financial advisor. I can help you with app features, setting up your account, or understanding how the platform works. How can I assist you?";
                } else {
                  botResponse = "I understand you're asking about investments or trading. I cannot provide investment or trading advice. I can help you with app features, navigation, and technical support. What would you like to know about using the platform?";
                }
                complianceCheck = { isCompliant: true, violations: complianceCheckResult.violations, userQueryFlagged: true };
              } else {
                botResponse = "I'm having trouble processing your request right now. I can help you with app features, navigation, and technical support. What would you like to know?";
              }
            } catch (complianceError) {
              console.error('Error checking compliance:', complianceError);
              botResponse = "I'm having trouble processing your request right now. I can help you with app features, navigation, and technical support. What would you like to know?";
            }
          }
          responseSource = 'fallback';
        }

      // Save bot response
      const botMessage = await ChatMessage.create({
        userId,
        sessionId: chatSession.sessionId,
        message: botResponse,
        sender: 'bot',
        metadata: {
          source: responseSource,
          complianceCheck,
          knowledgeBaseUsed
        }
      });

      // Update session
      chatSession.messageCount += 1;
      chatSession.lastMessageAt = new Date();
      await chatSession.save();

      console.log('📤 Sending response:', {
        sessionId: chatSession.sessionId,
        botResponseLength: botResponse.length,
        responseSource,
        complianceCheck
      });

      res.status(200).json({
        success: true,
        data: {
          sessionId: chatSession.sessionId,
          userMessage: {
            id: userMessage._id,
            message: userMessage.message,
            timestamp: userMessage.createdAt
          },
          botResponse: {
            id: botMessage._id,
            message: botResponse, // Ensure we use the processed botResponse
            timestamp: botMessage.createdAt,
            source: responseSource,
            complianceCheck: complianceCheck || { isCompliant: true, violations: [] }
          },
          knowledgeBaseUsed: knowledgeBaseUsed || []
        }
      });
    } catch (error) {
      console.error('Chatbot message error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process message'
      });
    }
  }
);

/**
 * @route   GET /api/chatbot/sessions
 * @desc    Get user's chat sessions
 * @access  Private
 */
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await ChatSession.find({
      userId: req.user._id,
      status: 'active'
    })
    .sort({ lastMessageAt: -1 })
    .limit(50);

    res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sessions'
    });
  }
});

/**
 * @route   GET /api/chatbot/history
 * @desc    Get chat history for a session
 * @access  Private
 */
router.get('/history',
  authenticate,
  [
    query('sessionId').optional().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.query;
      const limit = parseInt(req.query.limit) || 50;
      const query = { userId: req.user._id };
      
      if (sessionId) {
        query.sessionId = sessionId;
      }

      const messages = await ChatMessage.find(query)
        .sort({ createdAt: 1 })
        .limit(limit);

      res.status(200).json({
        success: true,
        data: { messages }
      });
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get chat history'
      });
    }
  }
);

/**
 * @route   POST /api/chatbot/sessions/:sessionId/archive
 * @desc    Archive a chat session
 * @access  Private
 */
router.post('/sessions/:sessionId/archive', authenticate, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.status = 'archived';
    await session.save();

    res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Archive session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to archive session'
    });
  }
});

/**
 * @route   GET /api/chatbot/faq/search
 * @desc    Search FAQs
 * @access  Public
 */
router.get('/faq/search',
  [
    query('query').optional().trim(),
    query('category').optional().isIn(['onboarding', 'portfolio', 'wallet', 'trading', 'general'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { query: searchQuery, category } = req.query;

      const query = { isActive: true };
      if (category) {
        query.category = category;
      }

      let faqs;
      if (searchQuery) {
        faqs = await FAQ.find({
          ...query,
          $text: { $search: searchQuery }
        }).sort({ helpfulCount: -1, viewCount: -1 }).limit(10);
      } else {
        faqs = await FAQ.find(query)
          .sort({ helpfulCount: -1, viewCount: -1 })
          .limit(20);
      }

      res.status(200).json({
        success: true,
        data: { faqs }
      });
    } catch (error) {
      console.error('FAQ search error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search FAQs'
      });
    }
  }
);

// ========== ADMIN ROUTES ==========

/**
 * @route   GET /api/chatbot/admin/stats
 * @desc    Get chatbot statistics (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    // TODO: Add admin check middleware
    
    const totalSessions = await ChatSession.countDocuments();
    const activeSessions = await ChatSession.countDocuments({ status: 'active' });
    const complianceIssues = await ChatSession.countDocuments({ hasComplianceIssues: true });
    const totalMessages = await ChatMessage.countDocuments();
    
    const recentComplianceFlags = await ChatSession.find({
      hasComplianceIssues: true,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'fullName phoneNumber');

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        complianceIssues,
        totalMessages,
        recentComplianceFlags
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin stats'
    });
  }
});

/**
 * @route   GET /api/chatbot/admin/sessions
 * @desc    Get all chat sessions with filters (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/sessions',
  authenticate,
  [
    query('hasComplianceIssues').optional().isBoolean(),
    query('status').optional().isIn(['active', 'archived', 'deleted']),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      // TODO: Add admin check middleware
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const query = {};
      if (req.query.hasComplianceIssues === 'true') {
        query.hasComplianceIssues = true;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }

      const limit = parseInt(req.query.limit) || 50;
      const sessions = await ChatSession.find(query)
        .populate('userId', 'fullName phoneNumber email')
        .sort({ lastMessageAt: -1 })
        .limit(limit);

      res.status(200).json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      console.error('Get admin sessions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get admin sessions'
      });
    }
  }
);

/**
 * @route   POST /api/chatbot/admin/knowledge-base
 * @desc    Add knowledge base entry (admin)
 * @access  Private (Admin only)
 */
router.post('/admin/knowledge-base',
  authenticate,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category').optional().isIn(['general', 'onboarding', 'wallet', 'portfolio', 'trading', 'account', 'technical'])
  ],
  async (req, res) => {
    try {
      // TODO: Add admin check middleware
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const kbEntry = await KnowledgeBase.create({
        ...req.body,
        createdBy: req.user._id,
        source: 'manual'
      });

      res.status(201).json({
        success: true,
        data: { entry: kbEntry }
      });
    } catch (error) {
      console.error('Create knowledge base entry error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create knowledge base entry'
      });
    }
  }
);

/**
 * @route   GET /api/chatbot/admin/knowledge-base
 * @desc    Get all knowledge base entries (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/knowledge-base', authenticate, async (req, res) => {
  try {
    // TODO: Add admin check middleware
    const entries = await KnowledgeBase.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName')
      .limit(100);

    res.status(200).json({
      success: true,
      data: { entries }
    });
  } catch (error) {
    console.error('Get knowledge base entries error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get knowledge base entries'
    });
  }
});

module.exports = router;
