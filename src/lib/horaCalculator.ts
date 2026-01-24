/**
 * Vedic Hora Calculator - Dr. Pillai / AstroVed Methodology
 * 
 * Implements accurate Planetary Hora calculations based on:
 * 1. Sunrise/Sunset anchoring (Vedic day begins at sunrise, not midnight)
 * 2. Variable Hora durations (Day divided into 12 Horas, Night divided into 12 Horas)
 * 3. Chaldean sequence: Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon
 * 4. Day ruler determines the first Hora of the day
 */

// Chaldean order of planetary speeds (slowest to fastest)
const CHALDEAN_SEQUENCE = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'] as const;

// Day rulers - each day starts with its ruling planet at sunrise
const DAY_RULERS: Record<number, typeof CHALDEAN_SEQUENCE[number]> = {
  0: 'Sun',      // Sunday
  1: 'Moon',     // Monday
  2: 'Mars',     // Tuesday
  3: 'Mercury',  // Wednesday
  4: 'Jupiter',  // Thursday
  5: 'Venus',    // Friday
  6: 'Saturn',   // Saturday
};

// Planet Sanskrit names and qualities
const PLANET_DETAILS: Record<string, { sanskrit: string; qualities: string }> = {
  Sun: { sanskrit: 'Surya', qualities: 'Authority, vitality, soul power' },
  Moon: { sanskrit: 'Chandra', qualities: 'Emotions, intuition, nurturing' },
  Mars: { sanskrit: 'Mangala', qualities: 'Action, courage, energy' },
  Mercury: { sanskrit: 'Budha', qualities: 'Communication, intellect, analysis' },
  Jupiter: { sanskrit: 'Guru', qualities: 'Wisdom, expansion, blessings' },
  Venus: { sanskrit: 'Shukra', qualities: 'Love, beauty, creativity' },
  Saturn: { sanskrit: 'Shani', qualities: 'Discipline, structure, karma' },
};

// Best activities for each planet's Hora
const HORA_ACTIVITIES: Record<string, string[]> = {
  Sun: ['Leadership decisions', 'Government matters', 'Health & vitality work', 'Father-related matters'],
  Moon: ['Meditation', 'Creative work', 'Public relations', 'Travel', 'Mother-related matters'],
  Mars: ['Physical training', 'Surgery', 'Property deals', 'Competitive activities', 'Technical work'],
  Mercury: ['Business deals', 'Writing', 'Learning', 'Communication', 'Financial analysis'],
  Jupiter: ['Spiritual practices', 'Teaching', 'Legal matters', 'Marriage ceremonies', 'Starting education'],
  Venus: ['Art & music', 'Romance', 'Luxury purchases', 'Entertainment', 'Beauty treatments'],
  Saturn: ['Long-term planning', 'Mining/Oil work', 'Dealing with servants', 'Iron/leather work', 'Ancestral matters'],
};

export interface HoraCalculation {
  currentHora: {
    planet: string;
    ruler: string;
    startTime: Date;
    endTime: Date;
    startTimeStr: string;
    endTimeStr: string;
    durationMinutes: number;
    isDay: boolean;
    horaIndex: number; // 0-23 (0-11 day, 12-23 night)
    bestFor: string[];
  };
  upcomingHoras: Array<{
    planet: string;
    ruler: string;
    startTime: Date;
    endTime: Date;
    startTimeStr: string;
    endTimeStr: string;
    durationMinutes: number;
    isDay: boolean;
    bestFor: string[];
  }>;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  dayRuler: string;
  remainingMs: number;
  vedicDayOfWeek: number; // Based on sunrise, not midnight
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
}

/**
 * Calculate approximate sunrise and sunset times based on date and coordinates
 * Uses simplified astronomical calculations suitable for Hora timing
 */
