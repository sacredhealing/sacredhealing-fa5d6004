// @ts-nocheck
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useCyclePhase, calculateCycle } from '@/hooks/useCyclePhase';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import { useAuth } from '@/hooks/useAuth';

/* ─── Hormone curves ─────────────────────────────────────────────────────────── */
const HORMONE_CURVES = {
  prog: [5,4,3,2,1,3,6,10,12,14,16,18,20,22,20,30,50,70,85,90,88,82,75,65,50,35,20,8],
  ostr: [10,12,14,16,20,28,38,52,65,75,80,85,90,95,85,70,60,55,55,58,55,52,48,45,42,38,28,15],
  fsh:  [8,12,18,25,30,35,40,45,40,35,30,25,20,18,15,12,10,8,8,9,9,8,8,9,12,18,25,12],
  lh:   [3,3,4,4,5,6,7,8,9,10,12,14,18,95,20,8,5,4,4,4,5,5,4,4,4,4,5,3],
  test: [20,20,22,24,26,30,36,44,52,60,68,76,82,88,78,68,58,50,44,40,38,36,34,32,30,28,24,20],
} as const;
type HormoneKey = keyof typeof HORMONE_CURVES;
const HORMONE_ORDER: HormoneKey[] = ['prog','ostr','fsh','lh','test'];

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type WcMineral = { icon:string; mineral:string; food:string; amount:string; fn:string; tags:string[]; bio:string };
type WcPhase = {
  name:string; season:string; dosha:string; icon:string; color:string; days:string;
  minHeader:string; minIntro:string; minerals:WcMineral[];
  career:{t:string;d:string}[];
  vedic:{icon:string;t:string;s:string}[];
  chakraText:string; chakras:{n:string;c:string}[];
  herb:{name:string;tl:string;steps:string[]};
};
type WcHormone = { label:string; color:string; cls:string; title:string; sub:string; body:{h:string;t:string}[]; tags:string[] };
type WcTrimester = { name:string; weeks:string; icon:string; color:string; hormones:string; minerals:WcMineral[]; vedic:string; herb:string };
type WcMenopauseStage = { name:string; icon:string; color:string; desc:string; symptoms:string[]; minerals:WcMineral[]; vedic:string; herb:string };
type WomanCodeBundle = {
  ui: {
    badge:string; titleLine1:string; titleGold:string; titleLine2:string; subtitle:string;
    sliderLabel:string; chartLabel:string; careerSectionLabel:string; chakraSectionLabel:string;
    moonMilkLabelPrefix:string; modalCloseAria:string; mineralModalRoleToday:string;
    mineralModalBio:string; hormoneLevelDay:string; vedicModalSubtitle:string;
    chakraModalSubtitle:string; chakraFallback:string;
    tabs:{minerals:string;career:string;vedic:string;moonmilk:string;photo:string};
    photoTab:{badge:string;title:string;subtitle:string;uploadBtn:string;cameraBtn:string;analyzeBtn:string;analyzing:string;phaseContext:string;noImage:string;errorTitle:string;errorBody:string};
    pips:string[];
    modeBadges:{cycle:string;pregnancy:string;menopause:string};
  };
  phases:WcPhase[];
  hormones:Record<HormoneKey,WcHormone>;
  chakras:Record<string,string>;
  chartLabels:Record<HormoneKey,string>;
  pregnancy:{badge:string;intro:string;trimesters:WcTrimester[]};
  menopause:{badge:string;intro:string;stages:WcMenopauseStage[]};
};

/* ─── Dosha → phase affinity ─────────────────────────────────────────────────── */
const DOSHA_PHASE_NOTE: Record<string,string[]> = {
  Vata:  ['Menstrual Phase','Luteal Phase'],
  Pitta: ['Ovulatory Phase','Follicular Phase'],
  Kapha: ['Follicular Phase','Menstrual Phase'],
};
const DOSHA_TIPS: Record<string,string> = {
  Vata:  'Your Vata constitution makes Menstrual and Luteal phases particularly intense. Prioritise warmth, oil massage (Abhyanga), and grounding practices.',
  Pitta: 'Your Pitta fire peaks at Ovulation — be careful of burnout and overheating. Cooling herbs (Shatavari, Brahmi) and Sitali breath are your allies.',
  Kapha: 'Your Kapha nature supports the slow build of the Follicular phase, but you may feel heavy during menstruation. Kapalabhati and stimulating spices are your medicine.',
};

