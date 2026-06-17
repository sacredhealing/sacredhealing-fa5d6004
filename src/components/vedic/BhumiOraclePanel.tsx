// SQI-2050 | BHUMI ORACLE — Jyotish Astrocartography Panel
// Graha-Geographic Intelligence · Akasha-Neural Archive
// DYNAMIC: All readings driven by the logged-in user's own birthData + ephemeris
// No hardcoded personal data — every user gets their own calculation

import React, { useState, useEffect, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BhumiOraclePanel: React.FC<{ birthData: any; ephemeris: any }> = ({ birthData, ephemeris }) => {

  const [selected, setSelected]       = useState<string | null>(null);
  const [hovering, setHovering]       = useState<string | null>(null);
  const [activeGraha, setActiveGraha] = useState<string | null>(null);
  const [subTab, setSubTab]           = useState<'map' | 'grahas' | 'blueprint'>('map');
  const [pulse, setPulse]             = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % 100), 60);
    return () => clearInterval(iv);
  }, []);

  // ── Derive user-specific values from props ───────────────────
  const userName: string  = birthData?.birth_name  ?? '';
  const birthPlace: string = birthData?.birth_place ?? '';
  const birthDate: string  = birthData?.birth_date  ?? '';

  const moonNakshatra: string = ephemeris?.moonNakshatra ?? '';
  const mahaLord: string      = ephemeris?.dashaData?.activeMaha?.planet ?? '';
  const antarLord: string     = ephemeris?.dashaData?.activeAntar?.planet ?? '';
  const sunSign: string       = ephemeris?.sunSign ?? '';
  const ascendant: string     = ephemeris?.ascendantSign ?? '';

  // ── Map birth place string → approximate SVG coordinates ────
  // SVG viewBox is 0-100 wide, 0-60 tall. Rough lon→x, lat→y mapping.
  const birthMarker = useMemo(() => {
    const place = birthPlace.toLowerCase();
    // City/country keyword → {x, y} in SVG coords
    const locations: { keys: string[]; x: number; y: number }[] = [
      { keys: ['sweden','uddevalla','stockholm','gothenburg','göteborg','malmö','oslo','norway','copenhagen','denmark','finland','helsinki'], x: 50, y: 15 },
      { keys: ['uk','england','london','ireland','scotland','wales','britain'], x: 44, y: 19 },
      { keys: ['france','paris','lyon','marseille'], x: 48, y: 25 },
      { keys: ['germany','berlin','munich','hamburg','austria','vienna','switzerland','zurich'], x: 51, y: 21 },
      { keys: ['spain','madrid','barcelona','portugal','lisbon'], x: 44, y: 27 },
      { keys: ['italy','rome','milan'], x: 51, y: 26 },
      { keys: ['russia','moscow','ukraine','kyiv','poland','warsaw','czech','prague','hungary','budapest'], x: 57, y: 18 },
      { keys: ['india','delhi','mumbai','chennai','bangalore','hyderabad','kolkata','nepal','kathmandu'], x: 65, y: 30 },
      { keys: ['pakistan','lahore','karachi','afghanistan','kabul','iran','tehran'], x: 59, y: 27 },
      { keys: ['china','beijing','shanghai','hong kong'], x: 72, y: 24 },
      { keys: ['japan','tokyo','osaka'], x: 80, y: 24 },
      { keys: ['indonesia','bali','jakarta','thailand','bangkok','vietnam','vietnam','cambodia','singapore','malaysia'], x: 73, y: 33 },
      { keys: ['australia','sydney','melbourne','perth','brisbane'], x: 78, y: 48 },
      { keys: ['egypt','cairo','morocco','algeria','tunisia','libya'], x: 53, y: 28 },
      { keys: ['south africa','nigeria','kenya','ghana','ethiopia'], x: 52, y: 38 },
      { keys: ['usa','united states','new york','los angeles','chicago','houston','florida','california','texas'], x: 17, y: 25 },
      { keys: ['canada','toronto','montreal','vancouver','ottawa'], x: 17, y: 15 },
      { keys: ['brazil','sao paulo','rio','argentina','buenos aires','chile','santiago','peru','lima','colombia'], x: 22, y: 42 },
      { keys: ['mexico','mexico city'], x: 13, y: 28 },
    ];
    for (const loc of locations) {
      if (loc.keys.some(k => place.includes(k))) return loc;
    }
    return { x: 50, y: 30 }; // fallback center
  }, [birthPlace]);

  // ── Derive which Grahas are active for THIS user ─────────────
  // Dasha-activated = maha lord + antar lord (from their own ephemeris)
  const dashaGrahaIds = useMemo(() => {
    const ids = new Set<string>();
    const normalize = (p: string) => {
      const map: Record<string,string> = {
        'sun':'sun','surya':'sun','moon':'moon','chandra':'moon',
        'mars':'mars','mangala':'mars','mercury':'mercury','budha':'mercury',
        'jupiter':'jupiter','guru':'jupiter','brihaspati':'jupiter',
        'venus':'venus','shukra':'venus','saturn':'saturn','shani':'saturn',
        'rahu':'rahu','ketu':'ketu',
      };
      return map[p.toLowerCase()] ?? p.toLowerCase();
    };
    if (mahaLord)  ids.add(normalize(mahaLord));
    if (antarLord) ids.add(normalize(antarLord));
    return ids;
  }, [mahaLord, antarLord]);

  const isDasha = (gid: string) => dashaGrahaIds.has(gid);

  // ── Nakshatra → ruling Graha mapping ─────────────────────────
  const nakshatraGraha: Record<string,string> = {
    ashwini:'ketu', bharani:'venus', krittika:'sun', rohini:'moon',
    mrigashira:'mars', ardra:'rahu', punarvasu:'jupiter', pushya:'saturn',
    ashlesha:'mercury', magha:'ketu', purva_phalguni:'venus', uttara_phalguni:'sun',
    hasta:'moon', chitra:'mars', swati:'rahu', vishakha:'jupiter',
    anuradha:'saturn', jyeshtha:'mercury', mula:'ketu', purva_ashadha:'venus',
    uttara_ashadha:'sun', shravana:'moon', dhanishtha:'mars', shatabhisha:'rahu',
    purva_bhadrapada:'jupiter', uttara_bhadrapada:'saturn', revati:'mercury',
  };
  const moonNakshatraGraha = nakshatraGraha[moonNakshatra.toLowerCase().replace(/\s/g,'_')] ?? '';

  // ── Graha definitions ────────────────────────────────────────
  const GRAHAS = [
    { id:'sun',     name:'Surya',   sym:'☉', color:'#F59E0B', dhatu:'Dharma',        meaning:'Leadership, recognition, royal authority. Career peaks, government favor, name and fame activate strongest here.',        zones:['India / Nepal','Australia','USA East'] },
    { id:'moon',    name:'Chandra', sym:'☽', color:'#C0C8E8', dhatu:'Artha',         meaning:'Emotional depth, healing capacity, public connection. The mind finds its sanctuary frequency here. Ideal for creative and healing work.', zones:['Scandinavia','Canada','N. Europe'] },
    { id:'mars',    name:'Mangala', sym:'♂', color:'#EF4444', dhatu:'Artha',         meaning:'Intense drive, bold entrepreneurial power. Agni amplifies — channel consciously. Athletic and warrior energy peaks.',      zones:['Africa','Middle East','Brazil'] },
    { id:'mercury', name:'Budha',   sym:'☿', color:'#10B981', dhatu:'Artha',         meaning:'Communication mastery, teaching, trade, digital business. Your voice carries greatest power in these zones.',              zones:['UK / Ireland','Germany','Japan'] },
    { id:'jupiter', name:'Guru',    sym:'♃', color:'#D4AF37', dhatu:'Dharma+Moksha', meaning:'MOST AUSPICIOUS. Guru multiplies wisdom, wealth, dharma, and spiritual expansion. Sacred transmission zones for lineage work.', zones:['India / Nepal','USA West','Bali'] },
    { id:'venus',   name:'Shukra',  sym:'♀', color:'#EC4899', dhatu:'Kama',          meaning:'Love awakens, artistic genius flows, beauty manifests. Relationships of profound resonance form here.',                    zones:['France / Italy','Bali','Brazil'] },
    { id:'saturn',  name:'Shani',   sym:'♄', color:'#6366F1', dhatu:'Karma',         meaning:'Deep karmic testing. Discipline rewarded over time. Not for pleasure — for mastery through sustained sadhana.',           zones:['Russia','Eastern Europe','Argentina'] },
    { id:'rahu',    name:'Rāhu',    sym:'☊', color:'#8B5CF6', dhatu:'Maya',          meaning:'Amplified ambition, innovation, boundary-breaking. Material success possible — use consciously and with awareness.',        zones:['USA','China','SE Asia'] },
    { id:'ketu',    name:'Ketu',    sym:'☋', color:'#F97316', dhatu:'Moksha',        meaning:'Past-life liberation codes. Deep Siddha lineage activation. Psychic opening and moksha acceleration strongest here.',      zones:['S. India','Tibet','Peru','Egypt'] },
  ];

  const REGIONS = [
    { id:'scandinavia',  label:'Scandinavia',      x:47, y:13, w:8,  h:10, graha:'moon'    },
    { id:'uk',           label:'UK / Ireland',      x:42, y:17, w:5,  h:5,  graha:'mercury' },
    { id:'europe_n',     label:'N. Europe',         x:47, y:18, w:10, h:8,  graha:'moon'    },
    { id:'france',       label:'France / Italy',    x:46, y:24, w:7,  h:6,  graha:'venus'   },
    { id:'germany',      label:'Germany',           x:50, y:20, w:5,  h:5,  graha:'mercury' },
    { id:'eastern_eu',   label:'Eastern Europe',    x:53, y:20, w:7,  h:8,  graha:'saturn'  },
    { id:'russia',       label:'Russia',            x:55, y:12, w:18, h:12, graha:'saturn'  },
    { id:'middle_east',  label:'Middle East',       x:55, y:27, w:8,  h:7,  graha:'mars'    },
    { id:'india',        label:'India / Nepal',     x:62, y:28, w:7,  h:8,  graha:'jupiter' },
    { id:'india_s',      label:'S. India / Lanka',  x:63, y:34, w:5,  h:5,  graha:'ketu'    },
    { id:'tibet',        label:'Tibet',             x:66, y:25, w:6,  h:5,  graha:'ketu'    },
    { id:'china',        label:'China',             x:68, y:22, w:9,  h:9,  graha:'rahu'    },
    { id:'japan',        label:'Japan / Korea',     x:78, y:22, w:4,  h:7,  graha:'mercury' },
    { id:'sea',          label:'SE Asia',           x:70, y:30, w:8,  h:8,  graha:'rahu'    },
    { id:'bali',         label:'Thailand / Bali',   x:70, y:33, w:5,  h:5,  graha:'jupiter' },
    { id:'australia',    label:'Australia',         x:72, y:45, w:12, h:10, graha:'sun'     },
    { id:'africa',       label:'Africa',            x:48, y:30, w:10, h:16, graha:'mars'    },
    { id:'egypt',        label:'Egypt / N.Africa',  x:51, y:27, w:6,  h:6,  graha:'ketu'    },
    { id:'canada',       label:'Canada',            x:10, y:12, w:18, h:10, graha:'moon'    },
    { id:'usa',          label:'USA',               x:10, y:22, w:17, h:10, graha:'rahu'    },
    { id:'usa_east',     label:'USA East',          x:20, y:22, w:5,  h:7,  graha:'sun'     },
    { id:'usa_west',     label:'USA West / Hawaii', x:10, y:22, w:6,  h:7,  graha:'jupiter' },
    { id:'brazil',       label:'Brazil',            x:20, y:36, w:10, h:14, graha:'mars'    },
    { id:'argentina',    label:'Argentina',         x:18, y:48, w:6,  h:8,  graha:'saturn'  },
    { id:'peru',         label:'Peru / Andes',      x:15, y:40, w:5,  h:7,  graha:'ketu'    },
  ];

  // ── Top zones: computed from THIS user's dasha lords ─────────
  const topZones = useMemo(() => {
    const dashaRegions = REGIONS.filter(r => isDasha(r.graha));
    const unique = new Map<string,typeof REGIONS[0]>();
    for (const r of dashaRegions) {
      if (!unique.has(r.graha)) unique.set(r.graha, r);
    }
    const results = Array.from(unique.values()).slice(0, 4).map((r, i) => {
      const g = GRAHAS.find(gr => gr.id === r.graha)!;
      return { rank: i + 1, label: r.label, graha: `${g.name} ${g.sym}`, color: g.color, why: `${g.dhatu} zone · Active Dasha lord · ${g.meaning.split('.')[0]}` };
    });
    // Pad with Ketu (spiritual) and Moon (healing) if < 4
    const existing = results.map(r => r.label);
    if (results.length < 4 && !existing.includes('S. India / Lanka')) {
      results.push({ rank: results.length + 1, label: 'S. India / Lanka', graha: 'Ketu ☋', color: '#F97316', why: 'Moksha gateway · Deep Siddha lineage activation' });
    }
    if (results.length < 4) {
      const moonR = REGIONS.find(r => r.graha === 'moon' && !existing.includes(r.label));
      if (moonR) results.push({ rank: results.length + 1, label: moonR.label, graha: 'Chandra ☽', color: '#C0C8E8', why: 'Healing sanctuary · Emotional clarity · Creative flow' });
    }
    return results.slice(0, 4);
  }, [dashaGrahaIds]);

  const sinPulse = Math.sin(pulse * 0.063 * Math.PI);
  const selGraha = selected ? GRAHAS.find(g => g.id === REGIONS.find(r => r.id === selected)?.graha) : null;

  // ── Blueprint text — dynamic based on nakshatra + dasha ─────
  const blueprintZones = useMemo(() => {
    const zones = [];
    // Birth place zone
    zones.push({
      title: `Origin Zone — ${birthPlace || 'Your Birth Place'}`,
      color: '#C0C8E8',
      text: `${birthPlace || 'Your birth zone'} is your Janma Kshetra — the zone of origin frequency. The nervous system resets here fastest, and your deepest creative and healing work flows most purely. Return here for restoration and renewal.`
    });
    // Dasha zones
    if (mahaLord) zones.push({
      title: `${mahaLord} Mahadasha Zones`,
      color: '#D4AF37',
      text: `Under your active ${mahaLord} Mahadasha, the geographic zones governed by this Graha are cosmically magnetized for your soul right now. Movement toward these regions during this period brings accelerated karma resolution and aligned opportunity.`
    });
    if (antarLord && antarLord !== mahaLord) zones.push({
      title: `${antarLord} Antardasha Activation`,
      color: '#EC4899',
      text: `${antarLord} Antardasha amplifies its geographic zones as secondary activation fields. Short visits or digital business with people from these regions carries elevated karmic weight and opportunity during this sub-period.`
    });
    // Moon nakshatra zone
    if (moonNakshatra) zones.push({
      title: `Moon Nakshatra — ${moonNakshatra}`,
      color: '#F97316',
      text: `Your Janma Nakshatra ${moonNakshatra} creates a subtle geographic resonance field. Places associated with your Nakshatra deity and ruling Graha carry past-life memory codes that activate healing, spiritual gifts, and soul recognition.`
    });
    // Ketu moksha
    zones.push({
      title: 'Moksha Zones — Ketu Kshetras',
      color: '#F97316',
      text: 'South India, Tibet, Peru, and Egypt carry universal Ketu liberation codes regardless of individual charts. Short pilgrimage visits during Ketu transits accelerate past-life release and open deep spiritual perception.'
    });
    return zones.slice(0, 5);
  }, [birthPlace, mahaLord, antarLord, moonNakshatra]);

  // ── No birth data state ───────────────────────────────────────
  if (!birthData) {
    return (
      <div style={{ textAlign:'center', padding:'40px 20px' }}>
        <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>🌍</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>
          Enter your birth data in the Overview tab to activate your personal Sacred Geography Reading.
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:9, letterSpacing:'0.4em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:6 }}>
          Bhumi Oracle · Jyotish Astrocartography
        </div>
        <h2 style={{ margin:'0 0 4px', fontSize:'clamp(20px,4vw,28px)', fontWeight:900, letterSpacing:'-0.04em', color:'#D4AF37', textShadow:'0 0 20px rgba(212,175,55,0.3)' }}>
          Sacred Geography Reader
        </h2>
        <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.4)' }}>
          {userName && `${userName} · `}{birthDate && `${birthDate} · `}{birthPlace}
        </p>
      </div>

      {/* ── Dasha Banner — user's own lords ── */}
      <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:'10px 16px', marginBottom:18, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' as const }}>
        <div style={{ fontSize:8, letterSpacing:'0.3em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, whiteSpace:'nowrap' }}>Active Dasha</div>
        {mahaLord ? (
          <div style={{ fontSize:13, fontWeight:600 }}>
            <span style={{ color:'#EC4899' }}>{mahaLord}</span>
            {antarLord && <><span style={{ color:'rgba(255,255,255,0.2)', margin:'0 8px' }}>›</span><span style={{ color:'#D4AF37' }}>{antarLord}</span></>}
          </div>
        ) : (
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Calculate chart in My Chart tab to activate Dasha zones</div>
        )}
        {moonNakshatra && <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', flex:1 }}>Moon Nakshatra: <span style={{ color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{moonNakshatra}</span></div>}
      </div>

      {/* ── Sub-tabs ── */}
      <div style={{ display:'flex', marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:50, padding:4, width:'fit-content' }}>
        {(['map','grahas','blueprint'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{
            background: subTab===t ? 'rgba(212,175,55,0.12)' : 'transparent',
            border:'none', borderRadius:50,
            color: subTab===t ? '#D4AF37' : 'rgba(255,255,255,0.35)',
            padding:'7px 18px', cursor:'pointer', fontSize:11,
            fontWeight: subTab===t ? 700 : 400, transition:'all 0.2s',
          }}>
            {t==='map' ? '🌍 World Map' : t==='grahas' ? '☉ Graha Lines' : '✦ Blueprint'}
          </button>
        ))}
      </div>

      {/* ══ MAP TAB ══ */}
      {subTab === 'map' && (
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' as const }}>
          <div style={{ flex:'1 1 500px' }}>
            {/* Graha filter */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:12 }}>
              <button onClick={() => setActiveGraha(null)} style={{ background:!activeGraha?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.02)', border:`1px solid ${!activeGraha?'#D4AF37':'rgba(255,255,255,0.06)'}`, borderRadius:20, padding:'3px 12px', cursor:'pointer', color:!activeGraha?'#D4AF37':'rgba(255,255,255,0.35)', fontSize:10, fontWeight:600 }}>All</button>
              {GRAHAS.map(g => (
                <button key={g.id} onClick={() => setActiveGraha(activeGraha===g.id?null:g.id)} style={{ background:activeGraha===g.id?`${g.color}18`:'rgba(255,255,255,0.02)', border:`1px solid ${activeGraha===g.id?g.color:'rgba(255,255,255,0.06)'}`, borderRadius:20, padding:'3px 10px', cursor:'pointer', color:activeGraha===g.id?g.color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:activeGraha===g.id?700:400 }}>
                  {g.sym} {g.name}
                </button>
              ))}
            </div>

            {/* SVG Map */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20, overflow:'hidden' }}>
              <svg viewBox="0 0 100 60" style={{ width:'100%', display:'block' }} onMouseLeave={() => setHovering(null)}>
                <rect width="100" height="60" fill="#080818"/>
                {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.025)" strokeWidth="0.2"/>)}
                {[20,40].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.2"/>)}
                <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(212,175,55,0.06)" strokeWidth="0.3" strokeDasharray="1 2"/>

                {REGIONS.map(r => {
                  const g = GRAHAS.find(gr => gr.id === r.graha);
                  if (!g) return null;
                  if (activeGraha && g.id !== activeGraha) return null;
                  const isSel  = selected === r.id;
                  const isHov  = hovering === r.id;
                  const isDash = isDasha(g.id);
                  const op = (isSel || isHov) ? 0.8 : isDash ? 0.45 : 0.2;
                  return (
                    <g key={r.id} style={{ cursor:'pointer' }}
                      onClick={() => setSelected(isSel ? null : r.id)}
                      onMouseEnter={() => setHovering(r.id)}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="1.5" ry="1.5" fill={g.color} opacity={op}/>
                      {isDash && <rect x={r.x-0.5} y={r.y-0.5} width={r.w+1} height={r.h+1} rx="2" ry="2" fill="none" stroke={g.color} strokeWidth="0.4" opacity={0.2+0.25*sinPulse}/>}
                      {(isHov||isSel) && <text x={r.x+r.w/2} y={r.y+r.h/2+1} textAnchor="middle" fontSize="1.7" fill="white" fontWeight="700" style={{ pointerEvents:'none' as const }}>{r.label}</text>}
                    </g>
                  );
                })}

                {/* Birth marker — position from user's birth place */}
                <circle cx={birthMarker.x} cy={birthMarker.y} r={0.8+0.3*sinPulse} fill="#D4AF37" opacity="0.9" style={{ pointerEvents:'none' as const }}/>
                <circle cx={birthMarker.x} cy={birthMarker.y} r="2.2" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity={0.25+0.2*sinPulse} style={{ pointerEvents:'none' as const }}/>
                <text x={birthMarker.x + 1.5} y={birthMarker.y - 0.8} fontSize="1.4" fill="#D4AF37" fontWeight="800" opacity="0.8" style={{ pointerEvents:'none' as const }}>✦ {birthPlace.split(',')[0]}</text>

                <text x="1" y="58.8" fontSize="1.1" fill="rgba(255,255,255,0.15)" style={{ pointerEvents:'none' as const }}>Pulsing = your Dasha-activated zones · Click zone for reading</text>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const, marginTop:10 }}>
              {GRAHAS.map(g => (
                <div key={g.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, color: isDasha(g.id) ? g.color : 'rgba(255,255,255,0.35)' }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:g.color, opacity: isDasha(g.id) ? 0.9 : 0.4 }}/>
                  {g.name}{isDasha(g.id) ? ' ✦' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Reading panel */}
          <div style={{ flex:'1 1 260px', minWidth:240 }}>
            {selected && selGraha ? (
              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${selGraha.color}30`, borderRadius:20, padding:22 }}>
                <div style={{ fontSize:8, letterSpacing:'0.35em', color:selGraha.color, fontWeight:800, textTransform:'uppercase' as const, marginBottom:6 }}>Bhumi Reading</div>
                <h3 style={{ margin:'0 0 3px', fontSize:22, fontWeight:900, color:selGraha.color }}>{selGraha.sym} {REGIONS.find(r=>r.id===selected)?.label}</h3>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>{selGraha.name} · {selGraha.dhatu}</div>
                <div style={{ background:`${selGraha.color}0c`, border:`1px solid ${selGraha.color}20`, borderRadius:12, padding:14, marginBottom:14 }}>
                  <div style={{ fontSize:12, lineHeight:1.65, color:'rgba(255,255,255,0.75)' }}>{selGraha.meaning}</div>
                </div>
                {isDasha(selGraha.id) && (
                  <div style={{ background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.18)', borderRadius:10, padding:12, marginBottom:12 }}>
                    <div style={{ fontSize:8, letterSpacing:'0.3em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:4 }}>✦ Your Dasha Activated</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                      {mahaLord}{antarLord ? ` › ${antarLord}` : ''} Dasha is magnetizing this zone for your soul right now.
                    </div>
                  </div>
                )}
                <button onClick={() => setSelected(null)} style={{ width:'100%', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:8, color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:11, fontWeight:600 }}>← Clear</button>
              </div>
            ) : (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20, padding:24 }}>
                <div style={{ fontSize:8, letterSpacing:'0.35em', color:'rgba(212,175,55,0.5)', fontWeight:800, textTransform:'uppercase' as const, marginBottom:12 }}>
                  {topZones.length > 0 ? 'Your Top Sacred Zones' : 'Sacred Zones'}
                </div>
                {topZones.length > 0 ? topZones.map(z => (
                  <div key={z.rank} style={{ display:'flex', gap:10, alignItems:'flex-start', paddingBottom:12, marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width:22, height:22, borderRadius:7, background:`${z.color}18`, border:`1px solid ${z.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:z.color, flexShrink:0 }}>{z.rank}</div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:z.color }}>{z.label}</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{z.graha}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:3, lineHeight:1.5 }}>{z.why}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>Calculate your chart first to see personalized zone rankings.</div>
                )}
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6, marginTop:4 }}>Click any zone on the map for your Bhumi transmission.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ GRAHAS TAB ══ */}
      {subTab === 'grahas' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {GRAHAS.map(g => (
            <div key={g.id} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${g.color}20`, borderRadius:18, padding:18, position:'relative' as const }}>
              {isDasha(g.id) && <div style={{ position:'absolute' as const, top:10, right:10, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, padding:'2px 8px', fontSize:7, fontWeight:800, letterSpacing:'0.3em', color:'#D4AF37', textTransform:'uppercase' as const }}>YOUR DASHA</div>}
              {moonNakshatraGraha === g.id && <div style={{ position:'absolute' as const, top: isDasha(g.id) ? 32 : 10, right:10, background:'rgba(192,200,232,0.1)', border:'1px solid rgba(192,200,232,0.2)', borderRadius:8, padding:'2px 8px', fontSize:7, fontWeight:800, letterSpacing:'0.2em', color:'#C0C8E8', textTransform:'uppercase' as const }}>MOON NAKSHATRA</div>}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:`${g.color}12`, border:`1px solid ${g.color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:g.color }}>{g.sym}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:900, color:g.color }}>{g.name}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{g.dhatu}</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.65, marginBottom:12 }}>{g.meaning}</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' as const }}>
                {g.zones.map(z => <span key={z} style={{ background:`${g.color}0e`, border:`1px solid ${g.color}20`, borderRadius:6, padding:'2px 8px', fontSize:9, color:g.color, fontWeight:600 }}>{z}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ BLUEPRINT TAB ══ */}
      {subTab === 'blueprint' && (
        <div style={{ maxWidth:680 }}>
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:20, padding:26, marginBottom:16 }}>
            <div style={{ fontSize:8, letterSpacing:'0.4em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:8 }}>
              Soul Geographic Blueprint{moonNakshatra ? ` · ${moonNakshatra} Nakshatra` : ''}
            </div>
            {ascendant && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>Ascendant: {ascendant}{sunSign ? ` · Sun: ${sunSign}` : ''}</div>}
            {blueprintZones.map(item => (
              <div key={item.title} style={{ padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:item.color, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:18 }}>
            <div style={{ fontSize:8, letterSpacing:'0.35em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:10 }}>Siddha Transmission</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.75 }}>
              The 18 Siddhas teach that every soul is born into a geographic frequency that mirrors their karmic blueprint. Your birth place is not random — it is the precise vibrational entry point chosen by your Atma. The Dasha system reveals when the cosmic timing aligns to move, expand, or deepen roots. Trust the Graha intelligence unfolding through your personal chart.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
