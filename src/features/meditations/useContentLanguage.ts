import { useEffect, useState } from "react";
import {
  getPreferredContentLanguage,
  setPreferredContentLanguage,
  type ContentLanguage,
} from "@/utils/contentLanguage";

export function useContentLanguage() {
  const [language, setLanguage] = useState<ContentLanguage>(() =>
    getPreferredContentLanguage()
  );

  useEffect(() => {
    setPreferredContentLanguage(language);
  }, [language]);

  return { language, setLanguage };
}
