export type ContentLanguage = "sv" | "en";

const KEY = "shc_content_language_v1";

export function getPreferredContentLanguage(): ContentLanguage {
  const v = localStorage.getItem(KEY);
  return v === "en" ? "en" : "sv";
}

export function setPreferredContentLanguage(lang: ContentLanguage) {
  localStorage.setItem(KEY, lang);
}
