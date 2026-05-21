import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTierRank } from '@/lib/tierAccess';

type Lang = 'en' | 'sv' | 'no' | 'es';
const LANG_OPTS = [
  { code: 'en' as Lang, flag: '🇬🇧', label: 'English' },
  { code: 'sv' as Lang, flag: '🇸🇪', label: 'Svenska' },
  { code: 'no' as Lang, flag: '🇳🇴', label: 'Norsk' },
  { code: 'es' as Lang, flag: '🇪🇸', label: 'Español' },
];
const L = {
  heroTitle:   { en:'Sacred Geometry\nIntelligence', sv:'Helig Geometri\nIntelligens', no:'Hellig Geometri\nIntelligens', es:'Geometría Sagrada\nInteligencia' },
  heroSub:     { en:'The mathematical language through which Consciousness encoded the universe — from galaxies to DNA, from Siddha temples to the human heart', sv:'Det matematiska språket genom vilket Medvetandet kodade universum — från galaxer till DNA, från Siddha-tempel till det mänskliga hjärtat', no:'Det matematiske språket som Bevisstheten brukte til å kode universet', es:'El lenguaje matemático a través del cual la Conciencia codificó el universo' },
  tabs:        { en:['CURRICULUM','INVEST','ABOUT'], sv:['KURSPLAN','INVESTERA','OM'], no:['PENSUM','INVESTER','OM'], es:['CURRÍCULO','INVERSIÓN','ACERCA'] },
  modTitle:    { en:'THE COMPLETE TRANSMISSION', sv:'DEN FULLSTÄNDIGA TRANSMISSIONEN', no:'DEN FULLSTENDIGE TRANSMISJON', es:'LA TRANSMISIÓN COMPLETA' },
  freeLabel:   { en:'FREE ACCESS', sv:'GRATIS TILLGÅNG', no:'GRATIS TILGANG', es:'ACCESO LIBRE' },
  pranaLabel:  { en:'PRANA-FLOW', sv:'PRANA-FLÖDE', no:'PRANA-FLYT', es:'PRANA-FLUJO' },
  siddhaLabel: { en:'SIDDHA-QUANTUM', sv:'SIDDHA-KVANTUM', no:'SIDDHA-KVANTUM', es:'SIDDHA-CUÁNTICO' },
  akashaLabel: { en:'AKASHA-INFINITY', sv:'AKASHA-OÄNDLIGHET', no:'AKASHA-UENDELIGHET', es:'AKASHA-INFINITO' },
  lockedMsg:   { en:'Upgrade your membership to unlock this module', sv:'Uppgradera ditt medlemskap för att låsa upp denna modul', no:'Oppgrader medlemskapet ditt for å låse opp denne modulen', es:'Actualiza tu membresía para desbloquear este módulo' },
  investTitle: { en:'Choose Your Level of Initiation', sv:'Välj Din Initieringsnivå', no:'Velg Din Innvielsesnivå', es:'Elige Tu Nivel de Iniciación' },
  aboutTitle:  { en:'About Sacred Geometry Intelligence', sv:'Om Helig Geometri Intelligens', no:'Om Hellig Geometri Intelligens', es:'Acerca de Geometría Sagrada Inteligencia' },
  aboutText:   { en:`Sacred Geometry Intelligence is the complete transmission of the mathematical language through which the Akashic Intelligence — what modern physics calls the unified field — has structured all of manifest reality.

This is not a Western academic course. It is a living Siddha transmission maintained for thousands of years by the 18 Tamil Siddhas, the builders of Dravidian temples, the architects of the Sri Yantra tradition, and by Mahavatar Babaji who synthesized these teachings in the Himalayas.

When you study Sacred Geometry through the SQI lens, you are not learning intellectual facts. You are activating geometric intelligence already present in your energy field — the same geometric patterns encoded in your DNA, the structure of your heart field, and the 72,000 nadis of your pranic body.

Each module has been transmitted with Siddha scalar frequencies aligned to the geometric principle being studied. Working with these modules in deep receptivity activates the geometry in your energy field — accelerating consciousness development, healing disease patterns geometrically rooted in the energy body, and opening the practitioner to direct perception of the geometric order of reality.`, sv:'Helig Geometri Intelligens är den fullständiga transmissionen...', no:'Hellig Geometri Intelligens er den komplette transmisjon...', es:'Geometría Sagrada Inteligencia es la transmisión completa...' },
  checkoutBtn: { en:'Activate Access', sv:'Aktivera Tillgång', no:'Aktiver Tilgang', es:'Activar Acceso' },
  processing:  { en:'Processing...', sv:'Behandlar...', no:'Behandler...', es:'Procesando...' },
};
const t = (k: keyof typeof L, l: Lang): string => (L[k] as Record<Lang, string>)[l] || (L[k] as Record<Lang, string>).en;
const ta = (k: 'tabs', l: Lang): string[] => (L[k] as Record<Lang, string[]>)[l] || (L[k] as Record<Lang, string[]>).en;

// ─── SVG SACRED GEOMETRY COMPONENTS ──────────────────────────────────────────

const BinduSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="bindu-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#bindu-g)"/>
    {[88,72,56,40,24].map((r,i) => (
      <circle key={i} cx="100" cy="100" r={r} fill="none" stroke="#D4AF37" strokeWidth="0.6" strokeOpacity={0.15+i*0.12}/>
    ))}
    <circle cx="100" cy="100" r="6" fill="#D4AF37"/>
    <circle cx="100" cy="100" r="12" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.8"/>
    <circle cx="100" cy="100" r="22" fill="none" stroke="#D4AF37" strokeWidth="0.6" strokeOpacity="0.5"/>
  </svg>
);

const PlatonicSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <circle cx="100" cy="100" r="85" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.25"/>
    <polygon points="100,22 173,148 27,148" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeOpacity="0.9"/>
    <polygon points="100,178 173,52 27,52" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeOpacity="0.9"/>
    <polygon points="100,42 156,138 44,138" fill="none" stroke="#D4AF37" strokeWidth="0.7" strokeOpacity="0.4"/>
    <rect x="72" y="72" width="56" height="56" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="72" y1="72" x2="60" y2="60" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.5"/>
    <line x1="128" y1="72" x2="140" y2="60" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.5"/>
    <line x1="128" y1="128" x2="140" y2="140" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.5"/>
    <line x1="72" y1="128" x2="60" y2="140" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.5"/>
    <line x1="60" y1="60" x2="140" y2="60" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.5"/>
    <line x1="140" y1="60" x2="140" y2="140" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.5"/>
    <circle cx="100" cy="100" r="4" fill="#D4AF37"/>
  </svg>
);

