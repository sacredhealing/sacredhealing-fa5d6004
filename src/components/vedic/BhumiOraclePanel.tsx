// SQI-2050 | BHUMI ORACLE — Jyotish Astrocartography Panel
// Self-contained ACG computation — works from cached ephemeris data
// No edge function redeploy needed — computes lines client-side

import React, { useState, useEffect, useMemo } from 'react';

// ── Planet name normaliser ──────────────────────────────────────
const PLANET_TO_ID: Record<string,string> = {
  Sun:'sun',Moon:'moon',Mars:'mars',Mercury:'mercury',Jupiter:'jupiter',
  Venus:'venus',Saturn:'saturn',Rahu:'rahu',Ketu:'ketu',
  sun:'sun',moon:'moon',mars:'mars',mercury:'mercury',jupiter:'jupiter',
  venus:'venus',saturn:'saturn',rahu:'rahu',ketu:'ketu',
};

// ── Nakshatra lord map ──────────────────────────────────────────
const NAK_LORD: Record<string,string> = {
  Ashwini:'ketu',Bharani:'venus',Krittika:'sun',Rohini:'moon',
  Mrigashira:'mars',Ardra:'rahu',Punarvasu:'jupiter',Pushya:'saturn',
  Ashlesha:'mercury',Magha:'ketu','Purva Phalguni':'venus','Uttara Phalguni':'sun',
  Hasta:'moon',Chitra:'mars',Swati:'rahu',Vishakha:'jupiter',
  Anuradha:'saturn',Jyeshtha:'mercury',Mula:'ketu','Purva Ashadha':'venus',
  'Uttara Ashadha':'sun',Shravana:'moon',Dhanishtha:'mars',Shatabhisha:'rahu',
  'Purva Bhadrapada':'jupiter','Uttara Bhadrapada':'saturn',Revati:'mercury',
};

// ── Nakshatra → sidereal start longitude (0° of each nak = 13.33° apart) ──
const NAK_START: Record<string,number> = {
  Ashwini:0,Bharani:13.33,Krittika:26.67,Rohini:40,Mrigashira:53.33,Ardra:66.67,
  Punarvasu:80,Pushya:93.33,Ashlesha:106.67,Magha:120,'Purva Phalguni':133.33,
  'Uttara Phalguni':146.67,Hasta:160,Chitra:173.33,Swati:186.67,Vishakha:200,
  Anuradha:213.33,Jyeshtha:226.67,Mula:240,'Purva Ashadha':253.33,
  'Uttara Ashadha':266.67,Shravana:280,Dhanishtha:293.33,Shatabhisha:306.67,
  'Purva Bhadrapada':320,'Uttara Bhadrapada':333.33,Revati:346.67,
};

// ── Graha definitions ───────────────────────────────────────────
const GRAHAS = [
  {id:'sun',     name:'Surya',   sym:'☉', color:'#F59E0B', benefic:false},
  {id:'moon',    name:'Chandra', sym:'☽', color:'#C0C8E8', benefic:true },
  {id:'mars',    name:'Mangala', sym:'♂', color:'#EF4444', benefic:false},
  {id:'mercury', name:'Budha',   sym:'☿', color:'#10B981', benefic:true },
  {id:'jupiter', name:'Guru',    sym:'♃', color:'#D4AF37', benefic:true },
  {id:'venus',   name:'Shukra',  sym:'♀', color:'#EC4899', benefic:true },
  {id:'saturn',  name:'Shani',   sym:'♄', color:'#6366F1', benefic:false},
  {id:'rahu',    name:'Rāhu',    sym:'☊', color:'#8B5CF6', benefic:false},
  {id:'ketu',    name:'Ketu',    sym:'☋', color:'#F97316', benefic:false},
];

// ── Angle meanings (36 combinations) ───────────────────────────
const MEANINGS: Record<string,Record<string,string>> = {
  ASC:{
    sun:'Identity and leadership radiate from you here. Seen as radiant and authoritative. Best zone for personal brand and visibility.',
    moon:'Deep emotional intelligence is your public face. Healing and nurturing roles come naturally. People feel safe with you here.',
    mars:'Bold and energised presence. Physical vitality peaks. Competitive energy strong — channel Agni consciously.',
    mercury:'Sharp intellect and communication define you here. Teaching, writing, and business thrive. Your voice carries authority.',
    jupiter:'Guru energy radiates from you. Wisdom, generosity, and dharma become your identity. Expansion in all areas of life.',
    venus:'Beauty, grace, and charm become your signature. Love and artistic creation flow most naturally here.',
    saturn:'Disciplined and serious persona. Life demands hard work but rewards mastery. Health consciousness important.',
    rahu:'Foreign and innovative boundary-breaking identity. Fame possible — use ambition with full awareness.',
    ketu:'Spiritual and mystical presence. Past-life gifts surface spontaneously. Others sense your otherworldly wisdom.',
  },
  MC:{
    sun:'Career and public reputation peak here. Government favour, recognition, and authority amplified. Best for visibility.',
    moon:'Public career in healing, hospitality, or service. Emotional intelligence recognised. Fame through nurturing.',
    mars:'Driven professional energy. Leadership and engineering success. Ambition amplified — results come fast.',
    mercury:'Communication and intellect define your career here. Writing, teaching, trading, and business intelligence peaks.',
    jupiter:'Most auspicious MC line. Career in dharma, education, law, or spiritual work. Wealth through wisdom and service.',
    venus:'Artistic and creative career peaks. Fame in beauty, arts, or luxury. Love life public and blessed.',
    saturn:'Career requires discipline and long-term effort. Slow but permanent gains. Authority through earned mastery.',
    rahu:'Unconventional fame zone. Technology, foreign career, or media success. Ambition watched carefully brings results.',
    ketu:'Spiritual vocation becomes public recognition. Renunciation respected. Career in moksha-related fields.',
  },
  DSC:{
    sun:'Relationships with powerful and authoritative partners. Marriage to someone solar — bright and commanding.',
    moon:'Deeply nurturing partnerships form here. Emotional bonds intensify. Marriage and close relationships are healing.',
    mars:'Passionate and intense partnerships. Magnetic attraction — channel the energy consciously for longevity.',
    mercury:'Intellectual partnerships and business alliances. Communication is the bond. Sharp and productive collaborations.',
    jupiter:'Most auspicious DSC line. Wise, dharmic, and expansive partners appear here. Best zone for marriage.',
    venus:'Zone of love and deep romance. Marriage prospects peak strongly here. Beautiful artistic partnerships blossom.',
    saturn:'Karmic partnerships form here. Long-lasting but requiring work, patience, and commitment over time.',
    rahu:'Foreign or unusual partnerships. Intense attraction with karmic undercurrent. Illusion possible — stay aware.',
    ketu:'Past-life partnerships resurface. Spiritually significant bonds. Detachment from relationship identity needed.',
  },
  IC:{
    sun:'Ancestral solar power activates. Rootedness in identity. Family as the foundation of authority and legacy.',
    moon:'Deepest emotional home zone. Most nurturing environment. Ideal for family life, inner peace, and restoration.',
    mars:'Intense home environment. Property acquisition strong here. Active and driven domestic life.',
    mercury:'Intellectual home life. Study, writing, and communication in private. Family of thinkers and communicators.',
    jupiter:'Home as sacred temple. Most auspicious IC — home filled with dharma, learning, wisdom, and expansion.',
    venus:'Beautiful and harmonious home environment. Artistic domestic setting. Deep joy and comfort in private life.',
    saturn:'Home as place of discipline and ancestral karma. Long-term stability earned through sustained effort.',
    rahu:'Foreign or unusual home environment. Restless roots. Strong innovation and experimentation in private life.',
    ketu:'Home as ashram. Deep spiritual private life. Ancestor karma resolves naturally. Solitude feels sacred.',
  },
};


