const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/AIVedicDashboard-wLO051oI.js","assets/index-DPalQnOV.js","assets/vendor-react-DdWqvjvq.js","assets/vendor-crypto-Cz0s2Wb9.js","assets/vendor-radix-E_JnJsxb.js","assets/vendor-i18n-CLO2ZSBh.js","assets/vendor-icons-DQ9y02-X.js","assets/vendor-query-DDdS-q50.js","assets/vendor-supabase-C8XXFrAR.js","assets/vendor-motion-BWTr00U0.js","assets/index-BH5UGkMJ.css","assets/card-DDAEinu4.js","assets/badge-O1jZUye6.js","assets/checkbox-D6i-MgCu.js","assets/slider-B84ob8FC.js","assets/switch-DpbPe-Xv.js","assets/label-DLzfexSv.js","assets/dialog-DksMiAd9.js","assets/format-D-SQBPj_.js","assets/en-US-DaTnBiBt.js","assets/endOfMonth-BS24EeZA.js","assets/useHoraWatch-L_Cw_KAT.js","assets/vedicLocale-DRnQPhF6.js","assets/input-CZHrym7b.js","assets/vedicCalculations-DbxpS8o1.js"])))=>i.map(i=>d[i]);
import{u as W,b as te,s as I,e as S,_ as oe}from"./index-DPalQnOV.js";import{r as n,j as e,i as ne,t as de}from"./vendor-react-DdWqvjvq.js";import{D as R,f as ce,a as F,b as Z,c as X}from"./dialog-DksMiAd9.js";import{v as ae,B as ee}from"./vedicLocale-DRnQPhF6.js";import{B as me}from"./badge-O1jZUye6.js";import{g as ge,a as xe,b as pe}from"./vedicCalculations-DbxpS8o1.js";import{S as re,a2 as he,C as be,ad as ue,aI as fe,w as ye,x as je,Z as ve,l as M,v as E,a as we}from"./vendor-icons-DQ9y02-X.js";import{m as A,A as Ne}from"./vendor-motion-BWTr00U0.js";const ke=()=>{const{user:r}=W(),{tier:t,isAdmin:s}=te(),[a,l]=n.useState([]),[d,p]=n.useState([]),[g,c]=n.useState(!0),h=n.useCallback(async()=>{try{const{data:o,error:x}=await I.from("vedic_astrology_tiers").select("*").eq("is_active",!0).order("order_index",{ascending:!0});if(x)throw x;const j=(o||[]).map(y=>({...y,features:y.features||[],membership_required:Array.isArray(y.membership_required)?y.membership_required:[]}));l(j)}catch(o){console.error("Error fetching Vedic astrology tiers:",o),l([])}},[]),b=n.useCallback(async()=>{if(!r){p([]);return}try{const{data:o,error:x}=await I.from("user_vedic_astrology_access").select("tier_level, granted_at, expires_at, granted_via_membership").eq("user_id",r.id);if(x)throw x;p(o||[])}catch(o){console.error("Error fetching user Vedic astrology access:",o),p([])}},[r]),u=n.useCallback(o=>{if(!r)return!1;if(s)return!0;const x=(t||"").toLowerCase();let j=0;if(x.includes("akasha")||x.includes("life")?j=3:x.includes("siddha")?j=2:(x.includes("prana")||x.includes("premium")||x.includes("month")||x.includes("annual")||x.includes("year"))&&(j=1),o==="basic"||o==="premium"&&j>=1||o==="master"&&j>=3)return!0;const y=d.find(v=>v.tier_level===o);return y?!(y.expires_at&&new Date(y.expires_at)<new Date):!1},[r,d,t,s]),f=n.useCallback(()=>s||u("master")?"master":u("premium")?"premium":u("basic")?"basic":null,[u,s]);return n.useEffect(()=>{(async()=>{c(!0),await Promise.all([h(),b()]),c(!1)})()},[h,b]),{tiers:a,userAccess:d,isLoading:g,hasAccess:u,getHighestAccessLevel:f,isAdmin:s,refetch:()=>Promise.all([h(),b()])}},P=({title:r,icon:t,children:s,defaultOpen:a=!1})=>{const[l,d]=n.useState(a);return e.jsxs("div",{className:"border-b border-amber-900/20",children:[e.jsxs("button",{type:"button",onClick:()=>d(!l),className:"w-full flex items-center justify-between py-5 px-4 text-left hover:bg-amber-900/5 transition-colors duration-300",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[t!=null&&e.jsx("span",{className:"text-amber-400/60 text-lg","aria-hidden":!0,children:t}),e.jsx("h3",{className:"text-lg font-serif tracking-widest text-amber-200/80 uppercase",children:r})]}),e.jsx("span",{className:`text-amber-400/40 transition-transform duration-300 ${l?"rotate-180":""}`,"aria-hidden":!0,children:"▾"})]}),e.jsx("div",{className:`overflow-hidden transition-all duration-500 ease-in-out ${l?"max-h-[2000px] opacity-100":"max-h-0 opacity-0"}`,children:e.jsx("div",{className:"px-4 pb-6",children:s})})]})};function Ae(r){const t=r.trim();if(!t)return[];const s=[];let a=0;for(let d=0;d<t.length;d++){const p=t[d];if(p==="."||p==="!"||p==="?"){const g=t[d+1];if(g===void 0||/\s/.test(g)){const c=t.slice(a,d+1).trim();for(c&&s.push(c),a=d+1;a<t.length&&/\s/.test(t[a]);)a++;d=a-1}}}const l=t.slice(a).trim();return l&&s.push(l),s.length?s:[r]}const N=({text:r,className:t=""})=>{const s=Ae(r);return s.length<=1?e.jsx("p",{className:`text-sm text-amber-100/60 leading-relaxed text-left font-serif ${t}`,children:r}):e.jsx("div",{className:`space-y-3 text-left ${t}`,children:s.map((a,l)=>e.jsx("p",{className:"text-sm text-amber-100/60 leading-relaxed font-serif",children:a},l))})},Se=({tier:r})=>{const{user:t}=W(),{t:s,language:a}=S(),l=ae(a),[d,p]=n.useState(null),[g,c]=n.useState(!0);if(n.useEffect(()=>{(async()=>{if(!t){c(!1);return}try{const{data:o,error:x}=await I.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",t.id).maybeSingle();if(x)throw x;o?.birth_name&&o?.birth_date&&o?.birth_time&&o?.birth_place&&p({name:o.birth_name,date:o.birth_date,time:o.birth_time,place:o.birth_place})}catch(o){console.error("Error fetching birth details:",o)}finally{c(!1)}})()},[t]),g)return e.jsx("div",{className:"p-8 rounded-2xl bg-[#0d0d14] border border-amber-900/20 flex justify-center",children:e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-2 border-amber-500/30 border-t-amber-400"})});const h=ge(s,d||void 0,r),b=r==="premium"||r==="master"?xe(s,d||void 0):null,u=r==="master"?pe(s,d||void 0):null;return e.jsxs("div",{className:"space-y-2 w-full max-w-full",children:[e.jsxs(P,{title:s("vedicAstrology.dailyTitle"),icon:"✨",defaultOpen:!0,children:[e.jsx("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-4",children:e.jsx(me,{className:"bg-amber-500/20 text-amber-300 border-amber-700/30 text-[10px] sm:text-xs w-fit",children:new Date().toLocaleDateString(l,{weekday:"short",month:"short",day:"numeric"})})}),e.jsxs("div",{className:"p-3 sm:p-4 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full mb-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1 flex-wrap",children:[e.jsx(re,{className:"w-4 h-4 text-amber-400 shrink-0"}),e.jsx("span",{className:"font-serif font-semibold text-amber-200/80 text-sm sm:text-base",children:s("vedicAstrology.dailyNakshatra",{name:h.nakshatra})})]}),e.jsx("p",{className:"text-sm text-amber-100/60 leading-relaxed font-serif",children:h.theme})]}),e.jsxs("div",{className:"w-full mb-4",children:[e.jsx("p",{className:"text-sm font-serif font-medium text-amber-200/80 mb-1",children:s("vedicAstrology.dailyPlanetary")}),e.jsx("p",{className:"text-sm text-amber-100/60 leading-relaxed font-serif",children:h.planetaryInfluence})]}),e.jsx("div",{className:"p-3 sm:p-4 rounded-xl bg-amber-900/10 border border-amber-700/20 w-full mb-4",children:e.jsxs("div",{className:"flex items-start gap-2 sm:gap-3",children:[e.jsx(he,{className:"w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("p",{className:"text-sm italic text-amber-100/80 mb-1 leading-relaxed font-serif",children:['"',h.wisdomQuote,'"']}),e.jsxs("p",{className:"text-[10px] sm:text-xs text-amber-200/50 font-serif",children:["— ",h.teacher]})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4",children:[e.jsxs("div",{className:"p-3 sm:p-4 rounded-xl bg-emerald-900/10 border border-emerald-800/20 w-full",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(be,{className:"w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 shrink-0"}),e.jsx("span",{className:"font-serif font-semibold text-amber-200/80 text-sm",children:s("vedicAstrology.dailyWhatToDo")})]}),e.jsx("ul",{className:"space-y-0.5 sm:space-y-1",children:h.do.map((f,o)=>e.jsxs("li",{className:"text-sm text-amber-100/60 flex items-start gap-2 leading-relaxed font-serif",children:[e.jsx("span",{className:"text-emerald-400 mt-0.5 shrink-0",children:"•"}),e.jsx("span",{children:f})]},o))})]}),e.jsxs("div",{className:"p-3 sm:p-4 rounded-xl bg-red-900/10 border border-red-800/20 w-full",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(ue,{className:"w-3 h-3 sm:w-4 sm:h-4 text-red-400 shrink-0"}),e.jsx("span",{className:"font-serif font-semibold text-amber-200/80 text-sm",children:s("vedicAstrology.dailyWhatToAvoid")})]}),e.jsx("ul",{className:"space-y-0.5 sm:space-y-1",children:h.avoid.map((f,o)=>e.jsxs("li",{className:"text-sm text-amber-100/60 flex items-start gap-2 leading-relaxed font-serif",children:[e.jsx("span",{className:"text-red-400 mt-0.5 shrink-0",children:"•"}),e.jsx("span",{children:f})]},o))})]})]}),!d&&e.jsx("div",{className:"p-3 rounded-xl bg-amber-900/10 border border-amber-900/20 w-full",children:e.jsx("p",{className:"text-xs text-amber-200/60 text-center font-serif",children:s("vedicAstrology.dailyTip")})})]}),b&&e.jsxs(P,{title:s("vedicAstrology.dailyCompassTitle"),icon:"🧭",defaultOpen:!1,children:[e.jsx("p",{className:"text-sm text-amber-100/60 leading-relaxed font-serif mb-4",children:b.personalizedMessage}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",children:[e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2",children:s("vedicAstrology.dailyCareer")}),e.jsx(N,{text:b.career})]}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2",children:s("vedicAstrology.dailyRelations")}),e.jsx(N,{text:b.relationships})]}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2",children:s("vedicAstrology.dailyHealth")}),e.jsx(N,{text:b.health})]}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2",children:s("vedicAstrology.dailyFinance")}),e.jsx(N,{text:b.finances})]})]}),!d&&e.jsx("div",{className:"p-3 rounded-lg bg-amber-900/10 border border-amber-700/20 mt-4",children:e.jsx("p",{className:"text-xs text-amber-200/60 text-center font-serif",children:s("vedicAstrology.dailyUnlockCompass")})})]}),u&&e.jsxs(P,{title:s("vedicAstrology.dailyMasterTitle"),icon:"📜",defaultOpen:!1,children:[e.jsx("p",{className:"text-sm text-amber-100/60 leading-relaxed font-serif mb-4",children:s("vedicAstrology.dailyMasterIntro")}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left mb-4",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2",children:s("vedicAstrology.dailySoulPurpose")}),e.jsx(N,{text:u.soulPurpose})]}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left mb-4",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2",children:s("vedicAstrology.dailyKarma")}),e.jsx(N,{text:u.karmaPatterns})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mb-4",children:[e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2",children:s("vedicAstrology.dailyStrengths")}),e.jsx(N,{text:u.strengths})]}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2",children:s("vedicAstrology.dailyChallenges")}),e.jsx(N,{text:u.challenges})]})]}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left mb-4",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2",children:s("vedicAstrology.dailyTiming")}),e.jsx(N,{text:u.timingPeaks})]}),e.jsxs("div",{className:"p-4 sm:p-5 rounded-xl bg-amber-900/10 border border-amber-700/20 w-full text-left mb-4",children:[e.jsx("h4",{className:"font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2",children:s("vedicAstrology.dailyBirthChart")}),e.jsx(N,{text:u.birthChartSummary})]}),!d&&e.jsx("div",{className:"p-3 rounded-lg bg-amber-900/10 border border-amber-700/20",children:e.jsx("p",{className:"text-xs text-amber-200/60 text-center font-serif",children:s("vedicAstrology.dailyUnlockMaster")})})]})]})},_e=()=>e.jsxs("div",{className:"incense-smoke","aria-hidden":!0,children:[e.jsx("div",{className:"smoke-wisp"}),e.jsx("div",{className:"smoke-wisp"}),e.jsx("div",{className:"smoke-wisp"}),e.jsx("div",{className:"smoke-wisp"})]}),Ce=({name:r,birthData:t,syncTime:s,onAdjustBirthData:a})=>{const{t:l}=S(),[d,p]=n.useState(!1);return e.jsxs("div",{className:"border-b border-amber-900/30 bg-[#0a0a0f]",children:[e.jsxs("div",{role:"button",tabIndex:0,onClick:()=>p(!d),onKeyDown:g=>{(g.key==="Enter"||g.key===" ")&&(g.preventDefault(),p(c=>!c))},className:"flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-amber-900/5 transition-colors",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]","aria-hidden":!0}),e.jsx("h2",{className:"text-lg font-serif tracking-wide text-amber-100",children:r})]}),e.jsx("span",{className:"text-amber-400/40 text-sm",children:l(d?"vedicAstrology.sacredHeaderClose":"vedicAstrology.sacredHeaderOpen")})]}),d&&e.jsx("div",{className:"px-6 pb-5 border-t border-amber-900/20 bg-[#0d0d14] animate-in slide-in-from-top duration-300",role:"region","aria-label":l("vedicAstrology.sacredHeaderBirthDetailsAria"),children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 pt-4",children:[e.jsxs("div",{className:"text-sm text-amber-200/50 space-y-1",children:[e.jsxs("p",{children:["📍 ",t.location]}),e.jsxs("p",{children:["🗓️ ",t.date," ",l("vedicAstrology.sacredHeaderAt")," ",t.time]}),e.jsx("p",{className:"text-xs italic",children:l("vedicAstrology.sacredHeaderLastSynced",{time:s})})]}),e.jsx("div",{className:"flex flex-col gap-2",children:a&&e.jsx("button",{type:"button",onClick:g=>{g.stopPropagation(),a()},className:"px-4 py-2 bg-amber-900/20 border border-amber-700/30 rounded-lg text-amber-200/70 hover:bg-amber-900/30 transition text-sm",children:l("vedicAstrology.adjustBirthData")})})]})})]})};function q(r,t){const[s,a]=n.useState(()=>{try{const l=typeof window<"u"?localStorage.getItem(r):null;return l?JSON.parse(l):t}catch{return t}});return n.useEffect(()=>{try{typeof window<"u"&&localStorage.setItem(r,JSON.stringify(s))}catch{}},[r,s]),[s,a]}const De=n.lazy(()=>oe(()=>import("./AIVedicDashboard-wLO051oI.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24])).then(r=>({default:r.AIVedicDashboard}))),Be=r=>{switch(r){case"basic":return"free";case"premium":return"compass";case"master":return"premium";case"prana-flow":case"premium-monthly":case"premium-annual":return"compass";case"siddha-quantum":case"akasha-infinity":case"lifetime":return"premium";default:return"free"}},ze=r=>{switch(r){case"prana-flow":case"premium-monthly":case"premium-annual":case"compass":return"premium";case"siddha-quantum":case"akasha-infinity":case"lifetime":case"master":return"master";default:return"basic"}},i={gold:"#D4AF37",goldGlow:"rgba(212,175,55,0.25)",goldDim:"rgba(212,175,55,0.08)",black:"#050505",glass:"rgba(255,255,255,0.02)",glassBorder:"rgba(255,255,255,0.05)",cyan:"#22D3EE",cyanGlow:"rgba(34,211,238,0.15)",white60:"rgba(255,255,255,0.60)",white30:"rgba(255,255,255,0.30)"},qe=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&display=swap');

  :root {
    --sqi-gold: ${i.gold};
    --sqi-black: ${i.black};
    --sqi-cyan: ${i.cyan};
  }

  .sqi-root {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: ${i.black};
    min-height: 100vh;
    overflow-x: hidden;
  }

  .glass-card {
    background: ${i.glass};
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid ${i.glassBorder};
    border-radius: 40px;
  }

  .glass-card-md {
    background: ${i.glass};
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid ${i.glassBorder};
    border-radius: 24px;
  }

  .gold-glow {
    text-shadow: 0 0 20px ${i.goldGlow}, 0 0 40px rgba(212,175,55,0.12);
    color: ${i.gold};
  }

  .gold-border {
    border: 1px solid rgba(212,175,55,0.3);
    box-shadow: 0 0 20px rgba(212,175,55,0.08), inset 0 0 20px rgba(212,175,55,0.03);
  }

  .gold-border-active {
    border: 1px solid rgba(212,175,55,0.6);
    box-shadow: 0 0 30px rgba(212,175,55,0.20), inset 0 0 30px rgba(212,175,55,0.05);
  }

  .sqi-toggle {
    background: rgba(212,175,55,0.05);
    border: 1px solid rgba(212,175,55,0.15);
    border-radius: 100px;
    padding: 4px;
    display: inline-flex;
  }

  .sqi-toggle-btn {
    padding: 8px 20px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: all 0.25s ease;
    color: rgba(212,175,55,0.5);
    cursor: pointer;
    border: none;
    background: transparent;
  }

  .sqi-toggle-btn.active {
    background: ${i.gold};
    color: ${i.black};
    box-shadow: 0 0 16px rgba(212,175,55,0.40);
  }

  .sqi-label {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: ${i.gold};
    opacity: 0.7;
  }

  .sqi-title {
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 900;
    letter-spacing: -0.05em;
    color: ${i.gold};
  }

  .sqi-body {
    font-weight: 400;
    line-height: 1.6;
    color: ${i.white60};
  }

  @keyframes nadiPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @keyframes orbitSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes cosmicFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes goldShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes anahataExpand {
    0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.15); }
    50% { box-shadow: 0 0 50px rgba(212,175,55,0.35), 0 0 100px rgba(212,175,55,0.10); }
  }

  .float-anim { animation: cosmicFloat 6s ease-in-out infinite; }
  .pulse-anim { animation: nadiPulse 3s ease-in-out infinite; }
  .anahata-glow { animation: anahataExpand 4s ease-in-out infinite; }

  .shimmer-text {
    background: linear-gradient(90deg, ${i.gold} 0%, #FFF7D6 40%, ${i.gold} 60%, #C89F2A 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: goldShimmer 4s linear infinite;
  }

  .tier-badge-free {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.5);
  }
  .tier-badge-prana {
    background: rgba(212,175,55,0.10);
    border: 1px solid rgba(212,175,55,0.35);
    color: ${i.gold};
  }
  .tier-badge-active {
    background: rgba(212,175,55,0.15);
    border: 1px solid rgba(212,175,55,0.50);
    color: ${i.gold};
    box-shadow: 0 0 12px rgba(212,175,55,0.20);
  }

  .nadi-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, ${i.cyan}, transparent);
    opacity: 0.3;
    margin: 16px 0;
  }

  .sqi-cta {
    background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05));
    border: 1px solid rgba(212,175,55,0.30);
    border-radius: 24px;
    padding: 32px;
    text-align: center;
  }

  .sqi-btn-gold {
    background: linear-gradient(135deg, #D4AF37, #C89F2A, #D4AF37);
    background-size: 200% auto;
    color: #050505;
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: none;
    border-radius: 100px;
    padding: 14px 32px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(212,175,55,0.30);
  }
  .sqi-btn-gold:hover {
    background-position: right center;
    box-shadow: 0 0 40px rgba(212,175,55,0.50);
    transform: translateY(-1px);
  }

  .ai-chat-badge {
    background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04));
    border: 1px solid rgba(34,211,238,0.25);
    border-radius: 100px;
    padding: 4px 12px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${i.cyan};
  }

  .star-field {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .star-dot {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: nadiPulse 4s ease-in-out infinite;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(212,175,55,0.30), transparent);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 2px; }
`,Ie=()=>{const r=Array.from({length:60},(t,s)=>({id:s,x:Math.random()*100,y:Math.random()*100,size:Math.random()*1.5+.5,delay:Math.random()*4,opacity:Math.random()*.4+.05}));return e.jsx("div",{className:"star-field",children:r.map(t=>e.jsx("div",{className:"star-dot",style:{left:`${t.x}%`,top:`${t.y}%`,width:t.size,height:t.size,opacity:t.opacity,animationDelay:`${t.delay}s`}},t.id))})},Te=()=>e.jsxs("svg",{width:"120",height:"120",viewBox:"0 0 120 120",fill:"none",style:{filter:`drop-shadow(0 0 18px ${i.goldGlow})`},className:"float-anim",children:[e.jsx("circle",{cx:"60",cy:"60",r:"56",stroke:i.gold,strokeWidth:"0.5",opacity:"0.3"}),e.jsx("circle",{cx:"60",cy:"60",r:"48",stroke:i.gold,strokeWidth:"0.3",opacity:"0.2"}),Array.from({length:9}).map((r,t)=>{const s=t/9*Math.PI*2-Math.PI/2;return e.jsx("circle",{cx:60+42*Math.cos(s),cy:60+42*Math.sin(s),r:"2.5",fill:i.gold,opacity:.6+t*.04},t)}),Array.from({length:12}).map((r,t)=>{const s=t/12*Math.PI*2;return e.jsx("line",{x1:"60",y1:"60",x2:60+50*Math.cos(s),y2:60+50*Math.sin(s),stroke:i.gold,strokeWidth:"0.3",opacity:"0.15"},t)}),e.jsx("circle",{cx:"60",cy:"60",r:"14",stroke:i.gold,strokeWidth:"0.8",opacity:"0.5"}),e.jsx("circle",{cx:"60",cy:"60",r:"6",fill:i.gold,opacity:"0.8",className:"pulse-anim"}),e.jsx("text",{x:"60",y:"64",textAnchor:"middle",fontSize:"10",fill:i.gold,opacity:"0.9",fontFamily:"serif",children:"ॐ"})]}),se=({size:r=300,speed:t=30,planetColor:s=i.gold,opacity:a=.12})=>e.jsx("div",{style:{position:"absolute",width:r,height:r,borderRadius:"50%",border:`1px solid rgba(212,175,55,${a})`,animation:`orbitSpin ${t}s linear infinite`,pointerEvents:"none"},children:e.jsx("div",{style:{position:"absolute",top:-3,left:"50%",transform:"translateX(-50%)",width:6,height:6,borderRadius:"50%",background:s,boxShadow:`0 0 8px ${s}`}})}),$e=[{sym:"☉",key:"surya",color:"#FFB347"},{sym:"☽",key:"chandra",color:"#C8E6FF"},{sym:"♂",key:"mangala",color:"#FF6B6B"},{sym:"☿",key:"budha",color:"#7AFFD4"},{sym:"♃",key:"guru",color:"#FFD700"},{sym:"♀",key:"shukra",color:"#FFB6C1"},{sym:"♄",key:"shani",color:"#B0C4DE"},{sym:"Rā",key:"rahu",color:"#9B59B6"},{sym:"Ke",key:"ketu",color:"#E67E22"}],Re=()=>{const{t:r}=S();return e.jsx("div",{style:{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",padding:"12px 0"},children:$e.map(t=>e.jsxs("div",{style:{background:`rgba(${t.color==="#FFD700"?"212,175,55":"255,255,255"},0.03)`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"6px 12px",textAlign:"center",minWidth:44},children:[e.jsx("div",{style:{fontSize:16,color:t.color,opacity:.85},children:t.sym}),e.jsx("div",{style:{fontSize:7,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",marginTop:2},children:r(`vedicAstrology.grahas.${t.key}`)})]},t.key))})},Fe=({tier:r,isActive:t,isLocked:s,onAction:a,membershipTier:l,membershipMap:d})=>{const{t:p}=S(),g=r.tier_level!=="basic";return e.jsxs(A.div,{initial:{opacity:0,y:16},animate:{opacity:1,y:0},style:{background:t?"linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))":i.glass,backdropFilter:"blur(40px)",border:t?"1px solid rgba(212,175,55,0.35)":"1px solid rgba(255,255,255,0.05)",borderRadius:32,padding:"28px 28px",marginBottom:16,opacity:s?.55:1,boxShadow:t?"0 0 40px rgba(212,175,55,0.12)":"none",transition:"all 0.3s ease"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:6},children:[e.jsx("h3",{style:{fontWeight:900,fontSize:"1.1rem",letterSpacing:"-0.03em",color:t?i.gold:"rgba(255,255,255,0.8)"},children:r.name}),t&&!s&&e.jsx("span",{className:"tier-badge-active",style:{fontSize:7,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",padding:"3px 10px",borderRadius:100},children:p("vedicAstrology.tierActive")}),s&&e.jsxs("span",{className:"tier-badge-free",style:{fontSize:7,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",padding:"3px 10px",borderRadius:100,display:"flex",alignItems:"center",gap:4},children:[e.jsx(M,{size:8})," ",p("vedicAstrology.tierLocked")]})]}),e.jsx("p",{className:"sqi-body",style:{fontSize:"0.78rem",maxWidth:380},children:r.description})]}),g&&!s&&e.jsx("div",{style:{color:i.gold,opacity:.7},children:e.jsx(E,{size:22})})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:p("vedicAstrology.requiredMembership")}),e.jsx("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:r.membership_required.map(c=>e.jsx("span",{style:{fontSize:9,fontWeight:800,letterSpacing:"0.10em",textTransform:"uppercase",padding:"4px 10px",borderRadius:100,background:l===c?"rgba(212,175,55,0.18)":"rgba(255,255,255,0.04)",border:l===c?"1px solid rgba(212,175,55,0.4)":"1px solid rgba(255,255,255,0.08)",color:l===c?i.gold:"rgba(255,255,255,0.40)"},children:d[c]||c},c))})]}),e.jsx("div",{className:"nadi-line"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:8,marginBottom:20},children:r.features.map((c,h)=>e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:8},children:[e.jsx("div",{style:{width:5,height:5,borderRadius:"50%",background:t?i.gold:"rgba(255,255,255,0.3)",marginTop:5,flexShrink:0}}),e.jsx("span",{className:"sqi-body",style:{fontSize:"0.75rem"},children:c})]},h))}),s?e.jsxs("button",{onClick:a,style:{width:"100%",padding:"13px 24px",borderRadius:100,background:"transparent",border:"1px solid rgba(212,175,55,0.25)",color:"rgba(212,175,55,0.6)",fontWeight:800,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s"},children:[e.jsx(M,{size:10,style:{display:"inline",marginRight:6,verticalAlign:"middle"}}),p("vedicAstrology.activatePranaUnlock")]}):e.jsxs("button",{className:"sqi-btn-gold",onClick:a,style:{width:"100%"},children:[e.jsx(we,{size:11,style:{display:"inline",marginRight:6,verticalAlign:"middle"}}),p("vedicAstrology.enterChamber",{name:r.name})]})]})},Pe=({onUpgrade:r})=>{const{t}=S(),s=[1,2,3,4,5].map(a=>t(`vedicAstrology.upgradeFeat${a}`));return e.jsxs("div",{style:{padding:"8px 0"},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:20},children:[e.jsx("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:"50%",background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.25)",marginBottom:12},children:e.jsx("span",{style:{fontSize:28},children:"🔱"})}),e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:t("vedicAstrology.upgradePranaRequired")}),e.jsx("h2",{style:{fontWeight:900,fontSize:"1.5rem",letterSpacing:"-0.04em",color:i.gold,textShadow:`0 0 20px ${i.goldGlow}`,marginBottom:8},children:t("vedicAstrology.upgradeUnlockOracle")}),e.jsx("p",{className:"sqi-body",style:{fontSize:"0.8rem",maxWidth:320,margin:"0 auto"},children:t("vedicAstrology.upgradeBody")})]}),e.jsx("div",{className:"nadi-line"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:10,margin:"16px 0 24px"},children:s.map((a,l)=>e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center",background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.10)",borderRadius:12,padding:"10px 16px"},children:[e.jsx("span",{style:{color:i.gold,fontSize:10},children:"✦"}),e.jsx("span",{className:"sqi-body",style:{fontSize:"0.78rem"},children:a})]},l))}),e.jsxs("button",{className:"sqi-btn-gold",onClick:r,style:{width:"100%",fontSize:10},children:[e.jsx(E,{size:11,style:{display:"inline",marginRight:6,verticalAlign:"middle"}}),t("vedicAstrology.activatePranaFlow")]})]})},Me=()=>{const r=ne(),[t]=de(),{user:s}=W(),{t:a,language:l}=S(),d=ae(l),{tiers:p,isLoading:g,hasAccess:c,getHighestAccessLevel:h}=ke(),{tier:b}=te(),[u,f]=n.useState(!1),[o,x]=n.useState(!1),j=s?.id??"anon",y=m=>`sh:vedic:${j}:${m}`,[v,_]=q(y("aiMode"),!0),[O,T]=q(y("sync"),{status:"idle"}),[H,L]=q(y("birth"),null);q(y("cachedResults"),null);const[C,D]=n.useState(!1),[w,B]=n.useState(null),[ie,z]=n.useState(null),U=O.status==="synced",V=O.lastSyncedAt??null,$=async()=>{if(s)try{const{data:m}=await I.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",s.id).maybeSingle();m?.birth_name&&m?.birth_date&&m?.birth_time&&m?.birth_place?(D(!0),B(m),L(m),U||T({status:"synced",lastSyncedAt:new Date().toISOString()})):(D(!1),B(null))}catch(m){console.error("Error checking birth details:",m)}};n.useEffect(()=>{!w&&H&&(B(H),D(!0))},[]),n.useEffect(()=>{if(!s){B(null),D(!1),L(null);return}$()},[s]);const G=n.useRef(h);G.current=h,n.useEffect(()=>{if(g)return;const m=t.get("tier")||null;if(m&&c(m)){z(m);return}const Q=G.current();z(Q||ze(b))},[g,b,c,t]);const k=b!=="free";n.useEffect(()=>{g||!k&&v&&_(!1)},[g,k,v,_]),n.useEffect(()=>{!g&&k&&!v&&localStorage.getItem(`sh:vedic:${j}:aiMode`)===null&&_(!0)},[g,k,v,j,_]);const J=m=>{if(m&&!k){x(!0);return}_(m)},Y=C?{name:w?.birth_name||"",birthDate:w?.birth_date||"",birthTime:w?.birth_time||"",birthPlace:w?.birth_place||"",plan:Be(b)}:null,le=n.useMemo(()=>({free:a("vedicAstrology.membershipFree"),"prana-flow":a("vedicAstrology.membershipPranaFlow"),"siddha-quantum":a("vedicAstrology.membershipSiddhaQuantum"),"akasha-infinity":a("vedicAstrology.membershipAkashaInfinity"),"premium-monthly":a("vedicAstrology.membershipPremiumMonthly"),"premium-annual":a("vedicAstrology.membershipPremiumAnnual"),lifetime:a("vedicAstrology.membershipLifetime")}),[a]);if(g)return e.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",background:i.black},children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:16},children:[e.jsx("div",{className:"pulse-anim",style:{width:48,height:48,borderRadius:"50%",border:`2px solid ${i.gold}`,borderTopColor:"transparent",animation:"orbitSpin 1s linear infinite"}}),e.jsx("span",{className:"sqi-label",children:a("vedicAstrology.loadingArchive")})]})});const K=ie??"basic";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:qe}),e.jsxs("div",{className:"sqi-root",style:{position:"relative"},children:[e.jsx(Ie,{}),e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"},children:[e.jsx("div",{style:{position:"absolute",top:"-15%",right:"-10%",width:"55%",height:"55%",borderRadius:"50%",background:"rgba(212,175,55,0.04)",filter:"blur(120px)"}}),e.jsx("div",{style:{position:"absolute",bottom:"-15%",left:"-10%",width:"45%",height:"45%",borderRadius:"50%",background:"rgba(212,175,55,0.03)",filter:"blur(100px)"}}),e.jsx("div",{style:{position:"absolute",top:"30%",left:"20%",width:"30%",height:"30%",borderRadius:"50%",background:"rgba(34,211,238,0.02)",filter:"blur(80px)"}})]}),e.jsx(_e,{}),e.jsxs("div",{style:{position:"relative",zIndex:1,maxWidth:860,margin:"0 auto",padding:"0 20px 96px"},children:[e.jsxs(A.header,{initial:{opacity:0,y:-30},animate:{opacity:1,y:0},transition:{duration:.7},style:{textAlign:"center",paddingTop:56,paddingBottom:32},children:[e.jsxs("div",{style:{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",width:160,height:160,marginBottom:20},children:[e.jsx(se,{size:150,speed:40,opacity:.12}),e.jsx(se,{size:120,speed:25,opacity:.08,planetColor:i.cyan}),e.jsx("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Te,{})})]}),e.jsx("div",{className:"sqi-label",style:{marginBottom:10},children:a("vedicAstrology.eyebrowChamber")}),e.jsx("h1",{className:"shimmer-text",style:{fontSize:"clamp(2rem, 5vw, 3.4rem)",fontWeight:900,letterSpacing:"-0.05em",lineHeight:1.1,marginBottom:12},children:a("vedicAstrology.heroTitle")}),e.jsx("p",{className:"sqi-body",style:{maxWidth:480,margin:"0 auto 16px",fontSize:"0.88rem"},children:a("vedicAstrology.heroBody")}),k&&e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"center"},children:[e.jsxs("span",{className:"ai-chat-badge",children:[e.jsx(fe,{size:8,style:{display:"inline",marginRight:4,verticalAlign:"middle"}}),a("vedicAstrology.badgeOracleActive")]}),e.jsx("span",{className:"ai-chat-badge",style:{background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.20)",color:i.gold},children:a("vedicAstrology.badgePranaFull")})]})]}),e.jsxs(A.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.3,duration:.6},className:"glass-card",style:{padding:"16px 20px",marginBottom:24},children:[e.jsx("div",{className:"sqi-label",style:{textAlign:"center",marginBottom:12},children:a("vedicAstrology.navagrahaStripTitle")}),e.jsx(Re,{})]}),e.jsxs(A.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.2,duration:.5},style:{marginBottom:24},children:[C?e.jsx("div",{className:"glass-card gold-border anahata-glow",style:{padding:"24px 28px"},children:e.jsx(Ce,{name:w?.birth_name||a("vedicAstrology.yourChartFallback"),birthData:{location:w?.birth_place||"",date:w?.birth_date||"",time:w?.birth_time||""},syncTime:U&&V?new Date(V).toLocaleString(d):a("vedicAstrology.notSyncedYet"),onAdjustBirthData:()=>f(!0)})}):e.jsx("div",{className:"glass-card gold-border",style:{padding:"28px"},children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:16,alignItems:"center",textAlign:"center"},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.25)",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(ye,{size:24,color:i.gold,opacity:.8})}),e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:a("vedicAstrology.birthCoordsRequired")}),e.jsx("h3",{style:{fontWeight:900,fontSize:"1.2rem",letterSpacing:"-0.04em",color:"rgba(255,255,255,0.9)",marginBottom:6},children:a("vedicAstrology.syncCosmicRecords")}),e.jsx("p",{className:"sqi-body",style:{fontSize:"0.8rem",maxWidth:360},children:a("vedicAstrology.birthCoordsBody")})]}),e.jsxs(R,{open:u,onOpenChange:f,children:[e.jsx(ce,{asChild:!0,children:e.jsxs("button",{className:"sqi-btn-gold",children:[e.jsx(je,{size:11,style:{display:"inline",marginRight:6,verticalAlign:"middle"}}),a("vedicAstrology.activateNatalBlueprint")]})}),e.jsxs(F,{style:{background:"#0a0a0f",border:"1px solid rgba(212,175,55,0.20)",borderRadius:24,maxWidth:640,maxHeight:"90vh",overflowY:"auto"},children:[e.jsx(Z,{children:e.jsx(X,{style:{color:i.gold,fontWeight:900,letterSpacing:"-0.04em"},children:a("vedicAstrology.enterBirthDetails")})}),e.jsx(ee,{onSaved:()=>{f(!1),$(),T({status:"synced",lastSyncedAt:new Date().toISOString()})}})]})]}),e.jsx("button",{type:"button",onClick:()=>r("/atma-seed"),style:{fontSize:11,color:"rgba(212,175,55,0.5)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",marginTop:-4},children:a("vedicAstrology.fullActivationGuide")})]})}),C&&e.jsx(R,{open:u,onOpenChange:f,children:e.jsxs(F,{style:{background:"#0a0a0f",border:"1px solid rgba(212,175,55,0.20)",borderRadius:24,maxWidth:640,maxHeight:"90vh",overflowY:"auto"},children:[e.jsx(Z,{children:e.jsx(X,{style:{color:i.gold,fontWeight:900,letterSpacing:"-0.04em"},children:a("vedicAstrology.updateBirthDetailsTitle")})}),e.jsx(ee,{initialData:w,onSaved:()=>{f(!1),$(),T({status:"synced",lastSyncedAt:new Date().toISOString()})}})]})})]}),C&&e.jsxs(A.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.35},style:{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:28},children:[e.jsxs("div",{className:"sqi-toggle",children:[e.jsxs("button",{className:`sqi-toggle-btn ${v?"active":""}`,onClick:()=>J(!0),children:[e.jsx(ve,{size:10,style:{display:"inline",marginRight:5,verticalAlign:"middle"}}),a("vedicAstrology.modeFullJyotish"),!k&&e.jsx("span",{style:{marginLeft:6,fontSize:8,opacity:.7},children:e.jsx(M,{size:8,style:{display:"inline",verticalAlign:"middle"}})})]}),e.jsxs("button",{className:`sqi-toggle-btn ${v?"":"active"}`,onClick:()=>J(!1),children:[e.jsx(re,{size:10,style:{display:"inline",marginRight:5,verticalAlign:"middle"}}),a("vedicAstrology.modeClassic")]})]}),e.jsx("div",{className:"sqi-label",style:{opacity:.5,fontSize:7},children:a(v?"vedicAstrology.modeHintAi":"vedicAstrology.modeHintClassic")})]}),e.jsx(R,{open:o,onOpenChange:x,children:e.jsx(F,{style:{background:"#08080f",border:"1px solid rgba(212,175,55,0.25)",borderRadius:28,maxWidth:440,padding:32},children:e.jsx(Pe,{onUpgrade:()=>{x(!1),r("/membership")}})})}),C&&e.jsx(Ne,{mode:"wait",children:e.jsx(A.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-10},transition:{duration:.5},style:{marginBottom:40},children:v&&Y?e.jsxs("div",{className:"glass-card gold-border-active",style:{padding:0,overflow:"hidden"},children:[e.jsx("div",{style:{padding:"20px 28px 16px",borderBottom:"1px solid rgba(212,175,55,0.10)",background:"rgba(212,175,55,0.03)"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx("div",{style:{width:8,height:8,borderRadius:"50%",background:i.gold,boxShadow:`0 0 8px ${i.gold}`},className:"pulse-anim"}),e.jsx("div",{className:"sqi-label",children:a("vedicAstrology.pranaOracleLive")})]})}),e.jsx("div",{style:{padding:0},children:e.jsx(n.Suspense,{fallback:e.jsxs("div",{style:{minHeight:360,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:32,color:"rgba(212,175,55,0.55)",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase"},children:[e.jsx(A.div,{style:{width:40,height:40,borderRadius:"50%",border:"2px solid rgba(212,175,55,0.25)",borderTopColor:"rgba(212,175,55,0.85)"},animate:{rotate:360},transition:{duration:.9,repeat:1/0,ease:"linear"}}),e.jsx("span",{children:a("vedicAstrology.loadingChamber")})]}),children:e.jsx(De,{user:Y,userId:s?.id,onEditDetails:()=>f(!0),onUpgrade:()=>r("/membership")})})})]}):e.jsxs("div",{children:[e.jsx("div",{style:{marginBottom:16},children:e.jsxs("div",{className:"section-header",children:[e.jsx("div",{className:"sqi-label",children:a("vedicAstrology.classicSectionLabel")}),e.jsx("div",{className:"section-line"})]})}),e.jsx("div",{className:"glass-card",style:{padding:"28px"},children:e.jsx(Se,{tier:K})}),!k&&e.jsxs(A.div,{initial:{opacity:0,y:12},animate:{opacity:1,y:0},transition:{delay:.4},className:"sqi-cta",style:{marginTop:20},children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:a("vedicAstrology.ctaEyebrow")}),e.jsx("h3",{style:{fontWeight:900,fontSize:"1.2rem",letterSpacing:"-0.04em",color:i.gold,marginBottom:8},children:a("vedicAstrology.unlockChamberTitle")}),e.jsx("p",{className:"sqi-body",style:{fontSize:"0.8rem",maxWidth:360,margin:"0 auto 20px"},children:a("vedicAstrology.unlockChamberBody")}),e.jsxs("button",{className:"sqi-btn-gold",onClick:()=>r("/membership"),children:[e.jsx(E,{size:11,style:{display:"inline",marginRight:6,verticalAlign:"middle"}}),a("vedicAstrology.activatePranaFlow")]})]})]})},`${K}-${v}`)}),!k&&e.jsxs(A.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.4,duration:.5},children:[e.jsxs("div",{className:"section-header",style:{marginBottom:20},children:[e.jsx("div",{className:"sqi-label",children:a("vedicAstrology.availableTiers")}),e.jsx("div",{className:"section-line"})]}),p.map(m=>e.jsx(Fe,{tier:m,isActive:c(m.tier_level),isLocked:!c(m.tier_level),membershipTier:b,membershipMap:le,onAction:()=>{c(m.tier_level)?(z(m.tier_level),window.scrollTo({top:0,behavior:"smooth"})):r("/membership")}},m.id))]})]})]})]})},Je=Object.freeze(Object.defineProperty({__proto__:null,default:Me},Symbol.toStringTag,{value:"Module"}));export{P as T,Je as V};
