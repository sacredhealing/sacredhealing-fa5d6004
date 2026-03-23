import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Shield, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';
import { chatSpeechLocale } from '@/lib/chatSpeechLocale';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface AyurvedaLiveDoctorProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayurveda-chat`;

export const AyurvedaLiveDoctor: React.FC<AyurvedaLiveDoctorProps> = ({ profile, dosha }) => {
  const { t, language } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'doctor'; text: string }[]>([]);
  const [currentUserText, setCurrentUserText] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      const speechLocale = chatSpeechLocale(language);
      utterance.lang = speechLocale;
      
      // Prefer a voice matching the session language
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = speechLocale.split('-')[0];
      const preferredVoice =
        voices.find((v) => v.lang.startsWith(speechLocale)) ||
        voices.find((v) => v.lang.startsWith(langPrefix)) ||
        voices.find((v) => v.name.includes('Samantha') || v.name.includes('Karen') || v.lang.includes('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Resume listening after speaking
        if (isActive && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            // Already started
          }
        }
      };
      
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isActive, language]);

  const sendToDoctor = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    // Add user message to transcription
    setTranscription(prev => [...prev, { role: 'user', text: userText }]);
    messagesRef.current = [...messagesRef.current, { role: 'user', content: userText }];

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesRef.current,
          profile,
          dosha,
          language,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let doctorResponse = '';

      // Add empty doctor message
      setTranscription(prev => [...prev, { role: 'doctor', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              doctorResponse += content;
              setTranscription(prev => {
                const newTranscription = [...prev];
                newTranscription[newTranscription.length - 1] = { role: 'doctor', text: doctorResponse };
                return newTranscription;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Store assistant message
      messagesRef.current = [...messagesRef.current, { role: 'assistant', content: doctorResponse }];

      // Speak the response
      if (doctorResponse) {
        speakText(doctorResponse);
      }
    } catch (error) {
      console.error('Doctor error:', error);
      const errorMsg = t('ayurvedaLive.connectionInterrupted', 'Forgive me, my connection was interrupted. Please speak again.');
      setTranscription(prev => [...prev, { role: 'doctor', text: errorMsg }]);
      speakText(errorMsg);
    }
  }, [profile, dosha, speakText, language, t]);

  const startSession = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error(t('ayurvedaLive.speechNotSupported', 'Speech recognition is not supported in this browser. Please use Chrome.'));
        setIsConnecting(false);
        return;
      }

      // Load voices for speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create speech recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = chatSpeechLocale(language);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Restart if still active and not speaking
        if (isActive && !isSpeaking) {
          try {
            recognition.start();
          } catch (e) {
            // Already started
          }
        }
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

        setCurrentUserText(interimTranscript);

        if (finalTranscript) {
          setCurrentUserText('');
          // Stop recognition while processing
          recognition.stop();
          setIsListening(false);
          sendToDoctor(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error(t('ayurvedaLive.micDenied', 'Microphone access denied. Please allow microphone access.'));
        }
      };

      recognitionRef.current = recognition;
      
      // Start session
      setIsActive(true);
      setTranscription([]);
      messagesRef.current = [];
      
      // Send initial greeting
      const name = profile?.name || t('ayurvedaLive.dearSeeker', 'dear seeker');
      const doshaLine = dosha?.primary
        ? t('ayurvedaLive.greetingDosha', { defaultValue: 'I see you have a {{primary}} constitution. ', primary: dosha.primary })
        : '';
      const greeting = t('ayurvedaLive.greetingFull', {
        defaultValue: 'Namaste {{name}}! I am your Ayurvedic doctor. {{doshaLine}}How may I guide you on your healing journey today?',
        name,
        doshaLine,
      });
      
      setTranscription([{ role: 'doctor', text: greeting }]);
      messagesRef.current = [{ role: 'assistant', content: greeting }];
      
      // Speak greeting and start listening after
      speakText(greeting);
      
      toast.success(t('ayurvedaLive.connected', 'Connected to Live Doctor'));
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error(t('ayurvedaLive.startSessionFail', 'Could not start session. Please grant microphone permission and try again.'));
    } finally {
      setIsConnecting(false);
    }
  }, [profile, dosha, speakText, sendToDoctor, isActive, isSpeaking, language, t]);

  const endSession = useCallback(() => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentUserText('');
    
    toast.info(t('ayurvedaLive.sessionEnded', 'Session ended. Namaste 🙏'));
  }, [t]);

  const handleToggleSession = () => {
    if (isActive) {
      endSession();
    } else {
      startSession();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden border-2 border-amber-500/20">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('ayurvedaLive.badgeLifetime', 'Lifetime Exclusive')}
          </Badge>
          <h2 className="text-2xl font-serif mb-2">{t('ayurvedaLive.liveTitle', 'Live Audio Consultation')}</h2>
          <p className="text-sm opacity-80">
            {t('ayurvedaLive.liveSubtitle', 'Real-time voice session with your AI Ayurvedic Doctor')}
          </p>
          {profile && dosha && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl inline-block">
              <p className="text-sm">
                {profile.name} • <span className="opacity-80">{dosha.primary} Prakriti</span>
              </p>
            </div>
          )}
        </div>

        {/* Main Call Interface */}
        <div className="p-8 bg-gradient-to-b from-background to-muted/30">
          <div className="relative flex flex-col items-center">
            {/* Pulsing Aura when active */}
            {isActive && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className={`w-48 h-48 rounded-full ${isSpeaking ? 'bg-amber-500/10' : 'bg-emerald-500/10'} animate-ping`} />
                <div className={`absolute w-40 h-40 rounded-full ${isSpeaking ? 'bg-amber-500/20' : 'bg-emerald-500/20'} animate-pulse`} />
              </motion.div>
            )}

            {/* Call Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Button
                onClick={handleToggleSession}
                disabled={isConnecting}
                className={`w-32 h-32 rounded-full text-white shadow-2xl transition-all ${
                  isActive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                }`}
              >
                {isConnecting ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : isActive ? (
                  <PhoneOff className="w-12 h-12" />
                ) : (
                  <Phone className="w-12 h-12" />
                )}
              </Button>
            </motion.div>

            {/* Status Text */}
            <p className="mt-6 text-lg font-medium text-foreground">
              {isConnecting
                ? t('ayurvedaLive.statusConnecting', 'Connecting...')
                : isActive
                  ? isSpeaking
                    ? t('ayurvedaLive.statusDoctorSpeaking', 'Doctor Speaking...')
                    : t('ayurvedaLive.statusListening', 'Listening...')
                  : t('ayurvedaLive.statusTapToBegin', 'Tap to Begin')}
            </p>

            {/* Current User Speech */}
            {currentUserText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-muted-foreground italic"
              >
                "{currentUserText}..."
              </motion.p>
            )}

            {/* Audio Indicators */}
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mt-4"
              >
                <div className={`flex items-center gap-2 ${isListening ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                  <span className="text-xs">{isListening ? t('ayurvedaLive.labelListening', 'Listening') : t('ayurvedaLive.labelPaused', 'Paused')}</span>
                </div>
                <div className={`flex items-center gap-2 ${isSpeaking ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  <span className="text-xs">{isSpeaking ? t('ayurvedaLive.labelSpeaking', 'Speaking') : t('ayurvedaLive.labelSilent', 'Silent')}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Live Transcription */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
              {t('ayurvedaLive.liveTranscription', 'Live Transcription')}
            </h3>
            <ScrollArea className="h-[200px]">
              <div ref={scrollRef} className="bg-muted/50 rounded-2xl p-4 min-h-[180px]">
                {transcription.length === 0 ? (
                  <p className="text-center text-muted-foreground/50 text-sm py-8">
                    {t('ayurvedaLive.sessionNotStarted', 'Session not started...')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transcription.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: item.role === 'user' ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-sm ${
                          item.role === 'user' 
                            ? 'text-emerald-600 text-right' 
                            : 'text-foreground'
                        }`}
                      >
                        <span className="font-medium">
                          {item.role === 'user' ? `${t('ayurvedaLive.roleYou', 'You')}: ` : `${t('ayurvedaLive.roleDoctor', 'Doctor')}: `}
                        </span>
                        {item.text}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Security Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-xs">{t('ayurvedaLive.encryptedFooter', 'Encrypted & Private Live Session')}</span>
        </div>
      </CardContent>
    </Card>
  );
};
