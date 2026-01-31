'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceState, Message, ChatResponse } from '@/types';
import { DEFAULT_MODEL, GREETING_MESSAGE, getModelById, AIProvider } from '@/constants/ai';

// Configuration
const SPEECH_DELAY_MS = 2500;
const MAX_NETWORK_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 1000;

// Clean text for TTS
const cleanTextForTTS = (text: string): string => {
    return text
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

interface UseVoiceAIOptions {
    onStateChange?: (state: VoiceState) => void;
    onTranscript?: (text: string) => void;
    onResponse?: (text: string) => void;
    onError?: (error: string) => void;
    initialModel?: string;
}

interface UseVoiceAIReturn {
    state: VoiceState;
    transcript: string;
    response: string;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string) => void;
    stopSpeaking: () => void;
    messages: Message[];
    greet: () => void;
    currentModel: string;
    setCurrentModel: (modelId: string) => void;
    networkError: boolean;
}

export const useVoiceAI = (options: UseVoiceAIOptions = {}): UseVoiceAIReturn => {
    // State
    const [state, setState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSupported, setIsSupported] = useState(false);
    const [currentModel, setCurrentModel] = useState(options.initialModel || DEFAULT_MODEL);
    const [networkError, setNetworkError] = useState(false);

    // Refs for mutable values (Strict Mode safe)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
    const messagesRef = useRef<Message[]>([]);
    const optionsRef = useRef(options);
    
    // STT tracking refs (prevents stale closure issues)
    const finalizedCountRef = useRef<number>(0);
    const committedTranscriptRef = useRef<string>('');
    const isListeningRef = useRef<boolean>(false);
    
    // Timers
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const networkRetryCountRef = useRef<number>(0);

    // Sync refs with state/props
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // TTS speak function
    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        console.log('[TTS] Speaking:', text.substring(0, 50) + '...');
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(
            (voice) => voice.lang.includes('id') || voice.lang.includes('ID')
        );
        if (indonesianVoice) {
            utterance.voice = indonesianVoice;
        }

        utterance.onstart = () => {
            console.log('[TTS] Started speaking');
            setState('speaking');
            optionsRef.current.onStateChange?.('speaking');
        };

        utterance.onend = () => {
            console.log('[TTS] Finished speaking');
            setState('idle');
            optionsRef.current.onStateChange?.('idle');
        };

        utterance.onerror = (event) => {
            const errorType = String(event.error || '');
            if (!errorType.includes('interrupt') && !errorType.includes('cancel') && errorType) {
                console.warn('[TTS] Error:', errorType);
            }
            setState('idle');
        };

        synthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, []);

    // Process message with AI
    const processMessage = useCallback(async (userMessage: string) => {
        console.log('[AI] Processing message:', userMessage);
        setState('processing');
        optionsRef.current.onStateChange?.('processing');

        const newUserMessage: Message = { role: 'user', content: userMessage };
        setMessages((prev) => [...prev, newUserMessage]);

        try {
            const modelInfo = getModelById(currentModel);
            const provider: AIProvider = modelInfo?.provider || 'gemini';

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    model: currentModel,
                    provider: provider,
                    history: messagesRef.current.slice(-10),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorDetail = errorData?.details || 'Unknown error';
                
                // Check for quota/rate limit errors
                if (errorDetail.includes('Quota') || errorDetail.includes('Rate limit')) {
                    throw new Error('QUOTA_EXCEEDED');
                }
                throw new Error(errorDetail);
            }

            const data: ChatResponse = await res.json();
            const aiResponse = data.choices?.[0]?.message?.content || 'Maaf, terjadi kesalahan.';
            const cleanResponse = cleanTextForTTS(aiResponse);

            setResponse(cleanResponse);
            optionsRef.current.onResponse?.(cleanResponse);

            const newAssistantMessage: Message = { role: 'assistant', content: cleanResponse };
            setMessages((prev) => [...prev, newAssistantMessage]);

            speak(cleanResponse);
        } catch (error) {
            console.error('[AI] Error:', error);
            setState('idle');
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            if (errorMessage === 'QUOTA_EXCEEDED') {
                const quotaMessage = 'Maaf, kuota API sudah habis untuk hari ini. Silakan coba lagi besok atau hubungi administrator.';
                setResponse(quotaMessage);
                speak(quotaMessage);
            } else {
                setResponse('Maaf, terjadi kesalahan koneksi. Silakan coba lagi.');
            }
            
            optionsRef.current.onError?.('Gagal mendapatkan respons dari AI');
        }
    }, [speak, currentModel]);

    const processMessageRef = useRef(processMessage);
    useEffect(() => {
        processMessageRef.current = processMessage;
    }, [processMessage]);

    // Schedule processing after speech delay
    const scheduleProcessing = useCallback((finalText: string) => {
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
        }

        console.log(`[STT] Scheduling processing in ${SPEECH_DELAY_MS}ms...`);

        speechTimeoutRef.current = setTimeout(() => {
            const textToProcess = finalText.trim();
            if (textToProcess) {
                console.log('[STT] Processing:', textToProcess);

                // Stop recognition
                if (recognitionRef.current) {
                    try {
                        recognitionRef.current.stop();
                    } catch {
                        // Ignore
                    }
                }

                isListeningRef.current = false;
                processMessageRef.current(textToProcess);
            }
            speechTimeoutRef.current = null;
        }, SPEECH_DELAY_MS);
    }, []);

    // Initialize Speech Recognition - STRICT MODE SAFE
    useEffect(() => {
        if (typeof window === 'undefined') return;

        console.log('[STT] useEffect running - initializing...');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const hasSpeechRecognition = !!SpeechRecognitionAPI;
        const hasSpeechSynthesis = 'speechSynthesis' in window;

        setIsSupported(hasSpeechRecognition && hasSpeechSynthesis);

        if (hasSpeechSynthesis) {
            window.speechSynthesis.getVoices();
        }

        if (!hasSpeechRecognition) return;

        // Create new recognition instance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';
        recognition.maxAlternatives = 1;

        // Event handlers using refs (prevents stale closures)
        recognition.onstart = () => {
            console.log('[STT] Recognition started');
            // Reset counters on fresh start
            finalizedCountRef.current = 0;
            committedTranscriptRef.current = '';
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            // Guard: only process if we're actually listening
            if (!isListeningRef.current) {
                console.log('[STT] Ignoring result - not in listening mode');
                return;
            }

            let interimTranscript = '';
            const resultsLength = event.results.length;
            
            // Process only new results (from where we left off)
            for (let i = finalizedCountRef.current; i < resultsLength; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    // Commit final result
                    const trimmedText = text.trim();
                    if (trimmedText) {
                        committedTranscriptRef.current += (committedTranscriptRef.current ? ' ' : '') + trimmedText;
                    }
                    finalizedCountRef.current = i + 1;
                    console.log('[STT] Final committed:', committedTranscriptRef.current);
                } else {
                    // Interim - just for display
                    interimTranscript += text;
                }
            }

            // Build display text
            const displayText = (committedTranscriptRef.current + (interimTranscript ? ' ' + interimTranscript : '')).trim();
            
            console.log('[STT] Display:', displayText);
            setTranscript(displayText);
            optionsRef.current.onTranscript?.(displayText);

            // Schedule processing when we get a final result
            const lastResult = event.results[resultsLength - 1];
            if (lastResult.isFinal && committedTranscriptRef.current) {
                scheduleProcessing(committedTranscriptRef.current);
            }
        };

        recognition.onspeechstart = () => {
            console.log('[STT] Speech detected');
            // Cancel pending processing if user continues speaking
            if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
                speechTimeoutRef.current = null;
                console.log('[STT] Cancelled pending timeout - user still speaking');
            }
        };

        recognition.onspeechend = () => {
            console.log('[STT] Speech ended');
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error('[STT] Error:', event.error);

            if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
                speechTimeoutRef.current = null;
            }

            if (event.error === 'no-speech') {
                return; // Ignore, keep listening
            }

            if (event.error === 'network' && networkRetryCountRef.current < MAX_NETWORK_RETRIES) {
                networkRetryCountRef.current++;
                setNetworkError(true);
                
                const delay = RETRY_DELAY_BASE_MS * networkRetryCountRef.current;
                retryTimeoutRef.current = setTimeout(() => {
                    if (isListeningRef.current && recognitionRef.current) {
                        try {
                            recognitionRef.current.start();
                        } catch {
                            // Ignore
                        }
                    }
                }, delay);
                return;
            }

            // Final error - reset state
            isListeningRef.current = false;
            setState('idle');
            setNetworkError(false);
            networkRetryCountRef.current = 0;
            optionsRef.current.onError?.('Speech recognition error');
        };

        recognition.onend = () => {
            console.log('[STT] Recognition ended');

            // If there's a pending timeout, let it handle state
            if (speechTimeoutRef.current) {
                return;
            }

            // Otherwise, if we were listening, go back to idle
            if (isListeningRef.current) {
                isListeningRef.current = false;
                setState('idle');
            }
        };

        recognitionRef.current = recognition;
        console.log('[STT] Recognition initialized');

        // CLEANUP - Critical for Strict Mode
        return () => {
            console.log('[STT] Cleanup running...');

            // Clear all timers
            if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
                speechTimeoutRef.current = null;
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }

            // Stop and nullify recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // Ignore
                }
                // Remove all listeners to prevent ghost callbacks
                recognitionRef.current.onstart = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.onspeechstart = null;
                recognitionRef.current.onspeechend = null;
                recognitionRef.current = null;
            }

            // Stop TTS
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            isListeningRef.current = false;
            console.log('[STT] Cleanup complete');
        };
    }, [scheduleProcessing]);

    // Start listening
    const startListening = useCallback(() => {
        console.log('[STT] startListening called');

        if (!recognitionRef.current) {
            console.error('[STT] Recognition not available');
            return;
        }

        if (state !== 'idle') {
            console.log('[STT] Cannot start - not idle, current state:', state);
            return;
        }

        // Prevent double-start
        if (isListeningRef.current) {
            console.log('[STT] Already listening - ignoring');
            return;
        }

        // Stop TTS if playing
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        // Reset all tracking
        setTranscript('');
        finalizedCountRef.current = 0;
        committedTranscriptRef.current = '';
        setNetworkError(false);
        networkRetryCountRef.current = 0;

        // Clear timers
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        // Set flags BEFORE starting
        isListeningRef.current = true;
        setState('listening');
        optionsRef.current.onStateChange?.('listening');

        try {
            recognitionRef.current.start();
            console.log('[STT] Recognition started successfully');
        } catch (error: unknown) {
            const err = error as Error;
            // Handle "already started" gracefully
            if (err.name === 'InvalidStateError') {
                console.log('[STT] Recognition already running');
            } else {
                console.error('[STT] Failed to start:', error);
                isListeningRef.current = false;
                setState('idle');
            }
        }
    }, [state]);

    // Stop listening
    const stopListening = useCallback(() => {
        console.log('[STT] stopListening called');

        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
        }

        isListeningRef.current = false;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // Ignore
            }
        }

        setState('idle');
        optionsRef.current.onStateChange?.('idle');
    }, []);

    // Stop speaking
    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setState('idle');
        optionsRef.current.onStateChange?.('idle');
    }, []);

    // Greet user
    const greet = useCallback(() => {
        speak(GREETING_MESSAGE);
        setResponse(GREETING_MESSAGE);
    }, [speak]);

    return {
        state,
        transcript,
        response,
        isSupported,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        messages,
        greet,
        currentModel,
        setCurrentModel,
        networkError,
    };
};