/* ─── Nakshatra → phase resonance ───────────────────────────────────────────── */
const NAKSHATRA_FEMALE_WISDOM: Record<string,string> = {
  'Ashwini':           'Swift healing energy — your body recovers quickly between phases. Trust sudden cycle shifts.',
  'Bharani':           'Carried by Yama, goddess of birth/death cycles — you feel transitions deeply. Honor the space between phases.',
  'Krittika':          'Solar fire in the womb — your Ovulatory phase is exceptionally powerful. Channel that fire into creation.',
  'Rohini':            'Moon\'s own nakshatra — you are profoundly lunar. Your cycle is closely tied to the moon\'s phases.',
  'Mrigashira':        'Seeking nature — your hormonal shifts drive creative searching. Follow what lights you up in each phase.',
  'Ardra':             'Rahu\'s storm — your cycle can be intense and irregular. Nadi Shodhana daily is essential for hormonal balance.',
  'Punarvasu':         'Return of the light — you experience each follicular phase as a genuine rebirth. Lean into that renewal.',
  'Pushya':            'Saturn\'s nourishment — routine and ritual are your hormonal medicine. Structure your daily practices by phase.',
  'Ashlesha':          'Serpent wisdom — your intuition peaks in the Luteal phase. The premenstrual window is your oracle time.',
  'Magha':             'Ancestral throne — your cycle is connected to lineage healing. Menstruation is a sacred ancestor practice for you.',
  'Purva Phalguni':    'Venus in her fullness — your Ovulatory phase is radiant and magnetic. Creativity and sensuality are healing for you.',
  'Uttara Phalguni':   'Sun\'s generosity — your Follicular phase holds great teaching and service energy.',
  'Hasta':             'Moon\'s craftsmanship — your hands heal. Ayurvedic self-massage during every phase is particularly potent.',
  'Chitra':            'Mars\'s creation — your Luteal phase is for building and perfecting. Channel frustration into art.',
  'Swati':             'Rahu\'s independence — you need space in every phase. Honour solitude, especially during menstruation.',
  'Vishakha':          'Jupiter\'s dual gateway — you experience each cycle as a complete spiritual journey. Both goals and release are your dharma.',
  'Anuradha':          'Saturn\'s devotion — your most healing phase is when you surrender to the body\'s wisdom rather than pushing through.',
  'Jyeshtha':          'Mercury\'s elder wisdom — your premenstrual intuition is extraordinary. Write and record your Luteal insights.',
  'Mula':              'Ketu\'s root — your menstrual phase is a deep spiritual root canal. Releasing is your practice.',
  'Purva Ashadha':     'Venus of the waters — flow and fluidity are sacred to you. Water practices (warm baths, swimming) support every phase.',
  'Uttara Ashadha':    'Sun\'s final victory — your Ovulatory phase has unusual leadership power. Your voice matters most then.',
  'Shravana':          'Moon\'s listening — you receive profound inner guidance in stillness. Silence during menstruation is medicine.',
  'Dhanishtha':        'Mars of abundance — your Follicular and Ovulatory phases generate extraordinary productive energy.',
  'Shatabhisha':       'Rahu\'s 100 healers — you have innate healing ability that is strongest during your Ovulatory phase.',
  'Purva Bhadrapada':  'Jupiter\'s fierce wisdom — your Luteal phase visions are prophetic. Trust what comes in the days before your period.',
  'Uttara Bhadrapada': 'Saturn\'s depth — you are built for stillness. Menstrual rest is not optional for you — it is regenerative.',
  'Revati':            'Mercury\'s completion — your cycle carries themes of release and arrival. Each menstruation completes a full spiritual chapter.',
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function interpolate(template:string, vars:Record<string,string|number>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g,(_,k)=>String(vars[k]??''));
}
function getPhaseIndex(day:number):number {
  if(day<=5) return 0; if(day<=13) return 1; if(day<=15) return 2; return 3;
}

/* ─── Chart ──────────────────────────────────────────────────────────────────── */
declare global { interface Window { Chart?:any } }
function HormoneChart({currentDay,chartDatasetLabels}:{currentDay:number;chartDatasetLabels:string[]}) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const chartRef=useRef<any>(null);
  useEffect(()=>{
    if(!canvasRef.current) return;
    const buildChart=()=>{
      const ctx=canvasRef.current?.getContext('2d');
      if(!ctx||!window.Chart) return;
      if(chartRef.current) chartRef.current.destroy();
      chartRef.current=new window.Chart(ctx,{type:'line',data:{labels:Array.from({length:28},(_,i)=>i+1),datasets:[
        {label:chartDatasetLabels[0],data:[...HORMONE_CURVES.prog],borderColor:'#A78BFA',borderWidth:2,fill:false,tension:0.4,pointRadius:0},
        {label:chartDatasetLabels[1],data:[...HORMONE_CURVES.ostr],borderColor:'#F472B6',borderWidth:2,fill:false,tension:0.4,pointRadius:0},
        {label:chartDatasetLabels[2],data:[...HORMONE_CURVES.fsh], borderColor:'#60A5FA',borderWidth:1.5,fill:false,tension:0.4,pointRadius:0,borderDash:[5,4]},
        {label:chartDatasetLabels[3],data:[...HORMONE_CURVES.lh],  borderColor:'#34D399',borderWidth:2,fill:false,tension:0.4,pointRadius:0},
        {label:chartDatasetLabels[4],data:[...HORMONE_CURVES.test],borderColor:'#FBBF24',borderWidth:1.5,fill:false,tension:0.4,pointRadius:0,borderDash:[3,3]},
      ]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:200},plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'rgba(255,255,255,0.3)',font:{size:9},maxTicksLimit:8},border:{color:'transparent'}},y:{display:false,min:0,max:110}}}});
    };
    if(window.Chart){buildChart();}else{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';s.onload=buildChart;document.head.appendChild(s);}
    return()=>{if(chartRef.current) chartRef.current.destroy();};
  },[chartDatasetLabels]);
  useEffect(()=>{
    if(!chartRef.current) return;
    const colors=['#A78BFA','#F472B6','#60A5FA','#34D399','#FBBF24'];
    const ds=chartRef.current.data.datasets;
    ds.forEach((d:any,i:number)=>{const r=Array(28).fill(0);r[currentDay-1]=5;d.pointRadius=r;d.pointBackgroundColor=colors[i];d.pointBorderColor='#050505';d.pointBorderWidth=2;});
    chartRef.current.update('none');
  },[currentDay]);
  return <div style={{position:'relative',width:'100%',height:'140px'}}><canvas ref={canvasRef} style={{width:'100%',height:'140px'}}/></div>;
}