export function calculateSunTimes(date: Date, latitude: number, longitude: number, timezoneOffsetMinutes: number = 0): SunTimes {
  const dayOfYear = getDayOfYear(date);
  
  // Calculate solar declination (simplified)
  const declination = 23.45 * Math.sin(toRadians((360 / 365) * (dayOfYear - 81)));
  
  // Calculate hour angle at sunrise/sunset
  const latRad = toRadians(latitude);
  const decRad = toRadians(declination);
  
  // Hour angle formula: cos(H) = -tan(lat) * tan(dec)
  let cosH = -Math.tan(latRad) * Math.tan(decRad);
  
  // Clamp for polar regions
  cosH = Math.max(-1, Math.min(1, cosH));
  
  const hourAngle = toDegrees(Math.acos(cosH));
  
  // Solar noon in hours (12:00 + equation of time correction + longitude correction)
  const eot = equationOfTime(dayOfYear);
  const solarNoonMinutes = 720 - (4 * longitude) - eot + timezoneOffsetMinutes;
  
  // Sunrise and sunset in minutes from midnight
  const sunriseMinutes = solarNoonMinutes - (hourAngle * 4);
  const sunsetMinutes = solarNoonMinutes + (hourAngle * 4);
  
  // Create Date objects
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);
  
  const sunrise = new Date(baseDate.getTime() + sunriseMinutes * 60000);
  const sunset = new Date(baseDate.getTime() + sunsetMinutes * 60000);
  
  // Calculate next day's sunrise for night hora calculation
  const nextDayOfYear = dayOfYear + 1;
  const nextDeclination = 23.45 * Math.sin(toRadians((360 / 365) * (nextDayOfYear - 81)));
  const nextDecRad = toRadians(nextDeclination);
  let nextCosH = -Math.tan(latRad) * Math.tan(nextDecRad);
  nextCosH = Math.max(-1, Math.min(1, nextCosH));
  const nextHourAngle = toDegrees(Math.acos(nextCosH));
  const nextEot = equationOfTime(nextDayOfYear);
  const nextSolarNoonMinutes = 720 - (4 * longitude) - nextEot + timezoneOffsetMinutes;
  const nextSunriseMinutes = nextSolarNoonMinutes - (nextHourAngle * 4);
  
  const nextBaseDate = new Date(baseDate.getTime() + 24 * 60 * 60000);
  const nextSunrise = new Date(nextBaseDate.getTime() + nextSunriseMinutes * 60000);
  
  return { sunrise, sunset, nextSunrise };
}

/**
 * Get coordinates from timezone (approximate city centers)
 * This provides reasonable defaults when GPS is not available
 */
export function getCoordinatesFromTimezone(timezone: string): { latitude: number; longitude: number } {
  const timezoneCoords: Record<string, { latitude: number; longitude: number }> = {
    'Europe/Stockholm': { latitude: 59.33, longitude: 18.07 },
    'Europe/London': { latitude: 51.51, longitude: -0.13 },
    'Europe/Paris': { latitude: 48.86, longitude: 2.35 },
    'Europe/Berlin': { latitude: 52.52, longitude: 13.40 },
    'America/New_York': { latitude: 40.71, longitude: -74.01 },
    'America/Los_Angeles': { latitude: 34.05, longitude: -118.24 },
    'America/Chicago': { latitude: 41.88, longitude: -87.63 },
    'Asia/Tokyo': { latitude: 35.68, longitude: 139.69 },
    'Asia/Shanghai': { latitude: 31.23, longitude: 121.47 },
    'Asia/Kolkata': { latitude: 22.57, longitude: 88.36 },
    'Asia/Mumbai': { latitude: 19.08, longitude: 72.88 },
    'Asia/Dubai': { latitude: 25.20, longitude: 55.27 },
    'Australia/Sydney': { latitude: -33.87, longitude: 151.21 },
    'Pacific/Auckland': { latitude: -36.85, longitude: 174.76 },
    'Africa/Cairo': { latitude: 30.04, longitude: 31.24 },
    'Africa/Johannesburg': { latitude: -26.20, longitude: 28.04 },
  };
  
  return timezoneCoords[timezone] || { latitude: 28.61, longitude: 77.21 }; // Default to Delhi (India)
}

/**
 * Get the Vedic day of week (based on sunrise, not midnight)
 * If before sunrise, it's still the previous Vedic day
 */