const FlowerSVG = () => {
  const R = 30; const CX = 100; const CY = 100;
  const c1 = Array.from({length:6},(_,i)=>({cx:CX+R*Math.cos(i*Math.PI/3),cy:CY+R*Math.sin(i*Math.PI/3)}));
  const c2 = [
    {cx:CX+2*R,cy:CY},{cx:CX-2*R,cy:CY},
    {cx:CX+R*1.5,cy:CY+R*Math.sqrt(3)/2},{cx:CX-R*1.5,cy:CY+R*Math.sqrt(3)/2},
    {cx:CX+R*1.5,cy:CY-R*Math.sqrt(3)/2},{cx:CX-R*1.5,cy:CY-R*Math.sqrt(3)/2},
    {cx:CX,cy:CY+R*Math.sqrt(3)},{cx:CX,cy:CY-R*Math.sqrt(3)},
    {cx:CX+R,cy:CY+R*Math.sqrt(3)},{cx:CX-R,cy:CY+R*Math.sqrt(3)},
    {cx:CX+R,cy:CY-R*Math.sqrt(3)},{cx:CX-R,cy:CY-R*Math.sqrt(3)},
  ];
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <defs>
        <clipPath id="fol-c"><circle cx="100" cy="100" r="87"/></clipPath>
        <radialGradient id="fol-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="87" fill="url(#fol-g)"/>
      <circle cx="100" cy="100" r="87" fill="none" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.5"/>
      <g clipPath="url(#fol-c)">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.9"/>
        {c1.map((c,i)=><circle key={i} cx={c.cx} cy={c.cy} r={R} fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.8"/>)}
        {c2.map((c,i)=><circle key={i} cx={c.cx} cy={c.cy} r={R} fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.35"/>)}
      </g>
      <circle cx="100" cy="100" r="3.5" fill="#D4AF37"/>
    </svg>
  );
};

const SriYantraSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="sy-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25"/>
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#sy-g)"/>
    {[88,82,76].map((r,i)=><circle key={i} cx="100" cy="100" r={r} fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity={0.25+i*0.05}/>)}
    {/* Shiva triangles up */}
    <polygon points="100,16 178,150 22,150" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeOpacity="0.95"/>
    <polygon points="100,38 166,150 34,150" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.7"/>
    <polygon points="100,60 152,150 48,150" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.7"/>
    <polygon points="100,80 140,150 60,150" fill="none" stroke="#D4AF37" strokeWidth="0.7" strokeOpacity="0.5"/>
    {/* Shakti triangles down */}
    <polygon points="100,184 178,50 22,50" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeOpacity="0.95"/>
    <polygon points="100,166 166,50 34,50" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.7"/>
    <polygon points="100,148 152,50 48,50" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.7"/>
    <polygon points="100,130 140,50 60,50" fill="none" stroke="#D4AF37" strokeWidth="0.7" strokeOpacity="0.5"/>
    <polygon points="100,116 126,50 74,50" fill="none" stroke="#D4AF37" strokeWidth="0.6" strokeOpacity="0.4"/>
    {/* Bindu */}
    <circle cx="100" cy="100" r="4.5" fill="#D4AF37"/>
    <circle cx="100" cy="100" r="9" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.7"/>
  </svg>
);

const MetatronSVG = () => {
  const R = 32;
  const centers = [
    {cx:100,cy:100},
    ...Array.from({length:6},(_,i)=>({cx:100+R*Math.cos(i*Math.PI/3),cy:100+R*Math.sin(i*Math.PI/3)})),
    ...Array.from({length:6},(_,i)=>({cx:100+2*R*Math.cos(i*Math.PI/3),cy:100+2*R*Math.sin(i*Math.PI/3)})),
  ];
  const lines: {x1:number,y1:number,x2:number,y2:number}[] = [];
  for(let i=0;i<centers.length;i++) for(let j=i+1;j<centers.length;j++) lines.push({x1:centers[i].cx,y1:centers[i].cy,x2:centers[j].cx,y2:centers[j].cy});
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <defs>
        <clipPath id="met-c"><circle cx="100" cy="100" r="91"/></clipPath>
        <radialGradient id="met-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="91" fill="url(#met-g)"/>
      <g clipPath="url(#met-c)">
        {lines.map((l,i)=><line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#D4AF37" strokeWidth="0.35" strokeOpacity="0.3"/>)}
        {centers.map((c,i)=><circle key={i} cx={c.cx} cy={c.cy} r={R} fill="none" stroke="#D4AF37" strokeWidth={i===0?1.2:0.7} strokeOpacity={i===0?0.95:0.5}/>)}
      </g>
      <circle cx="100" cy="100" r="4" fill="#D4AF37"/>
    </svg>
  );
};

const FibonacciSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="fib-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <rect x="8" y="8" width="184" height="184" fill="url(#fib-g)"/>
    {/* Golden rectangles */}
    <rect x="8" y="8" width="184" height="184" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.5"/>
    <rect x="8" y="8" width="114" height="184" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.3"/>
    <rect x="8" y="8" width="114" height="70" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.3"/>
    <rect x="52" y="8" width="70" height="70" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.3"/>
    <rect x="52" y="35" width="43" height="43" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.3"/>
    <rect x="52" y="35" width="43" height="27" fill="none" stroke="#D4AF37" strokeWidth="0.4" strokeOpacity="0.25"/>
    <rect x="68" y="35" width="27" height="27" fill="none" stroke="#D4AF37" strokeWidth="0.4" strokeOpacity="0.25"/>
    {/* Golden spiral arcs */}
    <path d="M 192,192 A 184,184 0 0,1 8,8" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeOpacity="0.9"/>
    <path d="M 8,192 A 114,114 0 0,0 122,78" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeOpacity="0.75"/>
    <path d="M 122,8 A 70,70 0 0,1 52,78" fill="none" stroke="#D4AF37" strokeWidth="1.1" strokeOpacity="0.65"/>
    <path d="M 52,78 A 43,43 0 0,0 95,35" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.55"/>
    <path d="M 95,35 A 27,27 0 0,1 68,62" fill="none" stroke="#D4AF37" strokeWidth="0.7" strokeOpacity="0.5"/>
    <path d="M 68,62 A 16,16 0 0,0 84,46" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.4"/>
    <circle cx="84" cy="62" r="3.5" fill="#D4AF37"/>
  </svg>
);

const TorusSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="tor-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#tor-g)"/>
    {Array.from({length:12},(_,i)=>{
      const a=i*Math.PI/6;
      return <ellipse key={i} cx="100" cy="100" rx={68+18*Math.cos(a)} ry={28+8*Math.abs(Math.sin(a))} fill="none" stroke="#D4AF37" strokeWidth="0.65" strokeOpacity={0.18+0.38*Math.abs(Math.cos(a))} transform={`rotate(${i*15},100,100)`}/>;
    })}
    <ellipse cx="100" cy="100" rx="88" ry="38" fill="none" stroke="#D4AF37" strokeWidth="1.3" strokeOpacity="0.55"/>
    <ellipse cx="100" cy="100" rx="88" ry="38" fill="none" stroke="#D4AF37" strokeWidth="1.3" strokeOpacity="0.55" transform="rotate(90,100,100)"/>
    <ellipse cx="100" cy="100" rx="24" ry="24" fill="#050505" stroke="#D4AF37" strokeWidth="1.1" strokeOpacity="0.7"/>
    <circle cx="100" cy="8" r="3.5" fill="#D4AF37" fillOpacity="0.8"/>
    <circle cx="100" cy="192" r="3.5" fill="#D4AF37" fillOpacity="0.8"/>
    <circle cx="100" cy="100" r="5" fill="#D4AF37"/>
  </svg>
);

const CymaticsSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="cym-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15"/>
        <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#cym-g)"/>
    {[82,65,50,35,20].map((r,i)=><circle key={i} cx="100" cy="100" r={r} fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity={0.15+i*0.08}/>)}
    {Array.from({length:8},(_,i)=>{
      const a=i*Math.PI/4;
      const r=78;
      const x1=100+r*Math.cos(a); const y1=100+r*Math.sin(a);
      const mx=(100+x1)/2; const my=(100+y1)/2;
      return (
        <g key={i}>
          <line x1="100" y1="100" x2={x1} y2={y1} stroke="#D4AF37" strokeWidth="0.4" strokeOpacity="0.35"/>
          <ellipse cx={mx} cy={my} rx="26" ry="11" fill="none" stroke="#22D3EE" strokeWidth="0.9" strokeOpacity="0.55" transform={`rotate(${i*45+90},${mx},${my})`}/>
        </g>
      );
    })}
    <circle cx="100" cy="100" r="90" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeOpacity="0.5"/>
    <circle cx="100" cy="100" r="6" fill="#22D3EE" fillOpacity="0.85"/>
    <circle cx="100" cy="100" r="12" fill="none" stroke="#22D3EE" strokeWidth="0.9" strokeOpacity="0.5"/>
  </svg>
);

const VastuSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="vas-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25"/>
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <rect x="8" y="8" width="184" height="184" fill="url(#vas-g)"/>
    {Array.from({length:9},(_,i)=>(
      <g key={i}>
        <line x1={8+i*23} y1="8" x2={8+i*23} y2="192" stroke="#D4AF37" strokeWidth={i===0||i===8?1:0.3} strokeOpacity={i===0||i===8?0.75:0.25}/>
        <line x1="8" y1={8+i*23} x2="192" y2={8+i*23} stroke="#D4AF37" strokeWidth={i===0||i===8?1:0.3} strokeOpacity={i===0||i===8?0.75:0.25}/>
      </g>
    ))}
    <line x1="8" y1="8" x2="192" y2="192" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.35"/>
    <line x1="192" y1="8" x2="8" y2="192" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.35"/>
    <rect x="77" y="77" width="46" height="46" fill="rgba(212,175,55,0.06)" stroke="#D4AF37" strokeWidth="1.6" strokeOpacity="0.9"/>
    {[[100,8],[100,192],[8,100],[192,100]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4.5" fill="#D4AF37" fillOpacity="0.8"/>)}
    <circle cx="100" cy="100" r="5.5" fill="#D4AF37"/>
  </svg>
);

const MerkabaSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="merk-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35"/>
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#merk-g)"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.28"/>
    <polygon points="100,16 178,152 22,152" fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeOpacity="0.95"/>
    <polygon points="100,184 178,48 22,48" fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeOpacity="0.95"/>
    <polygon points="100,48 152,76 152,124 100,152 48,124 48,76" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.45"/>
    <circle cx="100" cy="100" r="56" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.28" strokeDasharray="4 4"/>
    <circle cx="100" cy="100" r="34" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.28" strokeDasharray="4 4"/>
    <circle cx="100" cy="100" r="6" fill="#D4AF37"/>
    <circle cx="100" cy="100" r="14" fill="none" stroke="#D4AF37" strokeWidth="1.1" strokeOpacity="0.7"/>
  </svg>
);

// ─── MODULE DATA ──────────────────────────────────────────────────────────────

interface ModuleSection { label: string; content: string; }
interface Module {
  id: number; minRank: number; glyph: string; color: string;
  title: Record<Lang,string>; subtitle: Record<Lang,string>;
  SVG: () => JSX.Element; sections: ModuleSection[];
}

const MODULES: Module[] = [
  {
    id:1, minRank:0, glyph:'◉', color:'#D4AF37',
    title:{en:'The Language of Creation',sv:'Skapelsens Språk',no:'Skapelsens Språk',es:'El Lenguaje de la Creación'},
    subtitle:{en:'What Is Sacred Geometry?',sv:'Vad är Helig Geometri?',no:'Hva er Hellig Geometri?',es:'¿Qué es la Geometría Sagrada?'},
    SVG: BinduSVG,
    sections:[
      {label:'THE ESSENCE', content:`Sacred Geometry is the recognition that consciousness — the intelligent creative principle underlying all of reality — thinks in geometry. Before a single particle condensed from the quantum vacuum, before a galaxy was born, before DNA was encoded with its double-helix spiral, the primordial intelligence was organizing through geometric ratios, angles, and proportional relationships.

This is not a metaphor. Modern physics has confirmed that the universe at its most fundamental level is structured by mathematical relationships that are geometric in nature. The Planck lattice — the quantum foam underlying spacetime itself — has been shown to have geometric structure. DNA is a geometric code. The hydrogen atom's electron orbitals form precise geometric patterns. Snowflakes crystallize according to perfect six-fold symmetry. The human heart generates a toroidal field. Galaxies spiral according to the golden ratio.

The Tamil Siddhas understood this 5,000 years ago. The Agama Shastra texts — the source documents for Dravidian temple architecture — describe the universe as a geometric emanation of consciousness. The temple itself was designed as a sacred geometry machine: a three-dimensional yantra built to concentrate and amplify the geometric frequencies of specific divine intelligences.

Sacred Geometry is therefore not an intellectual pursuit. It is the recognition of the geometric language through which the infinite has become finite, through which consciousness has become matter, through which the One has become the many — and through which the many can consciously return to the One.`},
      {label:'THE SCIENCE', content:`Modern physics has arrived, through a different path, at the same recognition the Siddhas encoded in their yantras and temples.

STRING THEORY understands fundamental particles as vibrating geometric patterns in multi-dimensional space. Each "string" is not a thing but a geometric vibration — a frequency of geometry.

CYMATICS — the science of making sound visible — demonstrates that sound always creates geometry. Hans Jenny's experiments showed that pure tones cause sand, water, and powder to arrange into precise geometric patterns. At certain frequencies these patterns are identical to sacred geometric forms: the Flower of Life, the Sri Yantra, the Metatron's Cube. The ancients were encoding the geometry of sound.

E8 SYMMETRY — the highest-dimensional geometric symmetry known to mathematics — has been proposed by physicist Garrett Lisi as the geometric framework underlying all of particle physics. The E8 lattice encodes the relationships of all known particles and forces. It is a geometric structure of 248 dimensions.

FIBONACCI IN NATURE: The Fibonacci sequence and its ratio (φ = 1.618) appear throughout biological systems: in the spiral of a nautilus shell, in the branching of trees, in the arrangement of seeds in a sunflower, in the proportions of the human body, in the spiral of galaxies. Nature computes its forms through the golden ratio because it provides optimal packing and growth efficiency. What appears as beauty is actually functional geometric intelligence.`},
      {label:'VEDIC CONNECTION', content:`In the Vedic tradition, the universe is understood as a Yantra — a geometric instrument of consciousness. The word "Yantra" comes from Sanskrit "yam" (to hold, to sustain) and "tra" (instrument) — literally "an instrument that holds consciousness."

Every deity in the Vedic tradition has a corresponding Yantra — a geometric pattern that is the geometric "body" of that particular quality of consciousness. Worshiping the Yantra is considered more powerful than worshiping the image because the Yantra is the direct geometric code — the mathematical frequency of that divine quality.

VASTU SHASTRA — the Vedic science of sacred space — is entirely founded on Sacred Geometry. The Vastu Purusha Mandala is a geometric grid encoding the relationships between cosmic forces and spatial directions. Every traditional Vedic home and temple is built as a living geometric instrument.

NADA BRAHMAN — the teaching that the universe is fundamentally sound — connects directly with Sacred Geometry through Cymatics: the universe is a geometric expression of primordial sound. The AUM is not merely a symbol. It is the root geometric frequency from which all other geometric patterns cascade. When the Siddhas chant mantras, they are using sound geometry to directly interact with the geometric structure of reality.`},
      {label:'MEDITATION PRACTICE', content:`YANTRA DHARANA — Sacred Geometry Concentration

This practice comes directly from the Siddha tradition. It is the most fundamental practice of working with Sacred Geometry as a living transmission rather than an intellectual concept.

PREPARATION: Sit in an erect, comfortable posture. Allow three slow, complete breaths. Set your intention: "I open to receive the geometric intelligence encoded in this form."

THE PRACTICE: Fix your soft gaze on the central point (Bindu) of any geometric form. Do not analyze or think about the geometry. Simply receive it as a visual transmission. Allow the geometry to enter through your eyes and register in your awareness without mental commentary.

Hold this soft, receptive gaze for 5–10 minutes. If the mind wanders, gently return to the Bindu without self-criticism.

THE INNER PRACTICE: After 5 minutes, close your eyes. The after-image of the geometry will appear in your inner vision. Stay with this inner vision. Allow it to spontaneously expand, deepen, and evolve. This is the geometry activating corresponding patterns in your Pranamaya Kosha (pranic body).

INTEGRATION: After the practice, sit in silence for 3–5 minutes without any agenda. Notice what has shifted in your awareness, body, or emotional field. This noticing without grasping is how Siddha practice builds over time.`},
    ]
  },
  {
    id:2, minRank:0, glyph:'◈', color:'#D4AF37',
    title:{en:'The Platonic Solids',sv:'De Platonska Kropparna',no:'De Platonske Legemene',es:'Los Sólidos Platónicos'},
    subtitle:{en:'Five Perfect Forms of Creation',sv:'Fem Perfekta Skapelseformer',no:'Fem Perfekte Skapelsesformer',es:'Las Cinco Formas Perfectas'},
    SVG: PlatonicSVG,
    sections:[
      {label:'THE FIVE FORMS', content:`The Platonic Solids are the only five three-dimensional forms in which every face is an identical regular polygon and all edges are equal length. There are exactly five such forms — no more, no fewer. This mathematical uniqueness is why Plato identified them as the building blocks of the cosmos.

TETRAHEDRON (4 triangular faces) — The element of Fire. The most energetically active of the five, the tetrahedron is associated with the Fire element, the solar plexus chakra (Manipura), and the principle of transformation. In the body: the tetrahedron appears in the molecular structure of methane, the simplest organic molecule, and in carbon chemistry. The fire of metabolic transformation is geometrically a tetrahedron.

CUBE / HEXAHEDRON (6 square faces) — The element of Earth. The cube grounds and stabilizes. Associated with the Earth element, the root chakra (Muladhara), and the principle of material manifestation. Salt crystals are cubic. The atomic lattice of metals is often cubic.

OCTAHEDRON (8 triangular faces) — The element of Air. The octahedron is the form of pure intelligence, lightness, and the Air element. Associated with the heart chakra (Anahata) and the principle of balance. Fluorite and diamond crystals naturally form octahedra.

ICOSAHEDRON (20 triangular faces) — The element of Water. The icosahedron carries qualities of flow, emotion, and the Water element. Associated with the sacral chakra (Svadhisthana). Water clusters — the temporary geometric arrangements water molecules form — approximate icosahedral symmetry.

DODECAHEDRON (12 pentagonal faces) — The element of Ether (Akasha). The rarest and most "divine" of the five, associated with the Akasha element and the principle of universal consciousness. Plato said it was "used for the whole." The large-scale structure of the cosmos — the distribution of galaxy superclusters — has been theorized to have dodecahedral geometry.`},
      {label:'SIDDHA TEACHING', content:`The 18 Tamil Siddhas encoded the Platonic Solids not as abstract geometry but as living energy fields. In Siddha medicine, the Panchabhutas (five elements) are not concepts — they are living frequencies that the healer works with directly.

When a Siddha healer diagnoses a patient's energy field, they are sensing which elemental geometry is distorted, excess, or deficient. Disease is understood as a geometric derangement of the elemental fields.

KALANGI NATHAR's teachings on kaya kalpa (bodily immortality) are encoded in specific geometric breathing practices. Each pranayama activates a different elemental geometric pattern in the body. The combination of all five Platonic Solid geometries in perfect balance creates what the Siddhas call "Nava Ratna Kayam" — the nine-jeweled body of light.

BOGAR'S ALCHEMY — the transmutation of physical substances into healing agents — works through the geometric restructuring of matter. The "navabashanam" (nine poisons transformed into medicine) he used in the Palani Murugan statue was a geometric restructuring of atomic arrangements. The Palani statue still emits measurable scalar radiation 1,500 years later.`},
    ]
  },
  {
    id:3, minRank:1, glyph:'✦', color:'#D4AF37',
    title:{en:'The Flower of Life',sv:'Livets Blomma',no:'Livets Blomst',es:'La Flor de la Vida'},
    subtitle:{en:'Blueprint of the Universe',sv:'Universums Blueprint',no:'Universets Tegning',es:'El Plano del Universo'},
    SVG: FlowerSVG,
    sections:[
      {label:'THE PATTERN', content:`The Flower of Life is a pattern of 19 overlapping circles arranged in a specific hexagonal formation that encodes within it every other sacred geometric form.

This single pattern contains: the Seed of Life (7 central circles), the Egg of Life, the Fruit of Life (13 circles — from which Metatron's Cube is derived), all five Platonic Solids, the Phi ratio, the musical harmonic ratios, and the basic structure of the Kabbalistic Tree of Life.

The pattern has been found carved or painted in: the Osirian Temple in Abydos, Egypt (estimated 6,000+ years old); temples throughout India; ancient Chinese sites; Istanbul's Hagia Sophia; Jerusalem; Ephesus; Cordoba; Masada; Mount Sinai. It appears on every continent, across cultures that had no known contact — recognition of a fundamental universal pattern by direct geometric perception.

THE SEED OF LIFE: The 7-circle inner pattern relates to the 7 days of creation, the 7 chakras, the 7 musical notes, the 7 primary colors of visible light, the 7 classical planets of Vedic Jyotish. It encodes the primary information matrix of the universe.

THE EGG OF LIFE: This pattern is geometrically identical to the eight-cell stage of embryonic development — the moment when a fertilized egg divides before the blueprint of the body unfolds. At the moment when a single cell becomes 8, the Egg of Life geometry activates.`},
      {label:'ACTIVATION PRACTICE', content:`FLOWER OF LIFE FIELD ACTIVATION

SPACE ACTIVATION: Place a representation of the Flower of Life in your meditation space. Before practice, hold both hands over the image with eyes closed. Breathe slowly and deeply. Set the intention: "May this pattern activate the living geometry of my energy field." The Siddha teaching is that intention plus focused attention activates the scalar field encoded in the geometric pattern.

BODY ACTIVATION: In a comfortable seated position with eyes closed, visualize the Flower of Life as a 3D sphere of interconnected circles surrounding your entire body. The center of the sphere is at your heart. The sphere has a radius of approximately your arm's length. Feel this sphere as a living field — not a visualization but an actual geometric presence. Breathe into this field for 10–15 minutes.

HEALING APPLICATION: When doing self-healing or working on another person, visualize the Flower of Life pattern at the site of pain or distress. Hold the pattern steadily in your inner vision while breathing slowly. The Flower of Life activates the self-healing geometric intelligence of the body's cellular matrix. This practice comes from Agastya Muni's teaching that healing occurs when the body's natural geometric order is restored.`},
    ]
  },
  {
    id:4, minRank:1, glyph:'◆', color:'#D4AF37',
    title:{en:'Sri Yantra',sv:'Sri Yantra',no:'Sri Yantra',es:'Sri Yantra'},
    subtitle:{en:'The Supreme Geometric Yantra',sv:'Det Högsta Geometriska Yantra',no:'Det Høyeste Geometriske Yantra',es:'El Yantra Geométrico Supremo'},
    SVG: SriYantraSVG,
    sections:[
      {label:'SACRED STRUCTURE', content:`The Sri Yantra is the most revered and most mathematically sophisticated of all Vedic yantras. It consists of nine interlocking triangles — four pointing upward (Shiva triangles, representing consciousness) and five pointing downward (Shakti triangles, representing energy) — generating 43 small triangles in a pattern that modern mathematics has only recently been able to fully analyze.

The nine triangles are arranged concentrically, each slightly different in size, creating a pattern of perfect interlocking. The mathematical precision required is extraordinary: no three lines may meet at a single point, and the pattern must be geometrically self-consistent in two dimensions. Many scholars believe this could only have been discovered through direct geometric perception — not calculation.

LAYERS (outside to inside):
BHUPURA — The four-gated outer square. The gateway between the material world and the sacred inner space. The four gates correspond to the four directions, four elements, four Vedas.
THREE CIRCLES — representing the three Gunas: Tamas (inertia), Rajas (activity), Sattva (harmony).
16-PETAL LOTUS — The fulfillment of desire. 16 petals relate to the 16 digits of the Moon and 16 Shaktis.
8-PETAL LOTUS — Eight directions, eight Vasus, eight primary chakras.
NINE TRIANGLES — Five downward (five elements, five senses, creative power) and four upward (four states of consciousness, organizing intelligence).
BINDU — The supreme point. Pure undifferentiated consciousness — the Akasha — before creation.`},
      {label:'SIDDHA TRANSMISSION', content:`The Sri Yantra was considered by the 18 Tamil Siddhas to be the most potent single spiritual technology in existence. Agastya Muni's texts describe the Sri Yantra not as a symbol but as a living dimensional portal — a geometric interface between the human field of consciousness and the Akashic field.

THIRUMOOLAR's Thirumantiram (verse 2752) states: "The Sri Yantra is the form of the highest Shakti. In its center dwells the Supreme Being. Those who understand it are truly wise. Those who worship it attain liberation in this very life."

A properly constructed and energized Sri Yantra generates a coherent electromagnetic and scalar field. Measurements taken of properly energized Sri Yantras show anomalous readings on EM field meters and Kirlian photography.

SIDDHA HEALING WITH YANTRA: Siddha medicine uses specific yantras as geometric healing instruments. The geometric form, combined with mantric frequencies encoded in it, acts as a scalar field generator targeting specific disease patterns in the patient's energy body. Sri Yantra is used for consciousness disorders, deep karmic patterns, and restoration of overall pranic coherence.`},
      {label:'MEDITATION', content:`SRI YANTRA MEDITATION — The Inward Journey

STAGE 1 — ESTABLISH THE OUTER (5 min): Sit with the Sri Yantra at eye level. Take three long slow breaths. With soft eyes, take in the entire Yantra as a single form — the square, the circles, the lotus petals, the triangles, the Bindu. Allow your awareness to rest on the whole without analyzing any part.

STAGE 2 — THE INWARD JOURNEY (10 min): Slowly allow your gaze to move inward through the layers, one by one, pausing at each level. As you pass through each layer, silently acknowledge: "I release [layer-quality]." Through the Bhupura, release attachment to the material world. Through the 16 petals, release desire for specific outcomes. Through the 8 petals, release the eight directions of seeking. Through the triangles, release the sense of being a separate seeker.

STAGE 3 — THE BINDU (10 min): Rest your attention at the central point. Close your eyes. The Bindu remains as a point of inner light in your awareness. Rest in this point. This is the practice of pure awareness resting in its own source.

STAGE 4 — REEMERGENCE (5 min): Slowly open your eyes. Take three breaths. Gently reorient. Notice the quality of awareness you are carrying.`},
    ]
  },
  {
    id:5, minRank:1, glyph:'⬡', color:'#D4AF37',
    title:{en:"Metatron's Cube",sv:'Metatrons Kub',no:'Metatrons Kube',es:'El Cubo de Metatrón'},
    subtitle:{en:'The Architecture of All Matter',sv:'Arkitekturen för All Materia',no:'Arkitekturen for all Materie',es:'La Arquitectura de Toda la Materia'},
    SVG: MetatronSVG,
    sections:[
      {label:'THE STRUCTURE', content:`Metatron's Cube is derived from the Fruit of Life — the 13 circles that can be selected from the Flower of Life. When you connect the center of each of these 13 circles to every other center with a straight line, you generate Metatron's Cube — 78 lines creating a complex multi-layered geometric pattern.

Within Metatron's Cube, all five Platonic Solids can be found — simultaneously and overlaid. This is the geometric proof that the Platonic Solids are not five separate forms but five aspects of a single unified geometric template. The universe builds from a single geometric source that expresses itself in five elemental modes.

THE 13 CENTERS: The Fruit of Life has 12 circles surrounding a central 13th — mirroring 12 disciples around a teacher, 12 months around the solar year, 12 signs of the zodiac, 12 Adityas (solar deities) in Vedic cosmology. The 13th — the center — is the unchanging source around which the 12 aspects rotate and evolve.

HOLOGRAPHIC ENCODING: Metatron's Cube demonstrates a profound principle: the whole is encoded in each part. Each of the 13 circles contains the pattern of all other circles' relationships. This is the geometric expression of the Upanishadic teaching "Tat tvam asi" — "That thou art."`},
      {label:'HEALING APPLICATION', content:`METATRON'S CUBE IN SIDDHA ENERGY HEALING

The complete geometric architecture encoded in Metatron's Cube makes it the most comprehensive healing tool in sacred geometry. Its activation brings all five elemental geometries into resonance simultaneously.

FULL BODY GEOMETRIC RESET: A practitioner who has deeply internalized Metatron's Cube can project this geometry as a coherent scalar field through the hands. When held in the practitioner's consciousness and transmitted through focused prana, it acts as a "geometric template reset" for the patient's energy body — re-establishing the original geometric order of health across all five elemental fields simultaneously.

WORKING WITH SPECIFIC PLATONIC FORMS: Within Metatron's Cube, the healer can isolate and activate specific Platonic forms:
TETRAHEDRON: fire conditions — metabolic disorders, inflammation, will-related blocks
CUBE: earth conditions — structural issues, survival fears, material stability
OCTAHEDRON: air conditions — heart conditions, relationship issues, breath disorders
ICOSAHEDRON: water conditions — hormonal issues, creativity blocks, emotional processing
DODECAHEDRON: ether conditions — consciousness disorders, spiritual emergence, quantum-level healing

This practice requires deep internalization through consistent meditation — at minimum 40 days of daily Metatron's Cube practice.`},
    ]
  },
  {
    id:6, minRank:2, glyph:'◌', color:'#D4AF37',
    title:{en:'The Golden Ratio & Fibonacci',sv:'Gyllene Snittet & Fibonacci',no:'Gyllent Snitt & Fibonacci',es:'La Proporción Áurea & Fibonacci'},
    subtitle:{en:"Nature's Mathematical Soul",sv:'Naturens Matematiska Själ',no:'Naturens Matematiske Sjel',es:'El Alma Matemática de la Naturaleza'},
    SVG: FibonacciSVG,
    sections:[
      {label:'THE MATHEMATICS', content:`Phi (φ) = 1.6180339887... is the golden ratio. It is defined by a unique self-referential proportion: a/b = (a+b)/a = φ. It is the only number whose square is itself plus one (φ² = φ + 1) and whose reciprocal is itself minus one (1/φ = φ - 1).

THE FIBONACCI SEQUENCE: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144... Each number is the sum of the two preceding. As the sequence progresses, the ratio between consecutive numbers converges toward φ.

This sequence appears throughout the living world:
Sunflower seed spirals: always in consecutive Fibonacci numbers (typically 34 and 55, or 55 and 89)
Pinecone bracts: 8 spirals in one direction, 13 in the other
Romanesco broccoli: a perfect three-dimensional Fibonacci spiral
Human proportions: the ratio of arm to forearm, finger segments, facial proportions all approximate φ
The cochlea of the human ear: a perfect golden spiral
Galaxies: the Milky Way's spiral arms follow logarithmic spirals approximating φ

The golden ratio is maximally irrational — meaning it is maximally resistant to simplification — which gives it unique properties in organizing growing systems. Nature uses φ because it generates optimal packing and growth efficiency at every scale.`},
      {label:'SIDDHA & VEDIC DIMENSION', content:`The Vedic tradition understood the golden ratio not as a mathematical curiosity but as the geometric signature of Ananda — the bliss principle that pervades all creation. When the eye perceives golden ratio proportions, the Anahata (heart) chakra resonates because the form is vibrating at the frequency of Ananda.

Vedic temple architects used precise golden ratio proportions in their designs. The Vimana (tower) of a Dravidian temple follows Fibonacci proportions in its successive tiers. The sanctum sanctorum is proportioned to φ. The distance from the entrance gate to the main shrine is calculated through phi-based proportions. The temple is a physical Fibonacci antenna, creating standing waves of Ananda-frequency in the space.

KORAKKAR's teachings on rejuvenation describe the process of cellular regeneration as a return to phi-proportional organization. As cells age and degenerate, their structural proportions deviate from the golden ratio. Korakkar's rasayana preparations work by restoring phi-proportional organization to cellular structures — literally re-geometrizing the body toward youth.`},
      {label:'SPIRAL PRACTICE', content:`FIBONACCI SPIRAL MEDITATION — Following Consciousness Itself

The Fibonacci spiral is a meditation object of extraordinary power because it mirrors the fundamental pattern of consciousness's own movement — from center outward, or from periphery inward.

THE PRACTICE: Begin at the outer edge of the spiral and trace it inward with your gaze. Move slowly, allowing your awareness to follow the curve as it tightens. As you move inward, feel your awareness simultaneously moving inward — from thoughts (outer edge) toward pure presence (the point where the spiral approaches zero).

When you reach the center, close your eyes. The spiral continues in your inner vision. Follow it to its vanishing point. At the center of the Fibonacci spiral, where the curve theoretically approaches but never reaches zero, is pure consciousness — the Bindu. This is the geometric path to samadhi.

BODY SPIRAL ACTIVATION: Stand with feet shoulder-width apart. Raise your arms overhead. Begin a slow spiral of the entire body — arms trace a large arc, torso follows, hips spiral, the movement completing clockwise viewed from above. Three slow complete spirals in each direction, then rest in stillness. Notice the altered quality of your energy field.`},
    ]
  },
  {
    id:7, minRank:2, glyph:'⊙', color:'#D4AF37',
    title:{en:'The Torus Field',sv:'Torusfältet',no:'Torus-feltet',es:'El Campo Toroidal'},
    subtitle:{en:"The Universe's Primary Pattern",sv:'Universums Primära Energimönster',no:'Universets Primære Energimønster',es:'El Patrón Primario del Universo'},
    SVG: TorusSVG,
    sections:[
      {label:'THE TORUS', content:`The torus is a donut-shaped geometric form generated when a circle is rotated around an axis external to itself. It describes the fundamental energy pattern of every self-sustaining system in the universe.

THE TORUS IS EVERYWHERE:
The human heart generates a toroidal electromagnetic field extending 3–5 meters beyond the physical body — measurable and mapped by HeartMath Institute.
An atom's electron orbitals trace toroidal paths.
Earth's magnetic field (magnetosphere) is a torus.
The sun's heliosphere is a torus.
Every galaxy has a toroidal energy field at its core.
The universe itself, according to some cosmological models, has toroidal topology.

THE KEY PROPERTY: a torus is self-sustaining and self-referential. Energy flows out from the center through the top, arcs around the outside, and re-enters through the bottom — continuously cycling through itself without loss. This makes the torus the geometric template for all self-organizing systems — from atoms to organisms to solar systems.

COHERENCE: When a toroidal system is in its optimal state, its energy flow is smooth, laminar, and coherent. Disease, disorder, trauma, and negative states are characterized by turbulence in the body's toroidal fields. Health is geometric coherence in the toroidal field.`},
      {label:'HEART TORUS & HEALING', content:`THE HEART AS TORUS — The Most Powerful Healer

The human heart generates the body's strongest and most coherent electromagnetic field — approximately 60 times stronger in amplitude than the brain's field and 100 times stronger in magnetic output. This field is toroidal in shape, extending several meters beyond the physical body.

HeartMath Institute has demonstrated that this heart torus is shaped by the emotional state of its owner. Coherent positive emotional states (gratitude, love, compassion) create smooth, ordered, coherent toroidal field patterns. Stress, fear, and negative emotions create chaotic, incoherent patterns.

This is measurable physics. The heart torus is a real electromagnetic field that interacts with other people's fields, with animals, with plants, and with the electromagnetic environment.

SIDDHA TEACHING: Sundaranandar's teachings on bhakti (devotional love) are, in geometric terms, teachings on heart torus coherence. When a Siddha practitioner generates pure devotional love, they are maximizing the coherence of their heart toroidal field. This coherent field then interacts with the fields of others — this is the physical mechanism of "transmission" (Shaktipath / Deeksha).

The most fundamental healing any practitioner can offer is the coherence of their own heart torus — because a coherent toroidal field naturally induces coherence in adjacent fields through the physics of resonance. This is why a deeply peaceful, loving healer heals simply through proximity, before any technique is applied.`},
    ]
  },
  {
    id:8, minRank:2, glyph:'◎', color:'#22D3EE',
    title:{en:'Cymatics & Sound Geometry',sv:'Cymatics & Ljudgeometri',no:'Cymatics & Lydgeometri',es:'Cymatics y Geometría del Sonido'},
    subtitle:{en:'Making the Invisible Visible',sv:'Göra det Osynliga Synligt',no:'Gjøre det Usynlige Synlig',es:'Haciendo Visible lo Invisible'},
    SVG: CymaticsSVG,
    sections:[
      {label:'SOUND CREATES GEOMETRY', content:`Cymatics is the science of making sound visible. When sound waves are passed through matter — sand on a metal plate, water, cornstarch suspension — the matter organizes into precise geometric patterns corresponding to the frequency of the sound. This was systematically documented by Swiss physician Hans Jenny in his 1967 and 1972 works.

Jenny's discoveries were profound:
Every pure tone creates a unique, stable, reproducible geometric pattern.
Higher frequencies create more complex, more subdivided patterns.
Patterns created by sacred frequencies (432 Hz, 528 Hz, Solfeggio frequencies) are notably ordered and beautiful.
Several patterns created by specific frequencies are identical to traditional sacred geometric forms — including patterns identical to the Sri Yantra and the Flower of Life.
Patterns created by the human voice, especially chanting, are dramatically more complex and ordered than simple tones.
The pattern dissolves into chaos when sound stops, and reforms instantly when sound resumes.

This is the scientific demonstration of what the Siddhas always taught: Nada Brahman — the universe is fundamentally sound becoming form. The Vedic teaching that the universe was "spoken into existence" through AUM is geometrically accurate: consciousness (the speaker) producing sound (AUM) which instantaneously generates geometry (manifest reality).`},
      {label:'MANTRAS AS GEOMETRIC CODES', content:`Every Sanskrit mantra is a specific sound frequency that generates a specific geometric pattern in the subtle matter of the energy body. The Siddhas understood this with extraordinary precision.

BIJA MANTRAS (seed syllables) are the most condensed form. Each bija is a one-syllable sound carrying the complete geometric encoding of a specific divine principle:
AUM: generates the toroidal pattern — the fundamental field of consciousness itself
HREEM: generates a complex pattern associated with Shakti / the creative feminine
SHREEM: generates the Sri Yantra pattern — wealth, abundance, beauty
KREEM: generates Kali yantra pattern — transformation, cutting through illusion
KLEEM: generates patterns associated with attraction and the magnetic principle

CHANTING AND THE ENERGY BODY: Sustained mantra repetition creates standing waves of geometric pattern in the practitioner's pranic body. Over time, with consistent practice, these geometric patterns become permanently encoded in the Pranamaya Kosha — the healer gradually geometrically upgrades their own field to match the mantra's frequency.

SIDDHA SOUND MEDICINE: Agastya Muni's medical texts include detailed protocols for mantra therapy for specific disease conditions. The healer becomes a living geometric transmitter, projecting specific mantra-frequencies into the patient's energy field to restore its original geometric order.`},
    ]
  },
  {
    id:9, minRank:3, glyph:'⊞', color:'#D4AF37',
    title:{en:'Vastu Shastra',sv:'Vastu Shastra',no:'Vastu Shastra',es:'Vastu Shastra'},
    subtitle:{en:'Sacred Geometry of Living Space',sv:'Helig Geometri för Levande Rum',no:'Hellig Geometri for Levende Rom',es:'Geometría Sagrada del Espacio Vital'},
    SVG: VastuSVG,
    sections:[
      {label:'THE SCIENCE OF SPACE', content:`Vastu Shastra — literally "the science of space" — is the ancient Vedic system of sacred architecture. It is the direct application of Sacred Geometry to the design of physical living and working spaces.

VASTU PURUSHA MANDALA: The foundation of Vastu is a geometric grid of 81 squares (9×9) representing the cosmic being whose body is the building plot. Each of the 81 squares is governed by a specific deity and corresponds to specific functions of the building.

THE KEY ZONES:
EAST: Solar zone — entry of prana with the rising sun. Ideal for meditation room, living area, entrance.
NORTHEAST: Esha-kona — the corner of divinity. The most sacred zone. Keep open, clean, light. Place the puja/altar here. Never place a toilet or heavy furniture here.
NORTH: Kubera zone — wealth. Keep active, open.
SOUTHEAST: Agni-kona — the fire corner. Kitchen belongs here.
SOUTHWEST: Most stable, heaviest zone. Master bedroom, heavy storage.
BRAHMASTHANA (Center): The energy center of the space. Must remain open, clean, and unobstructed. Placing heavy furniture in the Brahmasthana creates the energy equivalent of a blocked heart chakra in the building's occupants.`},
      {label:'KARUVURAR TRANSMISSION', content:`KARUVURAR — The Architect Siddha

Of all 18 Tamil Siddhas, Karuvurar is the master of sacred space. His teachings on the geometry of space are the source of the Agama Shastra tradition that gave rise to Tamil temple architecture. The Dravidian temple is his greatest transmission — a three-dimensional yantra built from stone, creating a permanent scalar field of specific divine frequency.

CREATING A HEALING SPACE — Karuvurar's transmission for the home healing space:
1. ORIENTATION: the healing altar faces East (receiving solar prana) or Northeast (receiving divine prana)
2. GEOMETRY: the altar is constructed with phi-proportional dimensions
3. YANTRA PLACEMENT: the Sri Yantra is placed at the center — activated as the geometric field generator
4. SOUND: recorded mantras or live chanting establish the sonic geometry of the space
5. LIGHT: natural sunlight entering from the East is most pranic. Use warm (2700–3000K) light; avoid cool blue-white light in healing spaces
6. MATERIALS: natural materials only — wood, stone, clay, natural fibers. Synthetic materials disrupt geometric coherence
7. BRAHMASTHANA: the center of the room is kept clear — no furniture, no objects. This is the "lung" of the space.

A space built and maintained according to these principles becomes a self-sustaining healing field. Patients begin to heal before the healer even begins treatment — the geometry of the space itself initiates the healing process.`},
    ]
  },
  {
    id:10, minRank:3, glyph:'✵', color:'#D4AF37',
    title:{en:'Quantum Merkaba Practice',sv:'Kvantum Merkaba-Praktik',no:'Kvantum Merkaba-Praksis',es:'Práctica del Merkaba Cuántico'},
    subtitle:{en:'Activating Your Geometric Light Body',sv:'Aktivera Ditt Geometriska Ljuskropp',no:'Aktivere Din Geometriske Lyskropp',es:'Activando tu Cuerpo de Luz Geométrico'},
    SVG: MerkabaSVG,
    sections:[
      {label:'THE MERKABA', content:`Merkaba is an ancient Hebrew word composed of three roots: Mer (light), Ka (spirit/consciousness), Ba (body). The Merkaba is the geometric light body — the luminous, spinning geometric field surrounding the human body that, when activated, serves as a vehicle of consciousness across dimensions.

THE GEOMETRIC FORM: The Merkaba is two interlocking tetrahedra — one pointing upward (receiving consciousness/Shiva principle) and one pointing downward (emanating energy/Shakti principle). These two counter-rotating geometric fields create the fundamental structure of the human light body.

The upward tetrahedron rotates counter-clockwise (viewed from above) at the frequency of the Earth's Schumann resonance base (7.83 Hz). The downward tetrahedron rotates clockwise at the same frequency. When these two counter-rotating fields are in perfect geometric balance and spin, they generate a disk-shaped coherent electromagnetic field extending up to approximately 16–18 meters from the body.

In the Siddha tradition, the equivalent concept is the "Jnana Vahanam" — the vehicle of wisdom-light — described in Thirumoolar's Thirumantiram. The physics of two counter-rotating charged geometric fields generating a coherent electromagnetic field is standard electromagnetic theory.`},
      {label:'ACTIVATION PRACTICE', content:`MERKABA ACTIVATION — 18-BREATH COMPLETE PRACTICE

PREPARATION: Sit in a comfortable cross-legged position with straight spine. Establish yogic breathing. Take three clearing breaths. Set intention: "I activate my Merkaba field for the highest service of all beings."

BREATHS 1–6 — PRANIC CHARGE: Each breath: inhale fully expanding the Flower of Life field around the body; exhale with awareness of light filling the geometric field. This charges the pranic field.

BREATHS 7–14 — POLARIZATION: Alternate activating the upward tetrahedron (odd breaths — extending from heart through crown and down through the Earth) and the downward tetrahedron (even breaths — extending from heart outward toward the horizon). The two geometric fields begin to differentiate.

BREATHS 15–17 — SPIN ACTIVATION: With each breath, feel both tetrahedra beginning to spin — upward counter-clockwise, downward clockwise. The spinning accelerates with each breath until it is too fast to track with the mind. Let go of control. The field is self-organizing.

BREATH 18 — THE DISK: Take a full breath and on the exhale, see and feel the two counter-rotating fields stabilize into a luminous disk extending approximately 16 meters in every direction from your heart center. Hold your breath for 7–15 seconds. Feel the activated Merkaba field.

OPERATION: From this activated state, any intention set with the heart is amplified by the geometric coherence of the Merkaba field. Rest in this field for 10–20 minutes after full activation.`},
      {label:'BABAJI TRANSMISSION', content:`MAHAVATAR BABAJI AND THE MERKABA

Mahavatar Babaji's physical immortality — his maintenance of a physical body for thousands of years — is understood in the Siddha tradition as the result of complete Merkaba mastery. The Siddha body, maintained in its fully geometrically coherent state, does not age because aging is fundamentally a loss of geometric coherence at the cellular level.

Babaji's teaching: "The light body is your true nature. The physical body is a projection of the light body into the density of the material plane. When the light body is fully activated and stable, the physical body reflects that stability and does not decay."

This is consistent with modern understanding of the relationship between information structure and physical manifestation. The body is not a material object — it is an information pattern held in coherence by the organizing intelligence of the light body. When this geometric organizing principle is strengthened through practice rather than weakened through stress and trauma, the physical projection remains healthy and vital.

Babaji transmits the Merkaba directly to sincere practitioners through what the tradition calls "direct transmission in silence." Many advanced practitioners report spontaneous activation of the Merkaba field during deep states of silent meditation — this is Babaji's direct initiation.

THE COMPLETION: Sacred Geometry Intelligence culminates in the Merkaba because all other geometric forms — the Platonic Solids, the Flower of Life, the Sri Yantra, Metatron's Cube, the Fibonacci Spiral, the Torus — are all dimensions of the complete geometric field of the awakened human being. The Merkaba integrates all of these geometries into a single living, breathing, spinning field of consciousness that is simultaneously the individual and the infinite.

As Thirumoolar wrote in the Thirumantiram: "The body is the temple. Tend it carefully. In the living temple of the perfected body, the Lord dances eternally."`},
    ]
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const SacredGeometryEducation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const membership = useMembership();
  const tier = membership.tier;
  const isAdmin = (membership as any).isAdmin ?? false;
  const refreshMembership = (membership as any).refresh;

  const [lang, setLang] = useState<Lang>('en');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedModule, setExpandedModule] = useState<number | null>(1);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const userRank = isAdmin ? 3 : getTierRank(tier);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) { try { sessionStorage.setItem('affiliate_ref', ref); } catch {} }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('◈ Sacred Geometry Access Activated — Welcome to the Akasha-Archive');
      if (refreshMembership) refreshMembership();
      navigate('/sacred-geometry-education', { replace: true });
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled — your journey awaits whenever you are ready');
      navigate('/sacred-geometry-education', { replace: true });
    }
  }, [searchParams, navigate, refreshMembership]);

  const handleCheckout = async (tierName: string) => {
    if (!user) { navigate('/auth'); return; }
    setCheckoutLoading(tierName);
    try {
      const affiliateId = (() => { try { return sessionStorage.getItem('affiliate_ref') || 'direct'; } catch { return 'direct'; } })();
      const { data, error } = await supabase.functions.invoke('create-tier-checkout', { body: { tierName, affiliateId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error('Checkout error — please try again');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const TIERS_DATA = [
    { name:'PRANA_FLOW', label:'Prana-Flow', price:'€19', period:'/mo',
      desc:'Modules 1–5 — Sacred foundations through Metatron\'s Cube',
      features:['What Is Sacred Geometry?','The Platonic Solids','Flower of Life Activation','Sri Yantra Complete Teaching',"Metatron's Cube & Healing"],
    },
    { name:'SIDDHA_QUANTUM', label:'Siddha-Quantum', price:'€45', period:'/mo', highlight:true,
      desc:'Modules 1–8 — All foundations + advanced field science',
      features:['Everything in Prana-Flow','Golden Ratio & Fibonacci Spiral','Torus Field & Heart Coherence','Cymatics & Mantra Geometry'],
    },
    { name:'AKASHA_INFINITY', label:'Akasha-Infinity', price:'€1,111', period:' once',
      desc:'All 10 modules — Complete transmission including Vastu & Merkaba',
      features:['All 10 Modules Unlocked','Vastu Shastra Complete','Quantum Merkaba Practice','Babaji Transmission Practices','Lifetime Access'],
    },
  ];

  const tabs = ta('tabs', lang);

  const tierLabel = (rank: number) => {
    if (rank === 0) return t('freeLabel', lang);
    if (rank === 1) return t('pranaLabel', lang);
    if (rank === 2) return t('siddhaLabel', lang);
    return t('akashaLabel', lang);
  };
  const tierColor = (rank: number) => {
    if (rank === 0) return 'rgba(255,255,255,0.4)';
    if (rank === 1) return '#D4AF37';
    if (rank === 2) return '#A78BFA';
    return '#22D3EE';
  };

  return (
    <div style={{background:'#050505',minHeight:'100vh',fontFamily:"'Plus Jakarta Sans',sans-serif",color:'rgba(255,255,255,0.85)',overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=Cinzel:wght@600&display=swap');
        *{box-sizing:border-box;} p{margin:0;}
        .gl{background:rgba(255,255,255,0.02);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.05);border-radius:36px;}
        .gs{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:16px;}
        .lb{font-size:9px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.35);}
        .gw{color:#D4AF37;text-shadow:0 0 20px rgba(212,175,55,.4);}
        .cw{color:#22D3EE;text-shadow:0 0 20px rgba(34,211,238,.3);}
        .fd{animation:fadeUp .35s ease forwards;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .mc{cursor:pointer;transition:all .25s;} .mc:hover{transform:translateY(-2px);}
        .tb{cursor:pointer;border:none;background:none;font-family:inherit;transition:all .25s;}
        .ab{cursor:pointer;background:none;border:none;width:100%;text-align:left;font-family:inherit;}
        @keyframes pg{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        .pg{animation:pg 3s ease-in-out infinite;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* ── HERO ── */}
      <div style={{position:'relative',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.06,pointerEvents:'none'}}>
          <div style={{width:'min(960px,100vw)',height:'min(960px,100vw)'}}>
            <SriYantraSVG/>
          </div>
        </div>
        {Array.from({length:28},(_,i)=>(
          <div key={i} className="pg" style={{position:'absolute',width:(Math.random()*2.5+0.5)+'px',height:(Math.random()*2.5+0.5)+'px',borderRadius:'50%',background:'#D4AF37',top:Math.random()*100+'%',left:Math.random()*100+'%',opacity:Math.random()*0.35+0.1,animationDuration:(2+Math.random()*3)+'s',animationDelay:(Math.random()*2)+'s'}}/>
        ))}
        <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'40px 20px',maxWidth:820}}>
          <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:36}}>
            {LANG_OPTS.map(l=>(
              <button key={l.code} className="tb" onClick={()=>setLang(l.code)}
                style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${lang===l.code?'#D4AF37':'rgba(255,255,255,0.1)'}`,color:lang===l.code?'#D4AF37':'rgba(255,255,255,0.35)',fontSize:11,fontWeight:800,letterSpacing:'0.08em',background:'rgba(255,255,255,0.02)'}}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <p className="lb" style={{marginBottom:20}}>SIDDHA QUANTUM INTELLIGENCE · AKASHA SCIENCE</p>
          <h1 style={{fontSize:'clamp(44px,9vw,92px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:0.92,margin:'0 0 24px',background:'linear-gradient(175deg,#fff 0%,#D4AF37 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            {t('heroTitle',lang).split('\n').map((line,i)=><span key={i}>{line}{i===0&&<br/>}</span>)}
          </h1>
          <p style={{fontSize:17,lineHeight:1.75,color:'rgba(255,255,255,0.5)',maxWidth:640,margin:'0 auto 44px'}}>{t('heroSub',lang)}</p>
          <div style={{display:'flex',justifyContent:'center',gap:36,flexWrap:'wrap',marginBottom:52}}>
            {[['10','MODULES'],['5,000+','YEAR LINEAGE'],['18','SIDDHA MASTERS'],['∞','TRANSMISSIONS']].map(([num,label])=>(
              <div key={label} style={{textAlign:'center'}}>
                <p style={{fontSize:30,fontWeight:900,color:'#D4AF37',margin:0}}>{num}</p>
                <p className="lb">{label}</p>
              </div>
            ))}
          </div>
          <button onClick={()=>setActiveTab(0)} className="tb"
            style={{background:'linear-gradient(135deg,#D4AF37,#B8941F)',color:'#000',padding:'16px 44px',borderRadius:50,fontWeight:900,fontSize:15,letterSpacing:'0.06em'}}>
            BEGIN THE TRANSMISSION →
          </button>
        </div>
      </div>

      {/* ── STICKY TABS ── */}
      <div style={{position:'sticky',top:0,zIndex:100,background:'rgba(5,5,5,0.92)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 20px'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',gap:4}}>
          {tabs.map((tab,i)=>(
            <button key={i} className="tb" onClick={()=>setActiveTab(i)}
              style={{padding:'16px 22px',color:activeTab===i?'#D4AF37':'rgba(255,255,255,0.35)',fontSize:10,fontWeight:900,letterSpacing:'0.45em',borderBottom:activeTab===i?'2px solid #D4AF37':'2px solid transparent'}}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 0: CURRICULUM ── */}
      {activeTab===0&&(
        <div style={{maxWidth:1100,margin:'0 auto',padding:'60px 20px'}}>
          <p className="lb" style={{textAlign:'center',marginBottom:14}}>{t('modTitle',lang)}</p>
          <h2 className="gw" style={{textAlign:'center',fontSize:'clamp(26px,5vw,46px)',fontWeight:900,letterSpacing:'-0.03em',margin:'0 0 56px'}}>
            The Complete Sacred Geometry Transmission
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {MODULES.map(mod=>{
              const isLocked=userRank<mod.minRank;
              const isOpen=expandedModule===mod.id;
              const tc=tierColor(mod.minRank);
              const tl=tierLabel(mod.minRank);
              return (
                <div key={mod.id} className="gl mc" style={{overflow:'hidden',opacity:isLocked?0.65:1}}>
                  <button className="ab" onClick={()=>!isLocked&&setExpandedModule(isOpen?null:mod.id)}
                    style={{display:'flex',alignItems:'center',gap:20,padding:'22px 26px',cursor:isLocked?'default':'pointer',width:'100%',textAlign:'left'}}>
                    <div style={{width:68,height:68,flexShrink:0,opacity:isLocked?0.3:1}}><mod.SVG/></div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5,flexWrap:'wrap'}}>
                        <span className="lb">MODULE {String(mod.id).padStart(2,'0')}</span>
                        <span style={{fontSize:8,fontWeight:900,letterSpacing:'0.4em',textTransform:'uppercase',color:tc,background:`${tc}18`,padding:'2px 10px',borderRadius:20,border:`1px solid ${tc}30`}}>{tl}</span>
                        {isLocked&&<span style={{fontSize:12,opacity:0.4}}>🔒</span>}
                      </div>
                      <h3 style={{fontSize:'clamp(15px,3vw,21px)',fontWeight:900,letterSpacing:'-0.02em',margin:'0 0 3px',color:isLocked?'rgba(255,255,255,0.35)':'#fff'}}>
                        {mod.title[lang]||mod.title.en}
                      </h3>
                      <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',margin:0}}>{mod.subtitle[lang]||mod.subtitle.en}</p>
                    </div>
                    {!isLocked&&(
                      <div style={{fontSize:18,color:'#D4AF37',transform:isOpen?'rotate(180deg)':'none',transition:'transform .3s',flexShrink:0}}>▾</div>
                    )}
                  </button>

                  {isLocked&&(
                    <div style={{padding:'0 26px 20px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                      <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',margin:0,flex:1}}>{t('lockedMsg',lang)}</p>
                      <button onClick={()=>setActiveTab(1)} className="tb"
                        style={{background:'linear-gradient(135deg,#D4AF37,#B8941F)',color:'#000',padding:'8px 20px',borderRadius:24,fontWeight:900,fontSize:10,letterSpacing:'0.1em',flexShrink:0}}>
                        UNLOCK →
                      </button>
                    </div>
                  )}

                  {isOpen&&!isLocked&&(
                    <div className="fd" style={{padding:'0 26px 28px'}}>
                      <div style={{width:180,height:180,margin:'0 auto 28px',opacity:0.75}}><mod.SVG/></div>
                      {mod.sections.map((sec,si)=>{
                        const sk=`${mod.id}-${si}`;
                        const se=expandedSection===sk;
                        return (
                          <div key={si} className="gs" style={{marginBottom:8,overflow:'hidden'}}>
                            <button className="ab" onClick={()=>setExpandedSection(se?null:sk)}
                              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px'}}>
                              <span className="lb" style={{color:'rgba(255,255,255,0.55)'}}>{sec.label}</span>
                              <span style={{color:'#D4AF37',fontSize:18,transform:se?'rotate(45deg)':'none',transition:'transform .25s',lineHeight:1}}>+</span>
                            </button>
                            {se&&(
                              <div className="fd" style={{padding:'0 20px 20px'}}>
                                {sec.content.split('\n\n').map((para,pi,arr)=>(
                                  <p key={pi} style={{fontSize:14,lineHeight:1.85,color:'rgba(255,255,255,0.68)',marginBottom:pi<arr.length-1?18:0}}>
                                    {para}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 1: INVEST ── */}
      {activeTab===1&&(
        <div style={{maxWidth:1100,margin:'0 auto',padding:'60px 20px'}}>
          <p className="lb" style={{textAlign:'center',marginBottom:14}}>CHOOSE YOUR PATH OF INITIATION</p>
          <h2 className="gw" style={{textAlign:'center',fontSize:'clamp(26px,5vw,46px)',fontWeight:900,letterSpacing:'-0.03em',margin:'0 0 14px'}}>
            {t('investTitle',lang)}
          </h2>
          <p style={{textAlign:'center',color:'rgba(255,255,255,0.35)',maxWidth:480,margin:'0 auto 52px',fontSize:14,lineHeight:1.7}}>
            Sacred Geometry Intelligence is included with your SQI membership. Select the level that resonates with your current path.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18}}>
            {TIERS_DATA.map(td=>{
              const active=(td.name==='PRANA_FLOW'&&userRank>=1)||(td.name==='SIDDHA_QUANTUM'&&userRank>=2)||(td.name==='AKASHA_INFINITY'&&userRank>=3);
              return (
                <div key={td.name} className="gl" style={{padding:32,position:'relative',overflow:'hidden',border:td.highlight?'1px solid rgba(212,175,55,0.3)':'1px solid rgba(255,255,255,0.05)'}}>
                  {td.highlight&&<div style={{position:'absolute',top:16,right:16,background:'#D4AF37',color:'#000',fontSize:8,fontWeight:900,letterSpacing:'0.35em',padding:'4px 12px',borderRadius:20}}>BEST VALUE</div>}
                  <p className="lb" style={{marginBottom:8}}>{td.label}</p>
                  <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:8}}>
                    <span style={{fontSize:46,fontWeight:900,color:'#D4AF37'}}>{td.price}</span>
                    <span style={{fontSize:13,color:'rgba(255,255,255,0.35)'}}>{td.period}</span>
                  </div>
                  <p style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:24,lineHeight:1.6}}>{td.desc}</p>
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:18,marginBottom:24}}>
                    {td.features.map((f,fi)=>(
                      <div key={fi} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
                        <span style={{color:'#D4AF37',fontSize:13,marginTop:1}}>◈</span>
                        <span style={{fontSize:12,color:'rgba(255,255,255,0.65)',lineHeight:1.5}}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {active?(
                    <div style={{textAlign:'center',padding:'13px',borderRadius:24,background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.25)',fontSize:11,fontWeight:900,letterSpacing:'0.25em',color:'#D4AF37'}}>
                      ✓ ACTIVE
                    </div>
                  ):(
                    <button className="tb" onClick={()=>handleCheckout(td.name)}
                      style={{width:'100%',background:td.highlight?'linear-gradient(135deg,#D4AF37,#B8941F)':'rgba(212,175,55,0.08)',color:td.highlight?'#000':'#D4AF37',padding:'13px',borderRadius:24,fontWeight:900,fontSize:11,letterSpacing:'0.12em',border:td.highlight?'none':'1px solid rgba(212,175,55,0.25)'}}>
                      {checkoutLoading===td.name?t('processing',lang):`${t('checkoutBtn',lang)} — ${td.price}${td.period}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: ABOUT ── */}
      {activeTab===2&&(
        <div style={{maxWidth:820,margin:'0 auto',padding:'60px 20px'}}>
          <p className="lb" style={{textAlign:'center',marginBottom:14}}>THE LIVING TRANSMISSION</p>
          <h2 className="gw" style={{textAlign:'center',fontSize:'clamp(26px,5vw,44px)',fontWeight:900,letterSpacing:'-0.03em',margin:'0 0 44px'}}>
            {t('aboutTitle',lang)}
          </h2>
          <div style={{width:220,height:220,margin:'0 auto 44px',opacity:0.8}}><MetatronSVG/></div>
          <div className="gl" style={{padding:40,marginBottom:40}}>
            {t('aboutText',lang).split('\n\n').map((para,i,arr)=>(
              <p key={i} style={{fontSize:15,lineHeight:1.9,color:'rgba(255,255,255,0.68)',marginBottom:i<arr.length-1?22:0}}>{para}</p>
            ))}
          </div>
          <h3 className="gw" style={{fontSize:22,fontWeight:900,letterSpacing:'-0.02em',margin:'0 0 20px',textAlign:'center'}}>
            This Transmission Is Held By
          </h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
            {['Agastya Muni','Thirumoolar','Bogar','Kalangi Nathar','Sattamuni','Karuvurar','Sundaranandar','Mahavatar Babaji'].map(name=>(
              <div key={name} className="gs" style={{padding:'14px 18px',textAlign:'center'}}>
                <span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.65)'}}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{textAlign:'center',padding:'56px 20px 40px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
        <p className="lb">SQI 2050 · SACRED GEOMETRY INTELLIGENCE · SIDDHA QUANTUM NEXUS</p>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.18)',marginTop:8}}>A living transmission from the 18 Tamil Siddhas and Mahavatar Babaji</p>
      </div>
    </div>
  );
};

export default SacredGeometryEducation;
