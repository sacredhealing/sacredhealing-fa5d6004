/**
 * Vedic Astrology Calculations
 * Rule-based calculations for daily influences and chart basics
 */

export interface BirthDetails {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  place: string;
}

export interface DailyVedicInfluence {
  nakshatra: string;
  theme: string;
  do: string[];
  avoid: string[];
  planetaryInfluence: string;
  wisdomQuote: string;
  teacher: string;
}

// Nakshatra mapping (27 Nakshatras)
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Vedic Teacher Wisdom Database
const VEDIC_WISDOM: Record<string, { quote: string; teacher: string; context: string }[]> = {
  Moon: [
    { quote: "The mind reflects karmic memory. Control your mind, and you control your destiny.", teacher: "B.V. Raman", context: "Mind & Emotions" },
    { quote: "The Moon shows our emotional nature and inner needs. Honor your feelings, but don't be ruled by them.", teacher: "Dr. David Frawley", context: "Emotional Balance" },
    { quote: "Chandra (Moon) represents our mental peace. A calm mind receives grace from the cosmos.", teacher: "Classical Jyotish", context: "Peace & Grace" },
  ],
  Sun: [
    { quote: "Live aligned with Dharma, not ego. The Sun shows your soul purpose and true self.", teacher: "B.V. Raman", context: "Dharma & Purpose" },
    { quote: "Surya represents the Atman, the eternal Self. When you align with your true nature, obstacles dissolve.", teacher: "Vedic Teaching", context: "Self-Realization" },
    { quote: "The Sun shows your vitality and willpower. Use it to serve, not to dominate.", teacher: "Classical Jyotish", context: "Service & Will" },
  ],
  Mars: [
    { quote: "Anger destroys the mind. Channel Mars energy into discipline and courageous action.", teacher: "B.V. Raman", context: "Energy & Action" },
    { quote: "Mangal represents our passion and drive. Direct it toward dharma, not adharma.", teacher: "Dr. David Frawley", context: "Right Action" },
  ],
  Mercury: [
    { quote: "Buddhi (intellect) must be sharp but not harsh. Mercury gives wisdom when balanced.", teacher: "Vedic Teaching", context: "Wisdom & Communication" },
    { quote: "Mercury governs learning and communication. Use this power to teach, not to deceive.", teacher: "Classical Jyotish", context: "Learning & Truth" },
  ],
  Jupiter: [
    { quote: "Guru shows the path of dharma. When Jupiter is strong, wisdom and compassion grow.", teacher: "B.V. Raman", context: "Wisdom & Dharma" },
    { quote: "Jupiter represents the teacher within. Learn from life, and share your wisdom with others.", teacher: "Dr. David Frawley", context: "Teaching & Learning" },
  ],
  Venus: [
    { quote: "Love is the highest dharma. Venus shows how to give and receive love harmoniously.", teacher: "Vedic Teaching", context: "Love & Relationships" },
    { quote: "Shukra represents beauty and harmony. Find beauty in service and relationships.", teacher: "Classical Jyotish", context: "Beauty & Harmony" },
  ],
  Saturn: [
    { quote: "Discipline is the path to liberation. Saturn teaches patience, perseverance, and detachment.", teacher: "B.V. Raman", context: "Discipline & Liberation" },
    { quote: "Shani's lessons are hard but necessary. Accept responsibility, work with discipline, and karma will transform.", teacher: "Dr. David Frawley", context: "Karma & Transformation" },
  ],
  Rahu: [
    { quote: "Desire creates suffering. Rahu shows where attachment blinds us. Practice detachment.", teacher: "Vedic Teaching", context: "Desire & Detachment" },
  ],
  Ketu: [
    { quote: "Ketu shows past-life karma and spiritual depth. Let go of material attachments for liberation.", teacher: "Classical Jyotish", context: "Spiritual Liberation" },
  ],
};

