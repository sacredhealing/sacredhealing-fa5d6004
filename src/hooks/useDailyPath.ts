import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { IntentionType } from '@/components/meditation/IntentionThreshold';

export interface DailyPathSuggestion {
  intention: IntentionType;
  message: string;
  practiceTitle: string;
  practiceRoute: string;
  createdAt: string;
}

const STORAGE_KEY = 'sacred-healing-daily-path';

// Suggestion mapping based on intention
const INTENTION_SUGGESTIONS: Record<IntentionType, { message: string; practiceTitle: string; practiceRoute: string }> = {
  healing: {
    message: 'Your soul felt heavy today. Would you like to try the Heart-Opening Breath tomorrow?',
    practiceTitle: 'Heart-Opening Breath',
    practiceRoute: '/breathing',
  },
  anxiety: {
    message: 'Your soul felt heavy today. Would you like to try the Heart-Opening Breath tomorrow?',
    practiceTitle: 'Heart-Opening Breath',
    practiceRoute: '/breathing',
  },
  focus: {
    message: 'You sought clarity today. Would you like to energize with the Morning Solar Breath tomorrow?',
    practiceTitle: 'Morning Solar Breath',
    practiceRoute: '/breathing',
  },
  peace: {
    message: 'You sought tranquility today. Continue your journey with a gentle meditation tomorrow.',
    practiceTitle: 'Peaceful Morning Meditation',
    practiceRoute: '/meditations',
  },
  release: {
    message: 'You let go of what no longer serves you. Tomorrow, try a grounding breathwork session.',
    practiceTitle: 'Grounding Breath',
    practiceRoute: '/breathing',
  },
};

export const useDailyPath = () => {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<DailyPathSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setSuggestion(parsed);
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
  }, [user]);

  // Save a new suggestion based on intention
  const saveSuggestion = useCallback((intention: IntentionType) => {
    if (!user) return;

    const suggestionConfig = INTENTION_SUGGESTIONS[intention];
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
  }, [user]);

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

  // Get the suggestion config for an intention (for preview)
  const getSuggestionForIntention = useCallback((intention: IntentionType) => {
    return INTENTION_SUGGESTIONS[intention] || null;
  }, []);

  return {
    suggestion,
    isLoading,
    saveSuggestion,
    clearSuggestion,
    getSuggestionForIntention,
  };
};
