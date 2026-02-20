/**
 * Jyotish Mantra Logic Engine (Sri Yukteswar Logic)
 * Calculates planetary influences for mantra recommendations:
 * - Vara (Day of Week): Current weekday ruler
 * - Dasha (Period): Major life period from birth chart
 * - Hora (Planetary Hour): Current planetary hour based on sunrise
 */

export type Planet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

/**
 * Vara Logic: Day of week rulers
 * Sunday=Sun, Monday=Moon, Tuesday=Mars, Wednesday=Mercury, Thursday=Jupiter, Friday=Venus, Saturday=Saturn
 */
export function getPlanetOfDay(): Planet {
  const dayOfWeek = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
  const dayPlanets: Planet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  return dayPlanets[dayOfWeek];
}

/**
 * Hora Logic: Planetary hours based on Chaldean order (Sri Yukteswar Precision)
 * CORRECT ORDER: Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon (repeats)
 * Each hora is ~1 hour, starting from sunrise
 * Day ruler determines the first Hora of the day
 */
export function getPlanetOfHour(sunriseTime: Date | null = null): Planet | null {
  if (!sunriseTime) {
    // Default sunrise calculation (simplified - assumes 6 AM)
    const now = new Date();
    sunriseTime = new Date(now);
    sunriseTime.setHours(6, 0, 0, 0);
  }

  const now = new Date();
  const hoursSinceSunrise = (now.getTime() - sunriseTime.getTime()) / (1000 * 60 * 60);
  
  // CORRECT Chaldean order: Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon
  const horaOrder: Planet[] = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  
  // Get day ruler (determines first hora)
  const dayOfWeek = sunriseTime.getDay(); // 0=Sunday, 1=Monday, etc.
  const dayRulers: Planet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const dayRuler = dayRulers[dayOfWeek];
  
  // Find starting index based on day ruler
  const startIndex = horaOrder.indexOf(dayRuler);
  if (startIndex === -1) return null;
  
  // Each hora is approximately 1 hour
  const horaIndex = (startIndex + Math.floor(hoursSinceSunrise)) % 7;
  return horaOrder[horaIndex];
}

/**
 * Normalize planet name for matching (handles variations)
 */
export function normalizePlanetName(planet: string | null | undefined): Planet | null {
  if (!planet) return null;
  
  const normalized = planet.toLowerCase().trim();
  const planetMap: Record<string, Planet> = {
    'sun': 'Sun',
    'surya': 'Sun',
    'moon': 'Moon',
    'chandra': 'Moon',
    'mars': 'Mars',
    'mangal': 'Mars',
    'mercury': 'Mercury',
    'buddha': 'Mercury',
    'jupiter': 'Jupiter',
    'guru': 'Jupiter',
    'venus': 'Venus',
    'shukra': 'Venus',
    'saturn': 'Saturn',
    'shani': 'Saturn',
    'rahu': 'Rahu',
    'ketu': 'Ketu',
  };
  
  return planetMap[normalized] || null;
}

/**
 * Match mantra to planet based on planet_type column or title keywords
 */
export function mantraMatchesPlanet(
  mantra: { planet_type?: string | null; title: string },
  planet: Planet
): boolean {
  // First check planet_type column
  if (mantra.planet_type) {
    const normalizedMantraPlanet = normalizePlanetName(mantra.planet_type);
    if (normalizedMantraPlanet === planet) {
      return true;
    }
  }
  
  // Fallback: check title keywords
  const titleLower = mantra.title.toLowerCase();
  const planetKeywords: Record<Planet, string[]> = {
    Sun: ['surya', 'sun'],
    Moon: ['chandra', 'moon'],
    Mars: ['mangal', 'mars'],
    Mercury: ['buddha', 'mercury'],
    Jupiter: ['guru', 'jupiter'],
    Venus: ['shukra', 'venus'],
    Saturn: ['shani', 'saturn'],
    Rahu: ['rahu'],
    Ketu: ['ketu'],
  };
  
  return planetKeywords[planet]?.some(keyword => titleLower.includes(keyword)) || false;
}

/**
 * Resonance Logic: Get daily Sanskrit mantra based on active planetary cycle
 * Returns the specific bija mantra for each planet (Bhrigu Vision)
 * 
 * Example usage:
 * const mantra = getDailyMantra('Rahu'); // Returns "Om Ram Rahave Namah"
 * const mantra = getDailyMantraFromChart('Rahu Dasha'); // Returns "Om Ram Rahave Namah"
 */
export function getDailyMantra(activePlanet: Planet | null): string | null {
  if (!activePlanet) return null;
  
  const mantraMap: Record<Planet, string> = {
    Rahu: 'Om Ram Rahave Namah',
    Ketu: 'Om Kem Ketave Namah',
    Venus: 'Om Shum Shukraya Namah', // Shukra
    Jupiter: 'Om Brim Brihaspataye Namah', // Guru
    Sun: 'Om Hrim Suryaya Namah',
    Moon: 'Om Shrim Chandramase Namah',
    Mars: 'Om Krim Mangalaya Namah',
    Mercury: 'Om Budhaya Namah',
    Saturn: 'Om Sham Shanaye Namah',
  };
  
  return mantraMap[activePlanet] || null;
}

/**
 * Get daily mantra from user chart (VedicReading)
 * Extracts active planet from currentDasha period
 */
export function getDailyMantraFromChart(
  currentDasha: string | null | undefined
): string | null {
  if (!currentDasha) return null;
  
  // Extract planet from "Rahu Dasha" → "Rahu"
  const planetName = currentDasha.split(' ')[0];
  const planet = normalizePlanetName(planetName);
  
  return planet ? getDailyMantra(planet) : null;
}