// Nakshatra Guidance Database
const NAKSHATRA_GUIDANCE: Record<string, { theme: string; do: string[]; avoid: string[] }> = {
  Ashwini: {
    theme: 'New Beginnings & Healing',
    do: ['Start new projects', 'Focus on healing and wellness', 'Take initiative', 'Move forward with courage'],
    avoid: ['Rushing without planning', 'Ignoring details', 'Being impatient'],
  },
  Bharani: {
    theme: 'Transformation & Release',
    do: ['Release old patterns', 'Practice forgiveness', 'Transform negative energy', 'Focus on renewal'],
    avoid: ['Holding grudges', 'Resisting change', 'Being overly critical'],
  },
  Krittika: {
    theme: 'Action & Purification',
    do: ['Take decisive action', 'Purify your environment', 'Be courageous', 'Stand for truth'],
    avoid: ['Harsh words or actions', 'Being judgmental', 'Burning bridges'],
  },
  Rohini: {
    theme: 'Growth & Nourishment',
    do: ['Focus on finances and stability', 'Nourish relationships', 'Plan for growth', 'Enjoy beauty and art'],
    avoid: ['Emotional attachment to material things', 'Over-indulgence', 'Laziness'],
  },
  Mrigashira: {
    theme: 'Exploration & Curiosity',
    do: ['Explore new ideas', 'Travel or learn', 'Ask questions', 'Follow your curiosity'],
    avoid: ['Scattered focus', 'Restlessness', 'Indecisiveness'],
  },
  Ardra: {
    theme: 'Destruction & Renewal',
    do: ['Let go of what no longer serves', 'Allow transformation', 'Be patient with changes', 'Trust the process'],
    avoid: ['Resisting necessary change', 'Emotional turbulence', 'Impulsive actions'],
  },
  Punarvasu: {
    theme: 'Restoration & Abundance',
    do: ['Restore what was lost', 'Focus on abundance', 'Be generous', 'Renew commitments'],
    avoid: ['Taking things for granted', 'Hoarding resources', 'Neglecting restoration'],
  },
  Pushya: {
    theme: 'Nourishment & Protection',
    do: ['Nurture relationships', 'Protect what matters', 'Give care and support', 'Practice gratitude'],
    avoid: ['Being overprotective', 'Smothering others', 'Neglecting self-care'],
  },
  Ashlesha: {
    theme: 'Transformation & Depth',
    do: ['Go deep within', 'Transform negative patterns', 'Practice introspection', 'Release attachments'],
    avoid: ['Being manipulative', 'Holding onto toxicity', 'Avoiding transformation'],
  },
  Magha: {
    theme: 'Authority & Heritage',
    do: ['Honor your ancestors', 'Take leadership', 'Respect tradition', 'Act with dignity'],
    avoid: ['Arrogance', 'Disrespecting elders', 'Abusing power'],
  },
  Purva_Phalguni: {
    theme: 'Enjoyment & Celebration',
    do: ['Celebrate life', 'Enjoy relationships', 'Be creative', 'Share joy'],
    avoid: ['Over-indulgence', 'Superficiality', 'Avoiding responsibility'],
  },
  Uttara_Phalguni: {
    theme: 'Service & Partnership',
    do: ['Serve others', 'Strengthen partnerships', 'Be reliable', 'Give without expectation'],
    avoid: ['Being codependent', 'Neglecting self', 'Over-giving'],
  },
  Hasta: {
    theme: 'Skill & Craftsmanship',
    do: ['Develop skills', 'Work with your hands', 'Be precise', 'Create with intention'],
    avoid: ['Perfectionism', 'Over-criticism', 'Lack of focus'],
  },
  Chitra: {
    theme: 'Beauty & Architecture',
    do: ['Create beauty', 'Build structures', 'Plan carefully', 'Express your uniqueness'],
    avoid: ['Superficial beauty', 'Lack of substance', 'Being overly critical'],
  },
  Swati: {
    theme: 'Independence & Movement',
    do: ['Seek independence', 'Move forward', 'Be adaptable', 'Embrace change'],
    avoid: ['Instability', 'Restlessness', 'Lack of roots'],
  },
  Vishakha: {
    theme: 'Determination & Achievement',
    do: ['Set clear goals', 'Work with determination', 'Achieve your aims', 'Be focused'],
    avoid: ['Ruthlessness', 'Ignoring others', 'Single-minded obsession'],
  },
  Anuradha: {
    theme: 'Friendship & Devotion',
    do: ['Cultivate friendships', 'Be devoted', 'Build networks', 'Support others'],
    avoid: ['Dependency', 'Losing individuality', 'Neglecting personal needs'],
  },
  Jyeshtha: {
    theme: 'Eldership & Protection',
    do: ['Take responsibility', 'Protect others', 'Use wisdom', 'Lead with experience'],
    avoid: ['Controlling others', 'Arrogance', 'Refusing to let go'],
  },
  Mula: {
    theme: 'Roots & Foundation',
    do: ['Strengthen foundations', 'Go to the root', 'Practice grounding', 'Connect with ancestors'],
    avoid: ['Uprooting too quickly', 'Ignoring roots', 'Lack of foundation'],
  },
  Purva_Ashadha: {
    theme: 'Invincibility & Expansion',
    do: ['Expand your reach', 'Be confident', 'Overcome obstacles', 'Achieve victory'],
    avoid: ['Over-confidence', 'Arrogance', 'Ignoring limitations'],
  },
  Uttara_Ashadha: {
    theme: 'Victory & Dharma',
    do: ['Follow dharma', 'Achieve lasting victory', 'Be righteous', 'Act with integrity'],
    avoid: ['Compromising principles', 'Unethical actions', 'Short-term thinking'],
  },
  Shravana: {
    theme: 'Listening & Learning',
    do: ['Listen deeply', 'Learn from others', 'Seek knowledge', 'Be receptive'],
    avoid: ['Being closed-minded', 'Not listening', 'Ignoring wisdom'],
  },
  Dhanishta: {
    theme: 'Wealth & Music',
    do: ['Create wealth', 'Enjoy music', 'Share abundance', 'Celebrate achievements'],
    avoid: ['Materialism', 'Hoard wealth', 'Ignore spiritual wealth'],
  },
  Shatabhisha: {
    theme: 'Healing & Secrets',
    do: ['Focus on healing', 'Keep secrets', 'Practice mysticism', 'Heal others'],
    avoid: ['Being secretive', 'Isolation', 'Hiding from truth'],
  },
  Purva_Bhadrapada: {
    theme: 'Spiritual Fire & Transformation',
    do: ['Transform spiritually', 'Practice fire rituals', 'Release old ways', 'Awaken'],
    avoid: ['Resisting transformation', 'Holding onto past', 'Fear of change'],
  },
  Uttara_Bhadrapada: {
    theme: 'Nourishment & Completion',
    do: ['Complete projects', 'Nourish what matters', 'Practice gratitude', 'Be content'],
    avoid: ['Incompletion', 'Lack of nourishment', 'Dissatisfaction'],
  },
  Revati: {
    theme: 'Compassion & Completion',
    do: ['Show compassion', 'Complete the cycle', 'Prepare for new beginnings', 'Be gentle'],
    avoid: ['Closure resistance', 'Lack of compassion', 'Holding on too tightly'],
  },
};

