export interface ModuleContent {
  title: { en: string; sv: string };
  objective: { en: string; sv: string };
  videoScript: {
    sections: Array<{
      label: { en: string; sv: string };
      content: { en: string; sv: string };
    }>;
  };
  meditationScript: { en: string; sv: string };
  workbook: {
    reflectionQuestions: Array<{ en: string; sv: string }>;
    practicalExercise: { en: string; sv: string };
  };
  socialHook: { en: string; sv: string };
}

export interface CourseModule {
  id: number;
  month: number;
  topic: string;
  content?: ModuleContent;
}

export type Language = 'en' | 'sv';
