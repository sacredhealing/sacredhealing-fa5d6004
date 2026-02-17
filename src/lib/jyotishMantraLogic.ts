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
 * Hora Logic: Planetary hours based on Chaldean order
 * Order: Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars (repeats)
 * Each hora is ~1 hour, starting from sunrise
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
  
  // Chaldean order: Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars
  const horaOrder: Planet[] = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
  
  // Each hora is approximately 1 hour
  const horaIndex = Math.floor(hoursSinceSunrise) % 7;
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