// ── Geographic place lookup ─────────────────────────────────────
// lon: -180..180, lat: -90..90
interface GeoPlace {
  name: string; lat: number; lon: number; region: string;
}

const GEO_PLACES: GeoPlace[] = [
  // Europe
  {name:'Reykjavik',lat:64.1,lon:-21.9,region:'Iceland'},
  {name:'Oslo',lat:59.9,lon:10.8,region:'Norway'},
  {name:'Stockholm',lat:59.3,lon:18.1,region:'Sweden'},
  {name:'Helsinki',lat:60.2,lon:24.9,region:'Finland'},
  {name:'Copenhagen',lat:55.7,lon:12.6,region:'Denmark'},
  {name:'Edinburgh',lat:55.9,lon:-3.2,region:'Scotland'},
  {name:'London',lat:51.5,lon:-0.1,region:'England'},
  {name:'Dublin',lat:53.3,lon:-6.3,region:'Ireland'},
  {name:'Amsterdam',lat:52.4,lon:4.9,region:'Netherlands'},
  {name:'Brussels',lat:50.8,lon:4.4,region:'Belgium'},
  {name:'Paris',lat:48.9,lon:2.4,region:'France'},
  {name:'Zurich',lat:47.4,lon:8.5,region:'Switzerland'},
  {name:'Berlin',lat:52.5,lon:13.4,region:'Germany'},
  {name:'Vienna',lat:48.2,lon:16.4,region:'Austria'},
  {name:'Prague',lat:50.1,lon:14.4,region:'Czech Republic'},
  {name:'Warsaw',lat:52.2,lon:21.0,region:'Poland'},
  {name:'Kyiv',lat:50.5,lon:30.5,region:'Ukraine'},
  {name:'Madrid',lat:40.4,lon:-3.7,region:'Spain'},
  {name:'Lisbon',lat:38.7,lon:-9.1,region:'Portugal'},
  {name:'Barcelona',lat:41.4,lon:2.2,region:'Spain'},
  {name:'Lyon',lat:45.7,lon:4.8,region:'France'},
  {name:'Milan',lat:45.5,lon:9.2,region:'Italy'},
  {name:'Rome',lat:41.9,lon:12.5,region:'Italy'},
  {name:'Athens',lat:37.9,lon:23.7,region:'Greece'},
  {name:'Istanbul',lat:41.0,lon:28.9,region:'Turkey'},
  {name:'Bucharest',lat:44.4,lon:26.1,region:'Romania'},
  {name:'Budapest',lat:47.5,lon:19.0,region:'Hungary'},
  {name:'Belgrade',lat:44.8,lon:20.5,region:'Serbia'},
  {name:'Sofia',lat:42.7,lon:23.3,region:'Bulgaria'},
  {name:'Tallinn',lat:59.4,lon:24.7,region:'Estonia'},
  {name:'Riga',lat:56.9,lon:24.1,region:'Latvia'},
  {name:'Vilnius',lat:54.7,lon:25.3,region:'Lithuania'},
  // Russia / Central Asia
  {name:'Moscow',lat:55.8,lon:37.6,region:'Russia'},
  {name:'St Petersburg',lat:59.9,lon:30.3,region:'Russia'},
  {name:'Novosibirsk',lat:55.0,lon:82.9,region:'Russia'},
  {name:'Almaty',lat:43.3,lon:76.9,region:'Kazakhstan'},
  {name:'Tashkent',lat:41.3,lon:69.2,region:'Uzbekistan'},
  // Middle East
  {name:'Ankara',lat:39.9,lon:32.9,region:'Turkey'},
  {name:'Beirut',lat:33.9,lon:35.5,region:'Lebanon'},
  {name:'Tel Aviv',lat:32.1,lon:34.8,region:'Israel'},
  {name:'Jerusalem',lat:31.8,lon:35.2,region:'Israel'},
  {name:'Amman',lat:31.9,lon:35.9,region:'Jordan'},
  {name:'Baghdad',lat:33.3,lon:44.4,region:'Iraq'},
  {name:'Tehran',lat:35.7,lon:51.4,region:'Iran'},
  {name:'Dubai',lat:25.2,lon:55.3,region:'UAE'},
  {name:'Riyadh',lat:24.7,lon:46.7,region:'Saudi Arabia'},
  {name:'Muscat',lat:23.6,lon:58.6,region:'Oman'},
  // South Asia
  {name:'Karachi',lat:24.9,lon:67.0,region:'Pakistan'},
  {name:'Lahore',lat:31.5,lon:74.3,region:'Pakistan'},
  {name:'New Delhi',lat:28.6,lon:77.2,region:'India'},
  {name:'Mumbai',lat:19.1,lon:72.9,region:'India'},
  {name:'Bangalore',lat:13.0,lon:77.6,region:'India'},
  {name:'Chennai',lat:13.1,lon:80.3,region:'India'},
  {name:'Kolkata',lat:22.6,lon:88.4,region:'India'},
  {name:'Varanasi',lat:25.3,lon:83.0,region:'India'},
  {name:'Tiruvannamalai',lat:12.2,lon:79.1,region:'Tamil Nadu'},
  {name:'Madurai',lat:9.9,lon:78.1,region:'Tamil Nadu'},
  {name:'Kathmandu',lat:27.7,lon:85.3,region:'Nepal'},
  {name:'Colombo',lat:6.9,lon:79.9,region:'Sri Lanka'},
  {name:'Dhaka',lat:23.8,lon:90.4,region:'Bangladesh'},
  // East/SE Asia
  {name:'Lhasa',lat:29.6,lon:91.1,region:'Tibet'},
  {name:'Chengdu',lat:30.7,lon:104.1,region:'China'},
  {name:'Beijing',lat:39.9,lon:116.4,region:'China'},
  {name:'Shanghai',lat:31.2,lon:121.5,region:'China'},
  {name:'Hong Kong',lat:22.3,lon:114.2,region:'Hong Kong'},
  {name:'Taipei',lat:25.0,lon:121.5,region:'Taiwan'},
  {name:'Seoul',lat:37.6,lon:126.9,region:'South Korea'},
  {name:'Tokyo',lat:35.7,lon:139.7,region:'Japan'},
  {name:'Osaka',lat:34.7,lon:135.5,region:'Japan'},
  {name:'Bangkok',lat:13.8,lon:100.5,region:'Thailand'},
  {name:'Chiang Mai',lat:18.8,lon:99.0,region:'Thailand'},
  {name:'Yangon',lat:16.8,lon:96.2,region:'Myanmar'},
  {name:'Hanoi',lat:21.0,lon:105.8,region:'Vietnam'},
  {name:'Ho Chi Minh City',lat:10.8,lon:106.7,region:'Vietnam'},
  {name:'Phnom Penh',lat:11.6,lon:104.9,region:'Cambodia'},
  {name:'Vientiane',lat:17.9,lon:102.6,region:'Laos'},
  {name:'Kuala Lumpur',lat:3.1,lon:101.7,region:'Malaysia'},
  {name:'Singapore',lat:1.4,lon:103.8,region:'Singapore'},
  {name:'Jakarta',lat:-6.2,lon:106.8,region:'Indonesia'},
  {name:'Bali',lat:-8.4,lon:115.2,region:'Indonesia'},
  {name:'Manila',lat:14.6,lon:121.0,region:'Philippines'},
  // Oceania
  {name:'Darwin',lat:-12.5,lon:130.8,region:'Australia'},
  {name:'Perth',lat:-31.9,lon:115.9,region:'Australia'},
  {name:'Sydney',lat:-33.9,lon:151.2,region:'Australia'},
  {name:'Melbourne',lat:-37.8,lon:144.9,region:'Australia'},
  {name:'Brisbane',lat:-27.5,lon:153.0,region:'Australia'},
  {name:'Auckland',lat:-36.9,lon:174.8,region:'New Zealand'},
  // Africa
  {name:'Cairo',lat:30.0,lon:31.2,region:'Egypt'},
  {name:'Luxor',lat:25.7,lon:32.6,region:'Egypt'},
  {name:'Addis Ababa',lat:9.0,lon:38.7,region:'Ethiopia'},
  {name:'Nairobi',lat:-1.3,lon:36.8,region:'Kenya'},
  {name:'Dar es Salaam',lat:-6.8,lon:39.3,region:'Tanzania'},
  {name:'Johannesburg',lat:-26.2,lon:28.0,region:'South Africa'},
  {name:'Cape Town',lat:-33.9,lon:18.4,region:'South Africa'},
  {name:'Lagos',lat:6.5,lon:3.4,region:'Nigeria'},
  {name:'Accra',lat:5.6,lon:-0.2,region:'Ghana'},
  {name:'Dakar',lat:14.7,lon:-17.4,region:'Senegal'},
  {name:'Casablanca',lat:33.6,lon:-7.6,region:'Morocco'},
  {name:'Tunis',lat:36.8,lon:10.2,region:'Tunisia'},
  // Americas
  {name:'Anchorage',lat:61.2,lon:-149.9,region:'Alaska'},
  {name:'Vancouver',lat:49.3,lon:-123.1,region:'Canada'},
  {name:'Seattle',lat:47.6,lon:-122.3,region:'USA'},
  {name:'San Francisco',lat:37.8,lon:-122.4,region:'USA'},
  {name:'Los Angeles',lat:34.1,lon:-118.2,region:'USA'},
  {name:'Las Vegas',lat:36.2,lon:-115.1,region:'USA'},
  {name:'Denver',lat:39.7,lon:-104.9,region:'USA'},
  {name:'Chicago',lat:41.9,lon:-87.6,region:'USA'},
  {name:'New York',lat:40.7,lon:-74.0,region:'USA'},
  {name:'Miami',lat:25.8,lon:-80.2,region:'USA'},
  {name:'Toronto',lat:43.7,lon:-79.4,region:'Canada'},
  {name:'Montreal',lat:45.5,lon:-73.6,region:'Canada'},
  {name:'Mexico City',lat:19.4,lon:-99.1,region:'Mexico'},
  {name:'Havana',lat:23.1,lon:-82.4,region:'Cuba'},
  {name:'Guatemala City',lat:14.6,lon:-90.5,region:'Guatemala'},
  {name:'Bogotá',lat:4.7,lon:-74.1,region:'Colombia'},
  {name:'Quito',lat:-0.2,lon:-78.5,region:'Ecuador'},
  {name:'Lima',lat:-12.1,lon:-77.0,region:'Peru'},
  {name:'Cusco',lat:-13.5,lon:-71.9,region:'Peru'},
  {name:'La Paz',lat:-16.5,lon:-68.1,region:'Bolivia'},
  {name:'São Paulo',lat:-23.5,lon:-46.6,region:'Brazil'},
  {name:'Rio de Janeiro',lat:-22.9,lon:-43.2,region:'Brazil'},
  {name:'Brasília',lat:-15.8,lon:-47.9,region:'Brazil'},
  {name:'Buenos Aires',lat:-34.6,lon:-58.4,region:'Argentina'},
  {name:'Santiago',lat:-33.5,lon:-70.7,region:'Chile'},
  {name:'Montevideo',lat:-34.9,lon:-56.2,region:'Uruguay'},
  {name:'Caracas',lat:10.5,lon:-66.9,region:'Venezuela'},
];

