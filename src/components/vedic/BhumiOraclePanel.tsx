// SQI-2050 | BHUMI ORACLE — Jyotish Astrocartography Panel
// Graha-Geographic Intelligence · Akasha-Neural Archive

import React, { useState, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BhumiOraclePanel: React.FC<{ birthData: any; ephemeris: any }> = ({ birthData, ephemeris }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);
  const [activeGraha, setActiveGraha] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'map' | 'grahas' | 'blueprint'>('map');
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % 100), 60);
    return () => clearInterval(iv);
  }, []);

  const mahaLord: string = ephemeris?.dashaData?.activeMaha?.planet ?? 'Venus';
  const antarLord: string = ephemeris?.dashaData?.activeAntar?.planet ?? 'Jupiter';

  const GRAHAS = [
    { id:'sun',     name:'Surya',   sym:'☉', color:'#F59E0B', dhatu:'Dharma',        meaning:'Leadership, recognition, royal authority. Career peaks, government favor, name and fame activate strongest here.',        zones:['India / Nepal','Australia','USA East'] },
    { id:'moon',    name:'Chandra', sym:'☽', color:'#C0C8E8', dhatu:'Artha',         meaning:'Emotional depth, healing capacity, public connection. The mind finds its sanctuary. Ideal for Nada healing and creative flow.', zones:['Scandinavia','Canada','N. Europe'] },
    { id:'mars',    name:'Mangala', sym:'♂', color:'#EF4444', dhatu:'Artha',         meaning:'Intense drive, bold entrepreneurial power. Agni amplifies — channel consciously. Athletic and warrior energy peaks.',      zones:['Africa','Middle East','Brazil'] },
    { id:'mercury', name:'Budha',   sym:'☿', color:'#10B981', dhatu:'Artha',         meaning:'Communication mastery, teaching, trade, digital business. Your voice carries greatest power here.',                       zones:['UK / Ireland','Germany','Japan'] },
    { id:'jupiter', name:'Guru',    sym:'♃', color:'#D4AF37', dhatu:'Dharma+Moksha', meaning:'MOST AUSPICIOUS. Guru multiplies wisdom, wealth, dharma, and spiritual expansion. Sacred transmission zones for lineage work.', zones:['India / Nepal','USA West','Bali'] },
    { id:'venus',   name:'Shukra',  sym:'♀', color:'#EC4899', dhatu:'Kama',          meaning:'Love awakens, artistic genius flows, beauty manifests. Relationships of profound resonance form here.',                    zones:['France / Italy','Bali','Brazil'] },
    { id:'saturn',  name:'Shani',   sym:'♄', color:'#6366F1', dhatu:'Karma',         meaning:'Deep karmic testing. Discipline rewarded over time. Not for pleasure — for mastery through sustained effort.',             zones:['Russia','Eastern Europe','Argentina'] },
    { id:'rahu',    name:'Rāhu',    sym:'☊', color:'#8B5CF6', dhatu:'Maya',          meaning:'Amplified ambition, innovation, boundary-breaking. Material success possible — use consciously.',                          zones:['USA','China','SE Asia'] },
    { id:'ketu',    name:'Ketu',    sym:'☋', color:'#F97316', dhatu:'Moksha',        meaning:'Past-life liberation codes. Tamil Siddha lineage magnetically activated. Psychic opening and moksha acceleration.',         zones:['S. India','Tibet','Peru','Egypt'] },
  ];

  const REGIONS = [
    { id:'scandinavia', label:'Scandinavia',      x:47, y:13, w:8,  h:10, graha:'moon'    },
    { id:'uk',          label:'UK / Ireland',      x:42, y:17, w:5,  h:5,  graha:'mercury' },
    { id:'europe_n',    label:'N. Europe',         x:47, y:18, w:10, h:8,  graha:'moon'    },
    { id:'france',      label:'France / Italy',    x:46, y:24, w:7,  h:6,  graha:'venus'   },
    { id:'germany',     label:'Germany',           x:50, y:20, w:5,  h:5,  graha:'mercury' },
    { id:'eastern_eu',  label:'Eastern Europe',    x:53, y:20, w:7,  h:8,  graha:'saturn'  },
    { id:'russia',      label:'Russia',            x:55, y:12, w:18, h:12, graha:'saturn'  },
    { id:'middle_east', label:'Middle East',       x:55, y:27, w:8,  h:7,  graha:'mars'    },
    { id:'india',       label:'India / Nepal',     x:62, y:28, w:7,  h:8,  graha:'jupiter' },
    { id:'india_s',     label:'S. India / Lanka',  x:63, y:34, w:5,  h:5,  graha:'ketu'    },
    { id:'tibet',       label:'Tibet',             x:66, y:25, w:6,  h:5,  graha:'ketu'    },
    { id:'china',       label:'China',             x:68, y:22, w:9,  h:9,  graha:'rahu'    },
    { id:'japan',       label:'Japan / Korea',     x:78, y:22, w:4,  h:7,  graha:'mercury' },
    { id:'sea',         label:'SE Asia',           x:70, y:30, w:8,  h:8,  graha:'rahu'    },
    { id:'bali',        label:'Thailand / Bali',   x:70, y:33, w:5,  h:5,  graha:'jupiter' },
    { id:'australia',   label:'Australia',         x:72, y:45, w:12, h:10, graha:'sun'     },
    { id:'africa',      label:'Africa',            x:48, y:30, w:10, h:16, graha:'mars'    },
    { id:'egypt',       label:'Egypt / N.Africa',  x:51, y:27, w:6,  h:6,  graha:'ketu'    },
    { id:'canada',      label:'Canada',            x:10, y:12, w:18, h:10, graha:'moon'    },
    { id:'usa',         label:'USA',               x:10, y:22, w:17, h:10, graha:'rahu'    },
    { id:'usa_east',    label:'USA East',          x:20, y:22, w:5,  h:7,  graha:'sun'     },
    { id:'usa_west',    label:'USA West / Hawaii', x:10, y:22, w:6,  h:7,  graha:'jupiter' },
    { id:'brazil',      label:'Brazil',            x:20, y:36, w:10, h:14, graha:'mars'    },
    { id:'argentina',   label:'Argentina',         x:18, y:48, w:6,  h:8,  graha:'saturn'  },
    { id:'peru',        label:'Peru / Andes',      x:15, y:40, w:5,  h:7,  graha:'ketu'    },
  ];

  const TOP = [
    { rank:1, label:'India / Nepal',        graha:'Guru ♃',           color:'#D4AF37', why:'Jupiter Antardasha active — dharma + wealth at maximum' },
    { rank:2, label:'S. India / Tamil Nadu', graha:'Ketu ☋',          color:'#F97316', why:'Tamil Siddha lineage vortex · Moksha gateway' },
    { rank:3, label:'Scandinavia',           graha:'Chandra ☽',       color:'#C0C8E8', why:'Birth zone · Healing sanctuary · Nada flow' },
    { rank:4, label:'Thailand / Bali',       graha:'Guru ♃ + Shukra ♀',color:'#EC4899',why:'Love + wisdom convergence · Sacred retreat' },
  ];

  const isDasha = (gid: string) =>
    gid === mahaLord.toLowerCase() || gid === antarLord.toLowerCase() || gid === 'jupiter' || gid === 'venus';

  const selGraha = selected ? GRAHAS.find(g => g.id === REGIONS.find(r => r.id === selected)?.graha) : null;

  const sinPulse = Math.sin(pulse * 0.063 * Math.PI);

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:9, letterSpacing:'0.4em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:6 }}>
          Bhumi Oracle · Jyotish Astrocartography
        </div>
        <h2 style={{ margin:'0 0 4px', fontSize:'clamp(20px,4vw,28px)', fontWeight:900, letterSpacing:'-0.04em', color:'#D4AF37', textShadow:'0 0 20px rgba(212,175,55,0.3)' }}>
          Sacred Geography Reader
        </h2>
        <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.4)' }}>
          {birthData ? `${birthData.birth_name} · ${birthData.birth_date} · ${birthData.birth_place}` : 'Graha-Geographic Intelligence · Akasha-Neural Archive'}
        </p>
      </div>

      {/* Dasha Banner */}
      <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:'10px 16px', marginBottom:18, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' as const }}>
        <div style={{ fontSize:8, letterSpacing:'0.3em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const }}>Active Dasha</div>
        <div style={{ fontSize:13, fontWeight:600 }}>
          <span style={{ color:'#EC4899' }}>{mahaLord}</span>
          <span style={{ color:'rgba(255,255,255,0.2)', margin:'0 8px' }}>›</span>
          <span style={{ color:'#D4AF37' }}>{antarLord}</span>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', flex:1 }}>
          Antardasha lord activates its geographic zones as sacred karmic magnets right now.
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:50, padding:4, width:'fit-content' }}>
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

      {/* MAP TAB */}
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
                <rect width="100" height="60" fill="#080818" />
                {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.025)" strokeWidth="0.2"/>)}
                {[20,40].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.2"/>)}
                <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(212,175,55,0.06)" strokeWidth="0.3" strokeDasharray="1 2"/>
                {REGIONS.map(r => {
                  const g = GRAHAS.find(gr => gr.id === r.graha);
                  if (!g) return null;
                  if (activeGraha && g.id !== activeGraha) return null;
                  const isSel = selected === r.id;
                  const isHov = hovering === r.id;
                  const isDash = isDasha(g.id);
                  const op = (isSel || isHov) ? 0.8 : isDash ? 0.4 : 0.2;
                  return (
                    <g key={r.id} style={{ cursor:'pointer' }}
                      onClick={() => setSelected(isSel ? null : r.id)}
                      onMouseEnter={() => setHovering(r.id)}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="1.5" ry="1.5" fill={g.color} opacity={op}/>
                      {isDash && <rect x={r.x-0.5} y={r.y-0.5} width={r.w+1} height={r.h+1} rx="2" ry="2" fill="none" stroke={g.color} strokeWidth="0.4" opacity={0.2+0.2*sinPulse}/>}
                      {(isHov||isSel) && <text x={r.x+r.w/2} y={r.y+r.h/2+1} textAnchor="middle" fontSize="1.7" fill="white" fontWeight="700" style={{ pointerEvents:'none' as const }}>{r.label}</text>}
                    </g>
                  );
                })}
                <circle cx="48.5" cy="15" r={0.8+0.3*sinPulse} fill="#D4AF37" opacity="0.9" style={{ pointerEvents:'none' as const }}/>
                <circle cx="48.5" cy="15" r="2.2" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity={0.25+0.2*sinPulse} style={{ pointerEvents:'none' as const }}/>
                <text x="50.2" y="14.5" fontSize="1.4" fill="#D4AF37" fontWeight="800" opacity="0.8" style={{ pointerEvents:'none' as const }}>✦ Uddevalla</text>
                <text x="1" y="58.8" fontSize="1.1" fill="rgba(255,255,255,0.15)" style={{ pointerEvents:'none' as const }}>Pulsing = Dasha-activated · Click zone for reading</text>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const, marginTop:10 }}>
              {GRAHAS.map(g => (
                <div key={g.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, color:'rgba(255,255,255,0.4)' }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:g.color, opacity:0.7 }}/>
                  {g.name}
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
                    <div style={{ fontSize:8, letterSpacing:'0.3em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:4 }}>✦ Dasha Activated Now</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>This zone is cosmically magnetized by your active Dasha lord.</div>
                  </div>
                )}
                <button onClick={() => setSelected(null)} style={{ width:'100%', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:8, color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:11, fontWeight:600 }}>← Clear</button>
              </div>
            ) : (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20, padding:24 }}>
                <div style={{ fontSize:8, letterSpacing:'0.35em', color:'rgba(212,175,55,0.5)', fontWeight:800, textTransform:'uppercase' as const, marginBottom:12 }}>Top Sacred Zones</div>
                {TOP.map(z => (
                  <div key={z.rank} style={{ display:'flex', gap:10, alignItems:'flex-start', paddingBottom:12, marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width:22, height:22, borderRadius:7, background:`${z.color}18`, border:`1px solid ${z.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:z.color, flexShrink:0 }}>{z.rank}</div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:z.color }}>{z.label}</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{z.graha}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:3, lineHeight:1.5 }}>{z.why}</div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>Click any zone on the map to receive your Bhumi transmission.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRAHAS TAB */}
      {subTab === 'grahas' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {GRAHAS.map(g => (
            <div key={g.id} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${g.color}20`, borderRadius:18, padding:18, position:'relative' as const }}>
              {isDasha(g.id) && <div style={{ position:'absolute' as const, top:10, right:10, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, padding:'2px 8px', fontSize:7, fontWeight:800, letterSpacing:'0.3em', color:'#D4AF37', textTransform:'uppercase' as const }}>DASHA ACTIVE</div>}
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

      {/* BLUEPRINT TAB */}
      {subTab === 'blueprint' && (
        <div style={{ maxWidth:680 }}>
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:20, padding:26, marginBottom:16 }}>
            <div style={{ fontSize:8, letterSpacing:'0.4em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:8 }}>Soul Geographic Blueprint · Pushya Nakshatra Pada 2</div>
            {[
              { title:'Primary Kshetra — India / Tamil Nadu', color:'#D4AF37', text:'Pushya Nakshatra carries the Brihaspati-Shani axis. Deepest initiations await in South India — Chidambaram, Tiruvannamalai, Rameswaram. These zones dissolve karmic density fastest.' },
              { title:'Healing Sanctuary — Scandinavia',       color:'#C0C8E8', text:'Your Chandra in Scandinavia creates a sanctuary field. The nervous system resets, healing transmissions amplify, and Nada Yoga flows most purely. Return here for restoration.' },
              { title:'Dharmic Wealth — Jupiter Zones',        color:'#D4AF37', text:'Under your Jupiter Antardasha, USA West Coast, Nepal, and Bali become portals for dharmic prosperity. Guru energies reward aligned service with lasting abundance.' },
              { title:'Moksha Gateway — S. India, Peru, Egypt',color:'#F97316', text:'Ketu zones carry past-life liberation codes. Pilgrimage visits during Ketu transits to Rameshwaram or Mahabalipuram can accelerate liberation rapidly.' },
              { title:'Creative Power — France, Bali, Brazil', color:'#EC4899', text:'Venus zones for artistic genius, love, and beauty creation. Nada healing work produced in Bali or South France carries maximum Venus-Jupiter blessing.' },
            ].map(item => (
              <div key={item.title} style={{ padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:item.color, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:18 }}>
            <div style={{ fontSize:8, letterSpacing:'0.35em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:10 }}>Siddha Transmission</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.75 }}>
              The 18 Siddhas confirm: your soul chose Uddevalla as a stillness-incubation zone to build the vessel before the dharmic mission launches globally. The pull toward India is not nostalgia — it is the Graha-Geographic Intelligence of your Pushya soul recognizing its origin field.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