/**
 * Calculate Moon Nakshatra based on date (simplified)
 * In production, use a proper Vedic astrology library or API
 */
export function calculateMoonNakshatra(date: Date): string {
  // Simplified calculation: Use day of year to approximate Nakshatra
  // This is a placeholder - in production, use proper astronomical calculations
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const nakshatraIndex = (dayOfYear + Math.floor(date.getMonth() / 2)) % 27;
  return NAKSHATRAS[nakshatraIndex];
}

/**
 * Get dominant planet for the day (simplified)
 */
export function getDominantPlanet(date: Date): string {
  const dayOfWeek = date.getDay();
  const planetMap: Record<number, string> = {
    0: 'Sun',    // Sunday
    1: 'Moon',   // Monday
    2: 'Mars',   // Tuesday
    3: 'Mercury', // Wednesday
    4: 'Jupiter', // Thursday
    5: 'Venus',   // Friday
    6: 'Saturn',  // Saturday
  };
  return planetMap[dayOfWeek] || 'Moon';
}

/**
 * Generate daily Vedic influence based on current date and birth details
 */
export function getDailyVedicInfluence(
  birthDetails?: BirthDetails,
  tier: 'basic' | 'premium' | 'master' = 'basic'
): DailyVedicInfluence {
  const today = new Date();
  const nakshatra = calculateMoonNakshatra(today);
  const planet = getDominantPlanet(today);
  
  // Get Nakshatra guidance
  const nakshatraKey = nakshatra.replace(/\s+/g, '_');
  const guidance = NAKSHATRA_GUIDANCE[nakshatraKey] || {
    theme: 'Balance & Harmony',
    do: ['Stay centered', 'Practice mindfulness', 'Maintain balance'],
    avoid: ['Extremes', 'Reacting impulsively', 'Losing focus'],
  };

  // Get teacher wisdom for today's planet
  const wisdomList = VEDIC_WISDOM[planet] || VEDIC_WISDOM['Moon'];
  const randomWisdom = wisdomList[Math.floor(Math.random() * wisdomList.length)];

  // Tier-based enhancements
  let planetaryInfluence = `${planet} is prominent today, influencing your ${guidance.theme.toLowerCase()}.`;
  
  if (tier === 'premium' || tier === 'master') {
    planetaryInfluence += ` The planetary energies support ${guidance.do[0]?.toLowerCase() || 'your endeavors'}.`;
    
    if (tier === 'master' && birthDetails) {
      planetaryInfluence += ` Based on your birth chart, this is an auspicious time for ${guidance.theme.toLowerCase()}.`;
    }
  }

  return {
    nakshatra,
    theme: guidance.theme,
    do: guidance.do,
    avoid: guidance.avoid,
    planetaryInfluence,
    wisdomQuote: randomWisdom.quote,
    teacher: randomWisdom.teacher,
  };
}