/**
 * Find place names near a geographic longitude (for MC/IC lines)
 * or along an ASC/DSC curve's lat/lon points
 */
function placesNearLon(lon: number, radius = 18): string[] {
  const nearby = GEO_PLACES.filter(p => {
    const diff = Math.abs(p.lon - lon);
    return diff <= radius || diff >= (360 - radius);
  });
  // Sort by latitude (north to south) and deduplicate regions
  nearby.sort((a,b) => b.lat - a.lat);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of nearby) {
    if (!seen.has(p.region)) {
      seen.add(p.region);
      result.push(p.name);
    }
    if (result.length >= 6) break;
  }
  return result;
}

function placesAlongCurve(svgPts: string, radius = 14): string[] {
  // Parse SVG points back to geo coords
  // SVG: x = (lon+180)/360*100, y = (80-lat)/160*60
  const pts = svgPts.split(' ').filter(Boolean).slice(0, 60);
  const geoPts = pts.map(pt => {
    const [x,y] = pt.split(',').map(Number);
    const lon = (x/100)*360 - 180;
    const lat = 80 - (y/60)*160;
    return {lon, lat};
  });

  const nearby: GeoPlace[] = [];
  for (const p of GEO_PLACES) {
    for (const gp of geoPts) {
      const dLon = Math.abs(p.lon - gp.lon);
      const dLat = Math.abs(p.lat - gp.lat);
      if (dLon <= radius && dLat <= 8) {
        nearby.push(p);
        break;
      }
    }
  }
  nearby.sort((a,b) => b.lat - a.lat);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of nearby) {
    if (!seen.has(p.region)) {
      seen.add(p.region);
      result.push(p.name);
    }
    if (result.length >= 6) break;
  }
  return result;
}

