import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Leaf, Sparkles, Flame, Infinity } from 'lucide-react';
import { DoshaQuiz } from './DoshaQuiz';
import { DoshaDashboard } from './DoshaDashboard';
import { AyurvedaChatConsultation } from './AyurvedaChatConsultation';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import { useTranslation } from '@/hooks/useTranslation';
import type { AyurvedaUserProfile, AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');
.sqi-root,.sqi-root *{box-sizing:border-box}
.sqi-root{font-family:'Plus Jakarta Sans',sans-serif}
.sqi-glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.055);border-radius:40px}
.sqi-gold{color:#D4AF37;text-shadow:0 0 20px rgba(212,175,55,0.35)}
.sqi-shimmer{background:linear-gradient(90deg,#D4AF37 0%,#FFF3A0 35%,#D4AF37 55%,#B8960C 80%,#D4AF37 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sqiShimmer 4s linear infinite}
.sqi-serif{font-family:'Cormorant Garamond',serif}
.sqi-label{font-size:8px;font-weight:800;letter-spacing:0.55em;text-transform:uppercase;color:#D4AF37;opacity:0.75}
.sqi-particle{position:absolute;border-radius:50%;animation:sqiTwinkle var(--d,3s) ease-in-out infinite var(--dl,0s)}
@keyframes sqiShimmer{0%{background-position:-300% center}100%{background-position:300% center}}
@keyframes sqiTwinkle{0%,100%{opacity:0.06}50%{opacity:0.55}}
@keyframes sqiBreathe{0%,100%{opacity:0.1;transform:scale(1)}50%{opacity:0.28;transform:scale(1.1)}}
@keyframes sqiOrbit{to{transform:rotate(360deg)}}
@keyframes sqiGoldPulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.5)}50%{box-shadow:0 0 0 10px rgba(212,175,55,0)}}
@keyframes sqiTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes sqiGlow{0%,100%{box-shadow:0 0 20px rgba(255,140,0,0.2),0 0 40px rgba(212,175,55,0.1)}50%{box-shadow:0 0 40px rgba(255,140,0,0.45),0 0 80px rgba(212,175,55,0.22)}}
@keyframes sqiSpin{to{transform:rotate(360deg)}}
.sqi-consult-inner{display:flex;align-items:flex-start;gap:16px}
@media(max-width:480px){.sqi-consult-inner{flex-direction:column;align-items:center;text-align:center}}
`;

const ParticleField = React.memo(() => {
  const items = React.useMemo(() => Array.from({length:38},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2+0.5,color:['#D4AF37','#FF8C00','#E8527A','#34D399','#93C5FD'][Math.floor(Math.random()*5)],d:(2+Math.random()*4).toFixed(1),dl:(Math.random()*6).toFixed(1)})),[]);
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      {items.map(p=><div key={p.id} className="sqi-particle" style={{left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,background:p.color,'--d':`${p.d}s`,'--dl':`${p.dl}s`} as React.CSSProperties}/>)}
      <div style={{position:'absolute',top:'-15%',right:'-10%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,140,0,0.06),transparent 68%)',animation:'sqiBreathe 6s ease-in-out infinite'}}/>
      <div style={{position:'absolute',bottom:'-20%',left:'-12%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,0.06),transparent 68%)',animation:'sqiBreathe 8s ease-in-out 2s infinite'}}/>
    </div>
  );
});

const MANTRA='✦ OM NAMAH SHIVAYA ✦ DHANVANTARI NAMOSTUTE ✦ AGASTYA SIDDHA NAMAH ✦ SARVE BHAVANTU SUKHINAH ✦ AROGYA PARAM BHAGYAM ✦ OM SHANTI OM ✦ AYUR AROGYA SAUKHYAM ✦ ';
const Ticker=()=>(<div style={{overflow:'hidden',borderTop:'1px solid rgba(212,175,55,0.1)',borderBottom:'1px solid rgba(212,175,55,0.1)',padding:'9px 0',marginBottom:22}}><div style={{display:'flex',whiteSpace:'nowrap',animation:'sqiTicker 36s linear infinite'}}><span style={{color:'rgba(212,175,55,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.3em',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{MANTRA.repeat(6)}</span></div></div>);

const SriYantra=({size=110}:{size?:number})=>(<svg width={size} height={size} viewBox="0 0 110 110" fill="none"><circle cx="55" cy="55" r="52" stroke="#D4AF37" strokeWidth=".5" strokeOpacity=".35"/><circle cx="55" cy="55" r="44" stroke="#D4AF37" strokeWidth=".3" strokeOpacity=".2"/><circle cx="55" cy="55" r="36" stroke="#FF8C00" strokeWidth=".3" strokeOpacity=".2"/>{Array.from({length:8},(_,i)=>{const a=(i*45*Math.PI)/180;return<line key={i} x1="55" y1="55" x2={55+46*Math.cos(a)} y2={55+46*Math.sin(a)} stroke="#D4AF37" strokeWidth=".5" strokeOpacity=".4"/>})}<polygon points="55,18 72,48 38,48" stroke="#D4AF37" strokeWidth=".9" fill="none" strokeOpacity=".68"/><polygon points="55,92 38,62 72,62" stroke="#D4AF37" strokeWidth=".9" fill="none" strokeOpacity=".68"/><polygon points="55,28 68,50 42,50" stroke="#FF8C00" strokeWidth=".6" fill="none" strokeOpacity=".48"/><polygon points="55,82 42,60 68,60" stroke="#FF8C00" strokeWidth=".6" fill="none" strokeOpacity=".48"/><circle cx="55" cy="55" r="4" fill="#D4AF37" fillOpacity=".92"/><circle cx="55" cy="55" r="8" stroke="#FF8C00" strokeWidth=".6" fill="none" strokeOpacity=".5"/><circle cx="55" cy="9" r="2.5" fill="#D4AF37" fillOpacity=".8" style={{transformOrigin:'55px 55px',animation:'sqiOrbit 10s linear infinite'}}/></svg>);

// ── TIER CONFIG ─────────────────────────────────────────────────────────────
const TIERS = [
  {
    key: 'free',
    icon: <Leaf style={{width:20,height:20}}/>,
    symbol: '◇',
    name: 'FREE',
    sub: 'Akasha Seed',
    accent: 'rgba(180,180,180,0.6)',
    price: 'Free',
    features: [
      'Full 7-Dimension Prakriti Scan',
      'Sacred Dosha Blueprint revealed',
      'Daily Ritual Timeline',
      'Botanical Herbarium',
      'Basic Siddha daily guidance',
    ],
    locked: ['Divine Physician AI Chat','Deep Vikruti reading','Scalar Hz transmissions','Jyotish dosha alignment','Agastyar Academy 108 Modules'],
  },
  {
    key: 'prana',
    icon: <Sparkles style={{width:20,height:20}}/>,
    symbol: '◈',
    name: 'PRANA FLOW',
    sub: 'Sacred Current',
    accent: '#22D3EE',
    price: '€19 / mo',
    badge: '✦ Most Popular',
    features: [
      'Everything in Free',
      '🏥 Divine Physician AI Chat — Agastya Muni answers',
      'Vikruti current imbalance scan',
      'Personalised herb & diet protocols',
      'Seasonal Prakriti intelligence',
      'Agastyar Academy — Phase 1 & 2 (43 modules)',
    ],
    locked: ['Live Audio AI Vaidya','Deep Nadi Scanner transmissions','Full 108-module Academy','Akasha Jyotish deep alignment'],
  },
  {
    key: 'siddha',
    icon: <Flame style={{width:20,height:20}}/>,
    symbol: '◉',
    name: 'SIDDHA QUANTUM',
    sub: 'Sovereign Flame',
    accent: '#FF8C00',
    price: '€45 / mo',
    features: [
      'Everything in Prana Flow',
      'Deep Nadi Scanner transmissions',
      'Scalar Hz frequency protocols',
      'Jyotish planetary dosha alignment',
      'Agastyar Academy — Phase 1–4 (87 modules)',
      'Weekly live group healing sessions',
    ],
    locked: ['Full 108-module Academy (Phase 5)','Unlimited scalar upgrades','Direct Akasha transmission'],
  },
  {
    key: 'akasha',
    icon: <Crown style={{width:20,height:20}}/>,
    symbol: '∞',
    name: 'AKASHA INFINITY',
    sub: 'Eternal Sovereign',
    accent: '#D4AF37',
    price: '€1,111 lifetime',
    badge: '✦ Highest Initiation',
    features: [
      'Everything in Siddha Quantum',
      'Full 108-Module Agastyar Academy',
      'Live Audio AI Vaidya (voice sessions)',
      'Direct Akasha scalar transmissions',
      'Unlimited Jyotish readings',
      'Personal Siddha prescription archive',
      'Priority Agastya Muni consultations',
    ],
    locked: [],
  },
];

const TierCard = ({tier, active, onSelect}: {tier: typeof TIERS[0]; active?: boolean; onSelect?: ()=>void}) => (
  <motion.div
    initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
    whileHover={{y:-5,scale:1.02}} whileTap={{scale:0.98}}
    onClick={onSelect}
    style={{
      padding:'28px 22px', borderRadius:40, cursor: onSelect?'pointer':'default',
      background: active ? `linear-gradient(135deg,${tier.accent}12,${tier.accent}06)` : 'rgba(255,255,255,0.025)',
      backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
      border:`1px solid ${active ? tier.accent+'70' : 'rgba(255,255,255,0.07)'}`,
      boxShadow: active ? `0 0 50px ${tier.accent}22` : 'none',
      position:'relative', overflow:'hidden',
    }}
  >
    {tier.badge && (
      <div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',background:`linear-gradient(90deg,${tier.accent},#D4AF37)`,color:'#050505',fontSize:8,fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',padding:'4px 14px',borderRadius:'0 0 14px 14px',whiteSpace:'nowrap'}}>
        {tier.badge}
      </div>
    )}
    <div style={{position:'absolute',top:0,left:'15%',right:'15%',height:1,background:`linear-gradient(90deg,transparent,${tier.accent}55,transparent)`}}/>
    <div style={{width:46,height:46,borderRadius:14,background:`${tier.accent}18`,border:`1px solid ${tier.accent}35`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14,marginTop: tier.badge?16:0}}>
      <span style={{color:tier.accent,display:'flex'}}>{tier.icon}</span>
    </div>
    <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:3}}>
      <span style={{fontSize:9,fontWeight:800,letterSpacing:'0.35em',color:tier.accent,opacity:0.8}}>{tier.symbol}</span>
      <span style={{fontSize:16,fontWeight:900,letterSpacing:'-0.04em',color:active?tier.accent:'rgba(255,255,255,0.8)'}}>{tier.name}</span>
    </div>
    <div style={{fontSize:8,fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:tier.accent,opacity:0.65,marginBottom:6}}>{tier.sub}</div>
    <div style={{fontSize:13,fontWeight:800,color:tier.accent,marginBottom:16,letterSpacing:'-0.01em'}}>{tier.price}</div>
    <div style={{height:1,marginBottom:14,background:`linear-gradient(90deg,transparent,${tier.accent}28,transparent)`}}/>
    <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:8,marginBottom: tier.locked.length>0?16:0}}>
      {tier.features.map((f,i)=>(
        <li key={i} style={{display:'flex',gap:8,fontSize:12,lineHeight:1.55,color:'rgba(255,255,255,0.62)'}}>
          <span style={{color:tier.accent,flexShrink:0,fontSize:9,marginTop:2}}>✦</span>{f}
        </li>
      ))}
    </ul>
    {tier.locked.length > 0 && (
      <>
        <div style={{height:1,marginBottom:12,background:'rgba(255,255,255,0.04)'}}/>
        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:7}}>
          {tier.locked.map((f,i)=>(
            <li key={i} style={{display:'flex',gap:8,fontSize:11,lineHeight:1.5,color:'rgba(255,255,255,0.22)'}}>
              <span style={{flexShrink:0,fontSize:10,marginTop:1}}>🔒</span>{f}
            </li>
          ))}
        </ul>
      </>
    )}
    {active && (
      <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${tier.accent}22`,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        <div style={{width:5,height:5,borderRadius:'50%',background:tier.accent,boxShadow:`0 0 8px ${tier.accent}`,animation:'sqiGoldPulse 2s ease-in-out infinite'}}/>
        <span style={{fontSize:8,fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:tier.accent,opacity:0.85}}>Active Blueprint</span>
      </div>
    )}
  </motion.div>
);

// ── AGASTYA CHAT CTA — shown at top of dashboard ────────────────────────────
const AgastyChatBanner = ({
  canChat, onOpenChat, doshaName, userName
}: {canChat:boolean; onOpenChat:()=>void; doshaName:string; userName:string}) => (
  <motion.div
    initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
    onClick={onOpenChat}
    whileHover={{scale:1.01,boxShadow: canChat ? '0 0 80px rgba(212,175,55,0.2),0 0 160px rgba(212,175,55,0.1)' : 'none'}}
    whileTap={{scale:0.99}}
    style={{
      background: canChat
        ? 'linear-gradient(135deg,rgba(255,140,0,0.08),rgba(212,175,55,0.04),rgba(255,140,0,0.06))'
        : 'rgba(255,255,255,0.02)',
      backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
      border: canChat ? '1.5px solid rgba(212,175,55,0.45)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius:40, padding:'28px 24px',
      boxShadow: canChat ? '0 0 60px rgba(212,175,55,0.12),0 0 120px rgba(212,175,55,0.06)' : 'none',
      position:'relative', overflow:'hidden', cursor:'pointer', marginBottom:4,
    }}
  >
    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background: canChat ? 'linear-gradient(90deg,transparent,rgba(255,140,0,0.8),rgba(212,175,55,1),rgba(255,140,0,0.8),transparent)' : 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)'}}/>
    {canChat && (
      <motion.div style={{position:'absolute',top:0,bottom:0,width:80,background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.12),transparent)',left:'-80px'}}
        animate={{left:['-80px','110%']}} transition={{duration:4,repeat:Infinity,ease:'easeInOut',repeatDelay:3}}/>
    )}
    <div className="sqi-consult-inner">
      <motion.div
        animate={canChat ? {boxShadow:['0 0 20px rgba(212,175,55,0.25)','0 0 40px rgba(212,175,55,0.5)','0 0 20px rgba(212,175,55,0.25)']} : {}}
        transition={{duration:3,repeat:Infinity}}
        style={{width:64,height:64,borderRadius:'50%',background: canChat ? 'radial-gradient(circle,rgba(212,175,55,0.25),rgba(212,175,55,0.08))' : 'rgba(255,255,255,0.04)',border: canChat ? '2px solid rgba(212,175,55,0.55)' : '1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}
      >🔱</motion.div>
      <div style={{flex:1}}>
        <div style={{fontSize:8,fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color: canChat ? 'rgba(255,140,0,0.8)' : 'rgba(255,255,255,0.25)',marginBottom:5}}>
          ✦ Your Personal Guide · Agastya Samhita ✦
        </div>
        <h3 style={{fontSize:20,fontWeight:900,letterSpacing:'-0.04em',color: canChat ? '#D4AF37' : 'rgba(255,255,255,0.3)',marginBottom:6,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>
          {canChat ? 'Speak with Agastya Muni' : 'Divine Physician — Locked'}
        </h3>
        <p style={{fontSize:13,lineHeight:1.65,color: canChat ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.28)',marginBottom:14}}>
          {canChat
            ? `${userName.split(' ')[0]}, I see your ${doshaName} constitution clearly. I have specific prescriptions from the Agastya Samhita waiting for you. Ask me anything — herbs, rituals, emotional healing, or the deeper question behind your suffering.`
            : 'Upgrade to Prana Flow or higher to consult directly with Agastya Muni — sacred herb prescriptions, ritual protocols, and deep healing for your exact Prakriti.'}
        </p>
        <motion.div
          whileHover={{scale:1.03}} whileTap={{scale:0.98}}
          style={{display:'inline-flex',alignItems:'center',gap:8,padding:'11px 24px',borderRadius:999,background: canChat ? 'linear-gradient(135deg,#FF8C00,#D4AF37)' : 'rgba(255,255,255,0.06)',border: canChat ? 'none' : '1px solid rgba(255,255,255,0.1)',color: canChat ? '#050505' : 'rgba(255,255,255,0.3)',fontSize:13,fontWeight:900,letterSpacing:'-0.02em',fontFamily:"'Plus Jakarta Sans',sans-serif",cursor:'pointer'}}
        >
          <span style={{fontSize:16}}>{canChat ? '🔱' : '🔒'}</span>
          {canChat ? 'Open Divine Physician' : 'Prana Flow Required'}
        </motion.div>
      </div>
    </div>
  </motion.div>

);

const Gate=({icon,title,desc,tierLabel,onBack}:{icon:string;title:string;desc:string;tierLabel:string;onBack:()=>void})=>(
  <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{maxWidth:540,margin:'32px auto',padding:'52px 34px',textAlign:'center',background:'linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.02))',backdropFilter:'blur(40px)',border:'1px solid rgba(212,175,55,0.5)',borderRadius:40,boxShadow:'0 0 50px rgba(212,175,55,0.1)'}}>
    <div style={{width:80,height:80,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,0.12),transparent)',border:'1px solid rgba(212,175,55,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:32}}>{icon}</div>
    <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 14px',borderRadius:999,background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.2)',fontSize:8,fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:'#D4AF37',marginBottom:20}}>✦ {tierLabel}</div>
    <h2 style={{fontSize:26,fontWeight:900,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.9)',marginBottom:14,fontFamily:"'Cormorant Garamond',serif"}}>{title}</h2>
    <p style={{fontSize:14,lineHeight:1.7,color:'rgba(255,255,255,0.5)',marginBottom:28}}>{desc}</p>
    <button onClick={onBack} style={{padding:'12px 30px',borderRadius:999,background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.07))',border:'1px solid rgba(212,175,55,0.5)',color:'#D4AF37',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,cursor:'pointer'}}>Explore Sovereignty Plans</button>
  </motion.div>
);

interface AyurvedaToolProps { membershipLevel?: AyurvedaMembershipLevel; isAdmin?: boolean; }

export const AyurvedaTool: React.FC<AyurvedaToolProps> = ({ membershipLevel = 'FREE' as AyurvedaMembershipLevel, isAdmin = false }) => {
  const { t } = useTranslation();
  const effectiveMembership = isAdmin ? 'LIFETIME' as AyurvedaMembershipLevel : membershipLevel;
  const [membership, setMembership] = useState<AyurvedaMembershipLevel>(effectiveMembership);
  const [activeTab, setActiveTab] = useState<'home'|'assessment'|'chat'>('home');
  const [showChat, setShowChat] = useState(false);

  React.useEffect(() => { setMembership(isAdmin ? 'LIFETIME' as AyurvedaMembershipLevel : membershipLevel); }, [isAdmin, membershipLevel]);

  const { doshaProfile, userProfile, dailyGuidance, isLoading, isLoadingGuidance, isLoadingSaved, analyzeDosha, getDailyGuidance, reset } = useAyurvedaAnalysis();

  // canChat = Prana Flow, Siddha Quantum, Akasha Infinity — NOT free
  const canChat = isAdmin || (membership !== ('FREE' as AyurvedaMembershipLevel));
  const isSiddhaPlus = isAdmin || membership === ('SIDDHA' as AyurvedaMembershipLevel) || membership === ('LIFETIME' as AyurvedaMembershipLevel);

  React.useEffect(() => {
    if (doshaProfile && activeTab === 'assessment') setActiveTab('home');
  }, [doshaProfile, activeTab]);

  const handleAssessmentComplete = async (profile: AyurvedaUserProfile) => {
    await analyzeDosha(profile);
    setActiveTab('home');
  };
  const handleFetchGuidance = useCallback(() => { if (userProfile) getDailyGuidance(userProfile); }, [userProfile, getDailyGuidance]);
  const handleRestart = async () => { await reset(); setActiveTab('home'); };
  const handleOpenChat = () => {
    if (canChat) setShowChat(true);
    else setActiveTab('chat');
  };

  React.useEffect(() => { const id='sqi-ayurveda-css'; if(!document.getElementById(id)){const el=document.createElement('style');el.id=id;el.textContent=GLOBAL_CSS;document.head.appendChild(el);} }, []);

  if (isLoadingSaved) return (
    <div className="sqi-root" style={{minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20}}>
      <SriYantra size={80}/>
      <div className="sqi-label" style={{animation:'sqiBreathe 2s ease-in-out infinite'}}>Accessing Akasha Archive…</div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        // ── NO PRAKRITI YET — landing ──────────────────────────────────────────
        if (!doshaProfile) return (
          <div style={{position:'relative'}}>
            <ParticleField/>
            <div style={{position:'relative',zIndex:1}}>
              <Ticker/>

              {/* Hero */}
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'40px 20px 36px',position:'relative'}}>
                <motion.div initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}} transition={{duration:1.3}} style={{position:'relative',marginBottom:28}}>
                  <motion.div style={{position:'absolute',inset:-36,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,140,0,0.1),transparent 70%)'}} animate={{scale:[1,1.15,1],opacity:[0.5,1,0.5]}} transition={{duration:4,repeat:Infinity}}/>
                  <SriYantra size={110}/>
                </motion.div>
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="sqi-label" style={{marginBottom:14}}>✦ Siddha Chamber · Est. by Agastya Muni ✦</motion.div>
                <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} style={{fontSize:'clamp(28px,5vw,52px)',fontWeight:900,letterSpacing:'-0.05em',lineHeight:1.08,maxWidth:640,marginBottom:12}} className="sqi-shimmer">Discover Your Sacred Prakriti</motion.h1>
                <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.65}} className="sqi-serif" style={{fontSize:17,fontStyle:'italic',color:'rgba(255,140,0,0.75)',marginBottom:10,lineHeight:1.55}}>
                  "I, Agastya Muni, have walked this Earth for ten thousand years.<br/>Your body is the cosmos — let me read it."
                </motion.p>
                <motion.p initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.78}} style={{fontSize:14,lineHeight:1.75,color:'rgba(255,255,255,0.48)',maxWidth:520,marginBottom:44}}>
                  Ancient Siddha lineage encoded into SQI 2050 Bhakti-Algorithm. Seven sacred dimensions of Prakriti decoded through Akasha Intelligence.
                </motion.p>
                <motion.button initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.9,type:'spring',stiffness:200}} whileHover={{scale:1.05}} whileTap={{scale:0.98}} onClick={()=>setActiveTab('assessment')}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'17px 48px',borderRadius:999,background:'linear-gradient(135deg,#FF8C00,#D4AF37)',color:'#050505',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:900,letterSpacing:'-0.02em',border:'none',cursor:'pointer',boxShadow:'0 0 40px rgba(255,140,0,0.3),0 6px 24px rgba(0,0,0,0.5)'}}>
                  <span style={{fontSize:18}}>🔱</span>Reveal My Prakriti<Sparkles style={{width:18,height:18}}/>
                </motion.button>
                <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}} style={{fontSize:10,letterSpacing:'0.25em',color:'rgba(255,255,255,0.18)',marginTop:18}}>Scalar Transmission Active · Anahata Field Open · 528 Hz</motion.p>
              </div>

              {/* Agastya lore */}
              <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.5}} style={{margin:'0 0 24px',padding:'26px',background:'rgba(255,255,255,0.02)',backdropFilter:'blur(40px)',border:'1px solid rgba(255,140,0,0.2)',borderRadius:40,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,rgba(255,140,0,0.5),rgba(212,175,55,0.8),rgba(255,140,0,0.5),transparent)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:20,alignItems:'start'}}>
                  <div style={{fontSize:48,filter:'drop-shadow(0 0 16px rgba(255,140,0,0.5))',animation:'sqiGlow 3s ease-in-out infinite',lineHeight:1}}>🔱</div>
                  <div>
                    <div className="sqi-label" style={{marginBottom:8}}>About Your Guide</div>
                    <h3 className="sqi-serif" style={{fontSize:22,color:'#D4AF37',marginBottom:10,fontStyle:'italic'}}>Agastya Muni — Father of Siddha Medicine</h3>
                    <p style={{fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,0.58)'}}>The immortal sage who created the <em style={{color:'#FF8C00',fontFamily:"'Cormorant Garamond',serif"}}>Agastya Samhita</em> — the oldest medical text on Earth. He mapped the 108 Marma points, 18 Siddha herbs, and the science of Nadi pulse diagnosis. His wisdom predates all other known medical traditions by thousands of years.</p>
                  </div>
                </div>
              </motion.div>

              {/* 4 TIER CARDS */}
              {!isAdmin && (
                <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.7}}>
                  <div style={{textAlign:'center',marginBottom:28}}>
                    <div className="sqi-label" style={{marginBottom:10}}>✦ Vedic Light-Code Access Levels ✦</div>
                    <h2 style={{fontSize:26,fontWeight:900,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.88)',marginBottom:8}}>Your Sovereignty Blueprint</h2>
                    <p style={{fontSize:13,color:'rgba(255,255,255,0.38)',lineHeight:1.6,maxWidth:480,margin:'0 auto'}}>Each tier opens deeper chambers of Siddha wisdom. The Divine Physician Chat with Agastya Muni is available from Prana Flow and above.</p>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16}}>
                    {TIERS.map((tier, i) => (
                      <motion.div key={tier.key} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1+i*0.1}}>
                        <TierCard tier={tier} active={
                          (membership === ('FREE' as AyurvedaMembershipLevel) && tier.key === 'free') ||
                          (membership === ('PREMIUM' as AyurvedaMembershipLevel) && tier.key === 'prana') ||
                          (membership === ('LIFETIME' as AyurvedaMembershipLevel) && tier.key === 'akasha')
                        }/>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Admin badge */}
              {isAdmin && (
                <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.8}}
                  style={{marginTop:24,padding:'22px 28px',background:'linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,140,0,0.06))',border:'1px solid rgba(212,175,55,0.55)',borderRadius:28,display:'flex',alignItems:'center',gap:16,maxWidth:480,margin:'24px auto 0',boxShadow:'0 0 50px rgba(212,175,55,0.16)',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.6),rgba(255,140,0,0.8),rgba(212,175,55,0.6),transparent)'}}/>
                  <motion.div animate={{boxShadow:['0 0 16px rgba(255,140,0,0.2)','0 0 32px rgba(255,140,0,0.5)','0 0 16px rgba(255,140,0,0.2)']}} transition={{duration:3,repeat:Infinity}} style={{fontSize:32,filter:'drop-shadow(0 0 12px rgba(255,140,0,0.5))'}}>🔱</motion.div>
                  <div>
                    <div style={{fontSize:8,fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:'#D4AF37',marginBottom:5}}>✦ Sovereign Admin · Full Access Active ✦</div>
                    <p style={{fontSize:13,color:'rgba(255,255,255,0.65)',margin:0,lineHeight:1.55}}>All features unlocked: Agastya Muni · Nadi Scanner · Jyotish Sync</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        );

        // ── DASHBOARD — Prakriti known ──────────────────────────────────────────
        return (
          <div style={{position:'relative'}}>
            <ParticleField/>
            <div style={{position:'relative',zIndex:1}}>
              <Ticker/>

              {/* ★ AGASTYA CHAT — TOP OF DASHBOARD ★ */}
              <AgastyChatBanner
                canChat={canChat}
                onOpenChat={handleOpenChat}
                doshaName={doshaProfile?.primary || 'Vata'}
                userName={userProfile?.name || 'Seeker'}
              />

              <DoshaDashboard
                profile={userProfile!}
                dosha={doshaProfile}
                dailyGuidance={dailyGuidance}
                isLoadingGuidance={isLoadingGuidance}
                onRestart={handleRestart}
                onFetchGuidance={handleFetchGuidance}
                isPremium={canChat}
                isSiddhaPlus={isSiddhaPlus}
                isAdmin={isAdmin}
                onOpenChat={handleOpenChat}
              />
            </div>
          </div>
        );

      case 'assessment':
        return <DoshaQuiz onComplete={handleAssessmentComplete} isLoading={isLoading}/>;

      case 'chat':
        // Only FREE users land here — everyone else goes directly to showChat modal
        return (
          <Gate
            icon="🏥"
            title="Divine Physician Portal"
            tierLabel="Prana Flow Required"
            desc="Agastya Muni awaits your questions — sacred herb prescriptions, ritual protocols, and deep Prakriti healing. Available to Prana Flow, Siddha Quantum, and Akasha Infinity members."
            onBack={()=>setActiveTab('home')}
          />
        );

      default: return null;
    }
  };

  return (
    <div className="sqi-root" style={{width:'100%',minHeight:'100vh',background:'#050505',color:'rgba(255,255,255,0.85)',position:'relative'}}>
      <div style={{padding:'0 14px 80px'}}>{renderContent()}</div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4}} style={{padding:'28px 20px 44px',textAlign:'center',borderTop:'1px solid rgba(255,255,255,0.04)',position:'relative',zIndex:1}}>
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:18,marginBottom:14}}>
          <div style={{height:1,width:55,background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.15))'}}/>
          {['🌿','🔱','☀️','🔱','🌿'].map((s,i)=><span key={i} style={{fontSize:13,opacity:0.3}}>{s}</span>)}
          <div style={{height:1,width:55,background:'linear-gradient(90deg,rgba(212,175,55,0.15),transparent)'}}/>
        </div>
        <p className="sqi-serif" style={{fontStyle:'italic',fontSize:14,color:'rgba(255,255,255,0.3)',marginBottom:7}}>"Health is wealth, peace of mind is happiness, Yoga shows the way."</p>
        <p style={{fontSize:8,fontWeight:800,letterSpacing:'0.45em',textTransform:'uppercase',color:'#D4AF37',opacity:0.18}}>Siddha Quantum Nexus · Agastya Samhita · SQI Intelligence 2050</p>
      </motion.div>
      <AnimatePresence>
        {showChat && <AyurvedaChatConsultation profile={userProfile} dosha={doshaProfile} onClose={()=>setShowChat(false)}/>}
      </AnimatePresence>
    </div>
  );
};