function getVedicDayOfWeek(currentTime: Date, sunrise: Date): number {
  if (currentTime < sunrise) {
    // Before sunrise - still previous day in Vedic time
    const prevDay = new Date(currentTime);
    prevDay.setDate(prevDay.getDate() - 1);
    return prevDay.getDay();
  }
  return currentTime.getDay();
}

/**
 * Get the next planet in Chaldean sequence
 */
function getNextPlanet(currentPlanet: string): string {
  const currentIndex = CHALDEAN_SEQUENCE.indexOf(currentPlanet as typeof CHALDEAN_SEQUENCE[number]);
  const nextIndex = (currentIndex + 1) % CHALDEAN_SEQUENCE.length;
  return CHALDEAN_SEQUENCE[nextIndex];
}

/**
 * Calculate which Hora index we're in (0-23)
 * 0-11 = day horas (sunrise to sunset)
 * 12-23 = night horas (sunset to next sunrise)
 */
function calculateHoraIndex(
  currentTime: Date,
  sunrise: Date,
  sunset: Date,
  nextSunrise: Date
): { horaIndex: number; horaStart: Date; horaEnd: Date; isDay: boolean; horaDuration: number } {
  const currentMs = currentTime.getTime();
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();
  const nextSunriseMs = nextSunrise.getTime();
  
  if (currentMs >= sunriseMs && currentMs < sunsetMs) {
    // Daytime - divide into 12 horas
    const dayDurationMs = sunsetMs - sunriseMs;
    const horaDurationMs = dayDurationMs / 12;
    const elapsedMs = currentMs - sunriseMs;
    const horaIndex = Math.floor(elapsedMs / horaDurationMs);
    
    const horaStart = new Date(sunriseMs + horaIndex * horaDurationMs);
    const horaEnd = new Date(sunriseMs + (horaIndex + 1) * horaDurationMs);
    
    return {
      horaIndex,
      horaStart,
      horaEnd,
      isDay: true,
      horaDuration: horaDurationMs / 60000, // Convert to minutes
    };
  } else {
    // Nighttime - divide into 12 horas
    let nightStartMs: number;
    let nightEndMs: number;
    
    if (currentMs >= sunsetMs) {
      // After sunset same day
      nightStartMs = sunsetMs;
      nightEndMs = nextSunriseMs;
    } else {
      // Before sunrise (early morning) - use previous day's sunset
      const prevSunset = new Date(sunset);
      prevSunset.setDate(prevSunset.getDate() - 1);
      nightStartMs = prevSunset.getTime();
      nightEndMs = sunriseMs;
    }
    
    const nightDurationMs = nightEndMs - nightStartMs;
    const horaDurationMs = nightDurationMs / 12;
    const elapsedMs = currentMs - nightStartMs;
    const nightHoraIndex = Math.floor(elapsedMs / horaDurationMs);
    const horaIndex = 12 + nightHoraIndex; // Night horas are 12-23
    
    const horaStart = new Date(nightStartMs + nightHoraIndex * horaDurationMs);
    const horaEnd = new Date(nightStartMs + (nightHoraIndex + 1) * horaDurationMs);
    
    return {
      horaIndex: horaIndex % 24,
      horaStart,
      horaEnd,
      isDay: false,
      horaDuration: horaDurationMs / 60000,
    };
  }
}

/**
 * Get the ruling planet for a specific Hora index
 * The sequence starts with the day ruler and follows Chaldean order
 */
function getHoraPlanet(horaIndex: number, dayRuler: string): string {
  const startIndex = CHALDEAN_SEQUENCE.indexOf(dayRuler as typeof CHALDEAN_SEQUENCE[number]);
  const planetIndex = (startIndex + horaIndex) % 7;
  return CHALDEAN_SEQUENCE[planetIndex];
}

/**
 * Main Hora calculation function
 * Implements Dr. Pillai's AstroVed methodology
 */