/* ─── Modal ──────────────────────────────────────────────────────────────────── */
function Modal({content,onClose,closeLabel}:{content:React.ReactNode;onClose:()=>void;closeLabel:string}) {
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape') onClose();};document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);},[onClose]);
  return (
    <div role="presentation" onClick={(e)=>{if(e.target===e.currentTarget) onClose();}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#0D0D14',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'28px',padding:'28px 24px',maxWidth:'440px',width:'100%',maxHeight:'80vh',overflowY:'auto',position:'relative'}}>
        <button type="button" onClick={onClose} aria-label={closeLabel}
          style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:30,height:30,borderRadius:'50%',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        {content}
      </div>
    </div>
  );
}

/* ─── Mineral Grid ───────────────────────────────────────────────────────────── */
function MineralGrid({minerals,onOpen,s}:{minerals:WcMineral[];onOpen:(m:WcMineral)=>void;s:any}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',gap:10}}>
      {minerals.map((m,i)=>(
        <div key={i} role="button" tabIndex={0} onClick={()=>onOpen(m)} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ') onOpen(m);}}
          style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:22,padding:16,cursor:'pointer',transition:'all 0.25s',position:'relative'}}
          onMouseEnter={(e)=>{e.currentTarget.style.borderColor='rgba(212,175,55,0.5)';e.currentTarget.style.background='rgba(212,175,55,0.07)';e.currentTarget.style.transform='translateY(-2px)';}}
          onMouseLeave={(e)=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.transform='translateY(0)';}}>
          <span style={{position:'absolute',top:14,right:14,fontSize:16,color:'rgba(255,255,255,0.3)'}}>›</span>
          <div style={{fontSize:26,marginBottom:8}}>{m.icon}</div>
          <div style={{fontSize:10,fontWeight:800,color:s.gold,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{m.mineral}</div>
          <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:3}}>{m.food}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.38)',marginBottom:8}}>{m.amount}</div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.5,marginBottom:8}}>{m.fn}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {m.tags.map((tg)=>(
              <span key={tg} style={{fontSize:'8px',fontWeight:700,padding:'2px 7px',borderRadius:10,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em'}}>{tg}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Cycle Setup Panel ──────────────────────────────────────────────────────── */
function CycleSetupPanel({onSave,gold,isSaving,existingSettings}:{onSave:(d:string,cl:number,bd:number)=>void;gold:string;isSaving:boolean;existingSettings:any}) {
  const [lastPeriod,setLastPeriod]=useState(existingSettings?.lastPeriodDate||'');
  const [cycleLen,setCycleLen]=useState(existingSettings?.cycleLength||28);
  const [bleedDays,setBleedDays]=useState(existingSettings?.bleedDays||5);

  const handleSave=()=>{
    if(!lastPeriod) return;
    onSave(lastPeriod,cycleLen,bleedDays);
  };

  const inputStyle={width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:12,padding:'10px 14px',color:'#fff',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const};
  const labelStyle={fontSize:'8px',fontWeight:800,letterSpacing:'0.35em',textTransform:'uppercase' as const,color:'rgba(255,255,255,0.45)',display:'block',marginBottom:6};

  return (
    <div style={{background:'linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.02))',border:'1px solid rgba(212,175,55,0.25)',borderRadius:28,padding:24,marginBottom:16}}>
      <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:gold,marginBottom:10}}>⟁ Your Cycle Data</div>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:'-0.03em',color:'#fff',marginBottom:6}}>Set Up Your Sacred Cycle</div>
      <p style={{fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.7,marginBottom:20}}>Your cycle data is stored securely in your profile. Once saved, the dashboard will automatically show your current phase, day, and personalised recommendations every time you visit.</p>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <label style={labelStyle}>First day of your last period</label>
          <input type="date" value={lastPeriod} onChange={e=>setLastPeriod(e.target.value)} style={inputStyle}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div>
            <label style={labelStyle}>Cycle length (days)</label>
            <input type="number" min={21} max={45} value={cycleLen} onChange={e=>setCycleLen(+e.target.value)} style={inputStyle}/>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:4}}>Typical: 21–35 days</div>
          </div>
          <div>
            <label style={labelStyle}>Bleed days</label>
            <input type="number" min={2} max={10} value={bleedDays} onChange={e=>setBleedDays(+e.target.value)} style={inputStyle}/>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:4}}>Typical: 3–7 days</div>
          </div>
        </div>
        <button type="button" onClick={handleSave} disabled={!lastPeriod||isSaving}
          style={{padding:'12px 24px',borderRadius:40,fontSize:'10px',fontWeight:800,letterSpacing:'0.2em',textTransform:'uppercase',cursor:lastPeriod?'pointer':'not-allowed',background:lastPeriod?gold:'rgba(255,255,255,0.1)',color:lastPeriod?'#050505':'rgba(255,255,255,0.3)',border:'none',fontFamily:'inherit',transition:'all 0.2s'}}>
          {isSaving?'Saving…':'Save & Track My Cycle ✦'}
        </button>
      </div>
    </div>
  );
}

