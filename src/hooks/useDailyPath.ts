import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';
import type { IntentionType } from '@/components/meditation/IntentionThreshold';

export interface DailyPathSuggestion {
  intention: IntentionType;
  message: string;
  practiceTitle: string;
  practiceRoute: string;
  createdAt: string;
}

const STORAGE_KEY = 'sacred-healing-daily-path';

export const useDailyPath = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [suggestion, setSuggestion] = useState<DailyPathSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get translated suggestion based on intention
  const getSuggestionForIntention = useCallback((intention: IntentionType) => {
    const messageKey = `dashboard.dailyPath.${intention}.message`;
    const practiceTitleKey = `dashboard.dailyPath.${intention}.practiceTitle`;
    const practiceRouteMap: Record<IntentionType, string> = {
      healing: '/breathing',
      anxiety: '/breathing',
      focus: '/breathing',
      peace: '/meditations',
      release: '/breathing',
    };

    return {
      message: t(messageKey),
      practiceTitle: t(practiceTitleKey),
      practiceRoute: practiceRouteMap[intention] || '/meditations',
    };
  }, [t]);

  // Load suggestion from localStorage
  useEffect(() => {
    if (!user) {
      setSuggestion(null);
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
      if (stored) {
        const parsed: DailyPathSuggestion = JSON.parse(stored);
        // Check if suggestion is from today
        const suggestionDate = new Date(parsed.createdAt).toDateString();
        const today = new Date().toDateString();
        
        if (suggestionDate === today) {
          // Translate the stored suggestion based on current language
          const translated = getSuggestionForIntention(parsed.intention);
          setSuggestion({
            ...parsed,
            message: translated.message,
            practiceTitle: translated.practiceTitle,
          });
        } else {
          // Clear stale suggestions
          localStorage.removeItem(`${STORAGE_KEY}-${user.id}`);
          setSuggestion(null);
        }
      }
    } catch (error) {
      console.error('Error loading daily path:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getSuggestionForIntention]);

  // Save a new suggestion based on intention
  const saveSuggestion = useCallback((intention: IntentionType) => {
    if (!user) return;

    const suggestionConfig = getSuggestionForIntention(intention);
    if (!suggestionConfig) return;

    const newSuggestion: DailyPathSuggestion = {
      intention,
      message: suggestionConfig.message,
      practiceTitle: suggestionConfig.practiceTitle,
      practiceRoute: suggestionConfig.practiceRoute,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(newSuggestion));
      setSuggestion(newSuggestion);
    } catch (error) {
      console.error('Error saving daily path:', error);
    }
  }, [user, getSuggestionForIntention]);

  // Clear the suggestion (e.g., when user follows the suggestion)
  const clearSuggestion = useCallback(() => {
    if (!user) return;
    
    try {
      localStorage.removeItem(`${STORAGE_KEY}-${user.id}`);
      setSuggestion(null);
    } catch (error) {
      console.error('Error clearing daily path:', error);
    }
  }, [user]);

  return {
    suggestion,
    isLoading,
    saveSuggestion,
    clearSuggestion,
    getSuggestionForIntention,
  };
};
