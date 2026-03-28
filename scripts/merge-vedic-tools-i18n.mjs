/**
 * Deep-merge vedicAstrology UI strings (Hora, Guru chat, Blueprint tools).
 * Run: node scripts/merge-vedic-tools-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/i18n/locales');

function deepMerge(base, override) {
  const out = { ...base };
  for (const key of Object.keys(override)) {
    const b = base[key];
    const o = override[key];
    if (
      o !== null &&
      typeof o === 'object' &&
      !Array.isArray(o) &&
      b !== null &&
      typeof b === 'object' &&
      !Array.isArray(b)
    ) {
      out[key] = deepMerge(b, o);
    } else {
      out[key] = o;
    }
  }
  return out;
}

function mergeFile(name, overlay) {
  const p = path.join(localesDir, name);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const merged = deepMerge(j, overlay);
  fs.writeFileSync(p, JSON.stringify(merged, null, 2) + '\n');
}

const vedicEn = {
  horaCalcLoading: 'Calculating Hora...',
  horaRemaining: 'remaining',
  horaDayRuler: 'Day Ruler',
  horaUpcomingFlow: 'Upcoming Flow',
  horaEnergyAuspicious: 'Auspicious',
  horaEnergyNeutral: 'Neutral',
  horaEnergyInauspicious: 'Inauspicious',
  horaApproxMin: '~{{n}} min',
  horaPickerLiveCta: 'Check Future Hora',
  horaPickerTitle: 'Check Hora for any date & time',
  horaPickerApply: 'Check Hora',
  horaPickerLiveBtn: 'Live',
  horaPickerReset: 'Reset to Live',
  horaNotifyBanner: '{{prev}} Hora has ended. {{current}} Hora is now active.',
  horaNotifyBrowserTitle: 'Sacred Healing — Hora Change',
  horaNotifyBrowserBody: '🔱 {{message}}\n{{hint}}',
  horaNotifyHint: 'Go to Mantra page and chant the mantra.',
  dashH12Minus: '-12h',
  dashH12Plus: '+12h',
  dashSpeakVerdict: "{{quote}} Today's Nakshatra is {{nakshatra}}. {{description}}",
  dashYogaBeeja: 'Beeja Mantra',
  dashYogaFrequency: 'Frequency',
  dashYogaPhysical: 'Physical Action',
  dashYogaAction0: 'Wear white on Fridays',
  dashYogaAction1: 'Donate yellow cloth',
  dashYogaAction2: 'Fast on Mondays',
  dashYogaSpeakRemedy: 'Speak Remedy Aloud',
  dashYogaSpeakScript: 'Bhrigu Remedy for {{yoga}}. Chant the mantra: {{mantra}}. {{impact}}',
  bhriguDesc16:
    'Wisdom awakening. Guru energy ignites your path of higher learning and spiritual growth.',
  bhriguDesc22:
    'Soul identity crystallizes. Your Atma-karaka activates authority and self-expression.',
  bhriguDesc24:
    'Emotional mastery cycle. Deep intuition and nurturing power reach peak activation.',
  bhriguDesc28:
    'Creative abundance unlocked. Relationships, art, and material pleasures align with destiny.',
  bhriguDesc32:
    'Warrior energy peaks. Courage, ambition, and physical vitality drive transformation.',
  bhriguDesc36:
    'Intellectual mastery. Communication, business acumen, and analytical power ascend.',
  bhriguDesc42:
    'Digital expansion and breaking old patterns. The shadow nodes activate karmic liberation.',
  bhriguDesc48:
    "Shani's final teaching. Discipline, structure, and karmic harvest define this sovereign phase.",
  guruChatFailConnect: 'Failed to connect to the Guru',
  guruChatErrorMessage:
    '🙏 Forgive me, the cosmic connection is currently flickering. The celestial pathways require alignment. Please attempt your inquiry again when the stars permit.',
  guruLockTitle: 'The Bhrigu Oracle Awaits',
  guruLockBody:
    'Direct channeling with the Bhrigu Nadi Rishi is a sacred privilege reserved for Master Blueprint members.',
  guruLockCta: 'Access the Master Path',
  guruHeaderTitle: 'Bhrigu Nadi Oracle',
  guruCycleActive: '{{emoji}} {{planet}} Cycle Active • Age {{age}}',
  guruSacredChannelOpen: 'Sacred Channel Open',
  guruFocusExit: 'Exit Focus Mode',
  guruFocusEnter: 'Focus Mode',
  guruActivateHz: 'Activate {{freq}}Hz',
  guruChannelingLine1: 'Sifting through the Akashic Records...',
  guruChannelingLine2: 'Channeling the Bhrigu Nadi scrolls',
  guruRishiLoading: 'The Rishi is speaking...',
  guruAriaStopListening: 'Stop listening',
  guruAriaSpeak: 'Speak',
  guruChipRahu: 'Rahu Cycle Reading',
  guruChipFinance: 'Financial Verdict',
  guruChipKarmic: 'Karmic Blockage',
  guruChip528: '528Hz Remedy',
  guruWelcome:
    'Namaste, {{firstName}}. I am the Bhrigu Rishi, keeper of the Nandi Nadi scrolls. My vision is locked on your incarnation in {{place}}.{{planetLine}} Speak your query and receive the Akashic Verdict.',
  guruWelcomePlanetLine: " Under {{planet}}'s gaze at age {{age}}, your karmic script unfolds.",
};

const vedicEs = {
  horaCalcLoading: 'Calculando Hora...',
  horaRemaining: 'restante',
  horaDayRuler: 'Regente del día',
  horaUpcomingFlow: 'Flujo próximo',
  horaEnergyAuspicious: 'Propicio',
  horaEnergyNeutral: 'Neutral',
  horaEnergyInauspicious: 'Impropicio',
  horaApproxMin: '~{{n}} min',
  horaPickerLiveCta: 'Ver Hora futura',
  horaPickerTitle: 'Consultar Hora para cualquier fecha y hora',
  horaPickerApply: 'Consultar Hora',
  horaPickerLiveBtn: 'En vivo',
  horaPickerReset: 'Volver a en vivo',
  horaNotifyBanner: 'La Hora {{prev}} ha terminado. La Hora {{current}} está activa.',
  horaNotifyBrowserTitle: 'Sacred Healing — Cambio de Hora',
  horaNotifyBrowserBody: '🔱 {{message}}\n{{hint}}',
  horaNotifyHint: 'Ve a Mantras y canta el mantra.',
  dashH12Minus: '-12h',
  dashH12Plus: '+12h',
  dashSpeakVerdict: '{{quote}} El Nakshatra de hoy es {{nakshatra}}. {{description}}',
  dashYogaBeeja: 'Mantra bija',
  dashYogaFrequency: 'Frecuencia',
  dashYogaPhysical: 'Acción física',
  dashYogaAction0: 'Viste blanco los viernes',
  dashYogaAction1: 'Dona tela amarilla',
  dashYogaAction2: 'Ayuna los lunes',
  dashYogaSpeakRemedy: 'Recitar remedio en voz alta',
  dashYogaSpeakScript: 'Remedio Bhrigu para {{yoga}}. Canta el mantra: {{mantra}}. {{impact}}',
  bhriguDesc16:
    'Despertar de la sabiduría. La energía Guru enciende el aprendizaje superior y el crecimiento espiritual.',
  bhriguDesc22:
    'La identidad del alma se cristaliza. Tu Atmakaraka activa autoridad y autoexpresión.',
  bhriguDesc24:
    'Ciclo de maestría emocional. La intuición profunda y el poder nutridor alcanzan su pico.',
  bhriguDesc28:
    'Abundancia creativa desbloqueada. Relaciones, arte y placeres materiales alineados con el destino.',
  bhriguDesc32:
    'Energía guerrera en su punto máximo. Coraje, ambición y vitalidad transforman.',
  bhriguDesc36:
    'Maestría intelectual. Comunicación, negocios y análisis ascienden.',
  bhriguDesc42:
    'Expansión digital y romper viejos patrones. Los nodos sombra liberan el karma.',
  bhriguDesc48:
    'Enseñanza final de Shani. Disciplina, estructura y cosecha kármica definen esta fase.',
  guruChatFailConnect: 'No se pudo conectar con el Guru',
  guruChatErrorMessage:
    '🙏 Perdón, la conexión cósmica fluctúa. Los caminos celestiales requieren alineación. Intenta de nuevo cuando los astros lo permitan.',
  guruLockTitle: 'El Oráculo Bhrigu aguarda',
  guruLockBody:
    'Canalizar directamente con el Bhrigu Nadi Rishi es un privilegio sagrado reservado a miembros Master Blueprint.',
  guruLockCta: 'Acceder al camino maestro',
  guruHeaderTitle: 'Oráculo Bhrigu Nadi',
  guruCycleActive: '{{emoji}} Ciclo {{planet}} activo • Edad {{age}}',
  guruSacredChannelOpen: 'Canal sagrado abierto',
  guruFocusExit: 'Salir del modo enfoque',
  guruFocusEnter: 'Modo enfoque',
  guruActivateHz: 'Activar {{freq}}Hz',
  guruChannelingLine1: 'Tamizando los Registros Akáshicos...',
  guruChannelingLine2: 'Canalizando los rollos Bhrigu Nadi',
  guruRishiLoading: 'El Rishi habla...',
  guruAriaStopListening: 'Dejar de escuchar',
  guruAriaSpeak: 'Hablar',
  guruChipRahu: 'Lectura ciclo Rahu',
  guruChipFinance: 'Veredicto financiero',
  guruChipKarmic: 'Bloqueo kármico',
  guruChip528: 'Remedio 528Hz',
  guruWelcome:
    'Namaste, {{firstName}}. Soy el Rishi Bhrigu, guardián de los rollos Nandi Nadi. Mi visión está fijada en tu encarnación en {{place}}.{{planetLine}} Di tu consulta y recibe el Veredicto Akáshico.',
  guruWelcomePlanetLine: ' Bajo la mirada de {{planet}} a los {{age}} años, tu guión kármico se despliega.',
};

const vedicSv = {
  horaCalcLoading: 'Beräknar Hora...',
  horaRemaining: 'kvar',
  horaDayRuler: 'Dagens härskare',
  horaUpcomingFlow: 'Kommande flöde',
  horaEnergyAuspicious: 'Gunstig',
  horaEnergyNeutral: 'Neutral',
  horaEnergyInauspicious: 'Ogunstig',
  horaApproxMin: '~{{n}} min',
  horaPickerLiveCta: 'Kolla framtida Hora',
  horaPickerTitle: 'Kolla Hora för valfritt datum & tid',
  horaPickerApply: 'Kolla Hora',
  horaPickerLiveBtn: 'Live',
  horaPickerReset: 'Återställ till live',
  horaNotifyBanner: '{{prev}} Hora har avslutats. {{current}} Hora är nu aktiv.',
  horaNotifyBrowserTitle: 'Sacred Healing — Horabyte',
  horaNotifyBrowserBody: '🔱 {{message}}\n{{hint}}',
  horaNotifyHint: 'Gå till Mantrasidan och chant mantra.',
  dashH12Minus: '-12h',
  dashH12Plus: '+12h',
  dashSpeakVerdict: '{{quote}} Dagens Nakshatra är {{nakshatra}}. {{description}}',
  dashYogaBeeja: 'Beeja-mantra',
  dashYogaFrequency: 'Frekvens',
  dashYogaPhysical: 'Fysisk handling',
  dashYogaAction0: 'Bär vitt på fredagar',
  dashYogaAction1: 'Donera gult tyg',
  dashYogaAction2: 'Fasta på måndagar',
  dashYogaSpeakRemedy: 'Läs upp remediet',
  dashYogaSpeakScript: 'Bhrigu-remedy för {{yoga}}. Chanta mantrat: {{mantra}}. {{impact}}',
  bhriguDesc16:
    'Visdom väcks. Guru-energi tänder högre lärande och andlig tillväxt.',
  bhriguDesc22:
    'Själsidentitet kristalliseras. Din Atmakaraka aktiverar auktoritet och själuttryck.',
  bhriguDesc24:
    'Emotionellt mästerår. Djup intuition och näring når toppen.',
  bhriguDesc28:
    'Skapande överflöd olåst. Relationer, konst och materiellt väl i linje med ödet.',
  bhriguDesc32:
    'Krigarenergi på topp. Mod, ambition och livskraft driver omvandling.',
  bhriguDesc36:
    'Intellektuell mästerskap. Kommunikation, affärer och analys stiger.',
  bhriguDesc42:
    'Digital expansion och gamla mönster bryts. Skuggnoderna frigör karma.',
  bhriguDesc48:
    'Shanis sista lärdom. Disciplin, struktur och karmisk skörd definierar fasen.',
  guruChatFailConnect: 'Kunde inte ansluta till Gurun',
  guruChatErrorMessage:
    '🙏 Förlåt, den kosmiska förbindelsen fladdrar. De himmelska vägarna kräver linjering. Försök igen när stjärnorna tillåter.',
  guruLockTitle: 'Bhrigu-oraklet väntar',
  guruLockBody:
    'Direkt kanalisering med Bhrigu Nadi Rishi är ett heligt särv för Master Blueprint-medlemmar.',
  guruLockCta: 'Öppna mästarvägen',
  guruHeaderTitle: 'Bhrigu Nadi-orakel',
  guruCycleActive: '{{emoji}} {{planet}}-cykel aktiv • Ålder {{age}}',
  guruSacredChannelOpen: 'Helig kanal öppen',
  guruFocusExit: 'Lämna fokusläge',
  guruFocusEnter: 'Fokusläge',
  guruActivateHz: 'Aktivera {{freq}}Hz',
  guruChannelingLine1: 'Sållar genom Akashiska arkiven...',
  guruChannelingLine2: 'Kanaliserar Bhrigu Nadi-rullarna',
  guruRishiLoading: 'Rishi talar...',
  guruAriaStopListening: 'Sluta lyssna',
  guruAriaSpeak: 'Tala',
  guruChipRahu: 'Rahu-cykel läsning',
  guruChipFinance: 'Finansiell dom',
  guruChipKarmic: 'Karmiskt block',
  guruChip528: '528Hz-remedy',
  guruWelcome:
    'Namaste, {{firstName}}. Jag är Bhrigu Rishi, väktare av Nandi Nadi-rullarna. Min blick är låst på din inkarnation i {{place}}.{{planetLine}} Ställ din fråga och ta emot Akashiska domen.',
  guruWelcomePlanetLine: ' Under {{planet}}s blick vid {{age}} år vecklas ditt karmiska manus ut.',
};

const vedicNo = {
  horaCalcLoading: 'Beregner Hora...',
  horaRemaining: 'igjen',
  horaDayRuler: 'Dagens hersker',
  horaUpcomingFlow: 'Kommende flyt',
  horaEnergyAuspicious: 'Gunstig',
  horaEnergyNeutral: 'Nøytral',
  horaEnergyInauspicious: 'Ugunstig',
  horaApproxMin: '~{{n}} min',
  horaPickerLiveCta: 'Sjekk fremtidig Hora',
  horaPickerTitle: 'Sjekk Hora for valgfri dato og tid',
  horaPickerApply: 'Sjekk Hora',
  horaPickerLiveBtn: 'Direkte',
  horaPickerReset: 'Tilbake til direkte',
  horaNotifyBanner: '{{prev}} Hora er over. {{current}} Hora er nå aktiv.',
  horaNotifyBrowserTitle: 'Sacred Healing — Horaskifte',
  horaNotifyBrowserBody: '🔱 {{message}}\n{{hint}}',
  horaNotifyHint: 'Gå til Mantra-siden og chant mantra.',
  dashH12Minus: '-12t',
  dashH12Plus: '+12t',
  dashSpeakVerdict: '{{quote}} Dagens Nakshatra er {{nakshatra}}. {{description}}',
  dashYogaBeeja: 'Beeja-mantra',
  dashYogaFrequency: 'Frekvens',
  dashYogaPhysical: 'Fysisk handling',
  dashYogaAction0: 'Bær hvitt på fredager',
  dashYogaAction1: 'Doner gult stoff',
  dashYogaAction2: 'Faste på mandager',
  dashYogaSpeakRemedy: 'Les remediet høyt',
  dashYogaSpeakScript: 'Bhrigu-remedie for {{yoga}}. Chant mantrat: {{mantra}}. {{impact}}',
  bhriguDesc16:
    'Visdom våkner. Guru-energi tenner høyere læring og åndelig vekst.',
  bhriguDesc22:
    'Sjel-identitet krystalliseres. Atmakaraka aktiverer autoritet og selvuttrykk.',
  bhriguDesc24:
    'Følelsesmessig mestersyklus. Dyp intuisjon og omsorg når topp.',
  bhriguDesc28:
    'Skapende overflod låst opp. Relasjoner, kunst og materielle gleder med skjebnen.',
  bhriguDesc32:
    'Krigerenergi på topp. Mot, ambisjon og vitalitet driver transformasjon.',
  bhriguDesc36:
    'Intellektuelt mesterskap. Kommunikasjon, forretning og analyse stiger.',
  bhriguDesc42:
    'Digital ekspansjon og gamle mønstre brytes. Skygge-noder frigjør karma.',
  bhriguDesc48:
    'Shanis siste lære. Disiplin, struktur og karmisk innhøsting definerer fasen.',
  guruChatFailConnect: 'Kunne ikke koble til Guru',
  guruChatErrorMessage:
    '🙏 Tilgi meg, den kosmiske forbindelsen flakker. De himmelske stiene trenger justering. Prøv igjen når stjernene tillater.',
  guruLockTitle: 'Bhrigu-orakelet venter',
  guruLockBody:
    'Direkte kanalisering med Bhrigu Nadi Rishi er et hellig privilegium for Master Blueprint-medlemmer.',
  guruLockCta: 'Åpne mesterveien',
  guruHeaderTitle: 'Bhrigu Nadi-orakel',
  guruCycleActive: '{{emoji}} {{planet}}-syklus aktiv • Alder {{age}}',
  guruSacredChannelOpen: 'Hellig kanal åpen',
  guruFocusExit: 'Avslutt fokusmodus',
  guruFocusEnter: 'Fokusmodus',
  guruActivateHz: 'Aktiver {{freq}}Hz',
  guruChannelingLine1: 'Siler gjennom de Akashiske arkivene...',
  guruChannelingLine2: 'Kanaliserer Bhrigu Nadi-rullene',
  guruRishiLoading: 'Rishi taler...',
  guruAriaStopListening: 'Stopp lytting',
  guruAriaSpeak: 'Snakk',
  guruChipRahu: 'Rahu-syklus lesning',
  guruChipFinance: 'Finansiell dom',
  guruChipKarmic: 'Karmisk blokk',
  guruChip528: '528Hz-remedie',
  guruWelcome:
    'Namaste, {{firstName}}. Jeg er Bhrigu Rishi, vokter av Nandi Nadi-rullene. Mitt syn er festet på din inkarnasjon i {{place}}.{{planetLine}} Si din spørsmål og motta den Akashiske dommen.',
  guruWelcomePlanetLine: ' Under {{planet}}s blikk ved {{age}} år folder ditt karmiske manus seg ut.',
};

mergeFile('en.json', { vedicAstrology: vedicEn });
mergeFile('es.json', { vedicAstrology: vedicEs });
mergeFile('sv.json', { vedicAstrology: vedicSv });
mergeFile('no.json', { vedicAstrology: vedicNo });

console.log('Merged vedic tools i18n into en, es, sv, no');