function getLinePlaces(line: ACGLine): string[] {
  if (line.angle === 'MC' || line.angle === 'IC') {
    return placesNearLon(line.mcLon ?? 0);
  }
  return placesAlongCurve(line.svgPoints);
}

// ── ACG Mathematics ─────────────────────────────────────────────
function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }

function calcGMST(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const g = 280.46061837 + 360.98564736629*(jd-2451545.0)
    + 0.000387933*T*T - T*T*T/38710000.0;
  return ((g % 360) + 360) % 360;
}

function dateToJD(birthDate: string, birthTime: string, birthLon: number): number {
  const [yr,mo,dy] = birthDate.split('-').map(Number);
  const [hr,mn] = (birthTime||'12:00').split(':').map(Number);
  const utcHr = hr + mn/60 - birthLon/15;
  const a = Math.floor((14-mo)/12);
  const y = yr+4800-a; const m2 = mo+12*a-3;
  const jdn = dy+Math.floor((153*m2+2)/5)+365*y
    +Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  return jdn + (utcHr-12)/24;
}

// Compute approximate sidereal planet longitudes from birth date
// Uses mean longitude formulae accurate to ~1-2° — enough for ACG line placement
function approxPlanetLongitudes(jd: number): Record<string,number> {
  const T = (jd - 2451545.0) / 36525.0;
  // Tropical mean longitudes (degrees)
  const tropical: Record<string,number> = {
    sun:  ((280.46646 + 36000.76983*T) % 360 + 360) % 360,
    moon: ((218.3165 + 481267.8813*T)  % 360 + 360) % 360,
    mars: ((355.433 + 19140.299*T)     % 360 + 360) % 360,
    mercury:((252.251 + 149472.674*T)  % 360 + 360) % 360,
    jupiter:((34.351 + 3034.906*T)     % 360 + 360) % 360,
    venus:  ((181.979 + 58517.816*T)   % 360 + 360) % 360,
    saturn: ((50.077 + 1222.114*T)     % 360 + 360) % 360,
    rahu:   ((125.044 - 1934.136*T)    % 360 + 360) % 360,
  };
  // Lahiri ayanamsa (approx)
  const ayanamsa = 23.85 + (T * 50.3 / 3600);
  const sidereal: Record<string,number> = {};
  for (const [p, lon] of Object.entries(tropical)) {
    sidereal[p] = ((lon - ayanamsa) % 360 + 360) % 360;
  }
  // Ketu = Rahu + 180
  sidereal['ketu'] = (sidereal['rahu'] + 180) % 360;
  return sidereal;
}

interface ACGLine {
  planet: string;
  name: string;
  angle: string;
  color: string;
  benefic: boolean;
  // SVG polyline points string "x1,y1 x2,y2 ..."
  svgPoints: string;
  meaning: string;
  // The longitude where MC/IC line sits (for display)
  mcLon?: number;
}

interface Paran {
  p1: string; p2: string; name1: string; name2: string;
  c1: string; c2: string; lon: number; meaning: string;
}

function lonToX(lon: number): number { return ((lon+180)/360)*100; }
function latToY(lat: number): number { return ((80-lat)/160)*60; }

function computeLines(
  planetLons: Record<string,number>,
  gmst: number
): ACGLine[] {
  const lines: ACGLine[] = [];
  const EPS = 23.44;

  for (const g of GRAHAS) {
    const lon = planetLons[g.id];
    if (lon == null) continue;

    const eLon = toRad(lon);
    const epsR = toRad(EPS);
    const ra   = toDeg(Math.atan2(Math.sin(eLon)*Math.cos(epsR), Math.cos(eLon)));
    const raPos= ((ra%360)+360)%360;
    const dec  = toDeg(Math.asin(Math.sin(eLon)*Math.sin(epsR)));
    const tanDec = Math.tan(toRad(dec));

    // MC line — vertical, fixed longitude
    const mcLon = ((raPos - gmst + 180 + 360) % 360) - 180;
    const mcPts: string[] = [];
    for (let lat=-80;lat<=80;lat+=4) {
      mcPts.push(`${lonToX(mcLon).toFixed(1)},${latToY(lat).toFixed(1)}`);
    }
    lines.push({planet:g.id,name:g.name,angle:'MC',color:g.color,benefic:g.benefic,svgPoints:mcPts.join(' '),meaning:MEANINGS.MC[g.id]??'',mcLon});

    // IC line — opposite MC
    const icLon = ((mcLon+180+360)%360)-180;
    const icPts: string[] = [];
    for (let lat=-80;lat<=80;lat+=4) {
      icPts.push(`${lonToX(icLon).toFixed(1)},${latToY(lat).toFixed(1)}`);
    }
    lines.push({planet:g.id,name:g.name,angle:'IC',color:g.color,benefic:g.benefic,svgPoints:icPts.join(' '),meaning:MEANINGS.IC[g.id]??'',mcLon:icLon});

    // ASC + DSC — curved great circles
    if (Math.abs(tanDec) > 0.001) {
      const ascPts: string[] = [];
      const dscPts: string[] = [];
      for (let gLon=-180;gLon<=180;gLon+=2) {
        const lst = ((gmst+gLon+360)%360);
        const H   = toRad(((lst-raPos+360)%360));
        const latR= Math.atan(-Math.cos(H)/tanDec);
        const lat = toDeg(latR);
        if (lat>=-78&&lat<=78) ascPts.push(`${lonToX(gLon).toFixed(1)},${latToY(lat).toFixed(1)}`);
        const H2  = toRad(((lst-raPos+180+360)%360));
        const latR2=Math.atan(-Math.cos(H2)/tanDec);
        const lat2= toDeg(latR2);
        if (lat2>=-78&&lat2<=78) dscPts.push(`${lonToX(gLon).toFixed(1)},${latToY(lat2).toFixed(1)}`);
      }
      if (ascPts.length>3) lines.push({planet:g.id,name:g.name,angle:'ASC',color:g.color,benefic:g.benefic,svgPoints:ascPts.join(' '),meaning:MEANINGS.ASC[g.id]??''});
      if (dscPts.length>3) lines.push({planet:g.id,name:g.name,angle:'DSC',color:g.color,benefic:g.benefic,svgPoints:dscPts.join(' '),meaning:MEANINGS.DSC[g.id]??''});
    }
  }
  return lines;
}