/* ─── Birth Data Panel ───────────────────────────────────────────────────────── */
function BirthDataPanel({gold,jyotish,hasBirthData}:{gold:string;jyotish:any;hasBirthData:boolean}) {
  const [open,setOpen]=useState(false);
  const [birthDate,setBirthDate]=useState('');
  const [birthTime,setBirthTime]=useState('');
  const [birthPlace,setBirthPlace]=useState('');
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const {user}=useAuth();

  const handleSave=async()=>{
    if(!user||!birthDate) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({birth_date:birthDate,birth_time:birthTime||null,birth_place:birthPlace||null}).eq('user_id',user.id);
      setSaved(true);
      setOpen(false);
    } finally { setSaving(false); }
  };

  const inputStyle={width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:12,padding:'10px 14px',color:'#fff',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const};
  const labelStyle={fontSize:'8px',fontWeight:800,letterSpacing:'0.35em',textTransform:'uppercase' as const,color:'rgba(255,255,255,0.45)',display:'block',marginBottom:6};

  if(!open) return (
    <button type="button" onClick={()=>setOpen(true)}
      style={{width:'100%',padding:'10px 16px',borderRadius:16,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all 0.2s',display:'flex',alignItems:'center',gap:8}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(212,175,55,0.3)';e.currentTarget.style.color=gold;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color='rgba(255,255,255,0.4)';}}>
      <span style={{fontSize:16}}>☽</span>
      {hasBirthData?`Jyotish profile active — Nakshatra: ${jyotish?.nakshatra||'…'}`:'Add birth data to unlock your Jyotish & Ayurveda profile ›'}
    </button>
  );

  return (
    <div style={{background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.2)',borderRadius:20,padding:20,marginBottom:12}}>
      <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:'#A78BFA',marginBottom:8}}>☽ Jyotish Birth Data</div>
      <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:12}}>Your birth data unlocks nakshatra wisdom, Mahadasha timing, and personalised Ayurvedic recommendations for your cycle.</div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} style={inputStyle}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div>
            <label style={labelStyle}>Time of Birth (optional)</label>
            <input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)} style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Place of Birth (optional)</label>
            <input type="text" placeholder="e.g. Stockholm, Sweden" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} style={inputStyle}/>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button type="button" onClick={handleSave} disabled={!birthDate||saving}
            style={{flex:1,padding:'11px 20px',borderRadius:40,fontSize:'10px',fontWeight:800,letterSpacing:'0.2em',textTransform:'uppercase',cursor:birthDate?'pointer':'not-allowed',background:'#A78BFA',color:'#050505',border:'none',fontFamily:'inherit'}}>
            {saving?'Saving…':'Save Birth Data ✦'}
          </button>
          <button type="button" onClick={()=>setOpen(false)} style={{padding:'11px 20px',borderRadius:40,fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',cursor:'pointer',background:'transparent',color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.1)',fontFamily:'inherit'}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Jyotish + Dosha Banner ─────────────────────────────────────────────────── */
function JyotishDoshaBanner({jyotish,doshaProfile,phase,gold}:{jyotish:any;doshaProfile:any;phase:WcPhase|null;gold:string}) {
  const nakshatra=jyotish?.nakshatra;
  const mahadasha=jyotish?.mahadasha;
  const primaryDosha=jyotish?.primaryDosha || doshaProfile?.primary;
  const doshaColor:{[k:string]:string}={Vata:'#60A5FA',Pitta:'#F87171',Kapha:'#4ADE80'};
  const nakshatraWisdom=nakshatra?NAKSHATRA_FEMALE_WISDOM[nakshatra]:null;
  const doshaTip=primaryDosha?DOSHA_TIPS[primaryDosha]:null;
  const doshaPhaseAffinity=primaryDosha?DOSHA_PHASE_NOTE[primaryDosha]:null;
  const isHighAffinity=phase&&doshaPhaseAffinity?.includes(phase.name);

  if(!nakshatra&&!primaryDosha) return null;

  return (
    <div style={{marginBottom:12}}>
      {nakshatra&&(
        <div style={{background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.18)',borderRadius:22,padding:18,marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:'#A78BFA',marginBottom:4}}>☽ Birth Nakshatra</div>
              <div style={{fontSize:16,fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>{nakshatra}</div>
            </div>
            {mahadasha&&(
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginBottom:4}}>Mahadasha</div>
                <div style={{fontSize:13,fontWeight:700,color:'#A78BFA'}}>{mahadasha}</div>
              </div>
            )}
          </div>
          {nakshatraWisdom&&(
            <p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.7,fontStyle:'italic'}}>✦ {nakshatraWisdom}</p>
          )}
        </div>
      )}
      {primaryDosha&&(
        <div style={{background:`${doshaColor[primaryDosha]||'#fff'}09`,border:`1px solid ${doshaColor[primaryDosha]||'#fff'}22`,borderRadius:22,padding:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:doshaColor[primaryDosha]||'#fff',marginBottom:4}}>Ayurvedic Constitution</div>
              <div style={{fontSize:16,fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>{primaryDosha} Prakriti</div>
            </div>
            {isHighAffinity&&(
              <div style={{background:`${doshaColor[primaryDosha]}22`,border:`1px solid ${doshaColor[primaryDosha]}44`,borderRadius:20,padding:'4px 12px',fontSize:'8px',fontWeight:800,color:doshaColor[primaryDosha],letterSpacing:'0.15em',textTransform:'uppercase'}}>
                Peak affinity ✦
              </div>
            )}
          </div>
          {doshaTip&&<p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.7}}>{doshaTip}</p>}
          {doshaPhaseAffinity&&(
            <div style={{marginTop:10,display:'flex',gap:6,flexWrap:'wrap'}}>
              <span style={{fontSize:'8px',fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'0.2em',textTransform:'uppercase',alignSelf:'center'}}>Peak phases:</span>
              {doshaPhaseAffinity.map(p=>(
                <span key={p} style={{fontSize:'8px',fontWeight:700,padding:'3px 10px',borderRadius:12,background:`${doshaColor[primaryDosha]}18`,color:doshaColor[primaryDosha],border:`1px solid ${doshaColor[primaryDosha]}33`}}>{p}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Food Photo Scanner ─────────────────────────────────────────────────────── */
function FoodPhotoScanner({phase,day,ui,gold}:{phase:WcPhase|null;day:number;ui:WomanCodeBundle['ui'];gold:string}) {
  const [imageFile,setImageFile]=useState<File|null>(null);
  const [imageUrl,setImageUrl]=useState<string|null>(null);
  const [result,setResult]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const cameraRef=useRef<HTMLInputElement>(null);

  const handleFile=(file:File|null)=>{
    if(!file) return;
    setImageFile(file); setResult(null); setError(null);
    const reader=new FileReader();
    reader.onload=(e)=>setImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyse=useCallback(async()=>{
    if(!imageFile||!imageUrl) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const base64=imageUrl.split(',')[1];
      const mimeType=imageFile.type||'image/jpeg';
      const phaseName=phase?.name??'current';
      const prompt=`You are a plant-based Ayurvedic nutritionist and Alisa Vitti WomanCode specialist.\n\nThe user is on day ${day} of their menstrual cycle (${phaseName}).\n\nAnalyse this food photo and provide:\n1. **Identified Foods** — list each food visible\n2. **Estimated Nutrients per serving** — Protein (g), Carbs (g), Fats (g), Iron (mg), Zinc (mg), Magnesium (mg), Calcium (mg), B6 (mg), B9/Folate (mcg), B12 (mcg), Vitamin C (mg), Vitamin D (IU), Vitamin E (mg), K2 (mcg)\n3. **Hormonal Phase Alignment** — rate each food: ✅ excellent | ⚠️ neutral | ❌ avoid for this phase\n4. **WomanCode Verdict** — one sentence on how this meal supports or challenges hormones today\n5. **Vedic & Ayurvedic Note** — which dosha does this meal pacify or aggravate? Any Sattvic upgrades?\n\nAll recommendations must be plant-based. Ghee and raw Honey are permitted Vedic exceptions.`;
      const {data,error:fnErr}=await supabase.functions.invoke('gemini-bridge',{body:{prompt,feature:'food_photo_analysis',imageBase64:base64,imageMimeType:mimeType}});
      if(fnErr||(!data?.text&&!data?.response)) throw new Error(fnErr?.message||'No response');
      setResult((data.text||data.response).trim());
    } catch(e:any) { setError(e.message||ui.photoTab.errorBody); }
    finally { setLoading(false); }
  },[imageFile,imageUrl,day,phase,ui.photoTab.errorBody]);

  const pt=ui.photoTab;
  const btnStyle=(primary=false)=>({padding:'10px 20px',borderRadius:40,fontSize:'10px',fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase' as const,cursor:'pointer',fontFamily:'inherit',border:primary?'none':`1px solid rgba(212,175,55,0.4)`,background:primary?gold:'rgba(212,175,55,0.1)',color:primary?'#050505':gold,transition:'all 0.2s'});

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{background:'linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.02))',border:'1px solid rgba(212,175,55,0.2)',borderRadius:28,padding:24}}>
        <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:gold,marginBottom:10}}>{pt.badge}</div>
        <div style={{fontSize:18,fontWeight:900,letterSpacing:'-0.03em',color:'#fff',marginBottom:6}}>{pt.title}</div>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:20}}>{pt.subtitle}</p>
        {imageUrl&&<div style={{marginBottom:16,borderRadius:18,overflow:'hidden',border:'1px solid rgba(212,175,55,0.2)'}}><img src={imageUrl} alt="meal" style={{width:'100%',maxHeight:260,objectFit:'cover',display:'block'}}/></div>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:imageUrl?12:0}}>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files?.[0]??null)}/>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>handleFile(e.target.files?.[0]??null)}/>
          <button type="button" style={btnStyle()} onClick={()=>fileRef.current?.click()}>{pt.uploadBtn}</button>
          <button type="button" style={btnStyle()} onClick={()=>cameraRef.current?.click()}>{pt.cameraBtn}</button>
          {imageUrl&&<button type="button" style={btnStyle(true)} onClick={analyse} disabled={loading}>{loading?pt.analyzing:pt.analyzeBtn}</button>}
        </div>
        {!imageUrl&&<p style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontStyle:'italic',marginTop:8}}>{pt.noImage}</p>}
        {phase&&<div style={{marginTop:12,fontSize:'9px',fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'0.2em',textTransform:'uppercase'}}>{interpolate(pt.phaseContext,{phase:phase.name,day})}</div>}
      </div>
      {loading&&<div style={{textAlign:'center',padding:'28px 20px',color:'rgba(255,255,255,0.5)',fontSize:12}}><div style={{fontSize:32,marginBottom:10}}>🔮</div>{pt.analyzing}</div>}
      {error&&<div style={{background:'rgba(255,80,80,0.08)',border:'1px solid rgba(255,80,80,0.2)',borderRadius:20,padding:18}}><div style={{fontSize:12,fontWeight:800,color:'#FC8181',marginBottom:4}}>{pt.errorTitle}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{error}</div></div>}
      {result&&<div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:24,padding:22}}><div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:gold,marginBottom:14}}>AI Analysis Result</div><div style={{fontSize:12,color:'rgba(255,255,255,0.78)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{result}</div></div>}
    </div>
  );
}

