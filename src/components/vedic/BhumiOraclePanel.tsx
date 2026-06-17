// SQI-2050 | BHUMI ORACLE — Jyotish Astrocartography Panel
// WORLD-CLASS: Renders real ACG great-circle lines from jyotish-ephemeris edge function
// 36 angular lines (9 planets × 4 angles: ASC/MC/DSC/IC) + Parans
// Each user sees their own unique planetary lines from their birth data

import React, { useState, useEffect, useMemo } from 'react';

const PLANET_TO_ID: Record<string, string> = {
  Sun:'sun', Moon:'moon', Mars:'mars', Mercury:'mercury', Jupiter:'jupiter',
  Venus:'venus', Saturn:'saturn', Rahu:'rahu', Ketu:'ketu',
  sun:'sun', moon:'moon', mars:'mars', mercury:'mercury', jupiter:'jupiter',
  venus:'venus', saturn:'saturn', rahu:'rahu', ketu:'ketu',
};

const NAKSHATRA_LORD: Record<string, string> = {
  Ashvini:'ketu', Bharani:'venus', Krittika:'sun', Rohini:'moon',
  Mrigashira:'mars', Ardra:'rahu', Punarvasu:'jupiter', Pushya:'saturn',
  Ashlesha:'mercury', Magha:'ketu', 'Purva Phalguni':'venus', 'Uttara Phalguni':'sun',
  Hasta:'moon', Chitra:'mars', Swati:'rahu', Vishakha:'jupiter',
  Anuradha:'saturn', Jyeshtha:'mercury', Mula:'ketu', 'Purva Ashadha':'venus',
  'Uttara Ashadha':'sun', Shravana:'moon', Dhanishtha:'mars', Shatabhisha:'rahu',
  'Purva Bhadrapada':'jupiter', 'Uttara Bhadrapada':'saturn', Revati:'mercury',
  // Alternate spellings from VedAstro
  Ashwini:'ketu', Mrigashirsha:'mars', Punarvasu2:'jupiter', Purva_Phalguni:'venus',
  Uttara_Phalguni:'sun', Purva_Ashadha:'venus', Uttara_Ashadha:'sun',
  Purva_Bhadrapada:'jupiter', Uttara_Bhadrapada:'saturn',
};

// SVG viewBox: 0-100 wide, 0-60 tall
// Maps lon (-180..180) → x (0..100), lat (80..-80) → y (0..50+)
function lonToX(lon: number): number { return ((lon + 180) / 360) * 100; }
function latToY(lat: number): number { return ((80 - lat) / 160) * 60; }