function computeParans(lines: ACGLine[]): Paran[] {
  const mcLines = lines.filter(l=>l.angle==='MC');
  const parans: Paran[] = [];
  for (let i=0;i<mcLines.length;i++) for (let j=i+1;j<mcLines.length;j++) {
    const a=mcLines[i], b=mcLines[j];
    if (a.mcLon==null||b.mcLon==null) continue;
    const diff=Math.abs(a.mcLon-b.mcLon);
    if (diff<=6||diff>=354) {
      const g1=GRAHAS.find(g=>g.id===a.planet), g2=GRAHAS.find(g=>g.id===b.planet);
      parans.push({p1:a.planet,p2:b.planet,name1:a.name,name2:b.name,
        c1:a.color,c2:b.color,lon:(a.mcLon+b.mcLon)/2,
        meaning:`${a.name} × ${b.name} — ${g1?.benefic&&g2?.benefic?'Double benefic power zone. Wisdom, grace, and dharmic opportunity converge here.':g1?.benefic||g2?.benefic?'Benefic and challenging energies blend. Great potential with conscious navigation.':'Intense karmic activation zone. Powerful transformation demands full awareness.'}`});
    }
  }
  return parans;
}

function placeToCoords(place: string): {x:number;y:number} {
  const p = place.toLowerCase();
  const locs = [
    {keys:['uddevalla'],x:50.2,y:13.8},{keys:['stockholm'],x:51,y:13},
    {keys:['gothenburg','göteborg'],x:49.8,y:14.2},{keys:['sweden','sverige'],x:51,y:13},
    {keys:['oslo','norway'],x:49,y:12.5},{keys:['copenhagen','denmark'],x:51,y:15},
    {keys:['helsinki','finland'],x:53,y:12},{keys:['london','england','uk','britain'],x:44,y:19},
    {keys:['paris','france'],x:47,y:25},{keys:['berlin','germany'],x:51,y:21},
    {keys:['amsterdam','netherlands'],x:48,y:20},{keys:['vienna','austria'],x:51,y:23},
    {keys:['madrid','spain'],x:44,y:27},{keys:['rome','italy'],x:51,y:26},
    {keys:['moscow','russia'],x:60,y:16},{keys:['istanbul','turkey'],x:56,y:24},
    {keys:['dubai','uae'],x:59,y:29},{keys:['delhi','new delhi'],x:65,y:29},
    {keys:['mumbai','bombay'],x:63,y:31},{keys:['chennai','madras'],x:64,y:34},
    {keys:['bangalore','bengaluru'],x:63,y:33},{keys:['india','bharat'],x:65,y:30},
    {keys:['kathmandu','nepal'],x:66,y:28},{keys:['beijing','china'],x:72,y:24},
    {keys:['tokyo','japan'],x:80,y:23},{keys:['singapore'],x:72,y:35},
    {keys:['bali'],x:73,y:36},{keys:['australia','sydney'],x:78,y:48},
    {keys:['cairo','egypt'],x:54,y:28},{keys:['new york','nyc'],x:20,y:24},
    {keys:['los angeles','california'],x:11,y:25},{keys:['toronto','canada'],x:17,y:15},
    {keys:['brazil','sao paulo'],x:24,y:40},{keys:['argentina','buenos aires'],x:21,y:50},
    {keys:['lima','peru'],x:17,y:41},
  ];
  for (const loc of locs) if (loc.keys.some(k=>p.includes(k))) return {x:loc.x,y:loc.y};
  return {x:50,y:30};
}

