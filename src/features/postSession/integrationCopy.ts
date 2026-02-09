import type { PostSessionContext } from './sessionContext';

export type PostSessionEmotion = 'softer' | 'clear' | 'still-heavy' | 'restless';

export interface IntegrationUI {
  message: string;
  ctaLabel: string;
  ctaRoute: string;
}

function inferEmotion(ctx: PostSessionContext): PostSessionEmotion {
  const { depth, userState } = ctx;
  if (userState === 'heavy') return 'still-heavy';
  if (depth === 'deep') return 'clear';
  if (depth === 'medium') return 'softer';
  if (userState === 'engaged' && depth === 'light') return 'restless';
  return 'softer';
}

const EMOTION_RESPONSES: Record<PostSessionEmotion, IntegrationUI> = {
  softer: {
    message: 'Notice the softening. Gentle acceptance is the practice.',
    ctaLabel: 'Stay with a 2-minute comfort',
    ctaRoute: '/breathing?quick=true',
  },
  clear: {
    message: 'Notice the clarity before the mind fills it again.',
    ctaLabel: 'Continue your day gently',
    ctaRoute: '/dashboard',
  },
  'still-heavy': {
    message: "Some things take more than one sitting. Let's not push — just support the nervous system.",
    ctaLabel: 'Stay with a 2-minute comfort',
    ctaRoute: '/breathing?quick=true',
  },
  restless: {
    message: 'Restlessness is part of the process. No need to fix it.',
    ctaLabel: 'Try a 2-minute grounding',
    ctaRoute: '/breathing?quick=true',
  },
};

export function getIntegrationUI(
  ctx: PostSessionContext,
  emotionAfter?: PostSessionEmotion | null
): IntegrationUI {
  const emotion = emotionAfter ?? inferEmotion(ctx);
  return EMOTION_RESPONSES[emotion];
}
