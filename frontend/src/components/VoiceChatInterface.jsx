import React, { useState, useRef, useEffect } from 'react';
import { getValidToken } from '../storage/auth';
import { API_BASE } from '../config/api';

const VoiceChatInterface = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [micPermission, setMicPermission] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [visualLevel, setVisualLevel] = useState(0);
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const checkSpeechRecognitionSupport = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMicPermission(false);
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return false;
    }
    setMicPermission(true);
    return true;
  };

  const setupVisualization = async () => {
    try {
      // Get microphone access for visualization only
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup audio context for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization
      visualizeAudio();

      // Store stream reference to stop it later
      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
        };
      });

    } catch (err) {
      console.log('Visualization setup failed, continuing without visual feedback');
      // Don't set error - speech recognition can still work without visualization
    }
  };

  const startRecording = async () => {
    setError('');
    setTranscript('');
    setEditableTranscript('');
    setIsEditingTranscript(false);

    if (!checkSpeechRecognitionSupport()) return;

    try {
      // Create SpeechRecognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure for Kiswahili
      recognition.lang = 'sw-TZ'; // Kiswahili (Tanzania)
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results with visual indicator
        setTranscript(finalTranscript || interimTranscript + '...');

        // When we get a final result, prepare it for editing
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setEditableTranscript(finalTranscript);
          setIsEditingTranscript(true);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setError(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsRecording(false);
        console.log('Speech recognition ended');
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Setup audio context for visualization (using a dummy stream since we don't have access to the recognition audio)
      setupVisualization();

    } catch (err) {
      console.error('Speech recognition setup error:', err);
      setError('Failed to start speech recognition. Please check microphone permissions.');
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      if (!isRecording && !isSpeaking) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setVisualLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const startSilenceDetection = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const silenceThreshold = 10;
    const silenceDuration = 2000;

    const checkSilence = () => {
      if (!isRecording) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      if (average < silenceThreshold) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording();
          }, silenceDuration);
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      requestAnimationFrame(checkSilence);
    };

    checkSilence();
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const processVoiceMessage = async (transcribedText) => {
    setIsProcessing(true);

    try {
      const token = getValidToken();
      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: transcribedText,
          conversationId: conversationId,
          language: 'sw' // Indicate Kiswahili language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const data = await response.json();

      setResponse(data.reply);

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Play audio response
      await playAudioResponse(data.reply);

    } catch (err) {
      console.error('Message processing error:', err);
      setError('Failed to process message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = async (text) => {
    // Try server-side TTS first
    try {
      const token = getValidToken();
      const ttsResponse = await fetch(`${API_BASE}/chat/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          text,
          voice: 'alloy' // or 'nova', 'shimmer', etc.
        })
      });

      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          // Fallback to browser TTS
          speakWithBrowserTTS(text);
        };
        
        await audio.play();
        return;
      }
    } catch (err) {
      console.log('Server TTS not available, using browser TTS');
    }

    // Fallback to browser TTS
    speakWithBrowserTTS(text);
  };

  const speakWithBrowserTTS = (text) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();
    
    setTimeout(() => {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Detect language
      const isSwahili = /nimeuza|nilinunua|leo|shilingi|pesa/i.test(text);
      utterance.lang = isSwahili ? 'sw-KE' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const sendEditedTranscript = () => {
    if (editableTranscript.trim()) {
      processVoiceMessage(editableTranscript.trim());
      setIsEditingTranscript(false);
    }
  };

  const recordAgain = () => {
    setTranscript('');
    setEditableTranscript('');
    setIsEditingTranscript(false);
    setError('');
    startRecording();
  };

  const cancelEditing = () => {
    setEditableTranscript('');
    setTranscript('');
    setIsEditingTranscript(false);
  };

  const resetConversation = () => {
    setConversationId(null);
    setTranscript('');
    setEditableTranscript('');
    setIsEditingTranscript(false);
    setResponse('');
    setError('');
  };

  // Calculate pulse animation based on state
  const getPulseScale = () => {
    if (isRecording) {
      return 1 + (visualLevel * 0.5);
    }
    if (isSpeaking) {
      return 1.1;
    }
    return 1;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Voice Chat</h1>
          <p className="text-slate-400">Talk naturally, just like ChatGPT</p>
        </div>

        {/* Main Voice Interface */}
        <div className="relative flex flex-col items-center">
          {/* Animated Circle */}
          <div className="relative mb-8">
            <div
              className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/50'
                  : isSpeaking
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 animate-pulse'
                    : isProcessing
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/50'
                      : isEditingTranscript
                        ? 'bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-500/30'
                        : 'bg-gradient-to-br from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 cursor-pointer'
              }`}
              style={{
                transform: `scale(${getPulseScale()})`,
                transition: 'transform 0.1s ease-out'
              }}
              onClick={!isRecording && !isProcessing && !isSpeaking && !isEditingTranscript ? startRecording : undefined}
            >
              {/* Icon */}
              <div className="text-white">
                {isRecording ? (
                  <svg className="w-20 h-20 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                ) : isSpeaking ? (
                  <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                ) : isProcessing ? (
                  <svg className="w-20 h-20 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : isEditingTranscript ? (
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : (
                  <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
              </div>
            </div>

            {/* Outer pulse rings */}
            {(isRecording || isSpeaking) && (
              <>
                <div className={`absolute inset-0 w-48 h-48 rounded-full ${
                  isRecording ? 'bg-red-500' : 'bg-blue-500'
                } opacity-20 animate-ping`} />
                <div className={`absolute inset-0 w-48 h-48 rounded-full ${
                  isRecording ? 'bg-red-500' : 'bg-blue-500'
                } opacity-10 animate-pulse`} style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </div>

          {/* Status Text */}
          <div className="text-center mb-6">
            <p className="text-2xl font-semibold text-white mb-2">
              {isRecording ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Processing...' : isEditingTranscript ? 'Review your message' : 'Tap to talk'}
            </p>
            {isRecording && (
              <p className="text-slate-400 text-sm">Speak naturally, I'll stop when you're done</p>
            )}
            {isEditingTranscript && (
              <p className="text-slate-400 text-sm">Edit your message or send as is</p>
            )}
          </div>

          {/* Controls */}
          {!isEditingTranscript && (
            <div className="flex gap-4 mb-8">
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors"
                >
                  Stop Recording
                </button>
              )}

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-medium transition-colors"
                >
                  Stop Speaking
                </button>
              )}

              {(transcript || response) && !isRecording && !isProcessing && (
                <button
                  onClick={resetConversation}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-medium transition-colors"
                >
                  New Conversation
                </button>
              )}
            </div>
          )}

          {/* Transcript & Response Display */}
          {(transcript || response || isEditingTranscript) && (
            <div className="w-full space-y-4">
              {isEditingTranscript ? (
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-3">Review your message:</p>
                  <textarea
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Edit your transcribed message..."
                    autoFocus
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={sendEditedTranscript}
                      disabled={!editableTranscript.trim() || isProcessing}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      Send Message
                    </button>
                    <button
                      onClick={recordAgain}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Record Again
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : transcript && !isEditingTranscript ? (
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">You said:</p>
                  <p className="text-white text-lg">{transcript}</p>
                </div>
              ) : null}

              {response && (
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-blue-700/50">
                  <p className="text-xs text-blue-300 mb-2">AI replied:</p>
                  <p className="text-white text-lg">{response}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full mt-4 bg-red-900/30 border border-red-700 rounded-xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Permission Notice */}
          {micPermission === false && (
            <div className="w-full mt-4 bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
              <p className="text-yellow-300 text-sm">
                Microphone access is required for voice chat. Please enable it in your browser settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChatInterface;