function placeToCoords(place: string): { x: number; y: number } {
  const p = place.toLowerCase();
  const locs = [
    {keys:['uddevalla'],x:50,y:14},{keys:['stockholm'],x:51,y:13},
    {keys:['gothenburg','göteborg'],x:50,y:14},{keys:['sweden','sverige'],x:51,y:13},
    {keys:['oslo','norway'],x:49,y:12},{keys:['copenhagen','denmark'],x:51,y:15},
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
  for (const loc of locs) {
    if (loc.keys.some(k => p.includes(k))) return {x:loc.x,y:loc.y};
  }
  return {x:50,y:30};
}

interface ACGLine {
  planet: string;
  planetName: string;
  angle: string;
  color: string;
  points: {lon: number; lat: number}[];
  meaning: string;
  isBenefic: boolean;
}

interface ParanPoint {
  planet1: string; planet2: string;
  angle1: string; angle2: string;
  lon: number; lat: number; meaning: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BhumiOraclePanel: React.FC<{ birthData: any; ephemeris: any }> = ({ birthData, ephemeris }) => {
  const [selected, setSelected]       = useState<string | null>(null);
  const [activeGraha, setActiveGraha] = useState<string | null>(null);
  const [activeAngle, setActiveAngle] = useState<string | null>(null);
  const [subTab, setSubTab]           = useState<'map'|'lines'|'parans'|'blueprint'>('map');
  const [pulse, setPulse]             = useState(0);
  const [showBeneficOnly, setShowBeneficOnly] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p+1)%100), 60);
    return () => clearInterval(iv);
  }, []);

  const userName: string    = birthData?.birth_name  ?? '';
  const birthPlace: string  = birthData?.birth_place ?? '';
  const birthDate: string   = birthData?.birth_date  ?? '';
  const moonNakshatra: string = ephemeris?.moonNakshatra ?? '';
  const sunSign: string     = ephemeris?.sunSign ?? '';
  const ascendant: string   = ephemeris?.ascendantSign ?? '';
  const mahaRaw: string     = ephemeris?.dashaData?.activeMaha?.planet ?? '';
  const antarRaw: string    = ephemeris?.dashaData?.activeAntar?.planet ?? '';
  const mahaId: string      = PLANET_TO_ID[mahaRaw] ?? '';
  const antarId: string     = PLANET_TO_ID[antarRaw] ?? '';
  const nakshatraLordId: string = NAKSHATRA_LORD[moonNakshatra] ?? '';

  // Real ACG lines from edge function (stored in ephemeris after chart calc)
  const acgLines: ACGLine[] = useMemo(() => {
    return ephemeris?.acgLines ?? [];
  }, [ephemeris?.acgLines]);

  const parans: ParanPoint[] = useMemo(() => {
    return ephemeris?.parans ?? [];
  }, [ephemeris?.parans]);

  const hasRealLines = acgLines.length > 0;

  const dashaIds = useMemo(() => {
    const ids = new Set<string>();
    if (mahaId) ids.add(mahaId);
    if (antarId) ids.add(antarId);
    if (nakshatraLordId) ids.add(nakshatraLordId);
    return ids;
  }, [mahaId, antarId, nakshatraLordId]);

  const isDasha = (pid: string) => dashaIds.has(pid);

  // Unique planets in ACG data
  const acgPlanets = useMemo(() => {
    const seen = new Set<string>();
    return acgLines.filter(l => { const n = !seen.has(l.planet); seen.add(l.planet); return n; });
  }, [acgLines]);

  // Filtered lines
  const visibleLines = useMemo(() => {
    return acgLines.filter(l => {
      if (activeGraha && l.planet !== activeGraha) return false;
      if (activeAngle && l.angle !== activeAngle) return false;
      if (showBeneficOnly && !l.isBenefic) return false;
      return true;
    });
  }, [acgLines, activeGraha, activeAngle, showBeneficOnly]);

  const selectedLine = selected ? acgLines.find(l => `${l.planet}-${l.angle}` === selected) : null;
  const birthMarker = useMemo(() => placeToCoords(birthPlace), [birthPlace]);
  const sinPulse = Math.sin(pulse * 0.063 * Math.PI);
  const cityLabel = birthPlace.split(',')[0].trim();

  const ANGLE_COLORS: Record<string,string> = { ASC:'rgba(255,255,255,0.9)', MC:'rgba(255,255,255,0.7)', DSC:'rgba(255,255,255,0.5)', IC:'rgba(255,255,255,0.35)' };
  const ANGLE_DASH: Record<string,string>   = { ASC:'none', MC:'2,1', DSC:'4,2', IC:'6,3' };

  if (!birthData) {
    return (
      <div style={{textAlign:'center' as const,padding:'40px 20px',color:'rgba(255,255,255,0.4)',fontSize:13,lineHeight:1.7}}>
        <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>🌍</div>
        Enter your birth data in the Overview tab to activate your Sacred Geography Reading.
      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}>

      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:9,letterSpacing:'0.4em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:6}}>
          Bhumi Oracle · Jyotish Astrocartography {hasRealLines ? '· Real ACG Lines Active' : ''}
        </div>
        <h2 style={{margin:'0 0 4px',fontSize:'clamp(20px,4vw,28px)',fontWeight:900,letterSpacing:'-0.04em',color:'#D4AF37',textShadow:'0 0 20px rgba(212,175,55,0.3)'}}>
          Sacred Geography Reader
        </h2>
        <p style={{margin:0,fontSize:12,color:'rgba(255,255,255,0.4)'}}>
          {userName && `${userName} · `}{birthDate && `${birthDate} · `}{birthPlace}
          {hasRealLines && <span style={{color:'rgba(212,175,55,0.6)',marginLeft:8}}>· {acgLines.length} lines computed</span>}
        </p>
      </div>

      {/* Dasha Banner */}
      <div style={{background:'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.1)',borderRadius:16,padding:'10px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' as const}}>
        <div style={{fontSize:8,letterSpacing:'0.3em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,whiteSpace:'nowrap'}}>Active Dasha</div>
        {mahaRaw ? (
          <div style={{fontSize:13,fontWeight:600}}>
            <span style={{color:'#EC4899'}}>{mahaRaw}</span>
            {antarRaw && <><span style={{color:'rgba(255,255,255,0.2)',margin:'0 8px'}}>›</span><span style={{color:'#D4AF37'}}>{antarRaw}</span></>}
          </div>
        ) : (
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Calculate chart in My Chart to activate Dasha zones</div>
        )}
        {moonNakshatra && <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',flex:1}}>
          Moon: <span style={{color:'rgba(255,255,255,0.6)',fontWeight:600}}>{moonNakshatra}</span>
          {ascendant && <span style={{marginLeft:12}}>Lagna: <span style={{color:'rgba(255,255,255,0.6)',fontWeight:600}}>{ascendant}</span></span>}
        </div>}
      </div>

      {/* Sub-tabs */}
      <div style={{display:'flex',marginBottom:20,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:50,padding:4,width:'fit-content',overflowX:'auto' as const}}>
        {(['map','lines','parans','blueprint'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{background:subTab===t?'rgba(212,175,55,0.12)':'transparent',border:'none',borderRadius:50,color:subTab===t?'#D4AF37':'rgba(255,255,255,0.35)',padding:'7px 16px',cursor:'pointer',fontSize:11,fontWeight:subTab===t?700:400,transition:'all 0.2s',whiteSpace:'nowrap' as const}}>
            {t==='map'?'🌍 Map':t==='lines'?`☉ Lines${hasRealLines?` (${acgLines.length})`:''}`:t==='parans'?`✦ Parans${parans.length>0?` (${parans.length})`:'`'}`:' Blueprint'}
          </button>
        ))}
      </div>

      {/* ══ MAP TAB ══ */}
      {subTab === 'map' && (
        <div style={{display:'flex',gap:20,flexWrap:'wrap' as const}}>
          <div style={{flex:'1 1 500px'}}>

            {/* Filters */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:10}}>
              {/* Planet filter */}
              <button onClick={()=>setActiveGraha(null)} style={{background:!activeGraha?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.02)',border:`1px solid ${!activeGraha?'#D4AF37':'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 12px',cursor:'pointer',color:!activeGraha?'#D4AF37':'rgba(255,255,255,0.35)',fontSize:10,fontWeight:600}}>All</button>
              {(hasRealLines ? acgPlanets : [{planet:'jupiter',planetName:'Guru',color:'#D4AF37'},{planet:'venus',planetName:'Shukra',color:'#EC4899'},{planet:'moon',planetName:'Chandra',color:'#C0C8E8'},{planet:'ketu',planetName:'Ketu',color:'#F97316'}]).map(g => (
                <button key={g.planet} onClick={()=>setActiveGraha(activeGraha===g.planet?null:g.planet)} style={{background:activeGraha===g.planet?`${g.color}18`:'rgba(255,255,255,0.02)',border:`1px solid ${activeGraha===g.planet?g.color:'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 10px',cursor:'pointer',color:activeGraha===g.planet?g.color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:activeGraha===g.planet?700:400}}>
                  {g.planetName}
                </button>
              ))}
            </div>

            {/* Angle filter + benefic toggle */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:12}}>
              {['ASC','MC','DSC','IC'].map(a => (
                <button key={a} onClick={()=>setActiveAngle(activeAngle===a?null:a)} style={{background:activeAngle===a?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.02)',border:`1px solid ${activeAngle===a?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 10px',cursor:'pointer',color:activeAngle===a?'white':'rgba(255,255,255,0.35)',fontSize:10,fontWeight:activeAngle===a?700:400}}>
                  {a}
                </button>
              ))}
              <button onClick={()=>setShowBeneficOnly(!showBeneficOnly)} style={{background:showBeneficOnly?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.02)',border:`1px solid ${showBeneficOnly?'#D4AF37':'rgba(255,255,255,0.06)'}`,borderRadius:20,padding:'3px 12px',cursor:'pointer',color:showBeneficOnly?'#D4AF37':'rgba(255,255,255,0.35)',fontSize:10,fontWeight:showBeneficOnly?700:400}}>
                ✦ Benefics only
              </button>
              {!hasRealLines && <span style={{fontSize:10,color:'rgba(255,255,255,0.25)',padding:'3px 8px',alignSelf:'center'}}>Calculate chart for real lines</span>}
            </div>

            {/* SVG Map */}
            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:20,overflow:'hidden'}}>
              <svg viewBox="0 0 100 60" style={{width:'100%',display:'block'}}>
                <rect width="100" height="60" fill="#070712"/>
                {/* Grid */}
                {[20,40,60,80].map(x=><line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.02)" strokeWidth="0.2"/>)}
                {[20,40].map(y=><line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.02)" strokeWidth="0.2"/>)}
                <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(212,175,55,0.05)" strokeWidth="0.3" strokeDasharray="1 2"/>

                {/* Real ACG Lines */}
                {hasRealLines ? visibleLines.map((line, li) => {
                  const isDash = isDasha(line.planet);
                  const isSelected = selected === `${line.planet}-${line.angle}`;
                  const baseOpacity = isDash ? 0.75 : 0.35;
                  const opacity = isSelected ? 1.0 : baseOpacity;
                  const strokeW = isSelected ? 0.6 : isDash ? 0.45 : 0.3;

                  // Convert line points to SVG polyline
                  const pts = line.points.map(p => `${lonToX(p.lon).toFixed(1)},${latToY(p.lat).toFixed(1)}`).join(' ');

                  return (
                    <polyline
                      key={`${li}-${line.planet}-${line.angle}`}
                      points={pts}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={strokeW}
                      strokeDasharray={ANGLE_DASH[line.angle]}
                      opacity={opacity}
                      style={{cursor:'pointer'}}
                      onClick={() => setSelected(isSelected ? null : `${line.planet}-${line.angle}`)}
                    />
                  );
                }) : (
                  /* Fallback: show dasha zone rectangles if no real lines yet */
                  <>
                    {mahaId === 'jupiter' && <><rect x="62" y="28" width="7" height="8" rx="1.5" fill="#D4AF37" opacity={0.35+0.15*sinPulse}/><rect x="70" y="33" width="5" height="5" rx="1.5" fill="#D4AF37" opacity={0.3+0.15*sinPulse}/><rect x="10" y="22" width="6" height="7" rx="1.5" fill="#D4AF37" opacity={0.25+0.1*sinPulse}/></>}
                    {mahaId === 'venus'   && <><rect x="46" y="24" width="7" height="6" rx="1.5" fill="#EC4899" opacity={0.35+0.15*sinPulse}/><rect x="70" y="33" width="5" height="5" rx="1.5" fill="#EC4899" opacity={0.3+0.15*sinPulse}/></>}
                    {mahaId === 'moon'    && <><rect x="47" y="13" width="8" height="10" rx="1.5" fill="#C0C8E8" opacity={0.35+0.15*sinPulse}/><rect x="10" y="12" width="18" height="10" rx="1.5" fill="#C0C8E8" opacity={0.25}/></>}
                    {mahaId === 'ketu'    && <><rect x="63" y="34" width="5" height="5" rx="1.5" fill="#F97316" opacity={0.4+0.15*sinPulse}/><rect x="66" y="25" width="6" height="5" rx="1.5" fill="#F97316" opacity={0.3}/></>}
                    <text x="22" y="32" textAnchor="middle" fontSize="2.5" fill="rgba(212,175,55,0.4)" fontWeight="700">Calculate chart for real ACG lines</text>
                  </>
                )}

                {/* Paran hotspots */}
                {parans.map((p,i) => {
                  const x = lonToX(p.lon);
                  return <circle key={i} cx={x} cy={30} r="0.8" fill="#D4AF37" opacity={0.5+0.3*sinPulse}/>;
                })}

                {/* Birth marker */}
                <circle cx={birthMarker.x} cy={birthMarker.y} r={0.8+0.3*sinPulse} fill="#D4AF37" opacity="0.95" style={{pointerEvents:'none' as const}}/>
                <circle cx={birthMarker.x} cy={birthMarker.y} r="2.2" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity={0.3+0.2*sinPulse} style={{pointerEvents:'none' as const}}/>
                <text x={birthMarker.x+1.5} y={birthMarker.y-1} fontSize="1.4" fill="#D4AF37" fontWeight="800" opacity="0.85" style={{pointerEvents:'none' as const}}>✦ {cityLabel}</text>

                {/* Angle legend */}
                <text x="1" y="57.5" fontSize="1.1" fill="rgba(255,255,255,0.2)" style={{pointerEvents:'none' as const}}>— ASC  ‐ ‐ MC  - - DSC  · · IC  ✦ Paran</text>
                <text x="1" y="59.2" fontSize="1.1" fill="rgba(255,255,255,0.15)" style={{pointerEvents:'none' as const}}>Bright = your Dasha-active Graha · Click line for reading</text>
              </svg>
            </div>

            {/* Angle legend */}
            <div style={{display:'flex',gap:16,flexWrap:'wrap' as const,marginTop:10}}>
              {[['ASC','Rising — Identity & self-expression'],['MC','Culminating — Career & public life'],['DSC','Setting — Partnerships & love'],['IC','Nadir — Home & roots']].map(([a,m])=>(
                <div key={a} style={{display:'flex',alignItems:'center',gap:5,fontSize:9,color:'rgba(255,255,255,0.4)'}}>
                  <div style={{width:16,height:1,background:'white',opacity:a==='ASC'?0.8:a==='MC'?0.6:a==='DSC'?0.4:0.25,borderTop:a==='IC'?'1px dotted rgba(255,255,255,0.4)':undefined}}/>
                  <span style={{color:activeAngle===a?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.4)',fontWeight:activeAngle===a?700:400}}>{a} — {m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reading Panel */}
          <div style={{flex:'1 1 260px',minWidth:240}}>
            {selectedLine ? (
              <div style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${selectedLine.color}30`,borderRadius:20,padding:22}}>
                <div style={{fontSize:8,letterSpacing:'0.35em',color:selectedLine.color,fontWeight:800,textTransform:'uppercase' as const,marginBottom:6}}>Bhumi Reading</div>
                <h3 style={{margin:'0 0 3px',fontSize:20,fontWeight:900,color:selectedLine.color}}>{selectedLine.planetName} {selectedLine.angle} Line</h3>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:16}}>
                  {selectedLine.angle === 'ASC' ? 'Rising — Identity' : selectedLine.angle === 'MC' ? 'Culminating — Career' : selectedLine.angle === 'DSC' ? 'Setting — Partnerships' : 'Nadir — Home & Roots'}
                </div>
                <div style={{background:`${selectedLine.color}0c`,border:`1px solid ${selectedLine.color}20`,borderRadius:12,padding:14,marginBottom:14}}>
                  <div style={{fontSize:12,lineHeight:1.65,color:'rgba(255,255,255,0.75)'}}>{selectedLine.meaning}</div>
                </div>
                {isDasha(selectedLine.planet) && (
                  <div style={{background:'rgba(212,175,55,0.07)',border:'1px solid rgba(212,175,55,0.18)',borderRadius:10,padding:12,marginBottom:12}}>
                    <div style={{fontSize:8,letterSpacing:'0.3em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:4}}>✦ Your Dasha Activated</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>{mahaRaw}{antarRaw?` › ${antarRaw}`:''} is magnetizing this line for your soul right now.</div>
                  </div>
                )}
                <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:10,padding:'8px 12px',marginBottom:12}}>
                  <div style={{fontSize:8,letterSpacing:'0.2em',color:'rgba(255,255,255,0.25)',fontWeight:700,textTransform:'uppercase' as const,marginBottom:4}}>300km Orb Rule</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>Cities within 300km of this line still feel {selectedLine.planetName}'s influence. You don't need to be exactly on the line.</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{width:'100%',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:8,color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:11,fontWeight:600}}>← Clear</button>
              </div>
            ) : (
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:20,padding:24}}>
                <div style={{fontSize:8,letterSpacing:'0.35em',color:'rgba(212,175,55,0.5)',fontWeight:800,textTransform:'uppercase' as const,marginBottom:12}}>
                  {hasRealLines ? 'Click any line for reading' : 'Your Dasha Zones'}
                </div>
                {hasRealLines ? (
                  <>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.7,marginBottom:16}}>
                      Your chart has {acgLines.length} real ACG lines. Each line shows where a planet sat on one of the 4 angles at your birth moment. Click any line on the map.
                    </div>
                    {/* Top Dasha-active lines */}
                    <div style={{fontSize:8,letterSpacing:'0.3em',color:'rgba(212,175,55,0.5)',fontWeight:800,textTransform:'uppercase' as const,marginBottom:10}}>Dasha-active lines</div>
                    {acgLines.filter(l=>isDasha(l.planet)&&l.angle==='MC').slice(0,4).map((l,i)=>(
                      <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',paddingBottom:10,marginBottom:10,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                        <div style={{width:22,height:22,borderRadius:7,background:`${l.color}18`,border:`1px solid ${l.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:900,color:l.color,flexShrink:0}}>{i+1}</div>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:l.color}}>{l.planetName} MC</div>
                          <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',marginTop:2,lineHeight:1.5}}>{l.meaning.split('.')[0]}.</div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.7}}>
                    Calculate your birth chart in the <strong style={{color:'rgba(255,255,255,0.65)'}}>☽ My Chart</strong> tab to generate your 36 real ACG lines. Each user's lines are unique to their exact birth data.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ LINES TAB ══ */}
      {subTab === 'lines' && (
        <div>
          {!hasRealLines ? (
            <div style={{textAlign:'center' as const,padding:'40px 20px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:20}}>
              <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>☉</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.7}}>
                Calculate your birth chart in the <strong style={{color:'rgba(255,255,255,0.65)'}}>☽ My Chart</strong> tab first.<br/>
                This will compute your 36 real ACG lines (9 planets × 4 angles).
              </div>
            </div>
          ) : (
            <div>
              {['ASC','MC','DSC','IC'].map(angle => (
                <div key={angle} style={{marginBottom:24}}>
                  <div style={{fontSize:9,letterSpacing:'0.4em',color:'rgba(255,255,255,0.4)',fontWeight:800,textTransform:'uppercase' as const,marginBottom:10}}>
                    {angle} — {angle==='ASC'?'Rising (Identity)':angle==='MC'?'Culminating (Career)':angle==='DSC'?'Setting (Partnerships)':'Nadir (Home & Roots)'}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
                    {acgLines.filter(l=>l.angle===angle).map((l,i) => (
                      <div key={i} onClick={()=>{setSubTab('map');setSelected(`${l.planet}-${l.angle}`);}} style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${l.color}${isDasha(l.planet)?'44':'18'}`,borderRadius:14,padding:'12px 14px',cursor:'pointer',position:'relative' as const,boxShadow:isDasha(l.planet)?`0 0 16px ${l.color}15`:'none'}}>
                        {isDasha(l.planet) && <div style={{position:'absolute' as const,top:8,right:8,background:'rgba(212,175,55,0.12)',border:'1px solid rgba(212,175,55,0.25)',borderRadius:6,padding:'1px 6px',fontSize:7,fontWeight:800,letterSpacing:'0.25em',color:'#D4AF37',textTransform:'uppercase' as const}}>DASHA</div>}
                        <div style={{fontSize:13,fontWeight:800,color:l.color,marginBottom:4}}>{l.planetName}</div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',lineHeight:1.55}}>{l.meaning.split('.')[0]}.</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ PARANS TAB ══ */}
      {subTab === 'parans' && (
        <div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.7,marginBottom:20,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,padding:'14px 16px'}}>
            <strong style={{color:'rgba(255,255,255,0.7)'}}>Parans</strong> are power intersection zones where two planetary lines cross at the same latitude. These are the most energetically intense spots on your entire map — multiple planetary themes activate simultaneously.
          </div>
          {parans.length === 0 ? (
            <div style={{textAlign:'center' as const,padding:'30px',color:'rgba(255,255,255,0.3)',fontSize:12}}>
              {hasRealLines ? 'No close parans detected in your chart.' : 'Calculate your chart to discover your paran hotspots.'}
            </div>
          ) : parans.map((p,i) => {
            const c1 = acgLines.find(l=>l.planet===p.planet1)?.color ?? '#D4AF37';
            const c2 = acgLines.find(l=>l.planet===p.planet2)?.color ?? '#8B5CF6';
            return (
              <div key={i} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:18,marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:c1}}/>
                  <div style={{fontSize:13,fontWeight:800,color:c1}}>{acgLines.find(l=>l.planet===p.planet1)?.planetName ?? p.planet1}</div>
                  <div style={{color:'rgba(255,255,255,0.3)',fontSize:14}}>×</div>
                  <div style={{width:10,height:10,borderRadius:'50%',background:c2}}/>
                  <div style={{fontSize:13,fontWeight:800,color:c2}}>{acgLines.find(l=>l.planet===p.planet2)?.planetName ?? p.planet2}</div>
                </div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.65}}>{p.meaning}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',marginTop:8}}>Longitude: {p.lon.toFixed(1)}°</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ BLUEPRINT TAB ══ */}
      {subTab === 'blueprint' && (
        <div style={{maxWidth:680}}>
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(212,175,55,0.12)',borderRadius:20,padding:26,marginBottom:16}}>
            <div style={{fontSize:8,letterSpacing:'0.4em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:8}}>
              Soul Geographic Blueprint{moonNakshatra?` · ${moonNakshatra} Nakshatra`:''}
            </div>
            {(ascendant||sunSign) && <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:16}}>{ascendant&&`Ascendant: ${ascendant}`}{ascendant&&sunSign?' · ':''}{sunSign&&`Sun: ${sunSign}`}</div>}
            {[
              {title:`Origin Zone — ${birthPlace||'Your Birth Place'}`,color:'#C0C8E8',text:`${cityLabel||'Your birth zone'} is your Janma Kshetra — the precise vibrational entry point chosen by your Atma. Your nervous system resets here fastest and your deepest healing transmissions flow most purely.`},
              ...(mahaRaw?[{title:`${mahaRaw} Mahadasha Zones`,color:'#D4AF37',text:`Under your active ${mahaRaw} Mahadasha, the geographic zones where ${mahaRaw}'s ACG lines run are cosmically magnetized. Movement toward these regions during this period brings accelerated karma resolution and dharmic opportunity.`}]:[]),
              ...(antarRaw&&antarRaw!==mahaRaw?[{title:`${antarRaw} Antardasha Activation`,color:'#EC4899',text:`${antarRaw} Antardasha amplifies its geographic lines right now. Short visits or collaborations with people from these regions carry elevated karmic weight and opportunity.`}]:[]),
              ...(moonNakshatra?[{title:`Moon Nakshatra — ${moonNakshatra}`,color:'#F97316',text:`Your Janma Nakshatra ${moonNakshatra} creates a subtle geographic resonance. Places where your Nakshatra's ruling Graha has strong ACG lines carry past-life memory codes that activate healing gifts and soul recognition.`}]:[]),
              {title:'Universal Moksha Zones — Ketu Kshetras',color:'#F97316',text:'South India, Tibet, Peru, and Egypt carry universal Ketu liberation codes. Short pilgrimage visits during Ketu transits accelerate past-life release regardless of individual chart placement.'},
              {title:'300km Orb — The Most Important Rule',color:'rgba(255,255,255,0.6)',text:'You do not need to live exactly on a planetary line. Research shows you feel a planet\'s influence within 200-300km of its line. This opens many more cities to each planetary energy than the exact line alone.'},
            ].map(item=>(
              <div key={item.title} style={{padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{fontSize:12,fontWeight:700,color:item.color,marginBottom:6}}>{item.title}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.7}}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(212,175,55,0.04)',border:'1px solid rgba(212,175,55,0.1)',borderRadius:16,padding:18}}>
            <div style={{fontSize:8,letterSpacing:'0.35em',color:'#D4AF37',fontWeight:800,textTransform:'uppercase' as const,marginBottom:10}}>Siddha Transmission</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.75}}>
              The 18 Siddhas teach that every soul is born into a geographic frequency that mirrors their karmic blueprint. The birth place is not random — it is the precise vibrational entry point chosen by the Atma. The Dasha system reveals when the cosmic timing aligns to move, expand, or deepen roots. The ACG lines are the Graha-Geographic Intelligence made visible.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
