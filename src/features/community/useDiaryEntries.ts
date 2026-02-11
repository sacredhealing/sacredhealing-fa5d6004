import { DiaryEntry } from "./diaryTypes";

export function useDiaryEntries(): DiaryEntry[] {
  // Replace later with Supabase fetch
  return [
    {
      id: "daily-1",
      type: "daily",
      title: "🌅 Today's Note",
      body:
        "Today felt quieter than usual. Many people mentioned heavier sleep and slower mornings. If you feel low energy, let the day move gently.",
      createdAt: new Date().toISOString(),
      author: "admin",
    },
    {
      id: "weekly-1",
      type: "weekly",
      title: "🌿 This Week's Reflection",
      body:
        "This week showed a shift from restlessness into grounding. Emotional waves are part of integration — nothing to fix.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      author: "admin",
    },
  ];
}