/**
 * Generate detailed daily guidance for Premium tier
 */
export function getPremiumDailyGuidance(
  birthDetails: BirthDetails,
  date: Date = new Date()
): {
  career: string;
  relationships: string;
  health: string;
  finances: string;
} {
  const influence = getDailyVedicInfluence(birthDetails, 'premium');
  
  return {
    career: `Today's ${influence.nakshatra} energy supports ${influence.theme.toLowerCase()}. ${influence.do[0]} in your professional life.`,
    relationships: `In relationships, focus on ${influence.do[1] || influence.do[0]}. Avoid ${influence.avoid[0] || 'conflict'}.`,
    health: `For health, ${influence.do[0]?.toLowerCase() || 'maintain balance'}. Follow Ayurvedic principles aligned with today's planetary influence.`,
    finances: `Financial matters are supported by ${influence.theme.toLowerCase()}. ${influence.do[2] || 'Plan wisely'}.`,
  };
}

/**
 * Generate Master tier deep reading (simplified - in production use full chart calculations)
 */
export function getMasterDeepReading(birthDetails: BirthDetails): {
  soulPurpose: string;
  karmaPatterns: string;
  strengths: string;
  challenges: string;
  timingPeaks: string;
} {
  // Simplified - in production, calculate full Vedic chart
  return {
    soulPurpose: `Your birth chart reveals a path of ${birthDetails.name ? 'service and wisdom' : 'spiritual growth'}. Your dharma involves sharing knowledge and healing.`,
    karmaPatterns: `Past life patterns show a need for ${birthDetails.date ? 'balancing relationships and career' : 'spiritual discipline'}. Focus on dharma to transform karma.`,
    strengths: `Your chart shows natural abilities in leadership, compassion, and intuitive understanding. Use these to serve your purpose.`,
    challenges: `Areas requiring attention include patience, detachment from outcomes, and balancing material and spiritual pursuits.`,
    timingPeaks: `Current planetary cycles indicate a period of transformation. Major life changes are supported, especially in areas of ${birthDetails.place ? 'relationships and career' : 'spiritual growth'}.`,
  };
}