/* ─── Pregnancy View ─────────────────────────────────────────────────────────── */
function PregnancyView({pregnancy,s,onOpenMineral}:{pregnancy:WomanCodeBundle['pregnancy'];s:any;onOpenMineral:(m:WcMineral)=>void}) {
  const [trimIdx,setTrimIdx]=useState(0);
  const trim=pregnancy.trimesters[trimIdx];
  return (
    <div>
      <div style={{...s.glassSm,marginBottom:14}}>
        <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:'#F6AD55',marginBottom:8}}>{pregnancy.badge}</div>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.7}}>{pregnancy.intro}</p>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {pregnancy.trimesters.map((t,i)=>(
          <button key={i} type="button" onClick={()=>setTrimIdx(i)}
            style={{flex:1,padding:'10px 8px',border:trimIdx===i?`1px solid ${t.color}88`:'1px solid rgba(255,255,255,0.07)',borderRadius:40,background:trimIdx===i?`${t.color}18`:'transparent',color:trimIdx===i?t.color:'rgba(255,255,255,0.45)',fontFamily:'inherit',fontSize:'8px',fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.2s',textAlign:'center'}}>
            {t.icon} {t.name}
          </button>
        ))}
      </div>
      <div style={{...s.glass,borderColor:`${trim.color}22`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:18,fontWeight:900,color:trim.color,letterSpacing:'-0.03em'}}>{trim.name}</div>
          <div style={{fontSize:'9px',fontWeight:700,color:'rgba(255,255,255,0.4)',letterSpacing:'0.2em',textTransform:'uppercase'}}>{trim.weeks}</div>
        </div>
        <div style={{background:`${trim.color}10`,border:`1px solid ${trim.color}22`,borderRadius:14,padding:14,marginBottom:16,fontSize:11,color:'rgba(255,255,255,0.7)',lineHeight:1.7}}>
          <strong style={{color:trim.color,fontSize:'9px',letterSpacing:'0.2em',textTransform:'uppercase',display:'block',marginBottom:6}}>Hormones this trimester</strong>
          {trim.hormones}
        </div>
        <div style={s.label}>⚗ Key Minerals</div>
        <MineralGrid minerals={trim.minerals} onOpen={onOpenMineral} s={s}/>
        <div style={{marginTop:16,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.15)',borderRadius:16,padding:14}}>
          <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:s.gold,marginBottom:8}}>☽ Vedic Guidance</div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.75}}>{trim.vedic}</p>
        </div>
        <div style={{marginTop:12,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.15)',borderRadius:16,padding:14}}>
          <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:s.gold,marginBottom:8}}>✦ Moon Tonic</div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.75}}>{trim.herb}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Menopause View ─────────────────────────────────────────────────────────── */
function MenopauseView({menopause,s,onOpenMineral}:{menopause:WomanCodeBundle['menopause'];s:any;onOpenMineral:(m:WcMineral)=>void}) {
  const [stageIdx,setStageIdx]=useState(0);
  const stage=menopause.stages[stageIdx];
  return (
    <div>
      <div style={{...s.glassSm,marginBottom:14}}>
        <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:'#A78BFA',marginBottom:8}}>{menopause.badge}</div>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.7}}>{menopause.intro}</p>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {menopause.stages.map((st,i)=>(
          <button key={i} type="button" onClick={()=>setStageIdx(i)}
            style={{flex:1,minWidth:90,padding:'10px 8px',border:stageIdx===i?`1px solid ${st.color}88`:'1px solid rgba(255,255,255,0.07)',borderRadius:40,background:stageIdx===i?`${st.color}18`:'transparent',color:stageIdx===i?st.color:'rgba(255,255,255,0.45)',fontFamily:'inherit',fontSize:'8px',fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.2s',textAlign:'center'}}>
            {st.icon} {st.name}
          </button>
        ))}
      </div>
      <div style={{...s.glass,borderColor:`${stage.color}22`}}>
        <div style={{fontSize:18,fontWeight:900,color:stage.color,letterSpacing:'-0.03em',marginBottom:8}}>{stage.name}</div>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.7,marginBottom:16}}>{stage.desc}</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
          {stage.symptoms.map(sym=>(
            <span key={sym} style={{fontSize:'9px',fontWeight:700,padding:'4px 12px',borderRadius:20,background:`${stage.color}14`,color:stage.color,border:`1px solid ${stage.color}33`,letterSpacing:'0.05em'}}>{sym}</span>
          ))}
        </div>
        <div style={s.label}>⚗ Key Minerals & Foods</div>
        <MineralGrid minerals={stage.minerals} onOpen={onOpenMineral} s={s}/>
        <div style={{marginTop:16,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.15)',borderRadius:16,padding:14}}>
          <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:s.gold,marginBottom:8}}>☽ Vedic Wisdom</div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.75}}>{stage.vedic}</p>
        </div>
        <div style={{marginTop:12,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.15)',borderRadius:16,padding:14}}>
          <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:s.gold,marginBottom:8}}>✦ Rasayana Protocol</div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.75}}>{stage.herb}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────────── */
