export type DiaryType = "daily" | "weekly" | "monthly" | "yearly";

export interface DiaryEntry {
  id: string;
  type: DiaryType;
  title: string;
  body: string;
  createdAt: string;
  author: "admin";
}
