import { useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useLanguage } from '../i18n/LanguageContext';
import { useLocale } from './useLocale';

/**
 * Voice input for expense logging (spec §1 core differentiator, §2 Voice
 * Device speech recognition may use an OS/provider network service; this
 * hook does not enforce on-device-only processing.
 *
 * Hook contract:
 *   const { isListening, transcript, isAvailable, start, stop, reset } =
 *     useVoiceInput();
 *
 *   - start() requests mic + speech permissions (if needed) and opens the
 *     recognizer. Safe to call again to restart.
 *   - stop() gracefully finalises the current utterance.
 *   - transcript is the best current partial/final result; it updates as
 *     the user speaks. Pair with a useEffect to feed it into your
 *     description field.
 */
export interface VoiceInputState {
  isAvailable: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useVoiceInput(): VoiceInputState {
  const { locale } = useLocale();
  const { language, phrase } = useLanguage();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // `isRecognitionAvailable` throws on web — wrap in try so the hook can
    // still report false cleanly.
    try {
      setIsAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
    } catch {
      setIsAvailable(false);
    }
    return () => {
      mountedRef.current = false;
      // Belt-and-braces: ensure we don't leave a recogniser open if the
      // screen unmounts mid-recording.
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    if (mountedRef.current) setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    if (mountedRef.current) setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (!mountedRef.current) return;
    // result.results is an array of hypotheses; the first is the best guess.
    const text = event.results?.[0]?.transcript ?? '';
    if (text) setTranscript(text);
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (!mountedRef.current) return;
    // "no-speech" and "aborted" are user-driven, don't surface as errors.
    if (event.error === 'no-speech' || event.error === 'aborted') {
      setIsListening(false);
      return;
    }
    setError(phrase('Speech recognition failed. Try again.'));
    setIsListening(false);
  });

  const start = async () => {
    setError(null);
    setTranscript('');
    try {
      const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perms.granted) {
        setError(phrase('Allow microphone and speech access in device settings.'));
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: language === 'hi' ? 'hi-IN' : locale.localeTag,
        interimResults: true,
        // en-IN + noun biasing for Indian merchants could go here later.
      });
    } catch {
      setError(phrase('Could not start speech recognition. Try again.'));
    }
  };

  const stop = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* noop */
    }
  };

  const reset = () => {
    setTranscript('');
    setError(null);
  };

  return { isAvailable, isListening, transcript, error, start, stop, reset };
}
