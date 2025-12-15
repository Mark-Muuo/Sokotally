import React, { useState, useRef, useEffect } from 'react';
import { getValidToken } from '../storage/auth';
import { API_BASE } from '../config/api';

const SokoAssistant = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [conversations, setConversations] = useState([]); // List of all conversations
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micPermission, setMicPermission] = useState(null);
  const [micError, setMicError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const prevMessagesCount = useRef(messages.length);

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
    } catch (error) {}
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
    } catch (error) {}
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

  // Request microphone permission
  const requestMicPermission = async () => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission(true);
      return true;
    } catch (error) {
      setMicPermission(false);
      if (error.name === 'NotAllowedError') {
        setMicError('Microphone access denied. Please enable it in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone and try again.');
      } else {
        setMicError('Could not access microphone. Please try again.');
      }
      return false;
    }
  };

  const startVoiceChat = async () => {
    if (micPermission !== true) {
      const granted = await requestMicPermission();
      if (!granted) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio
        await handleVoiceMessage(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsListening(true);
      setMicError('');
    } catch (error) {
      setMicError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopVoiceChat = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setIsListening(false);
  };

  // Voice recording state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Handle voice recording and conversation
  const handleVoiceMessage = async (audioBlob) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('conversationId', currentConversationId || '');

      const token = getValidToken();
      const response = await fetch(`${API_BASE}/chat/voice`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process voice message');
      }

      const data = await response.json();
      
      // Update conversation ID if it's a new conversation
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
        loadConversations();
      }

      // Add user message (transcription)
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: data.transcription || 'Voice message',
        timestamp: new Date(),
        isVoice: true
      };
      setMessages(prev => [...prev, userMessage]);

      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Speak the AI response
      if ('speechSynthesis' in window) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Voice message error:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'ai',
        content: "Sorry, I couldn't process your voice message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Sidebar - Hidden on mobile, slide in on tablet+ */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        ${sidebarOpen ? 'lg:w-72' : 'lg:w-16'}
        fixed lg:relative z-30 h-full w-72
        transition-all duration-300 
        bg-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 
        flex flex-col shadow-2xl
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-800/40 to-slate-900/30">
          <h2 className={`font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent text-lg transition-opacity ${!sidebarOpen && 'lg:opacity-0 lg:hidden'}`}>
            💬 Conversations
          </h2>
          <button
            onClick={startNewConversation}
            className={`p-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 ${!sidebarOpen && 'lg:mx-auto'}`}
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
              <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className={`group p-4 rounded-xl cursor-pointer transition-all shadow-lg ${
                    currentConversationId === conv._id
                      ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/40 shadow-blue-500/20'
                      : 'bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate mb-1">
                        {conv.title || `Chat ${new Date(conv.createdAt).toLocaleDateString()}`}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
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
        <div className={`p-4 border-t border-slate-700/50 text-xs text-slate-400 text-center bg-slate-900/50 ${!sidebarOpen && 'lg:hidden'}`}>
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
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"> 
        {/* Top Bar with Mode Tabs */}
        <div className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-4 md:px-6 py-4 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-slate-800/60 rounded-xl transition-all lg:hidden border border-slate-700/50"
              title="Toggle Sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent hidden sm:flex items-center gap-2">
              {activeTab === 'text' ? '💬 AI Chat Assistant' : '🎙️ Voice Chat'}
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2.5 hover:bg-slate-800/60 rounded-xl transition-all border border-slate-700/50"
              title="Toggle Sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-full p-1 border border-slate-700/50 shadow-lg">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="hidden sm:inline">Text</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'voice'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
              <span className="hidden sm:inline">Voice</span>
            </button>
            {/* Removed AI Agent button per design request */}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'text' ? (
            <div className="h-full flex flex-col w-full relative">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-4 md:space-y-6 max-w-5xl mx-auto w-full">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    {message.type === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-md px-5 py-3 max-w-[85%] md:max-w-[75%] shadow-xl shadow-blue-500/30">
                          <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <div className="flex-1 max-w-[85%] md:max-w-[75%]">
                            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl rounded-tl-md px-5 py-3 shadow-xl">
                              <p className="text-sm md:text-base text-slate-100 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-end gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about your business..."
                        className="w-full bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/70 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-lg"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className="px-5 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none flex items-center gap-2 shrink-0 hover:scale-105 disabled:hover:scale-100"
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
                    <span className="text-lg">💡</span>
                    <span>Ask specific questions or tell me about your sales</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
              {/* Voice Interface - No History Here */}
              <div className="text-center w-full">
                {/* Microphone Circle */}
                <div className={`w-48 h-48 mx-auto rounded-full flex items-center justify-center mb-8 transition-all ${
                  isListening 
                    ? 'bg-red-900/40 border-4 border-red-500/60' 
                    : 'bg-blue-900/30 border-4 border-blue-600/40'
                }`}>
                  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isListening ? 'text-red-500' : 'text-blue-400'}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>

                {/* Status Text */}
                <h3 className="text-3xl font-bold text-gray-100 mb-3">
                  {isSpeaking ? '🔊 AI Speaking...' : isListening ? '🎤 Listening...' : 'Voice Chat Ready'}
                </h3>
                <p className="text-gray-400 mb-8 text-lg">
                  {isSpeaking ? 'AI is responding with voice' : isListening ? 'Speak your question clearly' : 'Click the microphone button to start'}
                </p>

                {/* Waveform Visualization */}
                {(isListening || isSpeaking) && (
                  <div className="mb-8 h-20 flex items-center justify-center gap-1 px-8">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all ${
                          isSpeaking ? 'bg-green-400' : 'bg-cyan-400'
                        }`}
                        style={{
                          height: `${Math.sin(i * 0.5) * 40 + Math.random() * 30}%`,
                          animation: `wave 0.5s ease-in-out ${i * 0.05}s infinite`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Error Message */}
                {micError && (
                  <div className="mb-8 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm max-w-md mx-auto">
                    {micError}
                  </div>
                )}

                {/* Button */}
                <button
                  onClick={isListening ? stopVoiceChat : startVoiceChat}
                  disabled={isLoading || isSpeaking}
                  className={`px-10 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isListening ? (
                      <rect x="4" y="4" width="16" height="16" rx="2"/>
                    ) : (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      </>
                    )}
                  </svg>
                  {isLoading ? 'Processing...' : isListening ? 'Stop Recording' : 'Start Conversation'}
                </button>

                {/* Tip */}
                <p className="text-gray-500 text-sm mt-8 max-w-lg mx-auto">
                  💡 Tip: Click "Start Conversation", speak your question, then click "Stop Recording". The AI will respond with voice and text!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SokoAssistant;
