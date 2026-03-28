import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sv from './locales/sv.json';
import es from './locales/es.json';
import no from './locales/no.json';
import { deepMergeLocales } from './deepMergeLocales';
import { templeHomeEn } from './locales/templeHome';
import { templeHomeSvPartial } from './locales/templeHome/templeHomeSvPartial';
import { templeHomeEsPartial } from './locales/templeHome/templeHomeEsPartial';
import { templeHomeNoPartial } from './locales/templeHome/templeHomeNoPartial';
import { quantumApothecaryEn } from './locales/quantumApothecary';
import { quantumApothecarySvPartial } from './locales/quantumApothecary/quantumApothecarySvPartial';
import { quantumApothecaryEsPartial } from './locales/quantumApothecary/quantumApothecaryEsPartial';
import { quantumApothecaryNoPartial } from './locales/quantumApothecary/quantumApothecaryNoPartial';
import { vayuProtocolEn } from './locales/vayuProtocol';
import { vayuProtocolSvPartial } from './locales/vayuProtocol/vayuProtocolSvPartial';
import { vayuProtocolEsPartial } from './locales/vayuProtocol/vayuProtocolEsPartial';
import { vayuProtocolNoPartial } from './locales/vayuProtocol/vayuProtocolNoPartial';
import { sriYantraShieldEn } from './locales/sriYantraShield';
import { sriYantraShieldSvPartial } from './locales/sriYantraShield/sriYantraShieldSvPartial';
import { sriYantraShieldEsPartial } from './locales/sriYantraShield/sriYantraShieldEsPartial';
import { sriYantraShieldNoPartial } from './locales/sriYantraShield/sriYantraShieldNoPartial';
import { digitalNadiEn } from './locales/digitalNadi';
import { digitalNadiSvPartial } from './locales/digitalNadi/digitalNadiSvPartial';
import { digitalNadiEsPartial } from './locales/digitalNadi/digitalNadiEsPartial';
import { digitalNadiNoPartial } from './locales/digitalNadi/digitalNadiNoPartial';
import { vajraSkyBreakerEn } from './locales/vajraSkyBreaker';
import { vajraSkyBreakerSvPartial } from './locales/vajraSkyBreaker/vajraSkyBreakerSvPartial';
import { vajraSkyBreakerEsPartial } from './locales/vajraSkyBreaker/vajraSkyBreakerEsPartial';
import { vajraSkyBreakerNoPartial } from './locales/vajraSkyBreaker/vajraSkyBreakerNoPartial';
import { wealthBeaconEn } from './locales/wealthBeacon';
import { wealthBeaconSvPartial } from './locales/wealthBeacon/wealthBeaconSvPartial';
import { wealthBeaconEsPartial } from './locales/wealthBeacon/wealthBeaconEsPartial';
import { wealthBeaconNoPartial } from './locales/wealthBeacon/wealthBeaconNoPartial';

