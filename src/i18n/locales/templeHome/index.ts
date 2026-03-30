import partUiEn from './part-ui-en.json';
import {
  templeHomeSitesEn,
  templeHomeSiteDbEn,
  templeHomeSiteBgEn,
  templeHomeSiteSignatures,
} from './templeHomeDataEn';

export { templeHomeSiteSignatures };

export const templeHomeEn = {
  ...(partUiEn as Record<string, unknown>),
  sites: templeHomeSitesEn,
  siteDb: templeHomeSiteDbEn,
  siteBg: templeHomeSiteBgEn,
} as Record<string, unknown>;
