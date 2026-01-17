import React, { useState, useRef, useEffect } from "react";
import { getValidToken } from "../storage/auth";
import { API_BASE } from "../config/api";

const SokoAssistant = () => {
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesCount = useRef(messages.length);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const activeAudioRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only auto-scroll when new messages are appended (not on initial load)
  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      scrollToBottom();
    }
    prevMessagesCount.current = messages.length;
  }, [messages.length]);

  // Load full history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Cleanup voice recording on unmount
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load complete chat history
  const loadHistory = async () => {
    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/chat/history?limit=200`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const loadedMessages = (data.messages || []).map((msg) => ({
          id: msg._id,
          type: msg.sender === "user" ? "user" : "ai",
          content: msg.message,
          timestamp: msg.createdAt,
          conversationId: msg.conversationId,
        }));

        setMessages(loadedMessages);
        const lastConversationId = loadedMessages.length
          ? loadedMessages[loadedMessages.length - 1].conversationId
          : null;
        setCurrentConversationId(lastConversationId || null);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  // Call backend API for chat completions
  const sendToBackend = async (userMessage) => {
    try {
      const token = getValidToken();

      if (!token) {
        throw new Error("You are not logged in. Please sign in to continue.");
      }

      const response = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: userMessage,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401 || errorData.code === "INVALID_TOKEN") {
          throw new Error(
            "Your session has expired. Please log out and log back in."
          );
        }

        throw new Error(errorData.error || "Failed to get response from AI");
      }

      const data = await response.json();

      // Update conversation ID if it's a new conversation
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }

      // Check if there's a pending transaction that needs confirmation
      if (data.pendingTransaction) {
        setPendingTransaction({
          ...data.pendingTransaction,
          conversationId: data.conversationId,
          userMessage: userMessage,
        });
        setShowConfirmation(true);
      }

      return data.reply;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponseText = await sendToBackend(messageText);
      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: aiResponseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        type: "ai",
        content:
          error.message ||
          "I'm sorry, I couldn't process your request right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Confirm transaction
  const handleConfirmTransaction = async () => {
    try {
      const token = getValidToken();

      const response = await fetch(`${API_BASE}/chat/confirm-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionData: {
            ...pendingTransaction,
            conversationText: pendingTransaction.userMessage,
          },
          conversationId: pendingTransaction.conversationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const confirmMessage = {
          id: Date.now() + 2,
          type: "ai",
          content: `Transaction recorded successfully! ${
            pendingTransaction.type === "income"
              ? "Sale"
              : pendingTransaction.type === "expense"
                ? "Expense"
                : "Transaction"
          } of KES ${pendingTransaction.amount.toLocaleString()} saved.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmMessage]);
      } else {
        throw new Error("Failed to save transaction");
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 2,
        type: "ai",
        content: "Sorry, I couldn't save the transaction. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setShowConfirmation(false);
      setPendingTransaction(null);
    }
  };

  // Cancel transaction
  const handleCancelTransaction = () => {
    const cancelMessage = {
      id: Date.now() + 2,
      type: "ai",
      content:
        "No problem! Transaction not saved. Let me know if you need anything else.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    setShowConfirmation(false);
    setPendingTransaction(null);
  };

  // Voice recording functionality (MediaRecorder + backend transcription)
  const checkAudioRecordingSupport = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert(
        "Audio recording is not supported in your browser. Please use a modern browser."
      );
      return false;
    }
    if (typeof MediaRecorder === "undefined") {
      alert(
        "Audio recording is not supported in your browser. Please use a modern browser."
      );
      return false;
    }
    return true;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const cleanupAudioStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopAudioPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const detectSpeechLanguage = (text) => {
    const swahiliPattern =
      /\b(nimeuza|nilinunua|leo|shilingi|pesa|habari|asante|karibu|sawa|je)\b/i;
    return swahiliPattern.test(text) ? "sw-KE" : "en-US";
  };

  const speakWithBrowserTTS = (text) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectSpeechLanguage(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const playAssistantResponse = async (text) => {
    stopAudioPlayback();

    try {
      const token = getValidToken();
      const ttsResponse = await fetch(`${API_BASE}/chat/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          voice: "alloy",
        }),
      });

      if (!ttsResponse.ok) {
        speakWithBrowserTTS(text);
        return;
      }

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        activeAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        activeAudioRef.current = null;
        speakWithBrowserTTS(text);
      };

      await audio.play();
    } catch (error) {
      speakWithBrowserTTS(text);
    }
  };

  const handleVoiceUpload = async (audioBlob) => {
    try {
      const token = getValidToken();
      if (!token) {
        throw new Error("You are not logged in. Please sign in to continue.");
      }

      setIsLoading(true);

      const formData = new FormData();
      formData.append("audio", audioBlob, `voice-${Date.now()}.webm`);
      if (currentConversationId) {
        formData.append("conversationId", currentConversationId);
      }

      const response = await fetch(`${API_BASE}/chat/voice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process voice message");
      }

      const data = await response.json();

      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }

      if (data.transcription) {
        const userVoiceMessage = {
          id: Date.now(),
          type: "user",
          content: data.transcription,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userVoiceMessage]);
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);

      if (data.pendingTransaction) {
        setPendingTransaction({
          ...data.pendingTransaction,
          conversationId: data.conversationId,
          userMessage: data.transcription,
        });
        setShowConfirmation(true);
      }

      if (data.reply) {
        await playAssistantResponse(data.reply);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 2,
        type: "ai",
        content:
          error.message ||
          "Sorry, I had trouble processing the voice message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecording = async () => {
    if (!checkAudioRecordingSupport() || isRecording) return;

    if (isSpeaking) {
      stopAudioPlayback();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const supportedType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = new MediaRecorder(
        stream,
        supportedType ? { mimeType: supportedType } : undefined
      );

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setRecordingDuration(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      };

      recorder.onerror = (event) => {
        console.error("Audio recording error:", event.error);
        setIsRecording(false);
        cleanupAudioStream();
      };

      recorder.onstop = () => {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];

        cleanupAudioStream();

        if (audioBlob.size > 0) {
          handleVoiceUpload(audioBlob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
    } catch (err) {
      console.error("Voice recording setup error:", err);
      cleanupAudioStream();
      alert(
        "Failed to start voice recording. Please check microphone permissions."
      );
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceButton = () => {
    if (isSpeaking) {
      stopAudioPlayback();
    }
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const formatTimestamp = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Assistant
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your full chat history is saved here
            </p>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col w-full relative">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-8 space-y-5 max-w-5xl mx-auto w-full">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {message.type === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[70%] shadow-sm">
                        <p className="text-sm md:text-base leading-relaxed">
                          {message.content}
                        </p>
                        <p className="text-[11px] text-gray-300 mt-2 text-right">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold">
                            A
                          </span>
                        </div>
                        <div className="flex-1 max-w-[85%] md:max-w-[75%]">
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                            <p className="text-sm md:text-base text-gray-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                              {formatTimestamp(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
              <div className="max-w-5xl mx-auto">
                {/* Recording Status */}
                {isRecording && (
                  <div className="text-center mb-3">
                    <p className="text-red-400 text-sm font-medium animate-pulse">
                      Recording {formatDuration(recordingDuration)}. Tap the
                      microphone to stop.
                    </p>
                  </div>
                )}
                {!isRecording && (isLoading || isSpeaking) && (
                  <div className="text-center mb-3">
                    <p className="text-blue-400 text-sm font-medium">
                      {isSpeaking ? "Speaking..." : "Thinking..."}
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
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 rounded-xl px-5 sm:px-6 py-3.5 sm:py-4 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 dark:focus:border-white transition"
                    />
                  </div>

                  {/* Stop Speaking Button */}
                  {isSpeaking && (
                    <button
                      onClick={stopAudioPlayback}
                      className="p-3 sm:p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400 transition flex items-center justify-center shrink-0"
                      title="Stop speaking"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6 6h12v12H6z" />
                      </svg>
                    </button>
                  )}

                  {/* Voice Button */}
                  <button
                    onClick={handleVoiceButton}
                    disabled={isLoading}
                    className={`p-3 sm:p-4 border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition flex items-center justify-center shrink-0 ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                        : "bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                    title={isRecording ? "Stop recording" : "Start voice input"}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      {isRecording && (
                        <>
                          <circle
                            cx="12"
                            cy="12"
                            r="8"
                            fill="currentColor"
                            opacity="0.2"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="4"
                            fill="currentColor"
                            opacity="0.4"
                          />
                        </>
                      )}
                    </svg>
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="px-5 sm:px-7 py-3.5 sm:py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-sm sm:text-base transition flex items-center gap-2 shrink-0"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="hidden sm:block"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="sm:hidden"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-center text-slate-500 text-xs sm:text-sm mt-4">
                  <span>
                    Ask specific questions or tell me about your sales • Voice
                    input & voice messages available
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Confirmation Modal */}
      {showConfirmation && pendingTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <h3 className="text-xl font-bold text-white">
                Confirm Transaction
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                Please verify the details below
              </p>
            </div>

            {/* Transaction Details */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">
                    Type:
                  </span>
                  <span className="text-gray-900 dark:text-white font-bold capitalize">
                    {pendingTransaction.type === "income"
                      ? "Sale"
                      : pendingTransaction.type === "expense"
                        ? "Expense"
                        : pendingTransaction.type}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">
                    Amount:
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    KES {pendingTransaction.amount.toLocaleString()}
                  </span>
                </div>

                {pendingTransaction.items &&
                  pendingTransaction.items.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-3">
                      <span className="text-gray-600 dark:text-slate-400 text-sm font-medium block mb-2">
                        Items:
                      </span>
                      <div className="space-y-2">
                        {pendingTransaction.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700 dark:text-slate-300">
                              {item.quantity} {item.unit} {item.name}
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              @ {item.unitPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {pendingTransaction.customerName && (
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-slate-700 pt-3">
                    <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">
                      Customer:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {pendingTransaction.customerName}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelTransaction}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmTransaction}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Yes, Save It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SokoAssistant;