const enRoot = deepMergeLocales(en as Record<string, unknown>, {
  templeHome: templeHomeEn,
  quantumApothecary: quantumApothecaryEn,
  vayuProtocol: vayuProtocolEn,
  sriYantraShield: sriYantraShieldEn,
  digitalNadi: digitalNadiEn,
  vajraSkyBreaker: vajraSkyBreakerEn,
  wealthBeacon: wealthBeaconEn,
} as Record<string, unknown>);
const svMerged = deepMergeLocales(
  deepMergeLocales(enRoot, sv as Record<string, unknown>),
  {
    templeHome: deepMergeLocales(
      templeHomeEn as Record<string, unknown>,
      templeHomeSvPartial as Record<string, unknown>
    ),
    quantumApothecary: deepMergeLocales(
      quantumApothecaryEn as Record<string, unknown>,
      quantumApothecarySvPartial as Record<string, unknown>
    ),
    vayuProtocol: deepMergeLocales(
      vayuProtocolEn as Record<string, unknown>,
      vayuProtocolSvPartial as Record<string, unknown>
    ),
    sriYantraShield: deepMergeLocales(
      sriYantraShieldEn as Record<string, unknown>,
      sriYantraShieldSvPartial as Record<string, unknown>
    ),
    digitalNadi: deepMergeLocales(
      digitalNadiEn as Record<string, unknown>,
      digitalNadiSvPartial as Record<string, unknown>
    ),
    vajraSkyBreaker: deepMergeLocales(
      vajraSkyBreakerEn as Record<string, unknown>,
      vajraSkyBreakerSvPartial as Record<string, unknown>
    ),
    wealthBeacon: deepMergeLocales(
      wealthBeaconEn as Record<string, unknown>,
      wealthBeaconSvPartial as Record<string, unknown>
    ),
  } as Record<string, unknown>
);
const esMerged = deepMergeLocales(
  deepMergeLocales(enRoot, es as Record<string, unknown>),
  {
    templeHome: deepMergeLocales(
      templeHomeEn as Record<string, unknown>,
      templeHomeEsPartial as Record<string, unknown>
    ),
    quantumApothecary: deepMergeLocales(
      quantumApothecaryEn as Record<string, unknown>,
      quantumApothecaryEsPartial as Record<string, unknown>
    ),
    vayuProtocol: deepMergeLocales(
      vayuProtocolEn as Record<string, unknown>,
      vayuProtocolEsPartial as Record<string, unknown>
    ),
    sriYantraShield: deepMergeLocales(
      sriYantraShieldEn as Record<string, unknown>,
      sriYantraShieldEsPartial as Record<string, unknown>
    ),
    digitalNadi: deepMergeLocales(
      digitalNadiEn as Record<string, unknown>,
      digitalNadiEsPartial as Record<string, unknown>
    ),
    vajraSkyBreaker: deepMergeLocales(
      vajraSkyBreakerEn as Record<string, unknown>,
      vajraSkyBreakerEsPartial as Record<string, unknown>
    ),
    wealthBeacon: deepMergeLocales(
      wealthBeaconEn as Record<string, unknown>,
      wealthBeaconEsPartial as Record<string, unknown>
    ),
  } as Record<string, unknown>
);
const noMerged = deepMergeLocales(
  deepMergeLocales(enRoot, no as Record<string, unknown>),
  {
    templeHome: deepMergeLocales(
      templeHomeEn as Record<string, unknown>,
      templeHomeNoPartial as Record<string, unknown>
    ),
    quantumApothecary: deepMergeLocales(
      quantumApothecaryEn as Record<string, unknown>,
      quantumApothecaryNoPartial as Record<string, unknown>
    ),
    vayuProtocol: deepMergeLocales(
      vayuProtocolEn as Record<string, unknown>,
      vayuProtocolNoPartial as Record<string, unknown>
    ),
    sriYantraShield: deepMergeLocales(
      sriYantraShieldEn as Record<string, unknown>,
      sriYantraShieldNoPartial as Record<string, unknown>
    ),
    digitalNadi: deepMergeLocales(
      digitalNadiEn as Record<string, unknown>,
      digitalNadiNoPartial as Record<string, unknown>
    ),
    vajraSkyBreaker: deepMergeLocales(
      vajraSkyBreakerEn as Record<string, unknown>,
      vajraSkyBreakerNoPartial as Record<string, unknown>
    ),
    wealthBeacon: deepMergeLocales(
      wealthBeaconEn as Record<string, unknown>,
      wealthBeaconNoPartial as Record<string, unknown>
    ),
  } as Record<string, unknown>
);

/**
 * Legacy i18n init (react-i18next): English, Spanish, Swedish, Norwegian.
 * Non-English bundles are deep-merged with English so every key exists and
 * profile.preferred_language drives a consistent UI app-wide.
 * Language is initialized from localStorage/navigator, then synced with
 * profile.preferred_language via ProfileLanguageSync when user is logged in.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enRoot as typeof en },
      es: { translation: esMerged as typeof en },
      sv: { translation: svMerged as typeof en },
      no: { translation: noMerged as typeof en },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'sv', 'no'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

if (typeof document !== 'undefined') {
  const syncHtmlLang = () => {
    document.documentElement.lang = (i18n.language || 'en').split('-')[0];
  };
  syncHtmlLang();
  i18n.on('languageChanged', syncHtmlLang);
}

export default i18n;

