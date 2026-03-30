type TFn = (key: string, ...args: any[]) => string;

const GENRE_KEYS: Record<string, string> = {
  all: 'music.portal.filterAll',
  beats: 'music.genreBeats',
  meditation: 'music.genreMeditation',
  mystic: 'music.genreMystic',
  reggae: 'music.genreReggae',
  'hip-hop': 'music.genreHipHop',
  reggaeton: 'music.genreReggaeton',
  indian: 'music.genreIndian',
  shamanic: 'music.genreShamanic',
};

const MOOD_KEYS: Record<string, string> = {
  calm: 'music.portal.moodCalm',
  energizing: 'music.portal.moodEnergizing',
  healing: 'music.portal.moodHealing',
  meditative: 'music.portal.moodMeditative',
  grounding: 'music.portal.moodGrounding',
  focused: 'music.moodFocused',
};

const PATH_KEYS: Record<string, string> = {
  inner_peace: 'music.portal.pathInnerPeace',
  focus: 'music.portal.pathFocus',
  sleep: 'music.portal.pathSleep',
  healing: 'music.portal.pathDeepHealing',
  awakening: 'music.portal.pathAwakening',
};

export function tMusicGenre(genre: string, t: TFn): string {
  const key = GENRE_KEYS[genre];
  if (key) return t(key);
  return genre.charAt(0).toUpperCase() + genre.slice(1).replace('-', ' ');
}

export function tMusicMood(mood: string, t: TFn): string {
  const key = MOOD_KEYS[mood];
  if (key) return t(key);
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

export function tMusicSpiritualPath(path: string, t: TFn): string {
  const key = PATH_KEYS[path];
  if (key) return t(key);
  return path
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const TIME_KEYS: Record<string, string> = {
  morning: 'music.trackTimeMorning',
  midday: 'music.trackTimeMidday',
  evening: 'music.trackTimeEvening',
  sleep: 'music.trackTimeSleep',
};

const ENERGY_KEYS: Record<string, string> = {
  high: 'music.energyHigh',
  medium: 'music.energyMedium',
  low: 'music.energyLow',
};

export function tMusicTimeOfDay(time: string, t: TFn): string {
  const key = TIME_KEYS[time];
  if (key) return t(key);
  return time.charAt(0).toUpperCase() + time.slice(1);
}

export function tMusicEnergyLevel(level: string, t: TFn): string {
  const key = ENERGY_KEYS[level];
  if (key) return t(key);
  return level.charAt(0).toUpperCase() + level.slice(1);
}
