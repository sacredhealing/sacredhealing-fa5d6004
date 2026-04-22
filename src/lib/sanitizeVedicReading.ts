import type {
  GuruEfficiencyHack,
  MasterBlueprint,
  PersonalCompass,
  SignificantYoga,
  TodayInfluence,
  VedicReading,
} from '@/lib/vedicTypes';

function asStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asStrArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

const HACK_CATEGORIES = ['Productivity', 'Learning', 'Creation', 'Logic'] as const;

function sanitizeGuruHack(raw: unknown): GuruEfficiencyHack {
  const gh = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const cat = gh.toolCategory;
  const toolCategory = HACK_CATEGORIES.includes(cat as (typeof HACK_CATEGORIES)[number])
    ? (cat as GuruEfficiencyHack['toolCategory'])
    : 'Productivity';
  return {
    recommendedTool: asStr(gh.recommendedTool),
    toolCategory,
    whyThisTool: asStr(gh.whyThisTool),
    workflow: asStrArr(gh.workflow),
    proTip: asStr(gh.proTip),
    limitation: asStr(gh.limitation),
  };
}

function sanitizePersonalCompass(raw: unknown): PersonalCompass | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const pc = raw as Record<string, unknown>;
  const cdRaw = pc.currentDasha;
  const cd = cdRaw && typeof cdRaw === 'object' ? (cdRaw as Record<string, unknown>) : {};
  return {
    career: asStr(pc.career),
    relationship: asStr(pc.relationship),
    health: asStr(pc.health),
    financial: asStr(pc.financial),
    currentDasha: {
      period: asStr(cd.period, '—'),
      meaning: asStr(cd.meaning),
      focusArea: asStr(cd.focusArea),
    },
  };
}

function sanitizeMasterBlueprint(raw: unknown): MasterBlueprint | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const mb = raw as Record<string, unknown>;
  const yogas: SignificantYoga[] = Array.isArray(mb.significantYogas)
    ? mb.significantYogas
        .map((y) => {
          if (!y || typeof y !== 'object') return null;
          const o = y as Record<string, unknown>;
          return { name: asStr(o.name), impact: asStr(o.impact) };
        })
        .filter((x): x is SignificantYoga => x !== null)
    : [];
  return {
    soulPurpose: asStr(mb.soulPurpose),
    karmaPatterns: asStr(mb.karmaPatterns),
    navamshaAnalysis: asStr(mb.navamshaAnalysis),
    karmicNodes: asStr(mb.karmicNodes),
    significantYogas: yogas,
    sadeSatiStatus: asStr(mb.sadeSatiStatus),
    timingPeaks: asStr(mb.timingPeaks),
    divineRemedies: asStrArr(mb.divineRemedies),
    soulMap12Houses: asStr(mb.soulMap12Houses),
  };
}

/**
 * Ensures cached or API readings never crash the dashboard when fields are missing.
 */
export function sanitizeVedicReading(raw: unknown): VedicReading | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const tiRaw = r.todayInfluence;
  if (!tiRaw || typeof tiRaw !== 'object') return null;
  const ti = tiRaw as Record<string, unknown>;

  const todayInfluence: TodayInfluence = {
    nakshatra: asStr(ti.nakshatra),
    description: asStr(ti.description),
    planetaryInfluence: asStr(ti.planetaryInfluence),
    wisdomQuote: asStr(ti.wisdomQuote),
    whatToDo: asStrArr(ti.whatToDo),
    whatToAvoid: asStrArr(ti.whatToAvoid),
  };

  return {
    todayInfluence,
    horaWatch: r.horaWatch as VedicReading['horaWatch'],
    personalCompass: sanitizePersonalCompass(r.personalCompass),
    masterBlueprint: sanitizeMasterBlueprint(r.masterBlueprint),
    guruEfficiencyHack: sanitizeGuruHack(r.guruEfficiencyHack),
  };
}
