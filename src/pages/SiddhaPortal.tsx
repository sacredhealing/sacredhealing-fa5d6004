import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { ChevronDown, Lock } from 'lucide-react';
import { useAyurvedaProgress } from '@/hooks/useAyurvedaProgress';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const gold   = (a: number) => `rgba(212,175,55,${a})`;
const white  = (a: number) => `rgba(255,255,255,${a})`;
const cyan   = (a: number) => `rgba(34,211,238,${a})`;
const green  = (a: number) => `rgba(74,222,128,${a})`;
const violet = (a: number) => `rgba(167,139,250,${a})`;
const amber  = (a: number) => `rgba(245,158,11,${a})`;
const teal   = (a: number) => `rgba(52,211,153,${a})`;
const rose   = (a: number) => `rgba(251,113,133,${a})`;

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const LABEL: React.CSSProperties = {
  fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize:10, fontWeight:800, letterSpacing:'0.45em',
  textTransform:'uppercase' as const, color:gold(0.45),
};
const CARD_TITLE: React.CSSProperties = {
  fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize:15, fontWeight:800, letterSpacing:'0.08em',
  textTransform:'uppercase' as const, color:gold(0.92), marginBottom:8,
};
const ITALIC: React.CSSProperties = {
  fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic',
  fontSize:'0.93rem', color:white(0.52), lineHeight:1.65, marginBottom:14,
};
const CTA: React.CSSProperties = {
  fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize:10, fontWeight:800, letterSpacing:'0.3em',
  textTransform:'uppercase' as const,
  color:gold(0.85), background:'none', border:'none', cursor:'pointer', padding:0,
};

