/**
 * Bhagavad Gita Oracle - Jyotish-synced verses
 * Maps planetary cycles to Gita verses (Bhrigu Vision)
 */

export interface GitaVerse {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  producersTranslation: string;
}

export const GITA_VERSES: Record<string, GitaVerse> = {
  Rahu: {
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    transliteration: 'karmaṇy-evādhikāras te mā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr mā te saṅgo \'stv akarmaṇi',
    producersTranslation: 'You have the right to work, but never to the fruit of work. Work without attachment. Don\'t be driven by results. Stay free from inaction.',
  },
  Shukra: {
    chapter: 10,
    verse: 41,
    sanskrit: 'यद्यद्विभूतिमत्सत्त्वं श्रीमदूर्जितमेव वा। तत्तदेवावगच्छ त्वं मम तेजोंऽशसंभवम्॥',
    transliteration: 'yad yad vibhūtimat sattvaṁ śhrīmad ūrjitam eva vā\ntat tad evāvagachchha tvaṁ mama tejo-\'ṁśha-sambhavam',
    producersTranslation: 'Whatever is glorious, prosperous, or powerful—know that it springs from a fragment of My splendor. All beauty, all art, all abundance flows from Me.',
  },
  Guru: {
    chapter: 4,
    verse: 34,
    sanskrit: 'तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया। उपदेक्ष्यन्ति ते ज्ञानं ज्ञानिनस्तत्त्वदर्शिनः॥',
    transliteration: 'tad viddhi praṇipātena paripraśhnena sevayā\nupadekṣhyanti te jñānaṁ jñāninas tattva-darśhinaḥ',
    producersTranslation: 'Learn that truth by approaching a realized master. Inquire with humility and serve. Those who have seen the truth will share it with you.',
  },
  Sun: {
    chapter: 11,
    verse: 12,
    sanskrit: 'दिवि सूर्यसहस्रस्य भवेद्युगपदुत्थिता। यदि भाः सदृशी सा स्याद्भासस्तस्य महात्मनः॥',
    transliteration: 'divi sūrya-sahasrasya bhaved yugapad utthitā\nyadi bhāḥ sadṛśhī sā syād bhāsas tasya mahātmanaḥ',
    producersTranslation: 'If a thousand suns were to blaze forth together in the sky, even that would not match the splendor of that Supreme Being.',
  },
  Moon: {
    chapter: 15,
    verse: 13,
    sanskrit: 'गामाविश्य च भूतानि धारयाम्यहमोजसा। पुष्णामि चौषधीः सर्वाः सोमो भूत्वा रसात्मकः॥',
    transliteration: 'gām āviśhya cha bhūtāni dhārayāmy aham ojasā\npuṣhṇāmi chauṣhadhīḥ sarvāḥ somo bhūtvā rasātmakaḥ',
    producersTranslation: 'Permeating the earth, I nourish all beings with My energy. Becoming the moon, I nourish all plants with the sap of life.',
  },
  Mars: {
    chapter: 3,
    verse: 37,
    sanskrit: 'काम एष क्रोध एष रजोगुणसमुद्भवः। महाशनो महापाप्मा विद्ध्येनमिह वैरिणम्॥',
    transliteration: 'kāma eṣha krodha eṣha rajo-guṇa-samudbhavaḥ\nmahāśhano mahā-pāpmā viddhy enam iha vairiṇam',
    producersTranslation: 'It is desire, it is anger, born of the mode of passion. All-consuming and most sinful—know this as the enemy here.',
  },
  Mercury: {
    chapter: 10,
    verse: 34,
    sanskrit: 'मृत्युः सर्वहरश्चाहमुद्भवश्च भविष्यताम्। कीर्तिः श्रीर्वाक्च नारीणां स्मृतिर्मेधा धृतिः क्षमा॥',
    transliteration: 'mṛtyuḥ sarva-haraśh chāham udbhavaśh cha bhaviṣhyatām\nkīrtiḥ śhrīr vāk cha nārīṇāṁ smṛtir medhā dhṛtiḥ kṣhamā',
    producersTranslation: 'I am all-devouring death, and I am the origin of future beings. Among feminine qualities, I am fame, fortune, fine speech, memory, intelligence, courage, and forgiveness.',
  },
  Saturn: {
    chapter: 18,
    verse: 66,
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
    transliteration: 'sarva-dharmān parityajya mām ekaṁ śharaṇaṁ vraja\nahaṁ tvāṁ sarva-pāpebhyo mokṣhayiṣhyāmi mā śhuchaḥ',
    producersTranslation: 'Abandon all varieties of duty and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
  },
  Ketu: {
    chapter: 6,
    verse: 5,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    transliteration: 'uddhared ātmanātmānaṁ nātmānam avasādayet\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
    producersTranslation: 'Elevate yourself through the power of your own mind, and do not degrade yourself. The mind alone is the friend of the soul, and the mind alone is the enemy of the soul.',
  },
  default: {
    chapter: 4,
    verse: 34,
    sanskrit: 'तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया। उपदेक्ष्यन्ति ते ज्ञानं ज्ञानिनस्तत्त्वदर्शिनः॥',
    transliteration: 'tad viddhi praṇipātena paripraśhnena sevayā\nupadekṣhyanti te jñānaṁ jñāninas tattva-darśhinaḥ',
    producersTranslation: 'Learn that truth by approaching a realized master. Inquire with humility and serve. Those who have seen the truth will share it with you.',
  },
};

/**
 * Get Gita verse based on Jyotish cycle
 */
export function getGitaVerseForCycle(cycle: string | null | undefined): GitaVerse {
  if (!cycle) return GITA_VERSES.default;
  
  const normalized = cycle.toLowerCase().trim();
  
  if (normalized === 'rahu') return GITA_VERSES.Rahu;
  if (normalized === 'shukra' || normalized === 'venus') return GITA_VERSES.Shukra;
  if (normalized === 'guru' || normalized === 'jupiter') return GITA_VERSES.Guru;
  if (normalized === 'sun' || normalized === 'surya') return GITA_VERSES.Sun;
  if (normalized === 'moon' || normalized === 'chandra') return GITA_VERSES.Moon;
  if (normalized === 'mars' || normalized === 'mangal') return GITA_VERSES.Mars;
  if (normalized === 'mercury' || normalized === 'budha') return GITA_VERSES.Mercury;
  if (normalized === 'saturn' || normalized === 'shani') return GITA_VERSES.Saturn;
  if (normalized === 'ketu') return GITA_VERSES.Ketu;
  
  return GITA_VERSES.default;
}
