export interface PostSessionContext {
  dayPhase?: string;
  userState?: string;
  streakDays?: number;
  depth?: string;
  durationSec?: number;
  completed?: boolean;
  item?: {
    id?: string;
    title?: string;
    contentType?: string;
  };
}