export function calculateCurrentHora(
  currentTime: Date = new Date(),
  latitude: number,
  longitude: number,
  timezoneOffsetMinutes: number = 0
): HoraCalculation {
  // Calculate sun times for today
  const { sunrise, sunset, nextSunrise } = calculateSunTimes(
    currentTime,
    latitude,
    longitude,
    timezoneOffsetMinutes
  );
  
  // Handle case where we're before sunrise - need previous day's sunset
  let effectiveSunrise = sunrise;
  let effectiveSunset = sunset;
  let effectiveNextSunrise = nextSunrise;
  
  if (currentTime < sunrise) {
    // We're in the night period of the previous Vedic day
    const prevDay = new Date(currentTime);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevSunTimes = calculateSunTimes(prevDay, latitude, longitude, timezoneOffsetMinutes);
    effectiveSunset = prevSunTimes.sunset;
    effectiveNextSunrise = sunrise;
  }
  
  // Get Vedic day of week (determines first hora ruler)
  const vedicDayOfWeek = getVedicDayOfWeek(currentTime, effectiveSunrise);
  const dayRuler = DAY_RULERS[vedicDayOfWeek];
  
  // Calculate current hora
  const { horaIndex, horaStart, horaEnd, isDay, horaDuration } = calculateHoraIndex(
    currentTime,
    effectiveSunrise,
    effectiveSunset,
    effectiveNextSunrise
  );
  
  const currentPlanet = getHoraPlanet(horaIndex, dayRuler);
  const remainingMs = horaEnd.getTime() - currentTime.getTime();
  
  // Build current hora info
  const currentHora = {
    planet: currentPlanet,
    ruler: `${PLANET_DETAILS[currentPlanet].sanskrit} - ${PLANET_DETAILS[currentPlanet].qualities}`,
    startTime: horaStart,
    endTime: horaEnd,
    startTimeStr: formatTime(horaStart),
    endTimeStr: formatTime(horaEnd),
    durationMinutes: Math.round(horaDuration),
    isDay,
    horaIndex,
    bestFor: HORA_ACTIVITIES[currentPlanet] || [],
  };
  
  // Calculate next 4 horas
  const upcomingHoras: HoraCalculation['upcomingHoras'] = [];
  let nextHoraStart = horaEnd;
  
  for (let i = 1; i <= 4; i++) {
    const nextHoraIndex = (horaIndex + i) % 24;
    const nextPlanet = getHoraPlanet(nextHoraIndex, dayRuler);
    const nextIsDay = nextHoraIndex < 12;
    
    // Calculate duration based on day/night
    let nextHoraDuration: number;
    if (nextIsDay) {
      const dayDurationMs = effectiveSunset.getTime() - effectiveSunrise.getTime();
      nextHoraDuration = dayDurationMs / 12 / 60000;
    } else {
      const nightDurationMs = effectiveNextSunrise.getTime() - effectiveSunset.getTime();
      nextHoraDuration = nightDurationMs / 12 / 60000;
    }
    
    const nextHoraEnd = new Date(nextHoraStart.getTime() + nextHoraDuration * 60000);
    
    upcomingHoras.push({
      planet: nextPlanet,
      ruler: `${PLANET_DETAILS[nextPlanet].sanskrit} - ${PLANET_DETAILS[nextPlanet].qualities}`,
      startTime: new Date(nextHoraStart),
      endTime: nextHoraEnd,
      startTimeStr: formatTime(nextHoraStart),
      endTimeStr: formatTime(nextHoraEnd),
      durationMinutes: Math.round(nextHoraDuration),
      isDay: nextIsDay,
      bestFor: HORA_ACTIVITIES[nextPlanet] || [],
    });
    
    nextHoraStart = nextHoraEnd;
  }
  
  return {
    currentHora,
    upcomingHoras,
    sunrise: effectiveSunrise,
    sunset: effectiveSunset,
    nextSunrise: effectiveNextSunrise,
    dayRuler,
    remainingMs,
    vedicDayOfWeek,
  };
}

// Helper functions
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function equationOfTime(dayOfYear: number): number {
  const b = (360 / 365) * (dayOfYear - 81);
  return 9.87 * Math.sin(toRadians(2 * b)) - 7.53 * Math.cos(toRadians(b)) - 1.5 * Math.sin(toRadians(b));
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format remaining time as MM:SS or HH:MM:SS
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