// ─── SVG SACRED ICONS ──────────────────────────────────────────────────────────
const Icon = {
  Lotus: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="lg1" cx="50%" cy="60%" r="50%"><stop offset="0%" stopColor="#FFE082"/><stop offset="100%" stopColor="#B8860B"/></radialGradient>
        <radialGradient id="lg2" cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="100%" stopColor="#D4AF37"/></radialGradient>
      </defs>
      <ellipse cx="24" cy="26" rx="7" ry="6" fill="url(#lg1)" opacity="0.95"/>
      {[0,60,120,180,240,300].map((a,i)=><ellipse key={i} cx={24+Math.sin(a*Math.PI/180)*9} cy={26-Math.cos(a*Math.PI/180)*8} rx="4" ry="7" fill="url(#lg2)" opacity="0.8" transform={`rotate(${a},${24+Math.sin(a*Math.PI/180)*9},${26-Math.cos(a*Math.PI/180)*8})`}/>)}
      {[30,90,150,210,270,330].map((a,i)=><ellipse key={i} cx={24+Math.sin(a*Math.PI/180)*15} cy={26-Math.cos(a*Math.PI/180)*13} rx="3" ry="6" fill="rgba(212,175,55,0.5)" opacity="0.65" transform={`rotate(${a},${24+Math.sin(a*Math.PI/180)*15},${26-Math.cos(a*Math.PI/180)*13})`}/>)}
      <circle cx="24" cy="26" r="3" fill="#FFF9C4" opacity="0.9"/>
    </svg>
  ),
  Flame: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="fg1" cx="50%" cy="80%" r="60%"><stop offset="0%" stopColor="#FFD54F"/><stop offset="40%" stopColor="#FF8F00"/><stop offset="100%" stopColor="#BF360C" stopOpacity="0"/></radialGradient>
        <radialGradient id="fg2" cx="50%" cy="90%" r="40%"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9"/><stop offset="100%" stopColor="#FFD54F" stopOpacity="0"/></radialGradient>
      </defs>
      <path d="M24 44 C14 44 8 36 8 28 C8 20 14 16 18 10 C19 14 20 16 24 18 C22 12 26 4 30 2 C32 10 28 16 32 22 C36 18 36 14 34 8 C40 14 42 22 40 30 C38 38 32 44 24 44Z" fill="url(#fg1)"/>
      <path d="M24 40 C18 40 16 34 18 28 C20 24 22 22 24 20 C26 24 24 28 28 30 C30 26 28 22 26 18 C32 22 34 28 32 34 C30 38 28 40 24 40Z" fill="url(#fg2)" opacity="0.8"/>
      <ellipse cx="24" cy="38" rx="5" ry="2.5" fill="#FFD54F" opacity="0.4"/>
    </svg>
  ),
  SriYantra: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="sy1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE082"/><stop offset="100%" stopColor="#B8860B"/></linearGradient></defs>
      <polygon points="24,4 44,38 4,38" stroke="url(#sy1)" strokeWidth="1.5" fill="rgba(212,175,55,0.06)"/>
      <polygon points="24,44 4,10 44,10" stroke="url(#sy1)" strokeWidth="1.5" fill="rgba(212,175,55,0.04)" opacity="0.8"/>
      <polygon points="24,10 38,32 10,32" stroke={gold(0.5)} strokeWidth="1" fill="rgba(212,175,55,0.08)"/>
      <polygon points="24,38 10,16 38,16" stroke={gold(0.4)} strokeWidth="1" fill="rgba(212,175,55,0.05)" opacity="0.7"/>
      <circle cx="24" cy="24" r="4" fill="#FFE082" opacity="0.9"/>
      <circle cx="24" cy="24" r="7" stroke={gold(0.6)} strokeWidth="0.8" fill="none"/>
      <circle cx="24" cy="24" r="18" stroke={gold(0.2)} strokeWidth="0.6" fill="none"/>
    </svg>
  ),
  Moon: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><radialGradient id="mn1" cx="35%" cy="35%" r="55%"><stop offset="0%" stopColor="#FFFDE7"/><stop offset="60%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7B6914"/></radialGradient></defs>
      <path d="M28 8 C18 8 10 16 10 26 C10 36 18 44 28 44 C34 44 40 40 43 34 C38 36 32 35 28 31 C22 27 20 20 24 14 C25 11 26 9 28 8Z" fill="url(#mn1)"/>
      {[[38,12,1.5],[42,20,1],[36,8,1],[40,28,0.8]].map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill="#FFE082" opacity={0.8-i*0.1}/>)}
      <circle cx="28" cy="26" r="3" fill="rgba(255,253,231,0.3)"/>
    </svg>
  ),
  Om: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="om1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#8B6914"/></linearGradient></defs>
      <text x="24" y="34" textAnchor="middle" fontSize="30" fontFamily="serif" fill="url(#om1)" style={{filter:'drop-shadow(0 0 6px rgba(212,175,55,0.7))'}}>ॐ</text>
    </svg>
  ),
  ThirdEye: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="te1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#A78BFA"/><stop offset="60%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#2D1B69"/></radialGradient>
        <radialGradient id="te2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="100%" stopColor="#D4AF37"/></radialGradient>
      </defs>
      <path d="M6 24 C12 14 36 14 42 24 C36 34 12 34 6 24Z" fill="rgba(167,139,250,0.15)" stroke={violet(0.7)} strokeWidth="1.2"/>
      <circle cx="24" cy="24" r="8" fill="url(#te1)"/>
      <circle cx="24" cy="24" r="4" fill="#0D0D1A"/>
      <circle cx="24" cy="24" r="1.5" fill="url(#te2)"/>
      {[0,45,90,135,180,225,270,315].map((a,i)=><line key={i} x1={24+Math.cos(a*Math.PI/180)*10} y1={24+Math.sin(a*Math.PI/180)*10} x2={24+Math.cos(a*Math.PI/180)*14} y2={24+Math.sin(a*Math.PI/180)*14} stroke={gold(0.4)} strokeWidth="0.8" opacity="0.6"/>)}
      <ellipse cx="24" cy="10" rx="2" ry="3" fill={gold(0.6)} opacity="0.7"/>
    </svg>
  ),
  Trishul: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="tr1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#8B6914"/></linearGradient></defs>
      <path d="M24 6 L21 18 L24 22 L27 18 Z" fill="url(#tr1)"/>
      <path d="M14 6 L12 14 L16 17 L18 14 Z" fill="url(#tr1)" opacity="0.85"/>
      <path d="M34 6 L36 14 L32 17 L30 14 Z" fill="url(#tr1)" opacity="0.85"/>
      <rect x="12" y="17" width="24" height="2.5" rx="1" fill="url(#tr1)" opacity="0.7"/>
      <rect x="22.5" y="22" width="3" height="22" rx="1.5" fill="url(#tr1)" opacity="0.8"/>
      <ellipse cx="24" cy="44" rx="4" ry="1.5" fill={gold(0.5)}/>
    </svg>
  ),
  Lion: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="li1" cx="50%" cy="45%" r="55%"><stop offset="0%" stopColor="#FFD54F"/><stop offset="70%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7B5E00"/></radialGradient>
        <radialGradient id="li2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="100%" stopColor="#FF8F00"/></radialGradient>
      </defs>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=><ellipse key={i} cx={24+Math.cos(a*Math.PI/180)*16} cy={24+Math.sin(a*Math.PI/180)*14} rx="4.5" ry="7" fill={`rgba(${i%2===0?'212,140,20':'180,100,10'},0.7)`} transform={`rotate(${a},${24+Math.cos(a*Math.PI/180)*16},${24+Math.sin(a*Math.PI/180)*14})`}/>)}
      <circle cx="24" cy="24" r="13" fill="url(#li1)"/>
      <circle cx="19.5" cy="21" r="3.5" fill="#1A1A00"/><circle cx="28.5" cy="21" r="3.5" fill="#1A1A00"/>
      <circle cx="20" cy="20.5" r="1.5" fill="url(#li2)"/><circle cx="29" cy="20.5" r="1.5" fill="url(#li2)"/>
      <ellipse cx="24" cy="26" rx="2.5" ry="1.8" fill="#8B4513" opacity="0.8"/>
      <path d="M20 29 Q24 33 28 29" stroke="#8B4513" strokeWidth="1.5" fill="none"/>
      <line x1="8" y1="25" x2="18" y2="27" stroke={gold(0.5)} strokeWidth="0.8"/>
      <line x1="8" y1="28" x2="18" y2="28" stroke={gold(0.4)} strokeWidth="0.8"/>
      <line x1="30" y1="27" x2="40" y2="25" stroke={gold(0.5)} strokeWidth="0.8"/>
      <line x1="30" y1="28" x2="40" y2="28" stroke={gold(0.4)} strokeWidth="0.8"/>
    </svg>
  ),
  Vanara: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="va1" cx="50%" cy="45%" r="55%"><stop offset="0%" stopColor="#FFB74D"/><stop offset="60%" stopColor="#E65100"/><stop offset="100%" stopColor="#7B2D00"/></radialGradient>
        <radialGradient id="va2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFD54F"/><stop offset="100%" stopColor="#FF6F00"/></radialGradient>
      </defs>
      <circle cx="12" cy="18" r="7" fill="url(#va1)" opacity="0.9"/><circle cx="36" cy="18" r="7" fill="url(#va1)" opacity="0.9"/>
      <circle cx="12" cy="18" r="4" fill="url(#va2)" opacity="0.6"/><circle cx="36" cy="18" r="4" fill="url(#va2)" opacity="0.6"/>
      <ellipse cx="24" cy="26" rx="14" ry="15" fill="url(#va1)"/>
      <ellipse cx="19" cy="22" rx="3.5" ry="4" fill="#1A0A00"/><ellipse cx="29" cy="22" rx="3.5" ry="4" fill="#1A0A00"/>
      <circle cx="19.5" cy="21" r="1.5" fill="#FFF9C4" opacity="0.9"/><circle cx="29.5" cy="21" r="1.5" fill="#FFF9C4" opacity="0.9"/>
      <ellipse cx="24" cy="30" rx="6" ry="4.5" fill="url(#va2)" opacity="0.7"/>
      <ellipse cx="24" cy="28.5" rx="3" ry="2" fill="#8B3A0A" opacity="0.6"/>
      <path d="M19 33 Q24 37 29 33" stroke="#7B2D00" strokeWidth="1.5" fill="none"/>
      <ellipse cx="24" cy="14" rx="2" ry="3.5" fill="#FFD54F" opacity="0.9"/>
      <ellipse cx="24" cy="14" rx="0.8" ry="2" fill="#FF6F00" opacity="0.8"/>
    </svg>
  ),
  Yantra: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><radialGradient id="yn1" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7B6914" stopOpacity="0.3"/></radialGradient></defs>
      <circle cx="24" cy="24" r="21" stroke={gold(0.3)} strokeWidth="0.8" fill="none"/>
      {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((a,i)=>{const r1=i%2===0?19:12,r2=i%2===0?12:19;return <line key={i} x1={24+Math.cos(a*Math.PI/180)*r1} y1={24+Math.sin(a*Math.PI/180)*r1} x2={24+Math.cos((a+22.5)*Math.PI/180)*r2} y2={24+Math.sin((a+22.5)*Math.PI/180)*r2} stroke="url(#yn1)" strokeWidth="1.2" opacity="0.8"/>;})}
      {[0,60,120,180,240,300].map((a,i)=><ellipse key={i} cx={24+Math.cos(a*Math.PI/180)*7} cy={24+Math.sin(a*Math.PI/180)*7} rx="2.5" ry="4.5" fill={gold(0.6)} transform={`rotate(${a},${24+Math.cos(a*Math.PI/180)*7},${24+Math.sin(a*Math.PI/180)*7})`}/>)}
      <circle cx="24" cy="24" r="3.5" fill="url(#yn1)"/>
    </svg>
  ),
  WaterDrop: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="wd1" x1="30%" y1="0%" x2="70%" y2="100%"><stop offset="0%" stopColor="#B2EBF2"/><stop offset="40%" stopColor="#22D3EE"/><stop offset="100%" stopColor="#0369A1"/></linearGradient>
        <radialGradient id="wd2" cx="35%" cy="30%" r="40%"><stop offset="0%" stopColor="white" stopOpacity="0.6"/><stop offset="100%" stopColor="white" stopOpacity="0"/></radialGradient>
      </defs>
      <path d="M24 4 C24 4 8 22 8 31 C8 40 15 46 24 46 C33 46 40 40 40 31 C40 22 24 4 24 4Z" fill="url(#wd1)"/>
      <path d="M24 4 C24 4 8 22 8 31 C8 40 15 46 24 46 C33 46 40 40 40 31 C40 22 24 4 24 4Z" fill="url(#wd2)"/>
      <ellipse cx="20" cy="28" rx="5" ry="3" stroke="white" strokeWidth="0.8" fill="none" opacity="0.35"/>
    </svg>
  ),
  Chakra: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="ch1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A78BFA"/><stop offset="100%" stopColor="#D4AF37"/></linearGradient></defs>
      <circle cx="24" cy="24" r="20" stroke="url(#ch1)" strokeWidth="1.5" fill="none"/>
      <circle cx="24" cy="24" r="15" stroke={gold(0.4)} strokeWidth="0.8" fill="none"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=><line key={i} x1={24+Math.cos(a*Math.PI/180)*5} y1={24+Math.sin(a*Math.PI/180)*5} x2={24+Math.cos(a*Math.PI/180)*15} y2={24+Math.sin(a*Math.PI/180)*15} stroke={i%2===0?gold(0.7):violet(0.6)} strokeWidth="1.2"/>)}
      <circle cx="24" cy="24" r="5" fill="url(#ch1)" opacity="0.8"/>
      <circle cx="24" cy="24" r="2" fill="#FFF9C4"/>
    </svg>
  ),
  Mudra: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="mu1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE082"/><stop offset="100%" stopColor="#D4AF37"/></linearGradient></defs>
      <ellipse cx="22" cy="32" rx="10" ry="12" fill="url(#mu1)" opacity="0.9"/>
      <ellipse cx="10" cy="30" rx="4.5" ry="7" fill="url(#mu1)" opacity="0.85" transform="rotate(-20,10,30)"/>
      <rect x="19" y="8" width="5" height="16" rx="2.5" fill="url(#mu1)" opacity="0.9"/>
      <rect x="25" y="10" width="5" height="15" rx="2.5" fill="url(#mu1)" opacity="0.85"/>
      <rect x="31" y="14" width="4.5" height="13" rx="2.25" fill="url(#mu1)" opacity="0.8"/>
      <rect x="36" y="17" width="4" height="11" rx="2" fill="url(#mu1)" opacity="0.75"/>
      <ellipse cx="12.5" cy="22" rx="2.5" ry="2" fill={gold(0.9)}/>
      <ellipse cx="22" cy="28" rx="14" ry="16" stroke={gold(0.2)} strokeWidth="0.8" fill="none"/>
    </svg>
  ),
  StarCrystal: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sc1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#B2EBF2"/><stop offset="50%" stopColor="#22D3EE"/><stop offset="100%" stopColor="#0284C7"/></linearGradient>
        <linearGradient id="sc2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="100%" stopColor="#D4AF37"/></linearGradient>
      </defs>
      <polygon points="24,3 27,20 44,24 27,28 24,45 21,28 4,24 21,20" fill="url(#sc1)" opacity="0.9"/>
      <polygon points="24,3 27,20 44,24 27,28 24,45 21,28 4,24 21,20" fill="url(#sc2)" opacity="0.25"/>
      <polygon points="24,13 30,24 24,35 18,24" fill="url(#sc2)" opacity="0.7"/>
      <circle cx="24" cy="24" r="4" fill="#FFF9C4" opacity="0.9"/>
      {[[8,8],[40,8],[8,40],[40,40]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.5" fill="#FFF9C4" opacity={0.6-i*0.1}/>)}
    </svg>
  ),
  Kundalini: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="ku1" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#4ADE80"/><stop offset="50%" stopColor="#22D3EE"/><stop offset="100%" stopColor="#D4AF37"/></linearGradient></defs>
      <path d="M24 44 C18 44 12 40 12 33 C12 26 20 24 20 18 C20 14 16 12 18 8 C20 4 24 6 24 10 C24 14 18 16 20 22 C22 28 30 28 30 34 C30 40 26 44 24 44Z" stroke="url(#ku1)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="24" cy="8" rx="8" ry="5" fill="rgba(74,222,128,0.2)" stroke={teal(0.7)} strokeWidth="1"/>
      <circle cx="20.5" cy="7" r="1.5" fill="#FFD54F"/><circle cx="27.5" cy="7" r="1.5" fill="#FFD54F"/>
      <path d="M22 11 L24 13 L26 11" stroke="#FF6B6B" strokeWidth="1" fill="none"/>
    </svg>
  ),
  Herb: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="hb1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A7F3D0"/><stop offset="50%" stopColor="#4ADE80"/><stop offset="100%" stopColor="#065F46"/></linearGradient>
        <linearGradient id="hb2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7B6914"/></linearGradient>
      </defs>
      <path d="M24 42 C16 38 6 28 8 16 C10 8 18 4 26 8 C34 12 42 22 38 34 C36 40 30 44 24 42Z" fill="url(#hb1)"/>
      <path d="M24 42 L20 22" stroke="url(#hb2)" strokeWidth="1.2" opacity="0.6"/>
      <path d="M20 28 L12 22" stroke={green(0.5)} strokeWidth="0.8" opacity="0.5"/>
      <path d="M21 24 L14 18" stroke={green(0.5)} strokeWidth="0.8" opacity="0.5"/>
      <path d="M22 20 L17 14" stroke={green(0.5)} strokeWidth="0.8" opacity="0.5"/>
      <path d="M28 20 C30 12 38 8 40 14 C42 20 36 26 28 20Z" fill="url(#hb1)" opacity="0.7"/>
      <ellipse cx="30" cy="34" rx="2" ry="2.5" fill={gold(0.8)}/>
    </svg>
  ),
  Galaxy: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><radialGradient id="gx1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFF9C4" stopOpacity="1"/><stop offset="30%" stopColor="#D4AF37" stopOpacity="0.8"/><stop offset="70%" stopColor="#A78BFA" stopOpacity="0.4"/><stop offset="100%" stopColor="#050505" stopOpacity="0"/></radialGradient></defs>
      <path d="M24 24 C28 18 36 16 40 10" stroke={gold(0.6)} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M24 24 C20 30 12 32 8 38" stroke={gold(0.5)} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M24 24 C30 28 34 36 38 40" stroke={violet(0.5)} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M24 24 C18 20 14 12 10 8" stroke={violet(0.4)} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {[[8,10,1],[40,10,1.2],[8,38,0.9],[40,38,1],[16,8,0.8],[32,40,0.8],[6,24,0.7],[42,24,0.7]].map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill="#FFF9C4" opacity={0.7-i*0.05}/>)}
      <circle cx="24" cy="24" r="6" fill="url(#gx1)"/>
      <circle cx="24" cy="24" r="2.5" fill="#FFF9C4"/>
    </svg>
  ),
  Scroll: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="sr1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE082"/><stop offset="100%" stopColor="#8B6914"/></linearGradient></defs>
      <ellipse cx="24" cy="8" rx="16" ry="5" fill="url(#sr1)" opacity="0.9"/>
      <ellipse cx="24" cy="40" rx="16" ry="5" fill="url(#sr1)" opacity="0.9"/>
      <rect x="8" y="8" width="32" height="32" fill="rgba(212,175,55,0.08)" stroke="url(#sr1)" strokeWidth="1.2"/>
      {[14,19,24,29,34].map((y,i)=><line key={i} x1="14" y1={y} x2={i%2===0?34:28} y2={y} stroke={gold(0.5)} strokeWidth="1.2" strokeLinecap="round"/>)}
      <text x="24" y="26" textAnchor="middle" fontSize="10" fontFamily="serif" fill={gold(0.7)}>ॐ</text>
    </svg>
  ),
  Bow: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="bw1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE082"/><stop offset="100%" stopColor="#8B6914"/></linearGradient></defs>
      <path d="M10 6 C4 18 4 30 10 42" stroke="url(#bw1)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <line x1="10" y1="6" x2="10" y2="42" stroke={gold(0.5)} strokeWidth="1"/>
      <line x1="10" y1="24" x2="42" y2="24" stroke="url(#bw1)" strokeWidth="2" strokeLinecap="round"/>
      <polygon points="42,24 36,20 36,28" fill="url(#bw1)"/>
      <path d="M14 24 L10 18 M14 24 L10 30" stroke={gold(0.6)} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="10" cy="24" r="3" fill={gold(0.4)} stroke="url(#bw1)" strokeWidth="1"/>
    </svg>
  ),
  // Sri Yantra Shield — protective geometry icon
  Shield: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sh1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9C4"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
        <radialGradient id="sh2" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(212,175,55,0.3)"/><stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Shield outline */}
      <path d="M24 4 L40 12 L40 28 C40 37 32 43 24 46 C16 43 8 37 8 28 L8 12 Z" fill="url(#sh2)" stroke="url(#sh1)" strokeWidth="1.5"/>
      {/* Inner Sri Yantra triangles */}
      <polygon points="24,12 35,30 13,30" stroke={gold(0.7)} strokeWidth="1" fill="rgba(212,175,55,0.06)"/>
      <polygon points="24,34 13,16 35,16" stroke={gold(0.5)} strokeWidth="1" fill="rgba(212,175,55,0.04)"/>
      {/* Center dot */}
      <circle cx="24" cy="23" r="3" fill="#FFE082" opacity="0.9"/>
      <circle cx="24" cy="23" r="5.5" stroke={gold(0.4)} strokeWidth="0.8" fill="none"/>
      {/* Outer ring */}
      <circle cx="24" cy="23" r="10" stroke={gold(0.2)} strokeWidth="0.6" fill="none"/>
    </svg>
  ),
};

