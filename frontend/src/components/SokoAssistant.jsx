import React, { useState, useRef, useEffect } from 'react';
import { getValidToken } from '../storage/auth';
import { API_BASE } from '../config/api';

const SokoAssistant = () => {
  const [conversations, setConversations] = useState([]); // List of all conversations
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesCount = useRef(messages.length);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only auto-scroll when new messages are appended (not on initial load)
  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      scrollToBottom();
    }
    prevMessagesCount.current = messages.length;
  }, [messages.length]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Load all conversations from backend
  const loadConversations = async () => {
    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const convList = data.conversations || [];
        // Map the response to match expected format
        const formattedConversations = convList.map(conv => ({
          _id: conv._id,
          title: conv.title || conv.firstMessage?.substring(0, 50) || 'New Chat',
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt || conv.lastMessageAt,
          messageCount: conv.messageCount || 0
        }));
        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Load messages for a specific conversation
  const loadConversation = async (conversationId) => {
    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages.map(msg => ({
          id: msg._id,
          type: msg.sender === 'user' ? 'user' : 'ai',
          content: msg.message,
          timestamp: new Date(msg.createdAt)
        }));
        
        setMessages(loadedMessages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // Start a new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  // Delete a conversation
  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this conversation?')) return;

    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from list
        setConversations(prev => prev.filter(c => c._id !== conversationId));
        
        // If deleted conversation was active, start new one
        if (currentConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Call backend API for chat completions
  const sendToBackend = async (userMessage) => {
    try {
      const token = getValidToken();

      if (!token) {
        throw new Error('You are not logged in. Please sign in to continue.');
      }

      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: userMessage,
          conversationId: currentConversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || errorData.code === 'INVALID_TOKEN') {
          throw new Error('Your session has expired. Please log out and log back in.');
        }
        
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();
      
      // Update conversation ID if it's a new conversation
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
        // Reload conversations list
        loadConversations();
      }
      
      return data.reply;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponseText = await sendToBackend(messageText);
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: error.message || "I'm sorry, I couldn't process your request right now. Please check your internet connection and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice recording functionality
  const checkSpeechRecognitionSupport = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return false;
    }
    return true;
  };

  const startVoiceRecording = () => {
    if (!checkSpeechRecognitionSupport()) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'sw-TZ';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Add final transcript to input
        if (finalTranscript.trim()) {
          setInputValue(prev => prev + (prev ? ' ' : '') + finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error('Voice recording setup error:', err);
      alert('Failed to start voice recording. Please check microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const handleVoiceButton = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar - Hidden on mobile, slide in on tablet+ */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        ${sidebarOpen ? 'lg:w-72' : 'lg:w-16'}
        fixed lg:relative z-30 h-full w-72
        transition-all duration-300 
        bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 
        flex flex-col shadow-lg
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-slate-800">
          <h2 className={`font-bold text-gray-900 dark:text-white text-lg transition-opacity ${!sidebarOpen && 'lg:opacity-0 lg:hidden'}`}>
            Conversations
          </h2>
          <button
            onClick={startNewConversation}
            className={`p-2.5 bg-blue-600 hover:bg-blue-700 transition ${!sidebarOpen && 'lg:mx-auto'}`}
            title="New Chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Conversations List */}
        <div className={`flex-1 overflow-y-auto p-3 ${!sidebarOpen && 'lg:hidden'}`}>
          {conversations.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className={`group p-4 cursor-pointer transition ${
                    currentConversationId === conv._id
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                        {conv.title || `Chat ${new Date(conv.createdAt).toLocaleDateString()}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 transition-all"
                      title="Delete conversation"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-slate-800 ${!sidebarOpen && 'lg:hidden'}`}>
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-slate-900"> 
        {/* Top Bar with Mode Tabs */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all lg:hidden border border-gray-200 dark:border-slate-600"
              title="Toggle Sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 dark:text-gray-300">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white hidden sm:flex items-center gap-2">
              AI Chat Assistant
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-600"
              title="Toggle Sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 dark:text-gray-300">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>

        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col w-full relative">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-4 md:space-y-6 max-w-5xl mx-auto w-full">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    {message.type === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white px-5 py-3 max-w-[85%] md:max-w-[75%]">
                          <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-purple-600 flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <div className="flex-1 max-w-[85%] md:max-w-[75%]">
                            <div className="bg-gray-100 dark:bg-slate-800/60 backdrop-blur border border-gray-200 dark:border-slate-700/50 px-5 py-3">
                              <p className="text-sm md:text-base text-gray-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
                <div className="max-w-5xl mx-auto">
                  {/* Recording Status */}
                  {isRecording && (
                    <div className="text-center mb-3">
                      <p className="text-red-400 text-sm font-medium animate-pulse">
                        Ongea sasa... (Speak now)
                      </p>
                    </div>
                  )}
                  <div className="flex items-end gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about your business..."
                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 rounded px-5 sm:px-6 py-3.5 sm:py-4 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>

                    {/* Voice Button */}
                    <button
                      onClick={handleVoiceButton}
                      disabled={isLoading}
                      className={`p-3 sm:p-4 border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition flex items-center justify-center shrink-0 ${
                        isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                      title={isRecording ? "Stop recording" : "Start voice input (Kiswahili)"}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        {isRecording && (
                          <>
                            <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.2"/>
                            <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.4"/>
                          </>
                        )}
                      </svg>
                    </button>

                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className="px-5 sm:px-7 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded text-white font-bold text-sm sm:text-base transition flex items-center gap-2 shrink-0"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:block">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:hidden">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                  <p className="text-center text-slate-500 text-xs sm:text-sm mt-4 flex items-center justify-center gap-1.5">
                    <span>Ask specific questions or tell me about your sales • Voice input available</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default SokoAssistant;
