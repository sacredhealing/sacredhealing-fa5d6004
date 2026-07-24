import{r as n,j as e,g as re}from"./vendor-react--OR-uH7S.js";import{u as ie}from"./useSiteContent-DCHYK3Jc.js";import{A as ne}from"./AmbientSoundToggle-CTkoZHqS.js";import{u as Y,s as D,a as se,z as oe,A as le,C as ce}from"./index-RRXEvQfm.js";import{u as de}from"./useAdminRole-CCeebBaS.js";import{D as ge,a as pe}from"./dialog-BkQpXw4Q.js";import{m as he,b3 as xe,A as be,W as ue,n as me,p as O,a as P,a8 as H,i as G,g as fe,O as ye,c as ve,P as we,t as je,M as ke,aX as Ne,x as ze,Z as Se,I as Ae,b4 as Ce,a6 as _e}from"./vendor-icons-CZmAPI07.js";import{u as De}from"./vendor-i18n-BS5B6gzd.js";import"./vendor-crypto-DfHPQj82.js";import"./slider-DGAKccuM.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-motion-Dm4zQNot.js";import"./vendor-query-D1GokQmc.js";import"./vendor-supabase-DRj4EguU.js";const Pe=[{key:"is_pregnant",label:"Currently pregnant"},{key:"has_heart_condition",label:"Any heart condition"},{key:"has_blood_pressure_condition",label:"Uncontrolled high or low blood pressure"},{key:"has_epilepsy_or_seizures",label:"Epilepsy or a history of seizures"},{key:"has_glaucoma_or_eye_condition",label:"Glaucoma or a retinal condition"},{key:"has_recent_surgery",label:"Recent surgery (last 3 months)"},{key:"has_panic_or_anxiety_disorder",label:"Panic disorder or a diagnosed anxiety condition"}],Ee=({open:i,onOpenChange:l,techniqueType:s,onCleared:u})=>{const{user:m}=Y(),[h,N]=n.useState({}),[x,t]=n.useState(!1),[v,c]=n.useState(!1),w=Object.values(h).some(Boolean),d=async()=>{if(!m)return;t(!0);const o=!w,f={user_id:m.id,...h,cleared_for_retention:o,cleared_for_forceful:o,screened_at:new Date().toISOString()},{error:g}=await D.from("user_pranayama_health_screening").upsert(f,{onConflict:"user_id"});t(!1),!g&&(o?(l(!1),u()):c(!0))};return e.jsx(ge,{open:i,onOpenChange:l,children:e.jsx(pe,{className:"max-w-md bg-[#0a0a0a] border-[#D4AF37]/25 p-6 max-h-[85vh] overflow-y-auto",children:v?e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:10},children:[e.jsx(xe,{size:20,color:"#f0b03c"}),e.jsx("div",{style:{fontWeight:800,fontSize:17,color:"rgba(255,255,255,.92)"},children:"Let's Keep You Safe"})]}),e.jsx("p",{style:{fontSize:12.5,color:"rgba(255,255,255,.6)",lineHeight:1.7,marginBottom:14},children:"Based on what you shared, this technique isn't recommended for you right now. Please speak with your doctor before attempting breath retention or forceful breathing practices."}),e.jsx("p",{style:{fontSize:12.5,color:"rgba(255,255,255,.6)",lineHeight:1.7,marginBottom:20},children:"The gentle, beginner practices — Sama Vritti, foundation Nadi Shodhana, and Bhramari — remain fully safe and available to you."}),e.jsx("button",{onClick:()=>l(!1),style:{width:"100%",padding:"13px 0",borderRadius:100,background:"rgba(212,175,55,0.1)",color:"#D4AF37",fontWeight:800,fontSize:12,letterSpacing:".05em",textTransform:"uppercase",border:"1px solid rgba(212,175,55,0.4)",cursor:"pointer"},children:"Understood"})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:6},children:[e.jsx(he,{size:20,color:"#D4AF37"}),e.jsx("div",{style:{fontWeight:800,fontSize:17,color:"rgba(255,255,255,.92)"},children:"Before You Begin"})]}),e.jsx("p",{style:{fontSize:12.5,color:"rgba(255,255,255,.5)",lineHeight:1.6,marginBottom:18},children:s==="retention"?"Breath retention (Kumbhaka) is a powerful practice, but it isn't safe for everyone. Please check anything that applies to you.":"This forceful breathing practice raises heart rate and internal pressure quickly. Please check anything that applies to you."}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:10,marginBottom:20},children:Pe.map(o=>e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",cursor:"pointer",fontSize:12.5,color:"rgba(255,255,255,.75)"},children:[e.jsx("input",{type:"checkbox",checked:!!h[o.key],onChange:f=>N(g=>({...g,[o.key]:f.target.checked})),style:{width:16,height:16,accentColor:"#D4AF37",flexShrink:0}}),o.label]},o.key))}),e.jsx("p",{style:{fontSize:10.5,color:"rgba(255,255,255,.35)",lineHeight:1.5,marginBottom:16},children:"This is a safety check, not medical advice. When unsure, ask your doctor before practicing."}),e.jsx("button",{onClick:d,disabled:x,style:{width:"100%",padding:"13px 0",borderRadius:100,background:"linear-gradient(135deg,#D4AF37,#f0d878)",color:"#050505",fontWeight:800,fontSize:12,letterSpacing:".05em",textTransform:"uppercase",border:"none",cursor:x?"default":"pointer",opacity:x?.6:1},children:x?"Saving…":"Confirm & Continue"})]})})})},Fe=`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

  :root {
    --siddha-gold: #D4AF37;
    --akasha-black: #050505;
    --gold-glow: rgba(212,175,55,0.25);
    --gold-glow-deep: rgba(212,175,55,0.08);
    --glass-base: rgba(255,255,255,0.025);
    --glass-border: rgba(255,255,255,0.06);
    --vayu-cyan: #22D3EE;
    --prana-amber: rgba(212,175,55,0.15);
    --cave-stone: rgba(180,160,100,0.06);
  }

  .sqi-page {
    background: #050505;
    min-height: 100vh;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding-bottom: 120px;
    position: relative;
    overflow-x: hidden;
  }

  /* Cave ambient background */
  .sqi-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 20% 80%, rgba(34,211,238,0.04) 0%, transparent 50%),
      radial-gradient(ellipse 50% 60% at 80% 60%, rgba(150,100,200,0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  /* Floating golden dust particles */
  .sqi-page::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 15% 20%, rgba(212,175,55,0.4), transparent),
      radial-gradient(1px 1px at 40% 65%, rgba(212,175,55,0.2), transparent),
      radial-gradient(1px 1px at 70% 30%, rgba(212,175,55,0.3), transparent),
      radial-gradient(1px 1px at 85% 75%, rgba(34,211,238,0.3), transparent),
      radial-gradient(1px 1px at 55% 90%, rgba(212,175,55,0.2), transparent),
      radial-gradient(2px 2px at 25% 50%, rgba(212,175,55,0.15), transparent),
      radial-gradient(1px 1px at 90% 15%, rgba(212,175,55,0.25), transparent);
    pointer-events: none;
    z-index: 0;
    animation: dust-float 20s ease-in-out infinite;
  }

  @keyframes dust-float {
    0%, 100% { transform: translateY(0px); opacity: 1; }
    50% { transform: translateY(-8px); opacity: 0.7; }
  }

  .sqi-content {
    position: relative;
    z-index: 1;
  }

  /* ── GLASS CARD ── */
  .glass-card {
    background: rgba(255,255,255,0.025);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 32px;
    position: relative;
    overflow: hidden;
  }

  .glass-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent);
    border-radius: 32px 32px 0 0;
  }

  .gold-border-card {
    background: rgba(255,255,255,0.025);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 32px;
    position: relative;
    overflow: hidden;
  }

  .gold-border-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 32px;
    background: linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 50%);
    pointer-events: none;
  }

  /* ── GOLD TEXT ── */
  .gold-title {
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212,175,55,0.4);
    font-family: 'Cinzel', serif;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .gold-label {
    color: rgba(212,175,55,0.7);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.45em;
    text-transform: uppercase;
  }

  .body-text {
    color: rgba(255,255,255,0.55);
    font-weight: 400;
    line-height: 1.7;
    font-size: 14px;
  }

  /* ── HEADER ── */
  .cave-header {
    padding: 24px 20px 20px;
  }

  .back-nav {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 13px;
    font-weight: 500;
    transition: color 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .back-btn:hover { color: rgba(255,255,255,0.8); }

  .temple-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #D4AF37;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
    transition: all 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-shadow: 0 0 12px rgba(212,175,55,0.4);
  }

  .temple-btn:hover {
    text-shadow: 0 0 20px rgba(212,175,55,0.7);
    color: #f0cc5c;
  }

  /* ── HERO HEADER SECTION ── */
  .hero-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .hero-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05));
    border: 1px solid rgba(212,175,55,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(212,175,55,0.15), inset 0 1px 0 rgba(212,175,55,0.2);
    flex-shrink: 0;
  }

  @keyframes heroGoldShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .hero-shimmer-title {
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 26px;
    line-height: 1.1;
    margin: 0 0 4px;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 45%, #D4AF37 65%, #A07C10 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: heroGoldShimmer 5s linear infinite;
    display: inline-block;
  }

  .hero-titles p {
    color: rgba(255,255,255,0.4);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    margin: 0;
  }

  /* ── INTRO BANNER ── */
  .intro-banner {
    margin: 0 20px 20px;
    padding: 20px 24px;
  }

  .intro-banner p {
    color: rgba(255,255,255,0.55);
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
  }

  .intro-banner strong {
    color: rgba(212,175,55,0.85);
    font-weight: 600;
  }

  /* ── SECTION LABELS ── */
  .section-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.5);
    margin-bottom: 6px;
    display: block;
  }

  /* ── 3-STEP BEGINNER GUIDE ── */
  .howto-strip {
    margin: 0 20px 20px;
    padding: 16px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(212,175,55,0.15);
    border-radius: 20px;
  }

  .howto-step {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .howto-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(212,175,55,0.12);
    border: 1px solid rgba(212,175,55,0.4);
    color: #D4AF37;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .howto-text {
    font-size: 11.5px;
    line-height: 1.3;
    color: rgba(255,255,255,0.55);
  }

  .howto-text strong {
    color: rgba(255,255,255,0.9);
    font-weight: 700;
  }

  .howto-arrow {
    color: rgba(212,175,55,0.3);
    font-size: 12px;
    flex-shrink: 0;
  }

  @media (max-width: 380px) {
    .howto-strip { flex-wrap: wrap; }
    .howto-arrow { display: none; }
    .howto-step { flex: 1 1 100%; }
  }

  /* ── PRANAYAMA CAVE GRID ── */
  .cave-grid {
    margin: 0 20px 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .cave-technique-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 24px;
    padding: 20px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .cave-technique-card.active {
    background: rgba(212,175,55,0.08);
    border-color: rgba(212,175,55,0.4);
    box-shadow: 0 0 30px rgba(212,175,55,0.1), inset 0 1px 0 rgba(212,175,55,0.15);
  }

  .cave-technique-card:hover:not(.disabled) {
    border-color: rgba(212,175,55,0.25);
    transform: translateY(-2px);
  }

  .cave-technique-card.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .technique-icon-ring {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04));
    border: 1px solid rgba(212,175,55,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D4AF37;
    box-shadow: 0 0 16px rgba(212,175,55,0.12), inset 0 1px 0 rgba(212,175,55,0.18);
    margin-bottom: 10px;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }

  .cave-technique-card.active .technique-icon-ring {
    border-color: rgba(212,175,55,0.55);
    box-shadow: 0 0 24px rgba(212,175,55,0.3), inset 0 1px 0 rgba(212,175,55,0.25);
  }

  .technique-name {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: #D4AF37;
    margin-bottom: 4px;
    line-height: 1.2;
  }

  .technique-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .technique-ratio {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: rgba(212,175,55,0.6);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .active-glow-dot {
    position: absolute;
    top: 14px; right: 14px;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #D4AF37;
    box-shadow: 0 0 10px rgba(212,175,55,0.8);
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  }

  /* ── LOCK BADGE (tier-gated technique) ── */
  .cave-technique-card.locked {
    opacity: 0.55;
  }

  .lock-badge {
    position: absolute;
    top: 14px; right: 14px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(212,175,55,0.4);
    color: #D4AF37;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── LEVEL PILL ── */
  .level-pill {
    display: inline-block;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 20px;
    margin-bottom: 6px;
  }

  .level-beginner {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    color: rgba(52,211,153,0.9);
  }

  .level-intermediate {
    background: rgba(34,211,238,0.1);
    border: 1px solid rgba(34,211,238,0.3);
    color: rgba(34,211,238,0.9);
  }

  .level-advanced {
    background: rgba(212,175,55,0.12);
    border: 1px solid rgba(212,175,55,0.4);
    color: #D4AF37;
  }

  /* ── SIDDHA GUIDANCE PANEL ── */
  .guidance-panel {
    margin: 0 20px 20px;
    padding: 0;
    overflow: hidden;
  }

  .guidance-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 18px 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .guidance-toggle-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .guidance-title {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
  }

  .guidance-sanskrit {
    font-weight: 400;
    color: rgba(212,175,55,0.65);
    font-style: italic;
  }

  .guidance-sub {
    font-size: 10.5px;
    color: rgba(255,255,255,0.4);
    margin-top: 2px;
  }

  .guidance-body {
    padding: 0 20px 20px;
  }

  .guidance-lock-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 14px;
    background: rgba(212,175,55,0.06);
    border: 1px solid rgba(212,175,55,0.25);
    font-size: 11.5px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .guidance-upgrade-link {
    background: none;
    border: none;
    color: #D4AF37;
    font-weight: 800;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    font-size: 11.5px;
  }

  .guidance-section {
    margin-bottom: 16px;
  }

  .guidance-section:last-child { margin-bottom: 0; }

  .guidance-section-title {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.55);
    margin-bottom: 8px;
  }

  .guidance-steps {
    margin: 0;
    padding-left: 18px;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
    line-height: 1.7;
  }

  .guidance-steps li { margin-bottom: 4px; }

  .guidance-list {
    margin: 0;
    padding-left: 18px;
    color: rgba(255,255,255,0.55);
    font-size: 12px;
    line-height: 1.7;
    list-style: disc;
  }

  .guidance-caution .guidance-list {
    color: rgba(240,176,60,0.85);
  }

  .guidance-danger .guidance-section-title {
    color: rgba(240,120,90,0.85);
  }

  .guidance-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .guidance-tag {
    font-size: 10.5px;
    padding: 5px 10px;
    border-radius: 20px;
    background: rgba(240,120,90,0.08);
    border: 1px solid rgba(240,120,90,0.3);
    color: rgba(255,180,160,0.9);
  }

  /* ── CLASSIC TIMER ── */
  .timer-section {
    margin: 0 20px 20px;
    padding: 28px 24px;
  }

  .timer-section-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    text-align: center;
    margin-bottom: 24px;
  }

  .timer-circle-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .timer-orb {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .timer-orb::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(var(--siddha-gold) 0%, transparent 60%);
    opacity: 0.3;
    animation: orb-rotate 4s linear infinite;
  }

  @keyframes orb-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .orb-inhale { background: radial-gradient(circle, rgba(34,211,238,0.4), rgba(34,211,238,0.1)); box-shadow: 0 0 60px rgba(34,211,238,0.3); }
  .orb-hold { background: radial-gradient(circle, rgba(150,80,220,0.4), rgba(150,80,220,0.1)); box-shadow: 0 0 60px rgba(150,80,220,0.3); }
  .orb-exhale { background: radial-gradient(circle, rgba(52,211,153,0.4), rgba(52,211,153,0.1)); box-shadow: 0 0 60px rgba(52,211,153,0.3); }
  .orb-holdOut { background: radial-gradient(circle, rgba(251,146,60,0.4), rgba(251,146,60,0.1)); box-shadow: 0 0 60px rgba(251,146,60,0.3); }
  .orb-idle { background: radial-gradient(circle, rgba(212,175,55,0.15), rgba(5,5,5,0.6)); box-shadow: 0 0 40px rgba(212,175,55,0.1); }

  .scale-inhale { transform: scale(1.12); }
  .scale-exhale { transform: scale(0.88); }
  .scale-hold { transform: scale(1.05); }
  .scale-holdOut { transform: scale(0.95); }
  .scale-idle { transform: scale(1); }

  .orb-inner-text {
    text-align: center;
    z-index: 1;
  }

  .orb-phase-label {
    font-family: 'Cinzel', serif;
    font-size: 15px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.05em;
    text-shadow: 0 0 15px rgba(255,255,255,0.3);
    display: block;
    margin-bottom: 4px;
  }

  .orb-countdown {
    font-size: 44px;
    font-weight: 900;
    color: white;
    text-shadow: 0 0 30px rgba(255,255,255,0.5);
    line-height: 1;
    display: block;
  }

  .timer-stats {
    display: flex;
    align-items: center;
    gap: 24px;
    justify-content: center;
  }

  .timer-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 12px;
    font-weight: 600;
  }

  /* ── CONTROLS ── */
  .controls-row {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 0 20px 20px;
  }

  .btn-begin {
    background: linear-gradient(135deg, #D4AF37, #b8940f);
    border: none;
    border-radius: 50px;
    padding: 16px 40px;
    color: #050505;
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 30px rgba(212,175,55,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-begin:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(212,175,55,0.5);
  }

  .btn-stop {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50px;
    padding: 16px 28px;
    color: rgba(255,255,255,0.7);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-stop:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
  }

  .btn-reset {
    background: transparent;
    border: 1px solid rgba(212,175,55,0.2);
    border-radius: 50px;
    padding: 16px 20px;
    color: rgba(212,175,55,0.6);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-reset:hover {
    border-color: rgba(212,175,55,0.4);
    color: rgba(212,175,55,0.9);
  }

  /* ── MEDIA SECTION ── */
  .media-section {
    margin: 0 20px 20px;
    border-radius: 24px;
    overflow: hidden;
  }

  .audio-card {
    margin: 0 20px 20px;
    padding: 20px 24px;
  }

  /* ── CAVE GUIDE (5 techniques) ── */
  .cave-guide {
    margin: 0 20px 20px;
    padding: 0;
    overflow: hidden;
  }

  .cave-guide-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 22px 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .cave-guide-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .cave-guide-icon-ring {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04));
    border: 1px solid rgba(212,175,55,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D4AF37;
    box-shadow: 0 0 16px rgba(212,175,55,0.15), inset 0 1px 0 rgba(212,175,55,0.18);
  }

  .cave-guide-title {
    font-family: 'Cinzel', serif;
    font-size: 17px;
    font-weight: 700;
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212,175,55,0.3);
  }

  .cave-guide-sub {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.04em;
    margin-top: 2px;
  }

  .cave-guide-body {
    padding: 0 24px 28px;
  }

  .pranayama-guide-item {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .pranayama-guide-item:last-child {
    border-bottom: none;
  }

  .guide-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: #D4AF37;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .guide-text h4 {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    margin: 0 0 4px;
  }

  .guide-text p {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    line-height: 1.6;
    margin: 0;
  }

  .guide-text .guide-sanskrit {
    font-size: 10px;
    color: rgba(212,175,55,0.5);
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin-bottom: 2px;
    display: block;
  }

  /* ── BENEFITS ── */
  .benefits-section {
    margin: 0 20px 20px;
    padding: 24px;
  }

  .benefits-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }

  .benefit-item:last-child { border-bottom: none; }

  .benefit-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #D4AF37;
    margin-top: 5px;
    flex-shrink: 0;
    box-shadow: 0 0 8px rgba(212,175,55,0.6);
  }

  /* ── PRANA BADGE (Free + Prana Flow) ── */
  .access-badges {
    display: flex;
    gap: 8px;
    margin: 0 20px 20px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  .badge-free {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    color: rgba(52,211,153,0.9);
  }

  .badge-prana {
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.3);
    color: #D4AF37;
  }

  /* ── CAVE DIVIDER ── */
  .cave-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 4px 20px 20px;
    opacity: 0.4;
  }

  .cave-divider::before,
  .cave-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent);
  }

  .cave-divider span {
    font-size: 16px;
    color: rgba(212,175,55,0.6);
  }

  /* ── PATTERN SELECT LIST ── */
  .pattern-list-wrap {
    margin: 0 20px 20px;
    padding: 24px;
  }

  .pattern-list-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pattern-list-sub {
    font-size: 11px;
    color: rgba(212,175,55,0.45);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    font-weight: 800;
    margin-bottom: 20px;
  }

  .pattern-item {
    width: 100%;
    padding: 16px 18px;
    border-radius: 20px;
    text-align: left;
    transition: all 0.3s ease;
    margin-bottom: 10px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02);
    display: block;
  }

  .pattern-item:last-child { margin-bottom: 0; }

  .pattern-item.selected {
    background: rgba(212,175,55,0.08);
    border-color: rgba(212,175,55,0.35);
    box-shadow: 0 0 20px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.1);
  }

  .pattern-item:hover:not(.is-disabled) {
    border-color: rgba(212,175,55,0.2);
    background: rgba(212,175,55,0.04);
  }

  .pattern-item.is-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pattern-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .pattern-item-name {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
  }

  .pattern-item.selected .pattern-item-name {
    color: #D4AF37;
  }

  .pattern-item-ratio {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: rgba(212,175,55,0.55);
  }

  .pattern-item-desc {
    font-size: 12px;
    color: rgba(255,255,255,0.35);
    line-height: 1.5;
  }

  /* Responsive */
  @media (max-width: 400px) {
    .cave-grid { grid-template-columns: 1fr; }
    .hero-shimmer-title { font-size: 22px; }
  }