type Mode='cycle'|'pregnancy'|'menopause';

export default function WomanCodeDashboard() {
  const {t,i18n}=useTranslation();
  const bundle=useMemo(()=>t('womanCode',{returnObjects:true}) as WomanCodeBundle,[t,i18n.language]);

  // ── Live user data hooks ──
  const {phase:livePhase,cycleDay:liveCycleDay,isConfigured,settings,isLoading:cycleLoading,updateCycleSettings,isSaving}=useCyclePhase();
  const jyotish=useJyotishProfile();
  const {doshaProfile}=useAyurvedaAnalysis();

  // ── Local UI state ──
  const [mode,setMode]=useState<Mode>('cycle');
  // Day slider — initialised from live cycle day, but user can still drag it
  const [day,setDay]=useState(14);
  const [userAdjusted,setUserAdjusted]=useState(false);
  const [tab,setTab]=useState<'minerals'|'career'|'vedic'|'moonmilk'|'photo'>('minerals');
  const [modal,setModal]=useState<React.ReactNode>(null);
  const [showSetup,setShowSetup]=useState(false);

  // Sync slider to live cycle day when data loads (only if user hasn't manually adjusted)
  useEffect(()=>{
    if(isConfigured&&liveCycleDay&&!userAdjusted) {
      setDay(Math.min(Math.max(liveCycleDay,1),28));
    }
  },[isConfigured,liveCycleDay,userAdjusted]);

  // Show setup panel if not configured
  useEffect(()=>{
    if(!cycleLoading&&!isConfigured) setShowSetup(true);
  },[cycleLoading,isConfigured]);

  const phaseIdx=getPhaseIndex(day);
  const phase=bundle.phases?.[phaseIdx];

  const chartDatasetLabels=useMemo(()=>HORMONE_ORDER.map(k=>bundle.chartLabels?.[k]??k),[bundle.chartLabels]);

  const s={
    gold:'#D4AF37',
    glass:{background:'rgba(255,255,255,0.025)',backdropFilter:'blur(30px)',WebkitBackdropFilter:'blur(30px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'28px',padding:'20px',marginBottom:'12px'},
    glassSm:{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'16px'},
    label:{fontSize:'7px',fontWeight:800,letterSpacing:'0.45em',textTransform:'uppercase' as const,color:'#D4AF37',display:'block',marginBottom:'10px'},
    bodySm:{fontSize:'11px',color:'rgba(255,255,255,0.6)',lineHeight:1.65},
    tag:{display:'inline-block',fontSize:'9px',fontWeight:700,padding:'2px 9px',borderRadius:'20px',margin:'2px',background:'rgba(212,175,55,0.1)',color:'#D4AF37',border:'1px solid rgba(212,175,55,0.2)'},
  };

  const openModal=(content:React.ReactNode)=>setModal(content);
  const closeModal=()=>setModal(null);

  const openMineral=(m:WcMineral)=>openModal(
    <div>
      <div style={{fontSize:36,marginBottom:8}}>{m.icon}</div>
      <div style={{fontSize:20,fontWeight:900,color:s.gold,letterSpacing:'-0.03em',marginBottom:4}}>{m.food}</div>
      <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:16}}>{m.mineral}</div>
      <div style={{background:'rgba(212,175,55,0.07)',border:'1px solid rgba(212,175,55,0.15)',borderRadius:14,padding:14,marginBottom:14}}>
        <div style={{fontSize:'9px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:s.gold,marginBottom:6}}>{bundle.ui?.mineralModalRoleToday}</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.6}}>{m.fn}</div>
      </div>
      <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:10}}>{bundle.ui?.mineralModalBio}</div>
      <p style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.75,marginBottom:14}}>{m.bio}</p>
      <div>{m.tags.map(tag=><span key={tag} style={s.tag}>{tag}</span>)}</div>
    </div>
  );

  const openHormone=(key:HormoneKey)=>{
    const h=bundle.hormones?.[key]; if(!h) return;
    const val=Math.round(HORMONE_CURVES[key][day-1]);
    openModal(
      <div>
        <div style={{fontSize:22,fontWeight:900,color:h.color,letterSpacing:'-0.03em',marginBottom:4}}>{h.label}</div>
        <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:16}}>{h.sub}</div>
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:10,fontWeight:700,color:h.color}}>{interpolate(bundle.ui?.hormoneLevelDay??'',{day})}</span>
            <span style={{fontSize:10,fontWeight:700,color:h.color}}>{val}%</span>
          </div>
          <div style={{height:7,borderRadius:7,background:'rgba(255,255,255,0.1)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:7,background:h.color,width:`${val}%`,transition:'width 0.6s ease'}}/>
          </div>
        </div>
        {h.body.map((b,i)=><p key={i} style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.75,marginBottom:10}}><strong style={{color:'rgba(255,255,255,0.88)'}}>{b.h}: </strong>{b.t}</p>)}
        <div style={{marginTop:12}}>{h.tags.map(tag=><span key={tag} style={s.tag}>{tag}</span>)}</div>
      </div>
    );
  };

  const openVedic=(v:{icon:string;t:string;s:string})=>openModal(
    <div>
      <div style={{fontSize:44,marginBottom:12}}>{v.icon}</div>
      <div style={{fontSize:20,fontWeight:900,color:s.gold,letterSpacing:'-0.03em',marginBottom:4}}>{v.t}</div>
      <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:16}}>{interpolate(bundle.ui?.vedicModalSubtitle??'',{phase:phase?.name??''})}</div>
      <p style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>{v.s}</p>
    </div>
  );

  const openChakra=(name:string,color:string)=>openModal(
    <div>
      <div style={{fontSize:44,marginBottom:12}}>🔮</div>
      <div style={{fontSize:20,fontWeight:900,color,letterSpacing:'-0.03em',marginBottom:4}}>{name}</div>
      <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:16}}>{bundle.ui?.chakraModalSubtitle}</div>
      <p style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>{bundle.chakras?.[name]||bundle.ui?.chakraFallback}</p>
    </div>
  );

  const TABS=useMemo(()=>[
    {id:'minerals' as const,label:bundle.ui?.tabs?.minerals??'Minerals'},
    {id:'career' as const,  label:bundle.ui?.tabs?.career??'Life Sync'},
    {id:'vedic' as const,   label:bundle.ui?.tabs?.vedic??'Vedic'},
    {id:'moonmilk' as const,label:bundle.ui?.tabs?.moonmilk??'Moon Tonic'},
    {id:'photo' as const,   label:bundle.ui?.tabs?.photo??'Food Scan'},
  ],[bundle.ui?.tabs]);

  const pipLabels=bundle.ui?.pips??[];
  const modeBadges=bundle.ui?.modeBadges;
  const hasBirthData=!!(jyotish?.nakshatra&&jyotish.nakshatra!=='Rohini'); // Rohini = default/fallback

  return (
    <div style={{background:'#050505',minHeight:'100vh',fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",color:'#fff',padding:'0 0 80px'}}>
      {/* ── Header ── */}
      <div style={{textAlign:'center',padding:'28px 16px 20px'}}>
        <div style={{display:'inline-block',fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:s.gold,border:'1px solid rgba(212,175,55,0.25)',padding:'5px 16px',borderRadius:40,background:'rgba(212,175,55,0.1)',marginBottom:14}}>
          {bundle.ui?.badge}
        </div>
        <h1 style={{fontSize:'clamp(22px,5vw,36px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.05,marginBottom:10}}>
          {bundle.ui?.titleLine1}<span style={{color:s.gold}}>{bundle.ui?.titleGold}</span><br/>{bundle.ui?.titleLine2}
        </h1>
        <p style={{fontSize:12,color:'rgba(255,255,255,0.55)',maxWidth:440,margin:'0 auto',lineHeight:1.7}}>{bundle.ui?.subtitle}</p>
      </div>

      {/* ── Mode Selector ── */}
      <div style={{maxWidth:840,margin:'0 auto 18px',padding:'0 14px'}}>
        <div style={{display:'flex',gap:8}}>
          {(['cycle','pregnancy','menopause'] as Mode[]).map(m=>(
            <button key={m} type="button" onClick={()=>setMode(m)}
              style={{flex:1,padding:'12px 8px',borderRadius:40,fontFamily:'inherit',fontSize:'9px',fontWeight:800,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.25s',textAlign:'center',border:mode===m?'1px solid rgba(212,175,55,0.6)':'1px solid rgba(255,255,255,0.07)',background:mode===m?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.02)',color:mode===m?s.gold:'rgba(255,255,255,0.45)'}}>
              {modeBadges?.[m]??m}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:840,margin:'0 auto',padding:'0 14px'}}>

        {/* ── CYCLE MODE ── */}
        {mode==='cycle'&&(
          <>
            {/* Cycle Setup */}
            {showSetup&&(
              <CycleSetupPanel
                onSave={(d,cl,bd)=>{updateCycleSettings(d,cl,bd);setShowSetup(false);setUserAdjusted(false);}}
                gold={s.gold}
                isSaving={isSaving}
                existingSettings={settings}
              />
            )}

            {/* If configured, show a small "edit" chip */}
            {isConfigured&&!showSetup&&(
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,padding:'10px 16px',background:'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.15)',borderRadius:16}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>
                  <span style={{color:s.gold,fontWeight:800}}>Day {liveCycleDay}</span> of your cycle • {livePhase?.name}
                  {settings?.lastPeriodDate&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:10,marginLeft:8}}>since {new Date(settings.lastPeriodDate).toLocaleDateString()}</span>}
                </div>
                <button type="button" onClick={()=>setShowSetup(true)}
                  style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:'4px 8px'}}>
                  Edit ›
                </button>
              </div>
            )}

            {/* Birth data + Jyotish banner */}
            <BirthDataPanel gold={s.gold} jyotish={jyotish} hasBirthData={hasBirthData}/>
            {(jyotish?.nakshatra||doshaProfile?.primary)&&(
              <JyotishDoshaBanner jyotish={jyotish} doshaProfile={doshaProfile} phase={phase} gold={s.gold}/>
            )}

            {/* Day slider */}
            <div style={s.glass}>
              <span style={s.label}>{bundle.ui?.sliderLabel}</span>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:14}}>
                <div style={{fontSize:52,fontWeight:900,letterSpacing:'-0.05em',color:s.gold,lineHeight:1,minWidth:72}}>{day}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:17,fontWeight:800,letterSpacing:'-0.02em',marginBottom:4}}>{phase?.name}</div>
                  <div style={{fontSize:'9px',fontWeight:700,letterSpacing:'0.25em',textTransform:'uppercase',color:'rgba(255,255,255,0.38)'}}>{phase?.dosha}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:22}}>{phase?.icon}</div>
                  <div style={{fontSize:'8px',fontWeight:700,color:phase?.color,letterSpacing:'0.2em',textTransform:'uppercase',marginTop:2}}>{phase?.season}</div>
                </div>
              </div>
              <input type="range" min={1} max={28} value={day} aria-label={bundle.ui?.sliderLabel}
                onChange={e=>{setDay(+e.target.value);setUserAdjusted(true);}}
                style={{width:'100%',accentColor:s.gold,cursor:'pointer',height:4}}/>
              {isConfigured&&!userAdjusted&&(
                <div style={{fontSize:'9px',color:'rgba(212,175,55,0.6)',textAlign:'center',marginTop:4,letterSpacing:'0.1em'}}>
                  ✦ Live — Day {liveCycleDay} of your personal cycle
                </div>
              )}
              {userAdjusted&&(
                <button type="button" onClick={()=>{setUserAdjusted(false);setDay(Math.min(Math.max(liveCycleDay||14,1),28));}}
                  style={{display:'block',margin:'4px auto 0',fontSize:'8px',fontWeight:700,color:'rgba(255,255,255,0.35)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.1em'}}>
                  ↩ Back to live day {liveCycleDay}
                </button>
              )}
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                {pipLabels.map((l,i)=>(
                  <button key={i} type="button" onClick={()=>{setDay(i===0?3:i===1?9:i===2?14:22);setUserAdjusted(true);}}
                    style={{fontSize:'8px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:phaseIdx===i?s.gold:'rgba(255,255,255,0.3)',cursor:'pointer',transition:'color 0.3s',background:'none',border:'none',padding:0,fontFamily:'inherit'}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Hormone chart */}
            <div style={s.glass}>
              <span style={s.label}>{bundle.ui?.chartLabel}</span>
              <HormoneChart currentDay={day} chartDatasetLabels={chartDatasetLabels}/>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>
                {HORMONE_ORDER.map(key=>{
                  const h=bundle.hormones?.[key]; if(!h) return null;
                  return (
                    <button key={key} type="button" onClick={()=>openHormone(key)}
                      style={{padding:'7px 14px',borderRadius:40,fontSize:10,fontWeight:700,letterSpacing:'0.05em',cursor:'pointer',background:`${h.color}18`,color:h.color,border:`1px solid ${h.color}44`,fontFamily:'inherit',transition:'transform 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.05)';}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';}}>
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {TABS.map(tb=>(
                <button key={tb.id} type="button" onClick={()=>setTab(tb.id)}
                  style={{flex:1,minWidth:60,padding:'10px 6px',border:tab===tb.id?'1px solid rgba(212,175,55,0.5)':'1px solid rgba(255,255,255,0.07)',borderRadius:40,background:tab===tb.id?'rgba(212,175,55,0.1)':'transparent',color:tab===tb.id?s.gold:'rgba(255,255,255,0.55)',fontFamily:'inherit',fontSize:'8px',fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',textAlign:'center',transition:'all 0.2s'}}>
                  {tb.label}
                </button>
              ))}
            </div>

            {tab==='minerals'&&phase&&(
              <div>
                <div style={{...s.glassSm,marginBottom:12}}>
                  <span style={s.label}>⟁ {phase.minHeader}</span>
                  <p style={s.bodySm}>{phase.minIntro}</p>
                </div>
                <MineralGrid minerals={phase.minerals} onOpen={openMineral} s={s}/>
              </div>
            )}
            {tab==='career'&&phase&&(
              <div style={s.glass}>
                <span style={s.label}>{bundle.ui?.careerSectionLabel}</span>
                {phase.career.map((c,i)=>(
                  <div key={i} style={{display:'flex',gap:14,padding:'14px 0',borderBottom:i<phase.career.length-1?'1px solid rgba(255,255,255,0.08)':'none'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:s.gold,flexShrink:0,marginTop:5}}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:800,color:'#fff',marginBottom:4}}>{c.t}</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.6}}>{c.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab==='vedic'&&phase&&(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(175px, 1fr))',gap:10,marginBottom:12}}>
                  {phase.vedic.map((v,i)=>(
                    <div key={i} role="button" tabIndex={0} onClick={()=>openVedic(v)} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ') openVedic(v);}}
                      style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:22,padding:18,cursor:'pointer',transition:'all 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(212,175,55,0.4)';e.currentTarget.style.transform='translateY(-2px)';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.transform='translateY(0)';}}>
                      <div style={{fontSize:26,marginBottom:10}}>{v.icon}</div>
                      <div style={{fontSize:12,fontWeight:800,color:'#fff',marginBottom:4}}>{v.t}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.55)',lineHeight:1.55}}>{v.s}</div>
                    </div>
                  ))}
                </div>
                <div style={s.glassSm}>
                  <span style={s.label}>{bundle.ui?.chakraSectionLabel}</span>
                  <p style={{...s.bodySm,marginBottom:12}}>{phase.chakraText}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {phase.chakras.map(c=>(
                      <button key={c.n} type="button" onClick={()=>openChakra(c.n,c.c)}
                        style={{padding:'7px 14px',borderRadius:40,fontSize:'9px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',background:`${c.c}18`,color:c.c,border:`1px solid ${c.c}44`,transition:'transform 0.2s',fontFamily:'inherit'}}
                        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.05)';}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';}}>
                        {c.n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab==='moonmilk'&&phase&&(
              <div style={{background:'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.02))',border:'1px solid rgba(212,175,55,0.25)',borderRadius:28,padding:24}}>
                <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:s.gold,marginBottom:14}}>{bundle.ui?.moonMilkLabelPrefix}{phase.name}</div>
                <div style={{fontSize:22,fontWeight:900,letterSpacing:'-0.03em',color:s.gold,marginBottom:4}}>{phase.herb.name}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginBottom:20}}>{phase.herb.tl}</div>
                {phase.herb.steps.map((step,i)=>(
                  <div key={i} style={{display:'flex',gap:12,marginBottom:10,alignItems:'flex-start'}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(212,175,55,0.12)',border:'1px solid rgba(212,175,55,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:800,color:s.gold,flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.65,paddingTop:3}}>{step}</div>
                  </div>
                ))}
              </div>
            )}
            {tab==='photo'&&(
              <FoodPhotoScanner phase={phase} day={day} ui={bundle.ui} gold={s.gold}/>
            )}
          </>
        )}

        {mode==='pregnancy'&&bundle.pregnancy&&(
          <PregnancyView pregnancy={bundle.pregnancy} s={s} onOpenMineral={openMineral}/>
        )}
        {mode==='menopause'&&bundle.menopause&&(
          <MenopauseView menopause={bundle.menopause} s={s} onOpenMineral={openMineral}/>
        )}
      </div>

      {modal?<Modal content={modal} onClose={closeModal} closeLabel={bundle.ui?.modalCloseAria??'Close'}/>:null}
    </div>
  );
}