// ── Component ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BhumiOraclePanel: React.FC<{birthData:any;ephemeris:any}> = ({birthData,ephemeris}) => {
  const [selected,setSelected] = useState<string|null>(null);
  const [activeGraha,setActiveGraha] = useState<string|null>(null);
  const [activeAngle,setActiveAngle] = useState<string|null>(null);
  const [subTab,setSubTab] = useState<'map'|'lines'|'parans'|'blueprint'>('map');
  const [beneficOnly,setBeneficOnly] = useState(false);
  const [hoveredLine,setHoveredLine] = useState<string|null>(null);
  const [pulse,setPulse] = useState(0);

  useEffect(()=>{
    const iv=setInterval(()=>setPulse(p=>(p+1)%100),60);
    return ()=>clearInterval(iv);
  },[]);

  const userName: string    = birthData?.birth_name  ?? '';
  const birthPlace: string  = birthData?.birth_place ?? '';
  const birthDate: string   = birthData?.birth_date  ?? '';
  const birthTime: string   = birthData?.birth_time  ?? '12:00';
  const moonNak: string     = ephemeris?.moonNakshatra ?? '';
  const sunSign: string     = ephemeris?.sunSign ?? '';
  const ascendant: string   = ephemeris?.ascendantSign ?? '';
  const mahaRaw: string     = ephemeris?.dashaData?.activeMaha?.planet ?? '';
  const antarRaw: string    = ephemeris?.dashaData?.activeAntar?.planet ?? '';
  const mahaId: string      = PLANET_TO_ID[mahaRaw] ?? '';
  const antarId: string     = PLANET_TO_ID[antarRaw] ?? '';
  const nakLordId: string   = NAK_LORD[moonNak] ?? '';

  const dashaIds = useMemo(()=>{
    const s=new Set<string>();
    if(mahaId) s.add(mahaId);
    if(antarId) s.add(antarId);
    if(nakLordId) s.add(nakLordId);
    return s;
  },[mahaId,antarId,nakLordId]);

  const isDasha = (pid:string) => dashaIds.has(pid);

  // ── Compute ACG lines from birth data (client-side) ──────────
  const {acgLines, parans} = useMemo(()=>{
    if (!birthDate) return {acgLines:[] as ACGLine[], parans:[] as Paran[]};

    // Try to use real planet longitudes from ephemeris if available
    // (populated after edge function redeploy), else use approximation
    const stored = ephemeris?.planetLongitudes as Record<string,number>|undefined;

    // Approximate birth place coords for GMST
    const coords = placeToCoords(birthPlace);
    // Convert SVG coords back to rough lon (coords.x is SVG, not geo)
    // Use direct geo lon lookup instead
    const geoLon = birthPlace.toLowerCase().includes('sweden')||birthPlace.toLowerCase().includes('uddevalla') ? 12.0
      : birthPlace.toLowerCase().includes('india') ? 79.0
      : birthPlace.toLowerCase().includes('uk')||birthPlace.toLowerCase().includes('london') ? 0.0
      : birthPlace.toLowerCase().includes('france') ? 2.35
      : birthPlace.toLowerCase().includes('usa')||birthPlace.toLowerCase().includes('new york') ? -74.0
      : birthPlace.toLowerCase().includes('australia') ? 151.0
      : birthPlace.toLowerCase().includes('japan') ? 139.0
      : 0.0;

    const jd   = dateToJD(birthDate, birthTime, geoLon);
    const gmst = calcGMST(jd);

    // Use stored longitudes if available, else compute from formulae
    const planetLons = stored && Object.keys(stored).length >= 7
      ? stored
      : approxPlanetLongitudes(jd);

    // If we have Moon nakshatra, refine Moon longitude from it
    if (!stored && moonNak && NAK_START[moonNak] != null) {
      planetLons['moon'] = NAK_START[moonNak] + 6.67; // mid-nakshatra
    }

    const lines = computeLines(planetLons, gmst);
    const pars  = computeParans(lines);
    return {acgLines:lines, parans:pars};
  },[birthDate,birthTime,birthPlace,moonNak,ephemeris?.planetLongitudes]);

  const sinPulse = Math.sin(pulse*0.063*Math.PI);
  const birthMarker = useMemo(()=>placeToCoords(birthPlace),[birthPlace]);
  const cityLabel = birthPlace.split(',')[0].trim();

  const visibleLines = useMemo(()=>acgLines.filter(l=>{
    if(activeGraha && l.planet!==activeGraha) return false;
    if(activeAngle && l.angle!==activeAngle) return false;
    if(beneficOnly && !l.benefic) return false;
    return true;
  }),[acgLines,activeGraha,activeAngle,beneficOnly]);

  const selLine = selected ? acgLines.find(l=>`${l.planet}-${l.angle}`===selected) : null;

  const ANGLE_DASH: Record<string,string> = {ASC:'none',MC:'2,1',DSC:'4,2',IC:'6,3'};

  if (!birthData) return (
    <div style={{textAlign:'center' as const,padding:'40px 20px',color:'rgba(255,255,255,0.4)',fontSize:13,lineHeight:1.7}}>
      <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>🌍</div>
      Enter your birth data in the Overview tab to activate your Sacred Geography Reading.
    </div>
  );

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}>

      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:9,letterSpacing:'0.4em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:5}}>
          Bhumi Oracle · Jyotish Astrocartography · {acgLines.length} ACG Lines
        </div>
        <h2 style={{margin:'0 0 4px',fontSize:'clamp(20px,4vw,26px)',fontWeight:900,letterSpacing:'-0.04em',color:'#D4AF37',textShadow:'0 0 20px rgba(212,175,55,0.3)'}}>
          Sacred Geography Reader
        </h2>
        <p style={{margin:0,fontSize:12,color:'rgba(255,255,255,0.4)'}}>
          {userName&&`${userName} · `}{birthDate&&`${birthDate} · `}{birthPlace}
        </p>
      </div>

      {/* Dasha Banner */}
      <div style={{background:'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.1)',borderRadius:14,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' as const}}>
        <div style={{fontSize:8,letterSpacing:'0.3em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,whiteSpace:'nowrap'}}>Active Dasha</div>
        {mahaRaw ? <>
          <div style={{fontSize:13,fontWeight:600}}>
            <span style={{color:'#EC4899'}}>{mahaRaw}</span>
            {antarRaw&&<><span style={{color:'rgba(255,255,255,0.2)',margin:'0 6px'}}>›</span><span style={{color:'#D4AF37'}}>{antarRaw}</span></>}
          </div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',flex:1}}>
            {moonNak&&<>Moon: <span style={{color:'rgba(255,255,255,0.6)',fontWeight:600}}>{moonNak}</span></>}
            {ascendant&&<span style={{marginLeft:10}}>Lagna: <span style={{color:'rgba(255,255,255,0.6)',fontWeight:600}}>{ascendant}</span></span>}
          </div>
        </> : <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Calculate chart in My Chart tab</div>}
      </div>

      {/* Sub-tabs */}
      <div style={{display:'flex',marginBottom:16,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:50,padding:3,width:'fit-content',overflowX:'auto' as const}}>
        {(['map','lines','parans','blueprint'] as const).map(t=>(
          <button key={t} onClick={()=>setSubTab(t)} style={{background:subTab===t?'rgba(212,175,55,0.12)':'transparent',border:'none',borderRadius:50,color:subTab===t?'#D4AF37':'rgba(255,255,255,0.35)',padding:'6px 14px',cursor:'pointer',fontSize:10,fontWeight:subTab===t?700:400,whiteSpace:'nowrap' as const}}>
            {t==='map'?'🌍 Map':t==='lines'?`☉ Lines (${acgLines.length})`:t==='parans'?`✦ Parans (${parans.length})`:'Blueprint'}
          </button>
        ))}
      </div>

      {/* ══ MAP ══ */}
      {subTab==='map' && (
        <div style={{display:'flex',gap:16,flexWrap:'wrap' as const}}>
          <div style={{flex:'1 1 480px'}}>

            {/* Planet filter */}
            <div style={{display:'flex',gap:5,flexWrap:'wrap' as const,marginBottom:8}}>
              <button onClick={()=>setActiveGraha(null)} style={{background:!activeGraha?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.02)',border:`1px solid ${!activeGraha?'#D4AF37':'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 10px',cursor:'pointer',color:!activeGraha?'#D4AF37':'rgba(255,255,255,0.3)',fontSize:9,fontWeight:600}}>All</button>
              {GRAHAS.map(g=>(
                <button key={g.id} onClick={()=>setActiveGraha(activeGraha===g.id?null:g.id)} style={{background:activeGraha===g.id?`${g.color}18`:'rgba(255,255,255,0.02)',border:`1px solid ${activeGraha===g.id?g.color:'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 8px',cursor:'pointer',color:activeGraha===g.id?g.color:'rgba(255,255,255,0.3)',fontSize:9,fontWeight:activeGraha===g.id?700:400}}>
                  {g.sym} {g.name}
                </button>
              ))}
            </div>

            {/* Angle + benefic filter */}
            <div style={{display:'flex',gap:5,flexWrap:'wrap' as const,marginBottom:10}}>
              {['ASC','MC','DSC','IC'].map(a=>(
                <button key={a} onClick={()=>setActiveAngle(activeAngle===a?null:a)} style={{background:activeAngle===a?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.02)',border:`1px solid ${activeAngle===a?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 10px',cursor:'pointer',color:activeAngle===a?'white':'rgba(255,255,255,0.3)',fontSize:9,fontWeight:activeAngle===a?700:400}}>
                  {a}
                </button>
              ))}
              <button onClick={()=>setBeneficOnly(!beneficOnly)} style={{background:beneficOnly?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.02)',border:`1px solid ${beneficOnly?'#D4AF37':'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 10px',cursor:'pointer',color:beneficOnly?'#D4AF37':'rgba(255,255,255,0.3)',fontSize:9,fontWeight:beneficOnly?700:400}}>
                ✦ Benefics
              </button>
            </div>

            {/* MAP SVG */}
            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:18,overflow:'hidden'}}>
              <svg viewBox="0 0 100 60" style={{width:'100%',display:'block'}}>
                <rect width="100" height="60" fill="#060612"/>
                {[20,40,60,80].map(x=><line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.02)" strokeWidth="0.2"/>)}
                {[15,30,45].map(y=><line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.02)" strokeWidth="0.2"/>)}
                <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(212,175,55,0.05)" strokeWidth="0.3" strokeDasharray="1 2"/>

                {/* ACG Lines */}
                {visibleLines.map((line,i)=>{
                  const isDash = isDasha(line.planet);
                  const isSel  = selected===`${line.planet}-${line.angle}`;
                  const op = isSel?1.0:isDash?0.7:0.3;
                  const sw = isSel?0.65:isDash?0.45:0.28;
                  return (
                    <polyline key={i} points={line.svgPoints} fill="none"
                      stroke={line.color} strokeWidth={sw}
                      strokeDasharray={ANGLE_DASH[line.angle]}
                      opacity={op} style={{cursor:'pointer'}}
                      onClick={()=>setSelected(isSel?null:`${line.planet}-${line.angle}`)}
                      onMouseEnter={()=>setHoveredLine(`${line.planet}-${line.angle}`)}
                      onMouseLeave={()=>setHoveredLine(null)}
                    />
                  );
                })}

                {/* Paran dots */}
                {parans.map((p,i)=>(
                  <circle key={i} cx={lonToX(p.lon)} cy={30} r={0.7+0.4*sinPulse}
                    fill="#D4AF37" opacity={0.6+0.3*sinPulse}/>
                ))}

                {/* Birth marker */}
                <circle cx={birthMarker.x} cy={birthMarker.y} r={0.8+0.3*sinPulse} fill="#D4AF37" opacity="0.95" style={{pointerEvents:'none' as const}}/>
                <circle cx={birthMarker.x} cy={birthMarker.y} r="2.2" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity={0.3+0.2*sinPulse} style={{pointerEvents:'none' as const}}/>
                <text x={birthMarker.x+1.5} y={birthMarker.y-1} fontSize="1.4" fill="#D4AF37" fontWeight="800" opacity="0.85" style={{pointerEvents:'none' as const}}>✦ {cityLabel}</text>

                {/* Hover tooltip */}
                {hoveredLine && (() => {
                  const hl = acgLines.find(l=>`${l.planet}-${l.angle}`===hoveredLine);
                  if (!hl) return null;
                  const places = getLinePlaces(hl).slice(0,4);
                  const label = `${hl.name} ${hl.angle}${places.length ? ' — ' + places.join(', ') : ''}`;
                  return (
                    <text x="50" y="5" textAnchor="middle" fontSize="1.6" fill={hl.color}
                      fontWeight="700" style={{pointerEvents:'none' as const}}
                      filter="url(#shadow)">
                      {label}
                    </text>
                  );
                })()}
                <text x="1" y="57.8" fontSize="1.05" fill="rgba(255,255,255,0.18)" style={{pointerEvents:'none' as const}}>— ASC · ‐ ‐ MC · - - DSC · · · IC · ✦ Paran</text>
                <text x="1" y="59.2" fontSize="1.05" fill="rgba(255,255,255,0.12)" style={{pointerEvents:'none' as const}}>Brighter = your Dasha-active Graha · Tap line for reading</text>
              </svg>
            </div>

            {/* Graha legend */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap' as const,marginTop:8}}>
              {GRAHAS.map(g=>(
                <div key={g.id} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:isDasha(g.id)?g.color:'rgba(255,255,255,0.3)'}}>
                  <div style={{width:8,height:8,borderRadius:2,background:g.color,opacity:isDasha(g.id)?0.9:0.35}}/>
                  {g.name}{isDasha(g.id)?' ✦':''}
                </div>
              ))}
            </div>
          </div>

          {/* Reading panel */}
          <div style={{flex:'1 1 240px',minWidth:220}}>
            {selLine ? (
              <div style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${selLine.color}30`,borderRadius:18,padding:20}}>
                <div style={{fontSize:8,letterSpacing:'0.35em',color:selLine.color,fontWeight:800,textTransform:'uppercase' as const,marginBottom:5}}>Bhumi Reading</div>
                <h3 style={{margin:'0 0 3px',fontSize:19,fontWeight:900,color:selLine.color}}>{selLine.name} {selLine.angle}</h3>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:14}}>
                  {selLine.angle==='ASC'?'Rising — Identity & Self':selLine.angle==='MC'?'Culminating — Career & Fame':selLine.angle==='DSC'?'Setting — Partnerships & Love':'Nadir — Home & Roots'}
                </div>
                <div style={{background:`${selLine.color}0c`,border:`1px solid ${selLine.color}20`,borderRadius:11,padding:13,marginBottom:10}}>
                  <div style={{fontSize:12,lineHeight:1.65,color:'rgba(255,255,255,0.75)'}}>{selLine.meaning}</div>
                </div>
                {/* Places this line passes through */}
                {(() => {
                  const places = getLinePlaces(selLine);
                  if (!places.length) return null;
                  return (
                    <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:11,padding:'10px 13px',marginBottom:13}}>
                      <div style={{fontSize:8,letterSpacing:'0.3em',color:'rgba(255,255,255,0.3)',fontWeight:800,textTransform:'uppercase' as const,marginBottom:7}}>
                        Passes Through
                      </div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                        {places.map((p,i) => (
                          <span key={i} style={{background:`${selLine.color}12`,border:`1px solid ${selLine.color}25`,borderRadius:20,padding:'3px 10px',fontSize:10,color:selLine.color,fontWeight:600}}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {isDasha(selLine.planet) && (
                  <div style={{background:'rgba(212,175,55,0.07)',border:'1px solid rgba(212,175,55,0.18)',borderRadius:10,padding:11,marginBottom:11}}>
                    <div style={{fontSize:8,letterSpacing:'0.3em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:3}}>✦ Dasha Activated Now</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>{mahaRaw}{antarRaw?` › ${antarRaw}`:''} is magnetizing every {selLine.name} line globally right now.</div>
                  </div>
                )}
                <div style={{background:'rgba(255,255,255,0.02)',borderRadius:9,padding:'8px 11px',marginBottom:11}}>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.25)',fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.2em',marginBottom:3}}>300km Orb</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',lineHeight:1.55}}>Cities within 300km of this line still activate {selLine.name}'s energy. You don't need to be exactly on it.</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{width:'100%',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:9,padding:8,color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:10,fontWeight:600}}>← Clear</button>
              </div>
            ) : (
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:18,padding:20}}>
                <div style={{fontSize:8,letterSpacing:'0.35em',color:'rgba(212,175,55,0.5)',fontWeight:800,textTransform:'uppercase' as const,marginBottom:10}}>Your Dasha-active Lines</div>
                {acgLines.filter(l=>isDasha(l.planet)&&l.angle==='MC').slice(0,4).map((l,i)=>(
                  <div key={i} onClick={()=>{setSelected(`${l.planet}-${l.angle}`);}} style={{display:'flex',gap:9,alignItems:'flex-start',paddingBottom:10,marginBottom:10,borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer'}}>
                    <div style={{width:20,height:20,borderRadius:6,background:`${l.color}18`,border:`1px solid ${l.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,color:l.color,flexShrink:0}}>{i+1}</div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:l.color}}>{l.name} MC Line</div>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',marginTop:2,lineHeight:1.5}}>{l.meaning.split('.')[0]}.</div>
                    </div>
                  </div>
                ))}
                <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',lineHeight:1.6,marginTop:6}}>Tap any line on the map for a full Graha-Geographic reading.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ LINES ══ */}
      {subTab==='lines' && (
        <div>
          {['ASC','MC','DSC','IC'].map(angle=>(
            <div key={angle} style={{marginBottom:22}}>
              <div style={{fontSize:9,letterSpacing:'0.4em',color:'rgba(255,255,255,0.35)',fontWeight:800,textTransform:'uppercase' as const,marginBottom:10}}>
                {angle} — {angle==='ASC'?'Rising (Identity)':angle==='MC'?'Culminating (Career)':angle==='DSC'?'Setting (Partnerships)':'Nadir (Home & Roots)'}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:9}}>
                {acgLines.filter(l=>l.angle===angle).map((l,i)=>(
                  <div key={i} onClick={()=>{setSubTab('map');setSelected(`${l.planet}-${l.angle}`);}}
                    style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${l.color}${isDasha(l.planet)?'44':'18'}`,borderRadius:13,padding:'12px 13px',cursor:'pointer',position:'relative' as const,boxShadow:isDasha(l.planet)?`0 0 14px ${l.color}12`:'none'}}>
                    {isDasha(l.planet)&&<div style={{position:'absolute' as const,top:7,right:7,background:'rgba(212,175,55,0.12)',border:'1px solid rgba(212,175,55,0.25)',borderRadius:6,padding:'1px 5px',fontSize:7,fontWeight:800,color:'#D4AF37',textTransform:'uppercase' as const,letterSpacing:'0.2em'}}>DASHA</div>}
                    <div style={{fontSize:12,fontWeight:800,color:l.color,marginBottom:4}}>{l.name}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',lineHeight:1.55,marginBottom:5}}>{l.meaning.split('.')[0]}.</div>
                  {(() => {
                    const pp = getLinePlaces(l).slice(0,3);
                    return pp.length ? <div style={{fontSize:9,color:`${l.color}`,opacity:0.7}}>{pp.join(' · ')}</div> : null;
                  })()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ PARANS ══ */}
      {subTab==='parans' && (
        <div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.7,marginBottom:16,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:13,padding:'12px 14px'}}>
            <strong style={{color:'rgba(255,255,255,0.7)'}}>Parans</strong> are zones where two planetary lines converge within 300km. Multiple energies activate simultaneously — the most powerful spots on your entire map.
          </div>
          {parans.length===0 ? (
            <div style={{textAlign:'center' as const,padding:'30px',color:'rgba(255,255,255,0.3)',fontSize:12}}>No close parans found in your chart at this time.</div>
          ) : parans.map((p,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:16,marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:9,height:9,borderRadius:'50%',background:p.c1}}/><span style={{fontSize:12,fontWeight:800,color:p.c1}}>{p.name1}</span>
                <span style={{color:'rgba(255,255,255,0.25)',fontSize:13}}>×</span>
                <div style={{width:9,height:9,borderRadius:'50%',background:p.c2}}/><span style={{fontSize:12,fontWeight:800,color:p.c2}}>{p.name2}</span>
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.65}}>{p.meaning}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.2)',marginTop:6}}>Near {p.lon.toFixed(0)}° longitude</div>
            </div>
          ))}
        </div>
      )}

      {/* ══ BLUEPRINT ══ */}
      {subTab==='blueprint' && (
        <div style={{maxWidth:660}}>
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(212,175,55,0.12)',borderRadius:18,padding:24,marginBottom:14}}>
            <div style={{fontSize:8,letterSpacing:'0.4em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:7}}>
              Soul Geographic Blueprint{moonNak?` · ${moonNak} Nakshatra`:''}
            </div>
            {(ascendant||sunSign)&&<div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:14}}>{ascendant&&`Lagna: ${ascendant}`}{ascendant&&sunSign?' · ':''}{sunSign&&`Sun: ${sunSign}`}</div>}
            {[
              {title:`Origin Zone — ${birthPlace||'Your Birth Place'}`,color:'#C0C8E8',text:`${cityLabel||'Your birth zone'} is your Janma Kshetra. The precise vibrational entry point chosen by your Atma. Your nervous system resets here fastest and deepest healing transmissions originate from here.`},
              ...(mahaRaw?[{title:`${mahaRaw} Mahadasha — Your Activated Graha Lines`,color:'#D4AF37',text:`Every ${mahaRaw} line on your map is magnetically activated right now. The geographic zones where ${mahaRaw}'s ACG lines run are your highest-frequency relocation, travel, and business zones during this period.`}]:[]),
              ...(antarRaw&&antarRaw!==mahaRaw?[{title:`${antarRaw} Antardasha Activation`,color:'#EC4899',text:`${antarRaw} Antardasha creates a secondary activation field on all ${antarRaw} lines globally. Short visits or collaborations with people from these regions carry elevated karmic opportunity.`}]:[]),
              ...(moonNak?[{title:`${moonNak} Nakshatra Soul Resonance`,color:'#F97316',text:`Your Janma Nakshatra ${moonNak} creates a subtle geographic resonance. Regions where your Moon and Nakshatra lord's lines run carry past-life memory codes that activate healing gifts and deep soul recognition.`}]:[]),
              {title:'The 300km Orb — Most Important Rule',color:'rgba(255,255,255,0.55)',text:'You do not need to live exactly on a planetary line. The influence is felt within 200–300km. This opens many more cities to each planetary energy. A city near your Jupiter MC line carries Jupiter\'s blessing even if not precisely on it.'},
              {title:'Universal Moksha Kshetras',color:'#F97316',text:'South India, Tibet, Peru, and Egypt carry universal Ketu liberation codes regardless of individual chart. Pilgrimage to these zones during Ketu transits accelerates past-life release and opens deep spiritual perception.'},
            ].map(item=>(
              <div key={item.title} style={{padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{fontSize:12,fontWeight:700,color:item.color,marginBottom:5}}>{item.title}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.7}}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(212,175,55,0.04)',border:'1px solid rgba(212,175,55,0.1)',borderRadius:14,padding:16}}>
            <div style={{fontSize:8,letterSpacing:'0.35em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:8}}>Siddha Transmission</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.75}}>
              The 18 Siddhas teach that every soul is born into a geographic frequency that mirrors its karmic blueprint. The birth place is not random — it is the precise vibrational entry point chosen by the Atma. The Dasha system reveals when cosmic timing aligns to move, expand, or deepen roots. The ACG lines are the Graha-Geographic Intelligence made visible — your unique map of sacred geography on this Earth.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