`,qe=[{sanskrit:"PRANAYAMA",title:"What is Pranayama?",desc:"Prana means 'life force energy' — the breath is your bridge between body and soul. Pranayama is the ancient Vedic science of directing this energy through conscious breathing."},{sanskrit:"NADI SHODHANA",title:"Alternate Nostril Breathing",desc:"Balances left & right hemispheres of the brain. Close your right nostril, inhale left. Close left, exhale right. Switch. Like charging a battery — calms anxiety in 3 minutes."},{sanskrit:"KAPALABHATI",title:"Skull-Shining Breath",desc:"Short, sharp exhales through the nose with passive inhales. Clears stale prana from your lungs, activates solar plexus energy, sharpens mental clarity instantly."},{sanskrit:"BHRAMARI",title:"Humming Bee Breath",desc:"Inhale deeply, then hum like a bee on the exhale. The vibration stimulates the vagus nerve, drops cortisol, and activates Anahata (heart chakra) healing."},{sanskrit:"UJJAYI",title:"Ocean Victory Breath",desc:"Breathe through the nose with a slight constriction in the throat, creating an ocean sound. Used in yoga — heats the body, builds focus, and activates the parasympathetic system."}],W=[{id:"box",name:"Box Breathing",sanskrit_name:"Sama Vritti",description:"Equal counts for calm and focus. Used by Navy SEALs.",inhale:4,hold:4,exhale:4,hold_out:4,cycles:4,level:"beginner",tier_required:"free",technique_type:"gentle",requires_health_screen:!1}],Ie=({size:i=20,strokeWidth:l=1.6})=>e.jsxs("svg",{width:i,height:i,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:l,strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M4.2 15.2c0-2.6 2.1-4.3 4.4-4.3 2.7 0 4 2.1 4 4 0 2.1-1.6 3.9-3.8 3.9-1.9 0-3-1.2-3-2.5 0-1.2.9-2 1.9-2 .9 0 1.5.6 1.5 1.4"}),e.jsx("path",{d:"M12.6 11.4c0-2.2 1.8-3.9 4.2-3.9 2.2 0 3.8 1.6 3.8 3.6 0 2.4-2 4.4-4.5 4.4-1.1 0-2-.4-2.7-.9"}),e.jsx("path",{d:"M13.4 5.8c1.7-1.1 3.8-.6 4.6.9"}),e.jsx("circle",{cx:"19.4",cy:"4.6",r:"1",fill:"currentColor",stroke:"none"})]}),M=i=>{switch(i){case"akasha-infinity":return"Akasha-Infinity";case"siddha-quantum":return"Siddha-Quantum";case"prana-flow":return"Prana-Flow";default:return"Atma-Seed"}},Be=(i,l)=>{const s=l.toLowerCase();return i==="box"?Ne:s.includes("4-7-8")||s.includes("relaxation")?ze:s.includes("energiz")||s.includes("kapalbhati")?Se:s.includes("crown")||s.includes("pump")?Ae:s.includes("nadi")||s.includes("nostril")?Ce:s.includes("calm")||s.includes("ocean")||s.includes("ujjayi")?_e:P},Qe=()=>{const{t:i}=De(),l=re(),{content:s}=ie(["breathing_title","breathing_subtitle","breathing_description"]),{user:u}=Y(),{tier:m}=se(),{isAdmin:h}=de(),[N,x]=n.useState(W),[t,v]=n.useState(W[0]),[c,w]=n.useState(!1),[d,o]=n.useState("idle"),[f,g]=n.useState(0),[z,S]=n.useState(0),[E,F]=n.useState(0),y=n.useRef(null),[U,A]=n.useState(null),[V,q]=n.useState(!1),[I,$]=n.useState(!0),[B,J]=n.useState(!1);n.useEffect(()=>{(async()=>{if(!u){A(null);return}const{data:r}=await D.from("user_pranayama_health_screening").select("cleared_for_retention, cleared_for_forceful").eq("user_id",u.id).maybeSingle();A(r||null)})()},[u]);const b=a=>!oe({isAdmin:h,tier:m,level:a.level}),K=a=>le(a.technique_type)&&!ce({technique_type:a.technique_type,screening:U});n.useEffect(()=>{(async()=>{const{data:r,error:j}=await D.from("breathing_patterns").select("*").eq("is_active",!0).order("order_index",{ascending:!0});if(!j&&r&&r.length>0){const p=r.filter(k=>k.youtube_url&&k.youtube_url.trim()!==""),_=p.length>0?p:r;x(_);const te=_.find(k=>!b(k))||_[0];v(te)}})()},[m,h]);const Q={inhale:i("breathing.inhale","Breathe In"),hold:i("breathing.hold","Hold"),exhale:i("breathing.exhale","Breathe Out"),holdOut:i("breathing.holdOut","Hold"),idle:i("breathing.ready","Ready")},T=a=>{const r=t;switch(a){case"inhale":return r.hold>0?"hold":"exhale";case"hold":return"exhale";case"exhale":return r.hold_out>0?"holdOut":"inhale";case"holdOut":return"inhale";default:return"inhale"}},L=a=>{switch(a){case"inhale":return t.inhale;case"hold":return t.hold;case"exhale":return t.exhale;case"holdOut":return t.hold_out;default:return 0}},R=()=>{w(!0),S(1),o("inhale"),g(t.inhale),F(0)},X=()=>{if(b(t)){l("/membership");return}if(K(t)){q(!0);return}R()},C=()=>{w(!1),o("idle"),g(0),S(0),y.current&&clearInterval(y.current)},Z=()=>{C()};n.useEffect(()=>{if(c)return y.current=setInterval(()=>{F(a=>a+1),g(a=>{if(a<=1){const r=T(d),j=L(r);if(r==="inhale"&&d!=="idle"){if(z>=t.cycles)return C(),0;S(p=>p+1)}if(j===0){const p=T(r);return o(p),L(p)}return o(r),j}return a-1})},1e3),()=>{y.current&&clearInterval(y.current)}},[c,d,z,t]);const ee=`orb-${d}`,ae=`scale-${d}`;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Fe}),e.jsx("div",{className:"sqi-page",children:e.jsxs("div",{className:"sqi-content",children:[e.jsxs("div",{className:"cave-header",children:[e.jsxs("div",{className:"back-nav",children:[e.jsxs("button",{onClick:()=>l(-1),className:"back-btn",children:[e.jsx(be,{size:14}),e.jsx("span",{children:i("common.back","Back")})]}),e.jsx("button",{onClick:()=>l("/dashboard"),className:"temple-btn",children:"✦ Return to Temple"})]}),e.jsxs("div",{className:"hero-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:14},children:[e.jsx("div",{className:"hero-icon-wrap",children:e.jsx(ue,{size:28,color:"#D4AF37"})}),e.jsxs("div",{className:"hero-titles",children:[e.jsx("h1",{className:"hero-shimmer-title",children:s.breathing_title||"Pranayama Cave"}),e.jsx("p",{children:s.breathing_subtitle||"Sacred Breath · Vedic Light-Codes"})]})]}),e.jsx(ne,{})]})]}),e.jsx("div",{className:"access-badges",children:e.jsxs("span",{className:"badge badge-free",children:[e.jsx(me,{size:13,strokeWidth:2.25}),"Free — No Subscription Needed"]})}),e.jsxs("div",{className:"howto-strip",children:[e.jsxs("div",{className:"howto-step",children:[e.jsx("div",{className:"howto-num",children:"1"}),e.jsxs("div",{className:"howto-text",children:[e.jsx("strong",{children:"Choose"})," a pattern below"]})]}),e.jsx("div",{className:"howto-arrow",children:"→"}),e.jsxs("div",{className:"howto-step",children:[e.jsx("div",{className:"howto-num",children:"2"}),e.jsxs("div",{className:"howto-text",children:[e.jsx("strong",{children:"Press"})," Begin the Kriya"]})]}),e.jsx("div",{className:"howto-arrow",children:"→"}),e.jsxs("div",{className:"howto-step",children:[e.jsx("div",{className:"howto-num",children:"3"}),e.jsxs("div",{className:"howto-text",children:[e.jsx("strong",{children:"Follow"})," the orb — in and out"]})]})]}),e.jsx("div",{className:"cave-divider",children:e.jsx("span",{children:"🕉"})}),e.jsx("div",{style:{margin:"0 20px 8px",padding:"0"},children:e.jsx("span",{className:"section-label",children:"⬡ Step 1 · Choose Your Pattern"})}),e.jsx("div",{className:"cave-grid",children:N.map(a=>{const r=Be(a.id,a.name);return e.jsxs("button",{onClick:()=>{c||v(a)},disabled:c,className:`cave-technique-card ${t.id===a.id?"active":""} ${c?"disabled":""} ${b(a)?"locked":""}`,children:[t.id===a.id&&e.jsx("div",{className:"active-glow-dot"}),b(a)&&e.jsx("div",{className:"lock-badge",children:e.jsx(O,{size:10,strokeWidth:2.5})}),e.jsx("div",{className:"technique-icon-ring",children:e.jsx(r,{size:20,strokeWidth:1.75})}),e.jsx("span",{className:`level-pill level-${a.level||"beginner"}`,children:(a.level||"beginner").charAt(0).toUpperCase()+(a.level||"beginner").slice(1)}),e.jsx("div",{className:"technique-name",children:a.name}),e.jsx("div",{className:"technique-desc",children:a.description}),e.jsxs("div",{className:"technique-ratio",children:[a.inhale,"-",a.hold,"-",a.exhale,a.hold_out>0?`-${a.hold_out}`:""]})]},a.id)})}),e.jsxs("div",{className:"guidance-panel glass-card",children:[e.jsxs("button",{className:"guidance-toggle",onClick:()=>$(a=>!a),children:[e.jsxs("div",{className:"guidance-toggle-left",children:[e.jsx(P,{size:15,color:"#D4AF37"}),e.jsxs("div",{children:[e.jsxs("div",{className:"guidance-title",children:[t.name,t.sanskrit_name?e.jsxs("span",{className:"guidance-sanskrit",children:[" · ",t.sanskrit_name]}):null]}),e.jsx("div",{className:"guidance-sub",children:b(t)?`Requires ${M(t.tier_required)}`:"Proper Siddha guidance for this practice"})]})]}),I?e.jsx(H,{size:16,color:"rgba(255,255,255,.4)"}):e.jsx(G,{size:16,color:"rgba(255,255,255,.4)"})]}),I&&e.jsxs("div",{className:"guidance-body",children:[b(t)&&e.jsxs("div",{className:"guidance-lock-notice",children:[e.jsx(O,{size:13,color:"#D4AF37"}),e.jsxs("span",{children:["This technique is part of ",M(t.tier_required),". ",e.jsx("button",{className:"guidance-upgrade-link",onClick:()=>l("/membership"),children:"Upgrade to unlock →"})]})]}),!!t.steps?.length&&e.jsxs("div",{className:"guidance-section",children:[e.jsx("div",{className:"guidance-section-title",children:"How to Practice"}),e.jsx("ol",{className:"guidance-steps",children:t.steps.map((a,r)=>e.jsx("li",{children:a},r))})]}),!!t.benefits?.length&&e.jsxs("div",{className:"guidance-section",children:[e.jsx("div",{className:"guidance-section-title",children:"Benefits"}),e.jsx("ul",{className:"guidance-list",children:t.benefits.map((a,r)=>e.jsx("li",{children:a},r))})]}),!!t.cautions?.length&&e.jsxs("div",{className:"guidance-section guidance-caution",children:[e.jsx("div",{className:"guidance-section-title",children:"Cautions"}),e.jsx("ul",{className:"guidance-list",children:t.cautions.map((a,r)=>e.jsx("li",{children:a},r))})]}),!!t.contraindications?.length&&e.jsxs("div",{className:"guidance-section guidance-danger",children:[e.jsx("div",{className:"guidance-section-title",children:"Do Not Practice If You Have"}),e.jsx("div",{className:"guidance-tags",children:t.contraindications.map((a,r)=>e.jsx("span",{className:"guidance-tag",children:a},r))})]})]})]}),e.jsxs("div",{className:"timer-section glass-card",children:[e.jsx("div",{className:"timer-section-title",children:"Step 2 · Follow the Orb"}),e.jsxs("div",{className:"timer-circle-wrap",children:[e.jsx("div",{className:`timer-orb ${ee} ${ae}`,children:e.jsxs("div",{className:"orb-inner-text",children:[e.jsx("span",{className:"orb-phase-label",children:Q[d]}),c&&e.jsx("span",{className:"orb-countdown",children:f})]})}),c&&e.jsxs("div",{className:"timer-stats",children:[e.jsxs("div",{className:"timer-stat",children:[e.jsx(fe,{size:13,color:"#D4AF37"}),e.jsxs("span",{children:[i("breathing.cycle","Cycle")," ",z,"/",t.cycles]})]}),e.jsxs("div",{className:"timer-stat",children:[e.jsx(ye,{size:13,color:"rgba(255,255,255,0.4)"}),e.jsxs("span",{children:[Math.floor(E/60),":",(E%60).toString().padStart(2,"0")]})]})]})]})]}),e.jsx("div",{className:"controls-row",children:c?e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:C,className:"btn-stop",children:[e.jsx(we,{size:16}),i("breathing.stop","Stop")]}),e.jsxs("button",{onClick:Z,className:"btn-reset",children:[e.jsx(je,{size:15}),i("breathing.reset","Reset")]})]}):e.jsxs("button",{onClick:X,className:"btn-begin",children:[e.jsx(ve,{size:16}),"Begin the Kriya"]})}),t.youtube_url&&e.jsx("div",{className:"media-section",children:e.jsx("div",{style:{aspectRatio:"16/9"},children:e.jsx("iframe",{src:t.youtube_url.replace("watch?v=","embed/").replace("youtu.be/","youtube.com/embed/"),style:{width:"100%",height:"100%",border:"none"},allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",allowFullScreen:!0,title:t.name})})}),t.audio_url&&!t.youtube_url&&e.jsxs("div",{className:"audio-card gold-border-card",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:12},children:[e.jsx(ke,{size:18,color:"#D4AF37"}),e.jsx("span",{style:{fontWeight:700,color:"rgba(255,255,255,0.8)",fontSize:14,fontFamily:'"Cinzel", serif'},children:i("breathing.guidedAudio","Guided Audio")})]}),e.jsx("audio",{src:t.audio_url,controls:!0,style:{width:"100%"}})]}),e.jsx("div",{className:"cave-divider",children:e.jsx("span",{children:"◈"})}),e.jsxs("div",{className:"cave-guide glass-card",children:[e.jsxs("button",{className:"cave-guide-header",onClick:()=>J(a=>!a),children:[e.jsxs("div",{className:"cave-guide-header-left",children:[e.jsx("div",{className:"cave-guide-icon-ring",children:e.jsx(Ie,{size:18,strokeWidth:1.7})}),e.jsxs("div",{children:[e.jsx("div",{className:"cave-guide-title",children:"Want to Go Deeper?"}),e.jsx("div",{className:"cave-guide-sub",children:"The teachings behind each breath — read anytime"})]})]}),B?e.jsx(H,{size:16,color:"rgba(255,255,255,.4)"}):e.jsx(G,{size:16,color:"rgba(255,255,255,.4)"})]}),B&&e.jsx("div",{className:"cave-guide-body",children:qe.map((a,r)=>e.jsxs("div",{className:"pranayama-guide-item",children:[e.jsx("div",{className:"guide-number",children:r+1}),e.jsxs("div",{className:"guide-text",children:[e.jsx("span",{className:"guide-sanskrit",children:a.sanskrit}),e.jsx("h4",{children:a.title}),e.jsx("p",{children:a.desc})]})]},r))})]}),e.jsxs("div",{className:"benefits-section glass-card",children:[e.jsxs("div",{className:"benefits-title",children:[e.jsx(P,{size:16,color:"#D4AF37"}),i("breathing.benefits","Pranic Benefits")]}),[i("breathing.benefit1","Activates Parasympathetic — end fight-or-flight instantly"),i("breathing.benefit2","Improves Prana-Circulation through all 72,000 Nadis"),i("breathing.benefit3","Promotes deep Yoga Nidra sleep — melatonin + serotonin"),i("breathing.benefit4","Lowers cortisol — scientifically proven in 4 breaths"),i("breathing.benefit5","Opens Anahata (heart chakra) — scalar Prema-Pulse transmission")].map((a,r)=>e.jsxs("div",{className:"benefit-item",children:[e.jsx("div",{className:"benefit-dot"}),e.jsx("span",{children:a})]},r))]})]})}),e.jsx(Ee,{open:V,onOpenChange:q,techniqueType:t.technique_type||"gentle",onCleared:()=>{A({cleared_for_retention:!0,cleared_for_forceful:!0}),R()}})]})};export{Qe as default};
