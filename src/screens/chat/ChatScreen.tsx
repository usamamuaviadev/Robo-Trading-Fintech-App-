import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Send, Bot, User, AlertCircle } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { showErrorPopup } from '@/utils/errorPopup';

interface ChatScreenProps {
  onBack?: () => void;
  sessionId?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  source?: string;
  complianceCheck?: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onBack, sessionId: initialSessionId }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (currentSessionId) {
      loadChatHistory();
    } else {
      // Clear messages if no session
      setMessages([]);
    }
  }, [currentSessionId]);

  const loadChatHistory = async () => {
    if (!currentSessionId) return;

    try {
      const response = await apiService.getChatHistory(currentSessionId, 100);
      if (response.success && response.data?.messages) {
        const formattedMessages = response.data.messages.map((msg: any) => ({
          id: msg._id || msg.id,
          message: msg.message,
          sender: msg.sender,
          timestamp: new Date(msg.createdAt),
          source: msg.metadata?.source,
          complianceCheck: msg.metadata?.complianceCheck
        }));
        setMessages(formattedMessages);
        scrollToBottom();
      }
    } catch (error: any) {
      showErrorPopup(error?.message || (isRTL ? 'فشل تحميل المحادثة' : 'Failed to load chat'), t('common.error'));
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      message: userMessageText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMessage]);
    scrollToBottom();

    try {
      console.log('📤 Sending message:', userMessageText, 'Session:', currentSessionId);
      const response = await apiService.sendChatMessage(userMessageText, currentSessionId);
      console.log('📥 Received response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        // Update session ID if new session was created
        if (response.data.sessionId && !currentSessionId) {
          setCurrentSessionId(response.data.sessionId);
        }

        // Get bot response message - handle different response structures
        const botMessage = response.data.botResponse?.message || response.data.botResponse?.response || '';
        
        if (!botMessage) {
          console.warn('⚠️ No bot message in response:', response.data);
        }

        // Remove temp message and add real messages
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
          return [
            ...filtered,
            {
              id: response.data.userMessage?.id || `user-${Date.now()}`,
              message: response.data.userMessage?.message || userMessageText,
              sender: 'user',
              timestamp: new Date(response.data.userMessage?.timestamp || Date.now())
            },
            {
              id: response.data.botResponse?.id || `bot-${Date.now()}`,
              message: botMessage,
              sender: 'bot',
              timestamp: new Date(response.data.botResponse?.timestamp || Date.now()),
              source: response.data.botResponse?.source,
              complianceCheck: response.data.botResponse?.complianceCheck
            }
          ];
        });
        scrollToBottom();
      } else {
        showErrorPopup(
          response.message || (isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message'),
          t('common.error')
        );
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      }
    } catch (error: any) {
      showErrorPopup(
        error.message || (isRTL ? 'حدث خطأ أثناء إرسال الرسالة' : 'An error occurred while sending message'),
        t('common.error')
      );
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View className="items-center px-5 pt-4 pb-2 border-b border-gray-200" style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
        <Pressable onPress={onBack} hitSlop={10} className="p-2">
          {isRTL ? <ChevronRight size={24} color="#111827" /> : <ChevronLeft size={24} color="#111827" />}
        </Pressable>
        <View className="flex-1 flex-row items-center justify-center gap-2">
          <Bot size={24} color="#7C3AED" />
          <Text className="text-h3 font-bold text-gray-900">
            {isRTL ? 'المساعد الذكي' : 'AI Assistant'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Compliance Notice */}
      <View className="bg-blue-50 px-5 py-3 border-b border-blue-100">
        <View className={`flex-row items-start gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <AlertCircle size={16} color="#3B82F6" style={{ marginTop: 2 }} />
          <Text className={`text-body-sm text-blue-700 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL 
              ? 'ملاحظة: هذا المساعد لا يقدم نصائح استثمارية أو تداولية. يمكنه مساعدتك في استخدام التطبيق والميزات.'
              : 'Note: This assistant does not provide investment or trading advice. It can help you with app usage and features.'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={scrollToBottom}
      >
        {messages.length === 0 && !isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Bot size={64} color="#D1D5DB" />
            <Text className={`text-h5 font-semibold text-gray-700 mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?'}
            </Text>
            <Text className={`text-body-sm text-gray-500 mt-2 text-center px-8 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL 
                ? 'يمكنني مساعدتك في التنقل في التطبيق، والإجابة على الأسئلة حول الميزات، وتقديم الدعم الفني.'
                : 'I can help you navigate the app, answer questions about features, and provide technical support.'}
            </Text>
          </View>
        ) : (
          messages.filter((msg, index, self) => 
            // Remove duplicates based on id
            index === self.findIndex(m => m.id === msg.id)
          ).map((message) => (
            <View
              key={message.id}
              className={`mb-4 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-primary-600 rounded-br-sm'
                    : 'bg-gray-100 rounded-bl-sm'
                }`}
              >
                <View className={`flex-row items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  {message.sender === 'bot' ? (
                    <Bot size={16} color={message.sender === 'user' ? '#FFFFFF' : '#7C3AED'} />
                  ) : (
                    <User size={16} color="#FFFFFF" />
                  )}
                  <Text
                    className={`text-body-sm font-medium ${
                      message.sender === 'user' ? 'text-white' : 'text-gray-700'
                    } ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {message.sender === 'user' ? (isRTL ? 'أنت' : 'You') : (isRTL ? 'المساعد' : 'Assistant')}
                  </Text>
                </View>
                <Text
                  className={`text-body ${
                    message.sender === 'user' ? 'text-white' : 'text-gray-900'
                  } ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {message.message}
                </Text>
                <Text
                  className={`text-body-xs mt-2 ${
                    message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                  } ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {formatTime(message.timestamp)}
                </Text>
                {message.complianceCheck && !message.complianceCheck.isCompliant && (
                  <View className="mt-2 pt-2 border-t border-gray-300">
                    <Text className={`text-body-xs text-yellow-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'تم تصفية الاستجابة للامتثال' : 'Response filtered for compliance'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
        {isLoading && (
          <View className="mb-4 items-start">
            <View className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <ActivityIndicator size="small" color="#7C3AED" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View className="border-t border-gray-200 px-4 py-3 bg-white">
        <View className={`flex-row items-center gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
            placeholderTextColor="#9CA3AF"
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-body text-gray-900"
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            editable={!isLoading}
          />
          <Pressable
            onPress={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              inputMessage.trim() && !isLoading
                ? 'bg-primary-600'
                : 'bg-gray-300'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
        <Text className={`text-body-xs text-gray-500 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {isRTL ? 'لا يمكن للمساعد تقديم نصائح استثمارية' : 'Assistant cannot provide investment advice'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};
