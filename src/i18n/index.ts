import { en } from "./translations/en";
import { sv } from "./translations/sv";

export const supportedLanguages = ["en", "sv"] as const;
export type Language = (typeof supportedLanguages)[number];

export const translations = { en, sv } as const;

type Dict = Record<string, any>;

function getByPath(obj: Dict, path: string): unknown {
  return path.split(".").reduce((acc: any, key) => (acc ? acc[key] : undefined), obj);
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) =>
    vars[k] === undefined || vars[k] === null ? "" : String(vars[k])
  );
}

const warned = new Set<string>();
function warnMissing(key: string, lang: Language) {
  if (process.env.NODE_ENV === "production") return;
  const id = `${lang}:${key}`;
  if (warned.has(id)) return;
  warned.add(id);
  // eslint-disable-next-line no-console
  console.warn(`[i18n] Missing key "${key}" for lang "${lang}" (fallback to en)`);
}

export function createT(lang: Language) {
  return function t(key: string, vars?: Record<string, string | number>) {
    const primary = getByPath(translations[lang] as unknown as Dict, key);
    if (typeof primary === "string") return interpolate(primary, vars);

    const fallback = getByPath(translations.en as unknown as Dict, key);
    if (typeof fallback === "string") {
      warnMissing(key, lang);
      return interpolate(fallback, vars);
    }

    warnMissing(key, lang);
    return key; // last resort, shows obvious missing key
  };
}