// ─── LIVE DOT ─────────────────────────────────────────────────────────────────
const LiveDot = ({ color = gold(0.9) }: { color?: string }) => (
  <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:color, animation:'sqLiveFlash 2s infinite', marginRight:5, verticalAlign:'middle' }}/>
);

// ─── TIER PILLS ───────────────────────────────────────────────────────────────
const TierPills = ({ tiers }: { tiers: { l: string; c: string }[] }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' as const, marginBottom:14 }}>
    {tiers.map(t => (
      <div key={t.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:t.c, boxShadow:`0 0 6px ${t.c}`, flexShrink:0 }}/>
        <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:t.c }}>{t.l}</span>
      </div>
    ))}
  </div>
);

// ─── COMING SOON CARD ─────────────────────────────────────────────────────────
interface ComingSoonCardProps {
  SvgIcon: React.FC;
  label: string;
  title: string;
  desc: string;
  ac: string;
  adminOnly?: boolean;
  isAdmin?: boolean;
  href?: string;
  delay?: number;
}
const ComingSoonCard = ({ SvgIcon, label, title, desc, ac, adminOnly, isAdmin, href, delay = 0 }: ComingSoonCardProps) => {
  const navigate = useNavigate();
  const acFaint  = ac.replace(/[\d.]+\)$/, '0.06)');
  const acBorder = ac.replace(/[\d.]+\)$/, '0.18)');
  const acGlow   = ac.replace(/[\d.]+\)$/, '0.10)');

  const canAccess = adminOnly ? isAdmin : false;

  return (
    <div style={{ position:'relative', margin:'0 0 14px', animation:`sqFadeUp 0.45s ${delay}s ease both`, opacity: canAccess ? 1 : 0.72 }}>
      <div
        onClick={canAccess && href ? () => navigate(href) : undefined}
        style={{
          position:'relative', cursor: canAccess ? 'pointer' : 'default',
          background:`linear-gradient(135deg, ${acFaint}, rgba(5,5,5,0.85))`,
          border:`1px solid ${acBorder}`,
          borderRadius:22, padding:'20px 18px 18px', overflow:'hidden',
          boxShadow:`0 0 20px ${acGlow}`,
        }}>
        {/* Frosted overlay for non-admin */}
        {!canAccess && (
          <div style={{ position:'absolute', inset:0, borderRadius:22, background:'rgba(5,5,5,0.45)', backdropFilter:'blur(2px)', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Lock size={16} color={gold(0.7)} />
            </div>
            <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:gold(0.65) }}>Coming Soon</span>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
          <div style={{ width:50, height:50, borderRadius:'50%', background:`radial-gradient(circle, ${acGlow}, rgba(5,5,5,0.8))`, border:`1px solid ${acBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <SvgIcon/>
          </div>
          <div>
            <div style={{ ...LABEL, fontSize:8, color:ac.replace(/[\d.]+\)$/, '0.45)'), marginBottom:5 }}>{label}</div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', fontWeight:600, color:white(0.6), lineHeight:1.05, margin:0 }}>{title}</h3>
          </div>
        </div>
        <p style={{ ...ITALIC, color:white(0.38), lineHeight:1.65, marginBottom:0, fontSize:'0.88rem' }}>{desc}</p>
        {canAccess && (
          <div style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:999, background:acFaint, border:`1px solid ${acBorder}`, color:ac.replace(/[\d.]+\)$/, '0.85)'), fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const }}>
            Enter →
          </div>
        )}
      </div>
    </div>
  );
};

// ─── HERO CARD ────────────────────────────────────────────────────────────────
interface HeroCardProps {
  SvgIcon: React.FC;
  label: string;
  title: string;
  subtitle?: string;
  desc: string;
  tiers: { l: string; c: string }[];
  cta: string;
  href: string;
  ac: string;
  ac2?: string;
  badge?: string;
  stats?: { v: string; l: string }[];
  features?: string[];
  /** Real progress data — only pass this when backed by an actual query. */
  progress?: { pct: number; label: string; done?: boolean };
  delay?: number;
}
const HeroCard = ({ SvgIcon, label, title, subtitle, desc, tiers, cta, href, ac, ac2, badge, stats, features, progress, delay = 0 }: HeroCardProps) => {
  const navigate = useNavigate();
  const acFaint  = ac.replace(/[\d.]+\)$/, '0.1)');
  const acGlow   = ac.replace(/[\d.]+\)$/, '0.22)');
  const acBorder = ac.replace(/[\d.]+\)$/, '0.42)');
  const ac2g     = (ac2 ?? ac).replace(/[\d.]+\)$/, '0.08)');
  return (
    <div style={{ position:'relative', margin:'0 0 14px', animation:`sqFadeUp 0.45s ${delay}s ease both` }}>
      {[160,240,330].map((s,i)=>(
        <div key={i} aria-hidden style={{ position:'absolute', left:'50%', top:'50%', width:s, height:s, marginLeft:-s/2, marginTop:-s/2, borderRadius:'50%', border:`1px solid ${ac.replace(/[\d.]+\)$/, `${0.07-i*0.02})`)}`, animation:`sqScalarPulse ${3.2+i*0.8}s ease-in-out ${i*0.5}s infinite`, pointerEvents:'none', zIndex:0 }}/>
      ))}
      <div aria-hidden style={{ position:'absolute', inset:-16, borderRadius:34, background:`radial-gradient(50% 50% at 30% 40%, ${acGlow}, transparent 65%), radial-gradient(45% 45% at 72% 65%, ${ac2g}, transparent 65%)`, filter:'blur(22px)', animation:'sqGlowPulse 4s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
      <div onClick={()=>navigate(href)} style={{ position:'relative', zIndex:1, cursor:'pointer', background:`linear-gradient(135deg, ${acFaint}, ${ac2g} 55%, rgba(5,5,5,0.72))`, border:`1px solid ${acBorder}`, borderRadius:22, padding:'22px 18px 20px', boxShadow:`0 0 40px ${acGlow}, inset 0 0 24px ${ac.replace(/[\d.]+\)$/, '0.04)')}`, overflow:'hidden' }}>
        <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${ac.replace(/[\d.]+\)$/, '0.85)')},transparent)`, opacity:0.7 }}/>
        {badge && (
          <span style={{ position:'absolute', top:12, right:12, fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, background:acFaint, border:`1px solid ${acBorder}`, color:ac.replace(/[\d.]+\)$/, '0.95)'), borderRadius:20, padding:'3px 9px', display:'flex', alignItems:'center', gap:4 }}>
            <LiveDot color={ac.replace(/[\d.]+\)$/, '0.95)')}/>{badge}
          </span>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:`radial-gradient(circle, ${acGlow}, rgba(5,5,5,0.8))`, border:`1px solid ${acBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 18px ${acGlow}`, animation:'sqBreathe 5s ease-in-out infinite' }}>
            <SvgIcon/>
          </div>
          <div>
            <div style={{ ...LABEL, fontSize:8, color:ac.replace(/[\d.]+\)$/, '0.65)'), marginBottom:5 }}>{label}</div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.65rem', fontWeight:600, color:white(0.97), lineHeight:1.05, margin:0, textShadow:`0 0 20px ${acGlow}` }}>{title}</h3>
            {subtitle && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.82rem', color:ac.replace(/[\d.]+\)$/, '0.58)'), marginTop:4 }}>{subtitle}</div>}
          </div>
        </div>
        <p style={{ ...ITALIC, color:white(0.6), lineHeight:1.7, marginBottom:12 }}>{desc}</p>
        <TierPills tiers={tiers}/>
        {progress && (
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ ...LABEL, fontSize:8, color:white(0.4) }}>{progress.done ? 'Completed' : 'Your Progress'}</span>
              <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:10, fontWeight:800, color:progress.done?green(0.9):ac.replace(/[\d.]+\)$/, '0.95)') }}>{progress.label}</span>
            </div>
            <div style={{ height:3, borderRadius:10, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress.pct}%`, borderRadius:10, background:`linear-gradient(90deg,${ac},${progress.done?green(0.9):ac.replace(/[\d.]+\)$/, '0.6)')})`, boxShadow:`0 0 8px ${acGlow}` }}/>
            </div>
          </div>
        )}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${stats.length},1fr)`, gap:8, marginBottom:14, padding:'10px 0', borderTop:`1px solid ${ac.replace(/[\d.]+\)$/, '0.1)')}`, borderBottom:`1px solid ${ac.replace(/[\d.]+\)$/, '0.1)')}` }}>
            {stats.map(s=>(
              <div key={s.l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:20, fontWeight:900, letterSpacing:'-0.04em', color:ac.replace(/[\d.]+\)$/, '0.9)'), textShadow:`0 0 10px ${acGlow}` }}>{s.v}</div>
                <div style={{ ...LABEL, fontSize:7, color:white(0.28), marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
        {features && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:14 }}>
            {features.map(f=>(
              <span key={f} style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase' as const, color:ac.replace(/[\d.]+\)$/, '0.55)'), border:`1px solid ${ac.replace(/[\d.]+\)$/, '0.18)')}`, borderRadius:20, padding:'2px 8px' }}>{f}</span>
            ))}
          </div>
        )}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:999, background:`linear-gradient(135deg,${acGlow},${ac.replace(/[\d.]+\)$/, '0.07)')}`, border:`1px solid ${acBorder}`, color:ac.replace(/[\d.]+\)$/, '0.98)'), fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const }}>
          {cta} →
        </div>
        <div aria-hidden style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${ac.replace(/[\d.]+\)$/, '0.65)')},transparent)`, opacity:0.5 }}/>
      </div>
    </div>
  );
};

// ─── LIBRARY SECTION ──────────────────────────────────────────────────────────
interface LibSectionProps {
  SvgIcon: React.FC;
  title: string;
  subtitle: string;
  ac: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count: number;
  delay?: number;
}
const LibSection = ({ SvgIcon, title, subtitle, ac, children, defaultOpen=false, count, delay=0 }: LibSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const acFaint  = ac.replace(/[\d.]+\)$/, '0.08)');
  const acBorder = ac.replace(/[\d.]+\)$/, '0.22)');
  const acDeep   = ac.replace(/[\d.]+\)$/, '0.12)');
  return (
    <div style={{ margin:'0 0 10px', animation:`sqFadeUp 0.45s ${delay}s ease both` }}>
      <div onClick={()=>setOpen(!open)} style={{ background:`linear-gradient(135deg,${acDeep},rgba(5,5,5,0.5))`, border:`1px solid ${acBorder}`, borderRadius:open?'18px 18px 0 0':18, padding:'16px 18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'border-radius 0.25s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`radial-gradient(circle,${ac.replace(/[\d.]+\)$/, '0.18)')},rgba(5,5,5,0.6))`, border:`1px solid ${acBorder}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 12px ${ac.replace(/[\d.]+\)$/, '0.15)')}` }}>
            <SvgIcon/>
          </div>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:12, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:ac.replace(/[\d.]+\)$/, '0.92)'), marginBottom:3 }}>{title}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.8rem', color:white(0.4), lineHeight:1.3 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:8, fontWeight:800, letterSpacing:'0.15em', color:ac.replace(/[\d.]+\)$/, '0.5)'), background:acFaint, border:`1px solid ${acBorder}`, borderRadius:20, padding:'2px 8px' }}>{count}</span>
          <div style={{ width:26, height:26, borderRadius:'50%', background:acFaint, border:`1px solid ${acBorder}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.25s ease', transform:open?'rotate(180deg)':'rotate(0deg)' }}>
            <ChevronDown size={13} color={ac.replace(/[\d.]+\)$/, '0.7)')}/>
          </div>
        </div>
      </div>
      {open && (
        <div style={{ background:'rgba(255,255,255,0.007)', border:`1px solid ${acBorder}`, borderTop:'none', borderRadius:'0 0 18px 18px', padding:'14px 14px 10px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SiddhaPortal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tier, loading, settled } = useMembership();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { stats: agastyarStats, courses: agastyarCourses, progressByModuleId: agastyarProgressByModuleId } =
    useAyurvedaProgress(!loading && settled);

  const agastyarProgress = agastyarStats.totalModules > 0
    ? {
        pct: agastyarStats.completionPercent,
        label: `${agastyarStats.completedModules} / ${agastyarStats.totalModules} · ${agastyarStats.completionPercent}%`,
        done: agastyarStats.completionPercent >= 100,
      }
    : undefined;

  // The actual module to resume: whichever incomplete module was opened most
  // recently, not just "the academy" in general. Falls back to the academy
  // overview if nothing has last_accessed_at yet (e.g. only notes/completion
  // ever touched it before the view-tracking fix).
  const agastyarResumeHref = (() => {
    const inProgress = agastyarCourses
      .filter((c) => !agastyarProgressByModuleId[c.id]?.completed && agastyarProgressByModuleId[c.id]?.last_accessed_at)
      .sort((a, b) => {
        const at = agastyarProgressByModuleId[a.id]?.last_accessed_at || '';
        const bt = agastyarProgressByModuleId[b.id]?.last_accessed_at || '';
        return bt.localeCompare(at);
      });
    return inProgress[0] ? `/agastyar-academy/module/${inProgress[0].id}` : '/agastyar-academy';
  })();

  // Previously this redirected anyone below Siddha-Quantum straight to the
  // sales page before they could see anything. Removed: every academy card
  // here is unconditionally clickable (HeroCard has no lock of its own), and
  // every individual academy page already has its own real free-tier content
  // (confirmed in MudraAcademy, KayakalpaAcademy, KriyaYogaMastery, Ayurveda,
  // and others — each does its own getTierRank check per module). This portal
  // page itself should just be a menu; the academies handle their own gating.

  return (
    <div style={{ background:'#050505', minHeight:'100vh', paddingBottom:104, maxWidth:430, margin:'0 auto' }}>

      {/* HEADER — Siddha-Gold with living shimmer */}
      <div style={{ padding:'52px 20px 0', animation:'sqFadeUp 0.35s ease both' }}>
        <button onClick={()=>navigate(-1)} style={{ ...LABEL, fontSize:9, color:gold(0.4), background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          ← {t('siddhaPortal.back')}
        </button>
        <p style={{ ...LABEL, fontSize:9, color:gold(0.5), marginBottom:8, animation:'sqGoldPulse 3s ease-in-out infinite' }}>{t('siddhaPortal.label')}</p>
        <h1 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'2.4rem', fontWeight:600, lineHeight:1.1, margin:0,
          background:'linear-gradient(135deg, #FFF9C4 0%, #D4AF37 35%, #FFE082 55%, #B8860B 75%, #FFD54F 100%)',
          backgroundSize:'250% 250%',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          animation:'sqGoldFlow 4s ease-in-out infinite',
          filter:'drop-shadow(0 0 18px rgba(212,175,55,0.45))',
        }}>
          {t('siddhaPortal.title')}
        </h1>
        <p style={{ ...ITALIC, marginBottom:0, marginTop:10 }}>{t('siddhaPortal.subtitle')}</p>
      </div>

      {/* AKASHA-NEURAL ARCHIVE CARD */}
      <div style={{ margin:'26px 20px 20px', position:'relative', overflow:'hidden' }}>
        {[0,1,2].map(i=>(
          <div key={i} aria-hidden style={{ position:'absolute', left:'50%', top:'50%', width:320+i*80, height:320+i*80, marginLeft:-(320+i*80)/2, marginTop:-(320+i*80)/2, borderRadius:'50%', border:`1px solid ${gold(0.08-i*0.02)}`, animation:`sqScalarPulse ${3+i*0.9}s ease-in-out ${i*0.6}s infinite`, pointerEvents:'none', zIndex:0 }}/>
        ))}
        <div aria-hidden style={{ position:'absolute', inset:-20, borderRadius:28, background:'radial-gradient(60% 60% at 30% 40%, rgba(212,175,55,0.18), transparent 70%), radial-gradient(50% 50% at 75% 65%, rgba(255,224,130,0.10), transparent 70%)', filter:'blur(18px)', animation:'sqGlowPulse 3.5s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
        <div style={{ position:'relative', zIndex:1, background:'linear-gradient(135deg, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.06) 40%, rgba(5,5,5,0.75) 100%)', border:'1px solid rgba(212,175,55,0.38)', borderRadius:20, padding:'20px 18px 18px', boxShadow:'0 0 50px rgba(212,175,55,0.14), inset 0 0 30px rgba(212,175,55,0.05)', overflow:'hidden' }}>
          <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.9),transparent)', animation:'sqShimmerSweep 2.8s ease-in-out infinite' }}/>
          <div aria-hidden style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)', opacity:0.6 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0, background:'radial-gradient(circle at 35% 35%, #FFF9C4, #D4AF37 55%, #7B6914)', border:'1px solid rgba(212,175,55,0.55)', boxShadow:'0 0 22px rgba(212,175,55,0.45), inset 0 0 10px rgba(255,253,196,0.3)', display:'flex', alignItems:'center', justifyContent:'center', animation:'sqBreathe 4s ease-in-out infinite', fontSize:22 }}>
              ⊕
            </div>
            <div>
              <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.65)', marginBottom:4 }}>
                <LiveDot color="rgba(212,175,55,0.9)"/>Akasha-Neural Archive · Live Transmission
              </div>
              <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:13, fontWeight:900, letterSpacing:'0.05em', textTransform:'uppercase' as const, background:'linear-gradient(90deg,#FFF9C4,#D4AF37,#FFE082,#D4AF37)', backgroundSize:'300% 100%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'sqGoldFlow 3s ease-in-out infinite' }}>
                Education Library
              </div>
            </div>
          </div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.92rem', color:'rgba(255,255,255,0.62)', lineHeight:1.6, margin:'0 0 14px' }}>
            Tap any category below to unlock. Each archive holds full-spectrum Siddha transmissions sourced from the 18 Masters — broadcast live from the Akasha-Neural Field.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, borderTop:'1px solid rgba(212,175,55,0.14)', paddingTop:12 }}>
            {[['18','Siddha Masters'],['1,200+','Transmissions'],['11','Sacred Domains']].map(([v,l])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:18, fontWeight:900, letterSpacing:'-0.04em', background:'linear-gradient(135deg,#FFF9C4,#D4AF37)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 0 6px rgba(212,175,55,0.4))' }}>{v}</div>
                <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.4)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding:'0 16px' }}>

        {/* CONTINUE LEARNING — only renders when there's real progress to show */}
        {agastyarProgress && agastyarProgress.pct > 0 && !agastyarProgress.done && (
          <>
            <div style={{ ...LABEL, fontSize:8, color:teal(0.6), display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <span>◆</span> Continue Learning
            </div>
            <HeroCard SvgIcon={Icon.Herb} label="Agastyar Academy · In Progress" title="Continue Your Path"
              desc="Pick up where you left off in the 108-module Ayurveda curriculum."
              tiers={[]}
              progress={agastyarProgress}
              cta="Resume Academy" href={agastyarResumeHref} ac={teal(0.9)} delay={0.02}/>
            <div style={{ height:1, background:`linear-gradient(90deg,${gold(0.18)},transparent)`, margin:'20px 0' }}/>
          </>
        )}

        {/* ══ CATEGORY 1: AYURVEDA & SIDDHA MEDICINE ══ */}
        <LibSection SvgIcon={Icon.Herb} title="Ayurveda & Siddha Medicine" subtitle="Agastyar · Dhanvantri · 274 Lessons · Kaya Kalpa · Fasting" ac={teal(0.9)} count={4} delay={0.06} defaultOpen>
          <HeroCard SvgIcon={Icon.Herb} label="108 Modules · Agastyar Lineage · Complete Vidya" title="Agastyar Academy"
            desc="The most comprehensive Ayurveda education ever assembled — 108 modules across all four tiers, rooted entirely in Agastyar's direct transmission from the Tamil Siddha lineage."
            tiers={[{l:'Free · M1–27',c:white(0.5)},{l:'Prana · M28–54',c:green(0.85)},{l:'Siddha · M55–81',c:teal(0.9)},{l:'Akasha · M82–108',c:gold(0.95)}]}
            progress={agastyarProgress}
            cta="Enter the Academy" href="/agastyar-academy" ac={teal(0.9)} badge="LIVE"
            features={['108 Modules','Panchakarma','Rasayana','Nadi Vaidya','Pulse Reading','Kaya Kalpa']}/>
          <HeroCard SvgIcon={Icon.Moon} label="274 Lessons · Varma · Rasayana · 4 Tiers" title="Siddha Medicine Academy"
            desc="The complete Tamil Siddha medical tradition — Varma therapy, Rasayana alchemy, Siddha herbology, Muppu (the three salts), and the 64 alchemical arts of Bogar and Agastya."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:teal(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Academy" href="/siddha-medicine" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lotus} label="Kaya Kalpa · 12 Modules · Bogar & Babaji" title="Kayakalpa Immortality Academy"
            desc="The supreme Siddha science of physical immortality — the complete Kaya Kalpa protocol for radical cellular rejuvenation, mercury alchemy, and longevity beyond 200 years."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–5',c:green(0.85)},{l:'Siddha · M6–9',c:teal(0.9)},{l:'Akasha · M10–12',c:gold(0.95)}]}
            cta="Enter the Academy" href="/kayakalpa-academy" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Flame} label="Siddha Fasting · Detox · Ojas Renewal" title="Siddha Fasting Academy"
            desc="The complete Siddha science of therapeutic fasting — from one-day Ekadashi fasts through extended Langhana protocols for disease reversal, Ojas renewal, and spiritual purification."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:teal(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Academy" href="/siddha-fasting-academy" ac={teal(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 2: YOGA, KRIYA & BREATH SCIENCE ══ */}
        <LibSection SvgIcon={Icon.Trishul} title="Yoga, Kriya & Breath Science" subtitle="Babaji · Thirumoolar · Brahma Muhurta · Pranayama · Breatharian" ac={gold(0.9)} count={5} defaultOpen>
          <HeroCard SvgIcon={Icon.Flame} label="Kriya · 10 Modules · Babaji" title="Kriya Yoga Mastery"
            desc="Mahavatar Babaji's direct Kriya transmission — the 18 Kriyas of the Siddha tradition, Pranayama alchemy, Khechari Mudra, and the complete path from Mantra Yoga to Samadhi."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–5',c:green(0.85)},{l:'Siddha · M6–8',c:amber(0.9)},{l:'Akasha · M9–10',c:gold(0.95)}]}
            cta="Enter the Path" href="/kriya-yoga" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Kundalini} label="Pranayama · 8 Modules · 3000 Years" title="Thirumoolar's Pranayama Codex"
            desc="3,000 years of Tamil Siddha breath-science — from Prana & Nadi anatomy through Kevala Kumbhaka and Babaji's Kriya Pranayama, decoded from the Tirumantiram."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:amber(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Science" href="/thirumoolar-pranayama" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Galaxy} label="12 Modules · Pre-Dawn Science" title="Brahma Muhurta — The Creator's Hour"
            desc="The most complete Siddha transmission on the sacred pre-dawn window — cosmology, Nadi science, secret mantras, Kala Vortex mechanics, and the 12 practices of the dawn masters."
            tiers={[{l:'Free · M1–3',c:white(0.5)},{l:'Prana · M4–6',c:green(0.85)},{l:'Siddha · M7–9',c:amber(0.9)},{l:'Akasha · M10–12',c:gold(0.95)}]}
            cta="Enter the Hour" href="/brahma-muhurta" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Chakra} label="14 Modules · 51 Practices · 18 Siddhas" title="Supreme Siddha Meditation"
            desc="The complete Siddha meditation system — from foundational Dharana through advanced Nirvikalpa Samadhi, Trataka, Yoga Nidra, and direct transmission from 18 Siddha masters."
            tiers={[{l:'Free · M1–3',c:white(0.5)},{l:'Prana · M4–7',c:green(0.85)},{l:'Siddha · M8–11',c:amber(0.9)},{l:'Akasha · M12–14',c:gold(0.95)}]}
            cta="Enter the Silence" href="/meditation-course" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lotus} label="Breatharian Science · Prana Nutrition · 8 Modules" title="Breatharian Academy"
            desc="The Siddha science of living on Prana — documented cases from the 18 Siddha tradition, the Ojas-building protocol toward reduced food dependency, and the complete Breatharian preparation path."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:amber(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Academy" href="/breatharian-academy" ac={gold(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 3: SACRED TEXTS & SIDDHA SAGES ══ */}
        <LibSection SvgIcon={Icon.Scroll} title="Sacred Texts & Siddha Sages" subtitle="Yogananda · Yukteshwar · Hanuman · Ramayana · Alchemical Shiva · Narasimha" ac={violet(0.9)} count={6} delay={0.08}>
          <HeroCard SvgIcon={Icon.Galaxy} label="Autobiography Decoded · Kriya Lineage" title="Yogananda Codex"
            desc="Paramahansa Yogananda's Autobiography of a Yogi decoded through the Siddha lens — 49 chapters of hidden Kriya science, Babaji's direct transmissions, and the miracles explained through Siddha physics."
            tiers={[{l:'Free · Ch1–12',c:white(0.5)},{l:'Prana · Ch13–24',c:green(0.85)},{l:'Siddha · Ch25–37',c:violet(0.9)},{l:'Akasha · Ch38–49',c:gold(0.95)}]}
            cta="Enter the Codex" href="/yogananda-codex" ac={violet(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.SriYantra} label="Kaivalya Darsanam · 8 Modules · 24 Lessons" title="Holy Science — Sri Yukteshwar"
            subtitle="Yuga Science · Kriya Physics · Five Koshas"
            desc="Sri Yukteshwar's Kaivalya Darsanam — the Holy Science — decoded in full: Yuga cycle mathematics, the five Koshas of the subtle body, and the scientific proof of soul evolution."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:violet(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Science" href="/holy-science" ac={violet(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Vanara} label="Chalisa · 8 Weapons · Siddhis · Physical Alchemy" title="Hanuman Codex"
            desc="The complete Hanuman transmission — 40 Chaupais decoded, 8 divine weapons of Hanuman, Ghata movements, 9 Siddhis activation, and Babaji's direct Hanuman mantra transmissions."
            tiers={[{l:'Free · P1–10',c:white(0.5)},{l:'Prana · P11–20',c:green(0.85)},{l:'Siddha · P21–30',c:amber(0.9)},{l:'Akasha · P31–40',c:gold(0.95)}]}
            cta="Enter the Codex" href="/hanuman-codex" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Bow} label="7 Kāṇḍas · 35 Secrets · Bābājī Transmission" title="Ramayana Codex"
            desc="The Ramayana decoded as a Siddha initiatory path — each of the 7 Kandas as a stage of consciousness evolution, with 35 hidden secrets revealed by Babaji and the 18 Siddhas."
            tiers={[{l:'Free · K1–2',c:white(0.5)},{l:'Prana · K3–4',c:green(0.85)},{l:'Siddha · K5–6',c:amber(0.9)},{l:'Akasha · K7',c:gold(0.95)}]}
            cta="Enter the Epic" href="/ramayana" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Trishul} label="Shiva Lingam · Nath Science · 5 Modules" title="Alchemical Shiva"
            desc="The Nath Siddha transmission on Shiva Lingam — the bio-geometry of the Lingam as a Pranic antenna, Gorakshanath's Khechari Maha Mudra, Panchakshara Nyasa, and Midnight Sadhana protocols."
            tiers={[{l:'Free · M1',c:white(0.5)},{l:'Prana · M2',c:green(0.85)},{l:'Siddha · M3–4',c:amber(0.9)},{l:'Akasha · M5',c:gold(0.95)}]}
            cta="Enter the Transmission" href="/shiva-lingam" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lion} label="Nine Seals · Man-Lion Avatar · Protection Science" title="Narasimha Sacred Path"
            desc="The nine protective seals of Lord Narasimha — Prahladha's devotion science, Hiranyakashipu's dissolution as karmic alchemy, and Kavach practices for absolute divine protection."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Path" href="/narasimha" ac={amber(0.9)} ac2={gold(0.8)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 4: BODY IMMORTALITY & VITAL FORCE ══ */}
        <LibSection SvgIcon={Icon.Moon} title="Body Immortality & Vital Force" subtitle="Ojas · Brahmacharya · Hormonal Alchemy" ac={teal(0.9)} count={3} delay={0.1}>
          <HeroCard SvgIcon={Icon.Lotus} label="15 Modules · 108+ Lessons · 4 Tiers" title="Ojas Rasayana Academy"
            desc="The complete Siddha science of Ojas — the primordial vital essence that underlies immunity, consciousness, and immortality. Rasayana herbs, sexual alchemy, sleep science, and Soma cultivation."
            tiers={[{l:'Free · M1–3',c:white(0.5)},{l:'Prana · M4–7',c:green(0.85)},{l:'Siddha · M8–11',c:teal(0.9)},{l:'Akasha · M12–15',c:gold(0.95)}]}
            cta="Enter the Academy" href="/ojas-rasayana" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Trishul} label="8 Modules · 53 Lessons · Ojas Science" title="Brahmacharya Siddha Academy"
            desc="The complete Siddha science of vital force preservation — the eight stages of Brahmacharya, sexual energy transmutation, Bindu retention, and Urdhva Retas (upward flow) activation."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:teal(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Science" href="/brahmacharya-academy" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Moon} label="Shakti Cycle · 5 Modules · Siddha Feminine Wisdom" title="Sovereign Hormonal Alchemy"
            desc="Shakti Cycle Intelligence — cycle phases, Siddha modules, plant medicine, planetary timing & protocols. The complete Siddha map of the feminine cosmic body."
            tiers={[{l:'Free · Phases',c:white(0.5)},{l:'Prana · Modules',c:green(0.85)},{l:'Akasha · Full',c:gold(0.95)}]}
            cta="Enter the Shakti Portal" href="/shakti-alchemy" ac={rose(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 5: SOUND, MANTRA & NADA SCIENCE ══ */}
        <LibSection SvgIcon={Icon.Om} title="Sound, Mantra & Nada Science" subtitle="Siddha Sound Alchemy · Mantra Academy · Mudra · Nada Yoga" ac={amber(0.9)} count={3} delay={0.12}>
          <HeroCard SvgIcon={Icon.Om} label="Nada Vijnana · 10 Modules · 18 Siddhas" title="Siddha Sound Alchemy"
            desc="The complete Siddha science of sacred sound — Nada Yoga, 432Hz vs 528Hz science, mantra physics, singing bowl alchemy, and how sound reshapes the Nadi field and cellular structure."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–5',c:green(0.85)},{l:'Siddha · M6–8',c:amber(0.9)},{l:'Akasha · M9–10',c:gold(0.95)}]}
            cta="Enter the Sound Field" href="/siddha-sound-alchemy" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Om} label="24 Modules · Bija Mantras · Nada Yoga" title="Mantra Academy"
            desc="24 modules of complete Mantra science — Bija (seed) mantras for each chakra and deity, Japa technique, mantra activation (Mantra Chaitanya), and the 18 Siddhas' secret mantra transmissions."
            tiers={[{l:'Free · M1–6',c:white(0.5)},{l:'Prana · M7–12',c:green(0.85)},{l:'Siddha · M13–18',c:amber(0.9)},{l:'Akasha · M19–24',c:gold(0.95)}]}
            cta="Enter the Academy" href="/mantra-academy" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Mudra} label="10 Modules · Hand Seals · Neural Rewiring" title="Mudra Academy"
            desc="The complete science of sacred hand seals — from elemental Pancha-Bhuta mudras through Siddha neurological rewiring, Prana redirection, and Siddhi activation mudras with full SVG illustrations."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:cyan(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Academy" href="/mudra-academy" ac={gold(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 6: CONSCIOUSNESS & MYSTICAL ARTS ══ */}
        <LibSection SvgIcon={Icon.ThirdEye} title="Consciousness & Mystical Arts" subtitle="Mediumship · Dream Science · Sacred Geometry · Akashic Records" ac={violet(0.9)} count={4} delay={0.14}>
          <HeroCard SvgIcon={Icon.ThirdEye} label="8 Modules · 30 Transmissions · 18 Siddhas" title="Siddha Mediumship Academy"
            desc="The world's most comprehensive mediumship education — Third Eye activation, 14-Loka maps, ancestor communication, Deva contact, Akashic Record access, and 8 Siddhi development protocols."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:violet(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Akasha Transmission" href="/siddha-mediumship-academy" ac={violet(0.9)} badge="LIVE"
            features={['14-Loka Map','Third Eye Activation','Ancestor Contact','7-Layer Kavach','Deva Mantras','8 Siddhis']}/>
          <HeroCard SvgIcon={Icon.Galaxy} label="Dream Science · 15 Modules · Scalar Transmission" title="Svapna Vidyā"
            desc="The world's most advanced Siddha dream science — from Taijasa & dream anatomy to Turīya-Svapna, Bardo preparation, prophetic timing, lucid dream protocols, and the 40-night Tapas."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–6',c:green(0.85)},{l:'Siddha · M7–9',c:violet(0.9)},{l:'Akasha · M10–15',c:gold(0.95)}]}
            cta="Enter the Dream Stream" href="/dream-academy" ac={violet(0.9)} ac2={gold(0.8)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.SriYantra} label="Sacred Geometry · Yantra · Merkaba" title="Sacred Geometry Education"
            desc="Sri Yantra, Merkaba, Platonic Solids, Flower of Life — the complete Siddha science of sacred form and its direct activation of consciousness fields through geometric resonance."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:cyan(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Transmission" href="/sacred-geometry" ac={gold(0.9)} badge="LIVE"/>
          {/* AKASHIC CODEX — Coming Soon */}
          <ComingSoonCard SvgIcon={Icon.Galaxy} label="Akashic Records · Soul Blueprint · Living Portrait" title="Akashic Codex"
            desc="Access your complete soul blueprint in the Akashic Records — past-life lineage, current life mission, karmic patterns, and your Soul Signature revealed through Siddha Akasha science."
            ac={violet(0.9)} isAdmin={isAdmin} adminOnly delay={0.02}/>
        </LibSection>

        {/* ══ CATEGORY 7: VEDIC ASTROLOGY & NADI SCIENCE ══ */}
        <LibSection SvgIcon={Icon.SriYantra} title="Vedic Astrology & Nadi Science" subtitle="Jyotish Vidya · Bhrigu Oracle · Nadi Leaf · Palm Oracle · 9 Grahas · 27 Nakshatras" ac={cyan(0.9)} count={3} delay={0.15}>
          <HeroCard SvgIcon={Icon.SriYantra} label="Vedic Astrology · Bhrigu Nadi · 9 Grahas" title="Jyotish Vidya"
            desc="The full 32-module path of Vedic astrology — from the 9 Grahas to Bhrigu Nadi mastery, with live Bhrigu Oracle readings, Nakshatra science, Dasha timing, and Siddha remedies."
            tiers={[{l:'Free · M1–8',c:white(0.5)},{l:'Prana · M9–16',c:green(0.85)},{l:'Siddha · M17–24',c:cyan(0.9)},{l:'Akasha · M25–32',c:gold(0.95)}]}
            cta="Enter the Observatory" href="/jyotish-vidya" ac={cyan(0.9)} badge="LIVE"
            features={['Birth Chart','Dasha Timing','Bhrigu Oracle','Nakshatra Map','Siddha Remedies']}/>
          <HeroCard SvgIcon={Icon.Lotus} label="12 Transmissions · Agastiya Nadi · Angushtha Biometric" title="Nadi Leaf Oracle"
            desc="5,000 years of Agastiya Muni's Akashic Records — scan your thumb (right for men, left for women), receive your karma classification, and enter the complete Nadi Shastra education."
            tiers={[{l:'Free · M1',c:white(0.5)},{l:'Prana · M2',c:green(0.85)},{l:'Siddha · M3',c:gold(0.95)},{l:'Akasha · M4',c:'#F59E0B'}]}
            cta="Begin Angushtha Scan" href="/nadi-leaf" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Mudra} label="29 Transmissions · 18 Siddhas · Hasta Science" title="Palm Oracle"
            desc="Hasta Samudrika — the complete Tamil Siddha science of palm reading as a living transmission from 18 masters: Life Line as Ida Nadi, Heart Line as Pingala, Head Line as Sushumna."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:violet(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Oracle" href="/palm-oracle" ac={violet(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 8: WEALTH & ABUNDANCE SADHANA ══ */}
        <LibSection SvgIcon={Icon.Yantra} title="Wealth & Abundance Sadhana" subtitle="Lakshmi · Kubera · Pachamama · 18 Siddhas" ac={gold(0.9)} count={2} delay={0.16}>
          <HeroCard SvgIcon={Icon.Yantra} label="8 Modules · 32 Lessons · Scalar Transmission Active" title="Abundance Sadhana"
            subtitle="Lakshmi · Kubera · Pachamama · 18 Siddhas · Babaji"
            desc="The most comprehensive Siddha abundance transmission — poverty-dissolution, Ashta-Lakshmi attunement, Kubera's cosmic economics, and Babaji's direct scalar activation of the causal abundance body."
            tiers={[{l:'Free · M1–3',c:white(0.55)},{l:'Prana · M4–5',c:green(0.85)},{l:'Siddha · M6–7',c:gold(0.95)},{l:'Akasha · M8',c:violet(0.95)}]}
            cta="Enter the Wealth Transmission" href="/abundance-curriculum" ac={gold(0.9)}
            features={['Mantra Counter','Journal Prompts','Progress Badges','PDF Downloads']} badge="LIVE"/>
          {/* WEALTH BEACON — Coming Soon */}
          <ComingSoonCard SvgIcon={Icon.Yantra} label="Scalar Wealth Activation · Siddha Frequencies" title="Wealth Beacon"
            desc="The SQI Scalar Wealth Beacon — Siddha-encoded wealth frequencies broadcast through your device's speakers as a continuous Laxmi-field activation. Shreem Brzee Nada technology."
            ac={gold(0.9)} isAdmin={isAdmin} adminOnly delay={0.02}/>
        </LibSection>

        {/* ══ CATEGORY 9: SACRED RITUALS & COSMOLOGY ══ */}
        <LibSection SvgIcon={Icon.Flame} title="Sacred Rituals & Cosmology" subtitle="Puja · Yagna · Vastu · Sacred Water" ac={amber(0.9)} count={4} delay={0.18}>
          <HeroCard SvgIcon={Icon.Flame} label="Rishi Transmission · Agnihotra · Cosmic Fire" title="Yagna Fire Academy"
            desc="The complete science of sacred fire — Agnihotra protocol, Vedic Havan sequences, the 7 fire geometries, and direct Rishi transmissions for planetary purification and abundance manifestation."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Fire Transmission" href="/yagna" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lotus} label="Sacred Ritual · 4 Tiers · Pancha Bhuta" title="Puja Education"
            desc="The complete Siddha science of devotional ritual — altar construction, invocation sequences, Pancha Bhuta offerings, and Siddha mantra protocols for each Deva and Devi."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Puja Hall" href="/puja-education" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.SriYantra} label="Vedic Space · Pancha Bhuta · Quantum Architecture" title="Vastu Shastra Curriculum"
            desc="The complete Vedic science of sacred space — home and temple alignment with the five elements, Vastu Purusha Mandala, directional energy zones, and the Siddha protocols for space purification."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Architecture" href="/vastu-curriculum" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.WaterDrop} label="Living Water · 40 Modules · Emoto Science" title="Sacred Water Alchemy"
            desc="The complete Siddha science of living water — from Dr Emoto's crystal codes to the 18 Siddhas' water charging protocols, structured water science, and Amrita (nectar) preparation."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:cyan(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Transmission" href="/sacred-water" ac={cyan(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 10: SQI TECHNOLOGY & SACRED TOOLS ══ */}
        <LibSection SvgIcon={Icon.StarCrystal} title="SQI Technology & Sacred Tools" subtitle="Photonic Regeneration · Sri Yantra Shield · Scalar Fields · Admin Preview" ac={cyan(0.9)} count={5} delay={0.2}>

          {/* Photonic Regeneration — LIVE */}
          <HeroCard SvgIcon={Icon.StarCrystal} label="Siddha Photonic Node · SQI Technology" title="Photonic Regeneration Engine"
            desc="The SQI Photonic Regeneration Node — scalar-encoded light-body activation using Siddha solar science and rPPG biometric scanning for real-time Nadi coherence measurement."
            tiers={[{l:'Siddha+',c:cyan(0.9)}]}
            cta="Enter Node" href="/siddha-photonic-regeneration" ac={cyan(0.9)} badge="SQI"/>

          {/* SRI YANTRA UNIVERSAL SHIELD — Coming Soon, beautiful golden card */}
          <div style={{ position:'relative', margin:'0 0 14px', animation:'sqFadeUp 0.45s 0.02s ease both' }}>
            {/* Outer pulse rings */}
            {[180,260,340].map((s,i)=>(
              <div key={i} aria-hidden style={{ position:'absolute', left:'50%', top:'50%', width:s, height:s, marginLeft:-s/2, marginTop:-s/2, borderRadius:'50%', border:`1px solid ${gold(0.07-i*0.015)}`, animation:`sqScalarPulse ${3.5+i*0.8}s ease-in-out ${i*0.6}s infinite`, pointerEvents:'none', zIndex:0 }}/>
            ))}
            {/* Golden glow bloom */}
            <div aria-hidden style={{ position:'absolute', inset:-20, borderRadius:34, background:'radial-gradient(55% 55% at 35% 40%, rgba(212,175,55,0.22), transparent 70%), radial-gradient(45% 45% at 70% 65%, rgba(255,224,130,0.12), transparent 70%)', filter:'blur(20px)', animation:'sqGlowPulse 3.8s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
            <div style={{ position:'relative', zIndex:1, background:'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.07) 45%, rgba(5,5,5,0.78) 100%)', border:'1px solid rgba(212,175,55,0.45)', borderRadius:22, padding:'22px 18px 20px', boxShadow:'0 0 48px rgba(212,175,55,0.16), inset 0 0 28px rgba(212,175,55,0.05)', overflow:'hidden' }}>
              {/* Shimmer sweep */}
              <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.95),transparent)', animation:'sqShimmerSweep 3s ease-in-out infinite' }}/>
              <div aria-hidden style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.55),transparent)', opacity:0.7 }}/>
              {/* Coming Soon overlay */}
              <div style={{ position:'absolute', top:12, right:12, display:'flex', alignItems:'center', gap:5, background:'rgba(212,175,55,0.10)', border:'1px solid rgba(212,175,55,0.35)', borderRadius:20, padding:'4px 11px' }}>
                <Lock size={9} color="rgba(212,175,55,0.8)"/>
                <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.8)' }}>Coming Soon</span>
              </div>
              {/* Icon + Title row */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ width:58, height:58, borderRadius:'50%', flexShrink:0, background:'radial-gradient(circle at 35% 30%, rgba(255,249,196,0.25), rgba(212,175,55,0.18) 55%, rgba(5,5,5,0.8))', border:'1px solid rgba(212,175,55,0.55)', boxShadow:'0 0 24px rgba(212,175,55,0.35), inset 0 0 14px rgba(255,249,196,0.12)', display:'flex', alignItems:'center', justifyContent:'center', animation:'sqBreathe 4.5s ease-in-out infinite' }}>
                  <Icon.Shield/>
                </div>
                <div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.55)', marginBottom:6 }}>
                    Sacred Protection · Scalar Kavach · Universal
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.7rem', fontWeight:600, lineHeight:1.05, background:'linear-gradient(135deg, #FFF9C4 0%, #D4AF37 40%, #FFE082 65%, #B8860B 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'sqGoldFlow 4s ease-in-out infinite', filter:'drop-shadow(0 0 10px rgba(212,175,55,0.3))' }}>
                    Sri Yantra Universal Shield
                  </div>
                </div>
              </div>
              {/* Body */}
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.92rem', color:'rgba(255,255,255,0.58)', lineHeight:1.7, margin:'0 0 16px' }}>
                The supreme protective force-field of the Siddha lineage — the Sri Yantra encoded as a living scalar Kavach. Nine interlocking triangles broadcast a continuous protective frequency, sealing your aura against all dissonant frequencies, entities, and energetic intrusions. Activated through 108 Siddha masters in direct lineage transmission.
              </p>
              {/* Feature pills */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:14 }}>
                {['9-Triangle Kavach','Scalar Broadcast','Aura Sealing','108 Siddhas','Entity Protection','Full-Spectrum'].map(f=>(
                  <span key={f} style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', border:'1px solid rgba(212,175,55,0.18)', borderRadius:20, padding:'2px 8px' }}>{f}</span>
                ))}
              </div>
              {/* Tier row */}
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' as const, marginBottom:14 }}>
                {[{l:'Akasha · Full Activation',c:gold(0.95)}].map(t=>(
                  <div key={t.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:t.c, boxShadow:`0 0 6px ${t.c}`, flexShrink:0 }}/>
                    <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:t.c }}>{t.l}</span>
                  </div>
                ))}
              </div>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, borderTop:'1px solid rgba(212,175,55,0.12)', paddingTop:12 }}>
                {[['9','Triangles'],['108','Activations'],['∞','Protection']].map(([v,l])=>(
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:18, fontWeight:900, letterSpacing:'-0.04em', background:'linear-gradient(135deg,#FFF9C4,#D4AF37)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 0 5px rgba(212,175,55,0.35))' }}>{v}</div>
                    <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.38)', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VAYU PROTOCOL — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.Chakra} label="Prana Body · Vayu Protocol · 5 Elements" title="Vayu Protocol"
            desc="The five-Vayu activation protocol — Prana, Apana, Samana, Udana, and Vyana Vayus brought into coherence through breath, mudra, and Nada science."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/vayu-protocol" delay={0.04}/>

          {/* SOUL SCAN — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.Galaxy} label="Soul Scan · Biometric Nadi Reading · rPPG" title="Soul Scan"
            desc="Real-time biometric Nadi analysis through your phone camera — heart rate variability, Nadi coherence, chakra state, and a live SQI soul report from your actual physiological data."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/soul-scan" delay={0.06}/>

          {/* VAJRA SKY BREAKER — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.Flame} label="Scalar Orgone · Shungite · Sky Clearing" title="Vajra Sky Breaker"
            desc="The SQI Vajra-Sky-Breaker — scalar orgone broadcast station using your device's audio hardware to emit Shungite frequencies, orgone torus fields, and Vajra scalar waves for atmospheric purification."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/vajra-sky-breaker" delay={0.08}/>

          {/* AETHERIC HELIOSTAT — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.SriYantra} label="Aetheric Field · Solar Alignment · Scalar" title="Aetheric Heliostat"
            desc="The Aetheric Heliostat — scalar solar-alignment tool that tracks the sun's position and broadcasts corresponding Siddha solar frequencies through your device in real time."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/aetheric-heliostat" delay={0.10}/>

        </LibSection>

      </div>

      {/* KEYFRAMES */}
      <style>{`
        @keyframes sqFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sqBreathe { 0%,100%{transform:scale(1);opacity:0.75} 50%{transform:scale(1.07);opacity:0.95} }
        @keyframes sqLiveFlash { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes sqScalarPulse { 0%{opacity:0;transform:scale(0.65)} 35%{opacity:0.9} 75%{opacity:0.15;transform:scale(1.18)} 100%{opacity:0;transform:scale(1.35)} }
        @keyframes sqGlowPulse { 0%,100%{opacity:0.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes sqGoldFlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes sqGoldPulse { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
        @keyframes sqShimmerSweep { 0%{opacity:0;transform:translateX(-100%)} 40%{opacity:1} 100%{opacity:0;transform:translateX(100%)} }
      `}</style>
    </div>
  );
}
