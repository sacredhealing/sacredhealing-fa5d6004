import{r as d,j as e,i as qe}from"./vendor-react-DdWqvjvq.js";import{s as L,u as Ce,j as Me,D as ge,E as z,G as Ge,H as E,e as Ye,b as Ke,m as A,g as Je,I as Ve,r as Ue}from"./index-DPalQnOV.js";import{u as Qe}from"./useAdminRole-Bx4gCuv8.js";import{u as Xe}from"./useSHCBalance-DMHQoLHH.js";import{u as Ze}from"./useHoraWatch-L_Cw_KAT.js";import{g as er}from"./palmScanStore-STSHeMk5.js";import{L as _e,a as ue,c as ie,l as rr,P as ar,aZ as tr,bQ as nr,r as ir,bh as or,b0 as sr,W as lr,m as dr,aX as cr,bR as pr}from"./vendor-icons-DQ9y02-X.js";import{m as mr}from"./vendor-motion-BWTr00U0.js";import{s as gr}from"./startPranaMonthlyCheckout-CqRnck9v.js";import"./vendor-crypto-Cz0s2Wb9.js";import"./vendor-radix-E_JnJsxb.js";import"./vendor-i18n-CLO2ZSBh.js";import"./vendor-query-DDdS-q50.js";import"./vendor-supabase-C8XXFrAR.js";import"./stripeCheckoutNavigation-AOhyaKuh.js";async function ur(o){try{const{data:r,error:n}=await L.from("mantras").select("*").eq("is_active",!0).order("created_at",{ascending:!1});return n?(console.error("[Mantras] Error fetching mantras:",n),[]):!r||r.length===0?[]:r.map(s=>{const m=s.duration_minutes,l=s.duration_seconds,F=m?Number(m):l?Math.max(1,Math.ceil(Number(l)/60)):3,y=Number(s.required_tier??(s.is_premium?1:0));return{...s,category:s.category||"general",planet_type:s.planet_type||null,is_premium:s.is_premium||!1,required_tier:Number.isFinite(y)?y:0,duration_minutes:F,repetitionsFixed:108}})}catch(r){return console.error("[Mantras] Unexpected error:",r),[]}}const hr=108,pe="sh:bd:",br=15*60*1e3;function ve(o){try{const r=localStorage.getItem(pe+o);if(!r)return null;const{data:n,ts:p}=JSON.parse(r);return Date.now()-p>br?(localStorage.removeItem(pe+o),null):n}catch{return null}}function fr(o,r){try{localStorage.setItem(pe+o,JSON.stringify({data:r,ts:Date.now()}))}catch{}}function xr(o,r){const{user:n}=Ce(),[p,s]=d.useState(!1),[m,l]=d.useState(()=>n?ve(n.id):null),{reading:F,generateReading:y}=Me(),j=r!==void 0?r:F;if(d.useEffect(()=>{if(!n){s(!1),l(null);return}const f=ve(n.id);if(f){l(f),s(!0);return}(async()=>{try{const{data:S}=await L.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",n.id).maybeSingle();if(S?.birth_name&&S?.birth_date&&S?.birth_time&&S?.birth_place){const I={birth_name:S.birth_name,birth_date:S.birth_date,birth_time:S.birth_time,birth_place:S.birth_place};fr(n.id,I),l(I),s(!0)}else s(!1),l(null)}catch(S){console.error("Error fetching birth details:",S),s(!1),l(null)}})()},[n]),d.useEffect(()=>{m&&s(!0)},[m]),d.useEffect(()=>{if(r===void 0&&p&&m&&!j){const f={name:m.birth_name,birthDate:m.birth_date,birthTime:m.birth_time,birthPlace:m.birth_place,plan:"compass"};y(f,0,"Europe/Stockholm",n?.id??void 0)}},[p,m,j,y,r]),!p||!j)return null;const k=ge(),G=j.personalCompass?.currentDasha?.period||null,O=G?z(G.split(" ")[0]):null,T=Ge();if(!(O||k))return null;const W={Sun:{message:"You are currently in a Sun influence. This mantra supports vitality and inner strength.",bestTime:"morning"},Moon:{message:"You are currently in a Moon influence. This mantra supports emotional balance and inner peace.",bestTime:"evening"},Mars:{message:"You are currently in a Mars influence. This mantra supports courage and balanced energy.",bestTime:"morning"},Mercury:{message:"You are currently in a Mercury influence. This mantra supports wisdom and clear communication.",bestTime:"morning"},Jupiter:{message:"You are currently in a Jupiter influence. This mantra supports wisdom and spiritual growth.",bestTime:"morning"},Venus:{message:"You are currently in a Venus influence. This mantra supports love and harmony.",bestTime:"evening"},Saturn:{message:"You are currently in a Saturn influence. This mantra supports balance and stability.",bestTime:"morning"},Rahu:{message:"You are currently in a Rahu influence. This mantra supports grounding and protection.",bestTime:"morning"},Ketu:{message:"You are currently in a Ketu influence. This mantra supports spiritual growth and liberation.",bestTime:"evening"}},D=o.find(f=>E(f,k)),Z=O?o.find(f=>E(f,O)):null,P=T?o.find(f=>E(f,T)):null,oe=Z||D||P,Y=O||k||T;if(!Y||!W[Y])return null;const K=W[Y];return{planet:Y.toLowerCase(),dasha:G,message:K.message,duration:"40 days",repetitions:108,bestTime:K.bestTime,recommendedMantraId:oe?.id||null,dayMantraId:D?.id||null,periodMantraId:Z?.id||null,horaMantraId:P?.id||null,dayPlanet:k,periodPlanet:O,horaPlanet:T}}function yr(o){return d.useMemo(()=>{const r=o?.personalCompass?.currentDasha?.period;if(!r)return null;const n=r.split(" ")[0];return z(n)},[o?.personalCompass?.currentDasha?.period])}let x=null;const C={play(o,r,n){x&&(x.pause(),x.src="",x.load(),x=null);const p=new Audio(o);if(p.preload="auto",r){const s=!n?.endedEveryRepeat;p.addEventListener("ended",r,{once:s})}return p.play().catch(s=>{console.error(s),n?.onPlayError?.(s)}),x=p,p},stop(){x&&(x.pause(),x.currentTime=0,x.src="",x.load(),x=null)},pause(){x?.pause()},resume(){x?.play().catch(console.error)},isPlaying(){return!!(x&&!x.paused)},getCurrent(){return x}},de={Jupiter:"Om Gurave Namaha",Rahu:"Om Ram Rahave Namah",Venus:"Om Shum Shukraya Namah",Sun:"Om Hrim Suryaya Namah",Moon:"Om Shrim Chandramase Namah",Mars:"Om Krim Mangalaya Namah",Mercury:"Om Budhaya Namah",Saturn:"Om Sham Shanaye Namah",Ketu:"Om Kem Ketave Namah"};function vr(o,r,n,p){if(o&&r&&n){if(r==="Spiritual Mastery"&&n==="Jupiter")return{text:"Om Gurave Namaha",planet:"Jupiter"};if(r==="Karmic Debt"&&n==="Rahu")return{text:"Om Ram Rahave Namah",planet:"Rahu"}}if(n&&p)return{text:p,planet:n};if(n&&de[n])return{text:de[n],planet:n};if(o&&r){if(r==="Spiritual Mastery")return{text:"Om Gurave Namaha",planet:"Jupiter"};if(r==="Karmic Debt")return{text:"Om Ram Rahave Namah",planet:"Rahu"}}const s=ge();return{text:de[s]||"Om Gurave Namaha",planet:s}}const jr=({handAnalysisComplete:o,palmArchetype:r,activeDasha:n,prescribedText:p,onPlayRemedy:s,t:m,heartLineLeak:l,onPlayHeartHealing:F,heartHealingMantraTitle:y})=>{const j=vr(o,r,n,p);return e.jsxs("div",{style:{position:"relative",overflow:"hidden",borderRadius:28,border:"2px solid rgba(212,175,55,0.5)",background:"linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(139,92,246,0.04) 50%, rgba(0,0,0,0.6) 100%)",boxShadow:l?"0 0 0 1px rgba(212,175,55,0.3), 0 0 24px rgba(212,175,55,0.2), 0 0 40px rgba(244,63,94,0.15)":"0 0 0 1px rgba(212,175,55,0.3), 0 0 24px rgba(212,175,55,0.2), 0 0 40px rgba(212,175,55,0.1)",padding:"20px 22px"},children:[e.jsx("div",{style:{position:"absolute",top:14,right:14,color:"rgba(212,175,55,0.6)"},children:e.jsx(_e,{size:20,strokeWidth:1.5})}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:14},children:[e.jsx(ue,{size:18,style:{color:"#D4AF37"}}),e.jsx("span",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:"#D4AF37"},children:m("mantras.bhriguSamhita")})]}),l&&e.jsxs("div",{style:{marginBottom:16,padding:14,borderRadius:16,background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.25)"},children:[e.jsx("p",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(244,63,94,0.8)",marginBottom:4},children:m("mantras.bhriguFromPalmScan")}),e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,0.85)",marginBottom:10},children:m("mantras.bhriguHeartHealingLine")}),F&&e.jsxs("button",{onClick:F,style:{width:"100%",padding:"10px 16px",borderRadius:12,background:"transparent",border:"1px solid rgba(244,63,94,0.4)",color:"rgba(244,63,94,0.8)",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},children:[e.jsx(ie,{size:12}),y?m("mantras.bhriguPlayHeartHealingNamed",{title:y}):m("mantras.bhriguPlayHeartHealing")]})]}),o&&e.jsx("p",{style:{fontSize:11,color:"rgba(212,175,55,0.7)",fontStyle:"italic",marginBottom:8},children:m("mantras.bhriguSiddhaVerdict")}),e.jsx("h2",{style:{fontSize:20,fontWeight:800,color:"white",marginBottom:6},children:m("mantras.bhriguHolyRemedy")}),e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:8},children:m("mantras.bhriguPlanetRemedy",{planet:j.planet})}),e.jsx(mr.p,{initial:{opacity:0},animate:{opacity:1},transition:{duration:.6},style:{fontFamily:"Cinzel, Georgia, serif",fontSize:22,fontWeight:600,color:"#D4AF37",letterSpacing:"0.03em",marginBottom:18,lineHeight:1.3},children:j.text},j.text),e.jsxs("button",{onClick:()=>s(j.planet),style:{width:"100%",padding:"13px 20px",borderRadius:14,background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.35)",color:"rgba(255,255,255,0.75)",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",fontFamily:"inherit"},onMouseEnter:k=>{k.currentTarget.style.borderColor="rgba(212,175,55,0.6)",k.currentTarget.style.background="rgba(212,175,55,0.12)",k.currentTarget.style.color="#D4AF37"},onMouseLeave:k=>{k.currentTarget.style.borderColor="rgba(212,175,55,0.35)",k.currentTarget.style.background="rgba(212,175,55,0.06)",k.currentTarget.style.color="rgba(255,255,255,0.75)"},children:[e.jsx(ie,{size:14}),m("mantras.bhriguPlayPlanetRemedy",{planet:j.planet})]})]})},je=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');

  :root {
    --gold:    #D4AF37;
    --gold2:   #F5E17A;
    --gold-dim: rgba(212,175,55,0.12);
    --black:   #050505;
    --glass:   rgba(255,255,255,0.02);
    --border:  rgba(255,255,255,0.05);
    --muted:   rgba(255,255,255,0.42);
    --cyan:    #22D3EE;
    --r40:     40px;
    --page-pad: clamp(12px, 4.6vw, 22px);
  }

  .sqi-mantras {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--black);
    min-height: 100vh;
    color: rgba(255,255,255,0.9);
    overflow-x: hidden;
    position: relative;
  }

  /* ── Sri Yantra background ── */
  .sqi-yantra-bg {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: min(600px, 95vw);
    height: min(600px, 95vw);
    opacity: 0.022;
    pointer-events: none;
    z-index: 0;
  }
  .sqi-content { position: relative; z-index: 1; }

  .m-glass {
    background: var(--glass);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    border-radius: var(--r40);
  }
  .m-glass:hover { border-color: rgba(212,175,55,0.12); }

  @keyframes mShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .m-shimmer {
    background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 45%, #D4AF37 65%, #A07C10 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: mShimmer 5s linear infinite;
  }

  @keyframes nadiPulse {
    0%,100% { filter: drop-shadow(0 0 2px rgba(212,175,55,0)); }
    50%      { filter: drop-shadow(0 0 10px rgba(212,175,55,.7)); }
  }
  .nadi { animation: nadiPulse 3s ease-in-out infinite; color: var(--gold); }

  .m-hero {
    position: relative;
    padding: 52px var(--page-pad) 24px;
    overflow: hidden;
  }
  .m-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -5%, rgba(212,175,55,.09) 0%, transparent 65%),
      radial-gradient(ellipse 50% 40% at 90% 110%, rgba(34,211,238,.04) 0%, transparent 60%);
    pointer-events: none;
  }
  @keyframes orbFloat {
    0%,100% { transform: translateY(0)   rotate(0deg);   opacity: .25; }
    50%      { transform: translateY(-16px) rotate(180deg); opacity: .55; }
  }
  .m-orb {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,.2), transparent 70%);
    pointer-events: none;
    animation: orbFloat var(--dur,9s) ease-in-out infinite;
    animation-delay: var(--dl,0s);
  }
  .m-hero-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(22px, 5.5vw, 32px);
    font-weight: 600;
    letter-spacing: .05em;
    line-height: 1.1;
    margin-bottom: 6px;
  }

  /* ── Compact Hora strip ── */
  .m-hora-strip {
    margin: 0 var(--page-pad) 16px;
    display: flex; align-items: center;
    gap: 8px; flex-wrap: wrap;
    background: rgba(255,255,255,.015);
    border: 1px solid rgba(255,255,255,.05);
    border-radius: 100px;
    padding: 8px 14px;
    font-size: 11px;
  }
  .m-hora-strip-planet {
    font-size: 12px; font-weight: 900; color: var(--gold);
    letter-spacing: -.01em;
  }
  .m-hora-strip-time {
    color: rgba(255,255,255,.55);
    font-size: 11px;
  }
  .m-hora-strip-timer {
    font-variant-numeric: tabular-nums;
    font-weight: 900; font-size: 12px; color: var(--gold);
    letter-spacing: -.02em; margin-left: auto;
  }
  .m-hora-remedy-btn {
    background: linear-gradient(135deg,rgba(212,175,55,.15),rgba(212,175,55,.05));
    border: 1px solid rgba(212,175,55,.3);
    border-radius: 100px; padding: 4px 12px;
    font-size: 10px; font-weight: 800; letter-spacing: .06em;
    text-transform: uppercase; color: var(--gold);
    cursor: pointer; font-family: inherit;
    white-space: nowrap;
    transition: all .2s;
  }
  .m-hora-remedy-btn:hover { background: rgba(212,175,55,.2); }

  /* ── Play guidance bar ── */
  @keyframes premaPulse {
    0%,100% { opacity: .7; box-shadow: 0 0 16px rgba(212,175,55,.18); }
    50%      { opacity: 1;  box-shadow: 0 0 32px rgba(212,175,55,.42); }
  }
  .m-play-guidance {
    margin: 0 var(--page-pad) 20px;
    padding: 11px 18px;
    background: linear-gradient(135deg, rgba(212,175,55,.07), rgba(212,175,55,.02));
    border: 1px solid rgba(212,175,55,.22);
    border-radius: 100px;
    display: flex; align-items: center; gap: 10px;
    animation: premaPulse 2.6s ease-in-out infinite;
    cursor: pointer;
  }
  .m-play-guidance-text {
    font-size: 10px; font-weight: 800; letter-spacing: .18em;
    text-transform: uppercase; color: var(--gold);
    flex: 1;
  }

  /* ── Bhrigu card wrapper ── */
  .m-bhrigu {
    margin: 0 var(--page-pad) 16px;
    background: linear-gradient(135deg, rgba(212,175,55,.05), rgba(139,92,246,.04));
    border: 1px solid rgba(212,175,55,.12);
    border-radius: var(--r40);
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
  }
  .m-bhrigu::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 40% at 80% 50%, rgba(212,175,55,.05), transparent 70%);
  }

  /* ── Category accordions (match Meditations MeditationSectionSQI) ── */
  .m-cat-card {
    background: var(--glass);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    border-radius: var(--r40);
    margin: 0 var(--page-pad) 12px;
    overflow: visible;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .m-cat-card:hover { border-color: rgba(212,175,55,0.15); }
  .m-cat-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px;
    cursor: pointer;
    border-radius: var(--r40);
    transition: background .2s;
  }
  .m-cat-header:hover { background: rgba(255,255,255,.02); }
  .m-cat-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    flex: 1;
  }
  .m-cat-siddha-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(212, 175, 55, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.22);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 0 24px rgba(212, 175, 55, 0.08);
  }
  .m-cat-micro {
    font-size: 8px; font-weight: 800; letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,.45);
    margin-bottom: 4px;
  }
  .m-cat-title {
    font-weight: 800; font-size: 15px; letter-spacing: -0.01em;
    color: rgba(255,255,255,0.9);
  }
  .m-cat-sub {
    font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px;
  }
  .m-cat-chevron {
    width: 24px; height: 24px;
    border: 1px solid var(--border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    font-size: 12px;
    transition: transform .3s ease, border-color .3s, color .3s;
    flex-shrink: 0;
  }
  .m-cat-chevron.open {
    transform: rotate(180deg);
    border-color: rgba(212,175,55,.3);
    color: var(--gold);
  }
  .m-cat-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.1), transparent);
    margin: 4px 0 12px;
  }
  .m-cat-grid-wrap { padding: 0 20px 12px; }

  /* ── Mantra grid ── */
  .m-mantra-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  }
  @media (min-width: 480px) {
    .m-mantra-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  }

  /* ── Mantra card ── */
  .m-card {
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 14px 13px 12px;
    cursor: pointer;
    transition: all .22s ease;
    position: relative;
    overflow: hidden;
    text-align: left;
    font-family: inherit;
    display: flex; flex-direction: column; gap: 7px;
  }
  .m-card:hover { border-color: rgba(212,175,55,.18); }
  .m-card.m-card-selected {
    border-color: rgba(212,175,55,.45);
    background: linear-gradient(135deg, rgba(212,175,55,.09), rgba(212,175,55,.02));
    box-shadow: 0 0 24px rgba(212,175,55,.1);
  }
  .m-card.m-card-locked {
    opacity: .72;
  }
  @keyframes goldPulse {
    0%, 100% {
      border-color: rgba(212,175,55,.45);
      box-shadow: inset 0 0 24px rgba(212,175,55,.08), 0 0 22px rgba(212,175,55,.2);
    }
    50% {
      border-color: rgba(212,175,55,.85);
      box-shadow: inset 0 0 36px rgba(212,175,55,.14), 0 0 40px rgba(212,175,55,.42);
    }
  }
  .m-card.m-card-aura {
    animation: goldPulse 2.6s ease-in-out infinite;
    border-color: rgba(212,175,55,.55);
    background: linear-gradient(135deg, rgba(212,175,55,.14), rgba(255,230,120,.06) 50%, rgba(212,175,55,.05));
  }

  /* premium indicator dot (for unlocked premium cards) */
  .m-card-premium-dot {
    position: absolute; top: 8px; right: 8px;
    width: 7px; height: 7px; border-radius: 50%;
    background: #D4AF37;
    box-shadow: 0 0 6px rgba(212,175,55,.7);
  }

  /* locked card overlay — blurs content, shows upgrade CTA */
  .m-card-lock-overlay {
    position: absolute; inset: 0;
    background: rgba(5,5,5,.72);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    border-radius: 22px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 6px; padding: 10px;
    text-align: center;
  }
  .m-card-lock-icon {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(212,175,55,.12);
    border: 1px solid rgba(212,175,55,.3);
    display: flex; align-items: center; justify-content: center;
    color: #D4AF37;
  }
  .m-card-lock-label {
    font-size: 8px; font-weight: 800; letter-spacing: .16em;
    text-transform: uppercase; color: #D4AF37;
    line-height: 1.3;
  }
  @keyframes lockPulse {
    0%,100% { box-shadow: 0 0 16px rgba(212,175,55,.15); border-color: rgba(212,175,55,.25); }
    50%      { box-shadow: 0 0 28px rgba(212,175,55,.35); border-color: rgba(212,175,55,.5); }
  }
  .m-card.m-card-locked {
    animation: lockPulse 3s ease-in-out infinite;
  }

  .m-card-planet-icon {
    width: 36px; height: 36px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .m-card-planet-glyph {
    font-size: 17px;
    font-weight: 650;
    line-height: 1;
  }
  .m-card-title {
    font-size: 12px; font-weight: 700; letter-spacing: -.01em;
    line-height: 1.3; color: rgba(255,255,255,.88);
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .m-card-meta {
    display: flex; gap: 5px; align-items: center; flex-wrap: wrap;
  }
  .m-pill {
    font-size: 8.5px; font-weight: 800; letter-spacing: .07em;
    text-transform: uppercase; padding: 2px 7px;
    border-radius: 100px;
  }
  .m-lock-overlay {
    position: absolute; top: 8px; right: 8px;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,.4);
  }

  /* ── Prema-Pulse divider ── */
  @keyframes premaDivide {
    0%   { background-position: -200% center; opacity: .6; }
    50%  { opacity: 1; }
    100% { background-position:  200% center; opacity: .6; }
  }
  .m-prema-divider {
    margin: 6px var(--page-pad) 24px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.08), rgba(212,175,55,.6), rgba(245,225,122,.9), rgba(212,175,55,.6), rgba(212,175,55,.08), transparent);
    background-size: 200% auto;
    animation: premaDivide 4s linear infinite;
    border-radius: 2px;
  }

  /* ── Inline Player ── */
  .m-player-wrap {
    margin: 0 var(--page-pad) 16px;
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: var(--r40);
    overflow: hidden;
  }
  .m-player-banner {
    position: relative;
    padding: 22px var(--page-pad) 18px;
    background: linear-gradient(135deg, rgba(212,175,55,.06), rgba(180,120,20,.03));
    border-bottom: 1px solid var(--border);
    overflow: hidden;
    text-align: center;
  }
  .m-player-banner::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,.07), transparent 70%);
  }
  .m-mantra-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(15px, 3.5vw, 20px);
    font-weight: 600;
    letter-spacing: .04em;
    margin-bottom: 10px;
    overflow-wrap: anywhere;
  }
  .m-tag {
    font-size: 9px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; padding: 5px 12px;
    border-radius: 100px;
  }

  /* ── Compact ring + controls row ── */
  .m-controls-row {
    padding: 18px var(--page-pad) 16px;
    display: flex; align-items: center; gap: 14px;
  }
  .m-ring-wrap {
    position: relative; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .m-counter-ring { transform: rotate(-90deg); }
  .m-counter-track { fill: none; stroke: rgba(255,255,255,.06); stroke-width: 3; }
  .m-counter-fill {
    fill: none; stroke-width: 3; stroke-linecap: round;
    stroke: url(#goldGradMantra);
    filter: drop-shadow(0 0 6px rgba(212,175,55,.45));
    transition: stroke-dashoffset .35s ease;
  }

  /* scalar wave rings */
  @keyframes scalarWave {
    0%   { transform: translate(-50%,-50%) scale(.7); opacity: .7; }
    100% { transform: translate(-50%,-50%) scale(1.9); opacity: 0; }
  }
  .m-scalar-ring {
    position: absolute; left: 50%; top: 50%;
    width: 100px; height: 100px;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,.5);
    animation: scalarWave 2s ease-out infinite;
    pointer-events: none;
  }
  .m-scalar-ring:nth-child(2) { animation-delay: .65s; }
  .m-scalar-ring:nth-child(3) { animation-delay: 1.3s; }

  .m-btn-start {
    flex: 1; min-width: 0;
    padding: 14px 10px;
    border-radius: 100px;
    background: linear-gradient(135deg, #D4AF37, #B8960C);
    color: #050505; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
    border: none; cursor: pointer; font-family: inherit;
    box-shadow: 0 0 24px rgba(212,175,55,.4);
    transition: all .25s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .m-btn-start:hover { box-shadow: 0 0 40px rgba(212,175,55,.6); transform: scale(1.02); }
  @keyframes mantraStartPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,.55), 0 0 40px rgba(245,225,122,.12); transform: scale(1); }
    50% { box-shadow: 0 0 36px rgba(212,175,55,.9), 0 0 56px rgba(212,175,55,.25); transform: scale(1.02); }
  }
  .m-btn-start.m-paused {
    background: linear-gradient(145deg, #F5E17A, #D4AF37, #9A720E);
    animation: mantraStartPulse 2s ease-in-out infinite;
  }
  .m-btn-reset {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--glass); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted); font-size: 15px;
    transition: all .2s; font-family: inherit; flex-shrink: 0;
  }
  .m-btn-reset:hover { border-color: rgba(212,175,55,.25); color: var(--gold); }

  .m-micro {
    font-size: 8px; font-weight: 800; letter-spacing: .5em;
    text-transform: uppercase; color: rgba(212,175,55,.45);
  }
  .m-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.08), transparent);
    margin: 8px 0;
  }
  .m-instructions {
    margin: 0 var(--page-pad) 12px;
    background: rgba(255,255,255,.012);
    border: 1px solid rgba(255,255,255,.04);
    border-radius: 20px; padding: 14px 16px;
  }
`,ce={Sun:"☉",Moon:"☽",Mars:"♂",Mercury:"☿",Jupiter:"♃",Venus:"♀",Saturn:"♄",Rahu:"☊",Ketu:"☋"},kr={Sun:82,Moon:78,Mars:70,Mercury:85,Jupiter:92,Venus:88,Saturn:65,Rahu:60,Ketu:55},me={Jupiter:"Om Gurave Namaha",Rahu:"Om Ram Rahave Namah",Venus:"Om Shum Shukraya Namah",Sun:"Om Hrim Suryaya Namah",Moon:"Om Shrim Chandramase Namah",Mars:"Om Krim Mangalaya Namah",Mercury:"Om Budhaya Namah",Saturn:"Om Sham Shanaye Namah",Ketu:"Om Kem Ketave Namah"};function Sr(o){return o&&kr[o]||75}function ke(o){const r=o.match(/drive\.google\.com\/file\/d\/([^/]+)/);return r?`https://drive.google.com/uc?export=download&id=${r[1]}`:o}function wr(o){if(!o)return null;const r=z(o.split(" ")[0]);return r?me[r]||Ve(o):null}function Cr(o){return o.find(r=>/heart|anahata|432.*heart/i.test(r.title)||r.description&&/heart|anahata/i.test(r.description))}const Mr=25;function _r(o){return Number.isFinite(o)&&o>=Mr}const Se=()=>e.jsxs("svg",{className:"sqi-yantra-bg",viewBox:"0 0 400 400",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("circle",{cx:"200",cy:"200",r:"195",stroke:"#D4AF37",strokeWidth:"1"}),e.jsx("circle",{cx:"200",cy:"200",r:"185",stroke:"#D4AF37",strokeWidth:"0.5"}),Array.from({length:16}).map((o,r)=>{const n=r*22.5*Math.PI/180,p=200+155*Math.cos(n),s=200+155*Math.sin(n);return e.jsx("ellipse",{cx:p,cy:s,rx:"16",ry:"28",fill:"none",stroke:"#D4AF37",strokeWidth:"0.6",transform:`rotate(${r*22.5}, ${p}, ${s})`},r)}),e.jsx("polygon",{points:"200,30 370,320 30,320",stroke:"#D4AF37",strokeWidth:"1",fill:"none"}),e.jsx("polygon",{points:"200,370 30,80 370,80",stroke:"#D4AF37",strokeWidth:"1",fill:"none"}),e.jsx("polygon",{points:"200,70 340,300 60,300",stroke:"#D4AF37",strokeWidth:"0.8",fill:"none"}),e.jsx("polygon",{points:"200,330 60,100 340,100",stroke:"#D4AF37",strokeWidth:"0.8",fill:"none"}),e.jsx("polygon",{points:"200,110 310,280 90,280",stroke:"#D4AF37",strokeWidth:"0.6",fill:"none"}),e.jsx("polygon",{points:"200,290 90,120 310,120",stroke:"#D4AF37",strokeWidth:"0.6",fill:"none"}),e.jsx("polygon",{points:"200,150 280,260 120,260",stroke:"#D4AF37",strokeWidth:"0.5",fill:"none"}),e.jsx("polygon",{points:"200,250 120,140 280,140",stroke:"#D4AF37",strokeWidth:"0.5",fill:"none"}),e.jsx("circle",{cx:"200",cy:"200",r:"8",stroke:"#D4AF37",strokeWidth:"1"}),e.jsx("circle",{cx:"200",cy:"200",r:"2",fill:"#D4AF37"})]}),Ne={planet:{label:"Planetary Mantras",color:"#D4AF37",pillBg:"rgba(212,175,55,.1)",pillColor:"#D4AF37",borderColor:"rgba(212,175,55,.25)"},deity:{label:"Deity & Ishta Devata",color:"#F5E17A",pillBg:"rgba(245,225,122,.1)",pillColor:"#F5E17A",borderColor:"rgba(245,225,122,.2)"},intention:{label:"Intention & Affirmation",color:"rgba(34,211,238,.9)",pillBg:"rgba(34,211,238,.08)",pillColor:"rgba(34,211,238,.85)",borderColor:"rgba(34,211,238,.2)"},karma:{label:"Karma & Deep Healing",color:"rgba(167,139,250,.9)",pillBg:"rgba(167,139,250,.08)",pillColor:"rgba(167,139,250,.85)",borderColor:"rgba(167,139,250,.2)"},wealth:{label:"Wealth & Abundance",color:"#F5E17A",pillBg:"rgba(245,225,122,.1)",pillColor:"#F5E17A",borderColor:"rgba(245,225,122,.22)"},health:{label:"Health & Vitality",color:"rgba(52,211,153,.9)",pillBg:"rgba(52,211,153,.08)",pillColor:"rgba(52,211,153,.85)",borderColor:"rgba(52,211,153,.2)"},peace:{label:"Peace & Calm",color:"rgba(147,197,253,.9)",pillBg:"rgba(147,197,253,.08)",pillColor:"rgba(147,197,253,.85)",borderColor:"rgba(147,197,253,.2)"},protection:{label:"Protection & Power",color:"rgba(251,146,60,.9)",pillBg:"rgba(251,146,60,.08)",pillColor:"rgba(251,146,60,.85)",borderColor:"rgba(251,146,60,.2)"},spiritual:{label:"Spiritual Growth",color:"#D4AF37",pillBg:"rgba(212,175,55,.1)",pillColor:"#D4AF37",borderColor:"rgba(212,175,55,.2)"},general:{label:"Sacred Mantras",color:"rgba(255,255,255,.6)",pillBg:"rgba(255,255,255,.04)",pillColor:"rgba(255,255,255,.6)",borderColor:"rgba(255,255,255,.08)"}},we={planet:nr,deity:ir,intention:ue,karma:or,wealth:sr,health:_e,peace:lr,protection:dr,spiritual:cr,general:pr},Nr=["planet","deity","wealth","health","karma","intention","protection","peace","spiritual","general"];function Dr(o){const r=o.category?.toLowerCase()??"general";return r in Ne?r:"general"}const Gr=()=>{const o=qe(),{t:r}=Ye(),{user:n}=Ce(),{tier:p}=Ke(),{isAdmin:s}=Qe(),{refreshBalance:m}=Xe(),[l,F]=d.useState([]),[y,j]=d.useState(null),[k,G]=d.useState(!0),[O]=d.useState("Europe/Stockholm"),[T,B]=d.useState(0),[W,D]=d.useState(!1),[Z,P]=d.useState(!1),[oe,Y]=d.useState(new Set),K=d.useRef(null),f=d.useRef(null),ee=d.useRef(null),S=d.useRef(!1),I=()=>{ee.current?.(),ee.current=null},De=a=>{if(!Number.isFinite(a)||a<=0)return"";const i=Math.round(a);return i===1?r("mantras.durationMin"):r("mantras.durationMins",{count:i})};d.useEffect(()=>{new URLSearchParams(window.location.search).get("membership_success")==="true"&&(A.success("Welcome to Prana-Flow! All mantras unlocked. 🕉"),window.history.replaceState({},"","/mantras"))},[]);const R=hr,$=y?l.find(a=>a.id===y):null,re=$?.planet_type?z($.planet_type):null,{reading:J,generateReading:se}=Me(),h=xr(l,J),q=Ze({timezone:O}),w=q.calculation?.currentHora?.planet?z(q.calculation.currentHora.planet):null,u=yr(J),Ae=Je(p);d.useEffect(()=>{if(!n||J||!se)return;(async()=>{const{data:i}=await L.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",n.id).maybeSingle();i?.birth_name&&i?.birth_date&&i?.birth_time&&i?.birth_place&&await se({name:i.birth_name,birthDate:i.birth_date,birthTime:i.birth_time,birthPlace:i.birth_place,plan:"compass"},0,"Europe/Stockholm",n.id)})()},[n,J,se]);const le=er(),ze=!!le,Te=le?.palmArchetype??null,he=le?.heartLineLeak??!1,ae=Cr(l),Pe=ae?.title??null,Ie=null,Re=a=>{const i=a.planet_type?z(a.planet_type):null;return!!(u&&i===u||Ie||w&&i===w&&u&&w===u)},Ee=w&&u&&w===u;d.useEffect(()=>{let a=!1;return ur().then(i=>{if(a)return;const t=ge(),b=[...i].sort((M,g)=>{const c=u&&E(M,u),v=u&&E(g,u),_=E(M,t),N=E(g,t);return c&&!v?-1:!c&&v?1:_&&!N?-1:!_&&N?1:0});if(F(b),b.length>0&&!y){const M=u?b.find(v=>E(v,u))?.id:null,g=b.find(v=>E(v,t))?.id,c=h?.recommendedMantraId;j(M??g??(c&&b.find(v=>v.id===c)?c:null)??b[0].id)}G(!1)}).catch(()=>{a||(A.error(r("mantras.errorFetch")),G(!1))}),()=>{a=!0}},[p,s,h?.recommendedMantraId,u]),d.useEffect(()=>{if(h?.recommendedMantraId&&l.length>0&&!y){const a=l.find(i=>i.id===h.recommendedMantraId);a&&j(a.id)}},[h?.recommendedMantraId,l,y]),d.useEffect(()=>()=>{I(),C.stop()},[]),d.useEffect(()=>{if(!u||l.length===0)return;const a=l.find(b=>b.planet_type&&z(b.planet_type)===u);if(!a?.audio_url)return;const i=ke(a.audio_url),t=new Audio;return t.preload="auto",t.src=i,t.load(),()=>{t.src=""}},[u,l]);const be=async a=>{if(n)try{const i=new Date(Date.now()-864e5).toISOString(),{data:t}=await L.from("mantra_completions").select("id").eq("user_id",n.id).eq("mantra_id",a.id).gte("completed_at",i).limit(1);if(t?.length)return;await L.from("mantra_completions").insert({user_id:n.id,mantra_id:a.id,shc_earned:a.shc_reward});const{data:b}=await L.from("user_balances").select("balance, total_earned").eq("user_id",n.id).maybeSingle();b&&await L.from("user_balances").update({balance:b.balance+a.shc_reward,total_earned:b.total_earned+a.shc_reward}).eq("user_id",n.id),await L.from("shc_transactions").insert({user_id:n.id,type:"earned",amount:a.shc_reward,description:`Mantra: ${a.title}`,status:"completed"}),A.success(r("mantras.shcEarnedToast",{amount:a.shc_reward})),m(),"vibrate"in navigator&&navigator.vibrate([10,50,10])}catch(i){console.error(i)}},Fe=a=>{if(!a.audio_url)return;I();const i=ke(a.audio_url);f.current=a.id;const t=C.play(i,void 0,{onPlayError:()=>A.error(r("mantras.errorAudioPlay"))});let b=!1,M=-1;const g={},c=()=>{if(b)return;const v=t.duration;if(!(!Number.isFinite(v)||v<=0))if(b=!0,t.removeEventListener("loadedmetadata",c),t.removeEventListener("durationchange",c),_r(v)){const _=()=>{if(!Number.isFinite(t.duration)||t.duration<=0)return;const H=Math.min(R-1,Math.floor(t.currentTime/t.duration*R));H!==M&&(M=H,B(H))},N=()=>{I(),M=R,B(R),D(!1),P(!0),f.current=null,C.stop(),n&&be(a)};t.addEventListener("timeupdate",_),t.addEventListener("ended",N,{once:!0}),g.modeDetach=()=>{t.removeEventListener("timeupdate",_),t.removeEventListener("ended",N)},_()}else{const _=()=>{B(N=>{const H=N+1;if(H>=R)return D(!1),P(!0),f.current=null,I(),C.stop(),n&&be(a),R;const Q=C.getCurrent();return Q&&(Q.currentTime=0,Ue(Q)),H})};t.addEventListener("ended",_),g.modeDetach=()=>{t.removeEventListener("ended",_)}}};ee.current=()=>{g.modeDetach?.(),g.modeDetach=void 0,t.removeEventListener("loadedmetadata",c),t.removeEventListener("durationchange",c)},t.addEventListener("loadedmetadata",c),t.addEventListener("durationchange",c),t.readyState>=HTMLMediaElement.HAVE_METADATA&&queueMicrotask(c)},V=()=>{if(!$?.audio_url){A.error(r("mantras.noAudio"));return}if(T>=R&&B(0),C.getCurrent()&&f.current===$.id&&T<R){if(C.isPlaying())return;D(!0),C.resume();return}D(!0),P(!1),Fe($)},Be=()=>{C.pause(),D(!1)},We=()=>{I(),C.stop(),f.current=null,B(0),D(!1),P(!1)},fe=d.useCallback(async()=>{if(!n){o("/auth");return}if(!S.current){S.current=!0;try{await gr({successPath:"/mantras?membership_success=true",sourcePage:"mantras-upgrade"})}catch(a){S.current=!1,A.error(a instanceof Error?a.message:"Checkout failed.")}}},[n,o]),U=d.useCallback((a,i)=>{if(i){if(!n){o("/auth");return}fe();return}j(a.id),I(),(C.isPlaying()||C.getCurrent())&&C.stop(),D(!1),f.current=null,B(0),P(!1),setTimeout(()=>K.current?.scrollIntoView({behavior:"smooth",block:"center"}),80),"vibrate"in navigator&&navigator.vibrate(10)},[n,o,fe]),te=97,He=te-te*(T/R)*.97,Le=re?ce[re]??"":"",Oe=d.useCallback(()=>{if(!w)return;const a=l.find(i=>i.planet_type&&z(i.planet_type)===w);if(a)U(a,!1),a.audio_url&&setTimeout(()=>V(),300);else{const i=me[w];i&&A.info(i)}},[w,l,U]),$e=d.useMemo(()=>{const a={planet:[],deity:[],intention:[],karma:[],wealth:[],health:[],peace:[],protection:[],spiritual:[],general:[]};return l.forEach(i=>{const t=Dr(i);a[t].push(i)}),a},[l]);if(k)return e.jsxs("div",{className:"sqi-mantras",style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"},children:[e.jsx("style",{children:je}),e.jsx(Se,{}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{className:"nadi",style:{fontSize:28,marginBottom:12},children:"✦"}),e.jsx("div",{className:"m-micro",children:r("mantras.loading")})]})]});const xe=q.calculation?`${q.calculation.currentHora.startTimeStr} – ${q.calculation.currentHora.endTimeStr}`:null;return e.jsxs("div",{className:"sqi-mantras",children:[e.jsx("style",{children:je}),e.jsx(Se,{}),e.jsxs("div",{className:"sqi-content",children:[e.jsxs("div",{className:"m-hero",children:[e.jsx("div",{className:"m-orb",style:{width:200,height:200,top:-70,right:-60,"--dur":"11s","--dl":"0s"}}),e.jsx("div",{className:"m-orb",style:{width:90,height:90,top:80,left:-30,"--dur":"8s","--dl":"-3s"}}),e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26},children:[e.jsx("button",{onClick:()=>o("/dashboard"),style:{background:"none",border:"1px solid rgba(255,255,255,.05)",borderRadius:12,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,.4)",fontSize:14},children:"←"}),e.jsx(ue,{size:18,className:"nadi"})]}),e.jsx("div",{className:"m-micro",style:{marginBottom:8},children:r("mantras.heroMicro")}),e.jsx("h1",{className:"m-hero-title m-shimmer",children:r("mantras.title")}),e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,.42)",lineHeight:1.6,marginBottom:0},children:r("mantras.subtitle")})]}),e.jsxs("div",{onClick:()=>o("/mantra-academy"),style:{margin:"0 var(--page-pad) 20px",background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.18)",borderRadius:24,padding:"18px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border-color 0.2s"},onMouseEnter:a=>a.currentTarget.style.borderColor="rgba(212,175,55,0.4)",onMouseLeave:a=>a.currentTarget.style.borderColor="rgba(212,175,55,0.18)",children:[e.jsx("div",{style:{width:44,height:44,borderRadius:14,flexShrink:0,background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20},children:"📿"}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontSize:8,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",color:"rgba(212,175,55,0.6)",marginBottom:4},children:"SQI · 24 MODULES · VEDIC LIGHT-CODES"}),e.jsx("div",{style:{fontSize:15,fontWeight:900,letterSpacing:"-0.02em",color:"#fff",marginBottom:3},children:"Mantra Nada Academy"}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.5},children:"Learn the science behind every mantra you play — from AUM to the secret Siddha transmissions"})]}),e.jsx("div",{style:{fontSize:18,color:"rgba(212,175,55,0.5)",flexShrink:0},children:"→"})]}),e.jsx("div",{className:"m-bhrigu",children:e.jsx(jr,{handAnalysisComplete:ze,palmArchetype:Te,activeDasha:u,prescribedText:J?.personalCompass?.currentDasha?.period?wr(J.personalCompass.currentDasha.period):null,onPlayRemedy:a=>{const i=l.find(t=>t.planet_type&&z(t.planet_type)===a);if(i)U(i,!1),i.audio_url?setTimeout(()=>V(),300):A.error(r("mantras.errorMantraNoAudio"));else{const t=me[a]??null;t&&A.info(`${t} — ${r("mantras.findMantraHint")}`)}},t:r,heartLineLeak:he,onPlayHeartHealing:he&&ae?()=>{U(ae,!1),ae.audio_url?setTimeout(()=>V(),300):A.error(r("mantras.errorMantraNoAudio"))}:void 0,heartHealingMantraTitle:Pe})}),Ee&&u&&e.jsx("div",{className:"m-glass",style:{margin:"0 var(--page-pad) 14px",padding:"14px 18px"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx("span",{style:{fontSize:18},children:"✨"}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12.5,fontWeight:800,color:"rgba(255,255,255,.9)",marginBottom:2},children:r("mantras.celestialMatchTitle")}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,.5)"},children:r("mantras.celestialMatchBody",{hora:w,dasha:u})})]})]})}),q.calculation&&xe&&e.jsxs("div",{className:"m-hora-strip",children:[e.jsx("span",{style:{fontSize:13},children:ce[w??""]??"🌙"}),e.jsxs("span",{className:"m-hora-strip-planet",children:[w??"--"," Hora"]}),e.jsxs("span",{className:"m-hora-strip-time",children:["· ",xe]}),e.jsx("span",{className:"m-hora-strip-timer",children:q.remainingTimeStr}),w&&e.jsxs("button",{className:"m-hora-remedy-btn",onClick:Oe,children:["▶ ",w," Remedy"]})]}),e.jsxs("div",{className:"m-play-guidance",onClick:()=>K.current?.scrollIntoView({behavior:"smooth",block:"center"}),children:[e.jsx(ie,{size:14,style:{color:"#D4AF37",flexShrink:0}}),e.jsx("span",{className:"m-play-guidance-text",children:y?`${$?.title??""} — press start to begin`:"Select a mantra below — then press start"})]}),Nr.map(a=>{const i=$e[a];if(i.length===0)return null;const t=Ne[a],b=we[a],M=oe.has(a);return e.jsxs("div",{className:"m-cat-card",children:[e.jsxs("div",{className:"m-cat-header",onClick:()=>Y(g=>{const c=new Set(g);return c.has(a)?c.delete(a):c.add(a),c}),children:[e.jsxs("div",{className:"m-cat-header-left",children:[e.jsx("div",{className:"m-cat-siddha-icon",style:{borderColor:t.borderColor,color:t.color},"aria-hidden":!0,children:e.jsx(b,{size:24,strokeWidth:1.65})}),e.jsxs("div",{style:{minWidth:0},children:[e.jsx("div",{className:"m-cat-micro",children:r("meditations.sectionMicroLabel")}),e.jsx("div",{className:"m-cat-title",children:r(`mantras.categorySections.${a}.title`,{defaultValue:t.label})}),e.jsx("div",{className:"m-cat-sub",children:r(`mantras.categorySections.${a}.subtitle`)})]})]}),e.jsx("div",{className:`m-cat-chevron${M?"":" open"}`,"aria-hidden":!0,children:M?"▼":"▲"})]}),!M&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"m-cat-divider",style:{marginLeft:20,marginRight:20}}),e.jsx("div",{className:"m-cat-grid-wrap",children:e.jsx("div",{className:"m-mantra-grid",children:i.map(g=>{const c=g.planet_type?z(g.planet_type):null,v=y===g.id,_=Re(g),N=c?ce[c]??"":"",H=we[a],Q=Sr(c),X=g.required_tier??(g.is_premium?1:0),ne=X>Ae&&!s,ye=X>=3?"Akasha-Infinity":X===2?"Siddha-Quantum":X===1?"Prana-Flow+":"";return e.jsxs("button",{type:"button",className:["m-card",v?"m-card-selected":"",_&&!v?"m-card-aura":"",ne?"m-card-locked":""].filter(Boolean).join(" "),style:{borderColor:v?"rgba(212,175,55,.45)":t.borderColor},onClick:()=>U(g,ne),children:[X>0&&!ne&&e.jsx("div",{className:"m-card-premium-dot",title:ye}),ne&&e.jsxs("div",{className:"m-card-lock-overlay",children:[e.jsx("div",{className:"m-card-lock-icon",children:e.jsx(rr,{size:12})}),e.jsxs("div",{className:"m-card-lock-label",children:[ye,e.jsx("br",{}),"Tap to Unlock"]})]}),e.jsx("div",{className:"m-card-planet-icon",style:{background:`${t.borderColor}55`,border:`1px solid ${t.borderColor}`},children:N?e.jsx("span",{className:"m-card-planet-glyph",style:{color:t.pillColor},children:N}):e.jsx(H,{size:19,strokeWidth:1.65,color:t.pillColor,"aria-hidden":!0})}),e.jsx("div",{className:"m-card-title",children:g.title}),e.jsxs("div",{className:"m-card-meta",children:[c&&e.jsxs("span",{className:"m-pill",style:{background:t.pillBg,border:`1px solid ${t.borderColor}`,color:t.pillColor},children:[N," ",c]}),!c&&e.jsx("span",{className:"m-pill",style:{background:t.pillBg,border:`1px solid ${t.borderColor}`,color:t.pillColor},children:t.label.split(" ")[0]}),e.jsxs("span",{className:"m-pill",style:{background:"rgba(212,175,55,.06)",border:"1px solid rgba(212,175,55,.15)",color:"rgba(212,175,55,.55)"},children:[Q,"% ✦"]}),g.duration_minutes>0&&e.jsx("span",{style:{fontSize:9.5,color:"rgba(255,255,255,.3)"},children:De(g.duration_minutes)})]})]},g.id)})})})]})]},a)}),e.jsx("div",{className:"m-prema-divider"}),e.jsxs("div",{ref:K,className:"m-player-wrap",children:[e.jsxs("div",{className:"m-player-banner",children:[e.jsx("div",{className:"m-mantra-name m-shimmer",children:$?.title??r("mantras.selectPrompt")}),e.jsxs("div",{style:{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"},children:[re&&e.jsxs("span",{className:"m-tag",style:{background:"rgba(212,175,55,.07)",border:"1px solid rgba(212,175,55,.22)",color:"#D4AF37"},children:[Le," ",r("mantras.planetMantraTag",{planet:re})]}),e.jsxs("span",{className:"m-tag",style:{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",color:"rgba(255,255,255,.4)"},children:["✦ ",r("mantras.sacredReverb")]})]})]}),Z?e.jsxs("div",{style:{margin:16,background:"linear-gradient(135deg,rgba(212,175,55,.1),rgba(212,175,55,.04))",border:"1px solid rgba(212,175,55,.3)",borderRadius:20,padding:20,textAlign:"center"},children:[e.jsx("div",{style:{fontSize:32,marginBottom:8},children:"🕉"}),e.jsx("div",{style:{fontSize:15,fontWeight:900,letterSpacing:"-.02em",color:"#D4AF37",marginBottom:4},children:r("mantras.completed108Title")}),e.jsx("div",{style:{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:16},children:r("mantras.completed108Sub")}),e.jsx("button",{type:"button",className:"m-btn-start",style:{margin:"0 auto",width:"auto",padding:"10px 28px",display:"inline-flex"},onClick:()=>{B(0),P(!1),V(),"vibrate"in navigator&&navigator.vibrate([15,50,15])},children:r("mantras.practiceAgain")})]}):e.jsxs("div",{className:"m-controls-row",children:[e.jsxs("div",{className:"m-ring-wrap",children:[W&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"m-scalar-ring"}),e.jsx("div",{className:"m-scalar-ring"}),e.jsx("div",{className:"m-scalar-ring"})]}),e.jsxs("svg",{className:"m-counter-ring",width:"100",height:"100",viewBox:"0 0 36 36",children:[e.jsx("defs",{children:e.jsxs("linearGradient",{id:"goldGradMantra",x1:"0%",y1:"0%",x2:"100%",y2:"100%",children:[e.jsx("stop",{offset:"0%",stopColor:"#D4AF37",stopOpacity:"0.9"}),e.jsx("stop",{offset:"50%",stopColor:"#F5D77A",stopOpacity:"1"}),e.jsx("stop",{offset:"100%",stopColor:"#D4AF37",stopOpacity:"0.7"})]})}),e.jsx("circle",{className:"m-counter-track",cx:"18",cy:"18",r:"15.5"}),e.jsx("circle",{className:"m-counter-fill",cx:"18",cy:"18",r:"15.5",strokeDasharray:`${te} ${te}`,strokeDashoffset:He})]}),e.jsxs("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[e.jsx("div",{style:{fontSize:20,fontWeight:900,letterSpacing:"-.04em",color:"#D4AF37",lineHeight:1},children:T}),e.jsx("div",{style:{fontSize:8,fontWeight:800,letterSpacing:".3em",textTransform:"uppercase",color:"rgba(212,175,55,.4)",marginTop:2},children:r("mantras.slash108")})]})]}),e.jsxs("div",{style:{flex:1,display:"flex",gap:8,alignItems:"center"},children:[e.jsxs("button",{type:"button",className:`m-btn-start${W?" m-paused":""}`,onClick:()=>{W?Be():V(),"vibrate"in navigator&&navigator.vibrate(15)},children:[W?e.jsx(ar,{size:14}):e.jsx(ie,{size:14}),r(W?"mantras.pauseUpper":"mantras.startUpper")]}),e.jsx("button",{type:"button",className:"m-btn-reset",onClick:()=>{We(),"vibrate"in navigator&&navigator.vibrate([10,20,10])},title:r("mantras.resetAria"),children:e.jsx(tr,{size:16})})]})]}),e.jsxs("div",{className:"m-instructions",children:[e.jsx("div",{style:{fontSize:9,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(212,175,55,.45)",marginBottom:8},children:r("mantras.instructions.title")}),[r("mantras.instructions.step1"),r("mantras.instructions.step2"),r("mantras.instructions.step3")].map((a,i)=>e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:10,fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.5,marginBottom:i<2?6:0},children:[e.jsx("div",{style:{width:18,height:18,borderRadius:"50%",background:"rgba(212,175,55,.07)",border:"1px solid rgba(212,175,55,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"rgba(212,175,55,.55)",flexShrink:0,marginTop:1},children:i+1}),a]},i))]})]}),h&&e.jsxs("div",{className:"m-glass",style:{margin:"16px var(--page-pad) 0",padding:"18px 20px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:12},children:[e.jsx("span",{style:{fontSize:14},children:"🔭"}),e.jsx("div",{style:{fontSize:12.5,fontWeight:800,letterSpacing:"-.01em"},children:r("mantras.jyotishTitle")})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:9},children:[h.dayPlanet&&e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:11,color:"rgba(255,255,255,.4)"},children:r("mantras.recommendationDay",{planet:h.dayPlanet})}),e.jsx("span",{style:{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"},children:h.dayMantraId?l.find(a=>a.id===h.dayMantraId)?.title??"–":"–"})]}),h.periodPlanet&&e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)"}}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:11,color:"rgba(255,255,255,.4)"},children:r("mantras.recommendationPeriod",{planet:h.periodPlanet})}),e.jsx("span",{style:{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"},children:h.periodMantraId?l.find(a=>a.id===h.periodMantraId)?.title??"–":"–"})]})]}),h.horaPlanet&&e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)"}}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{style:{fontSize:11,color:"rgba(255,255,255,.4)"},children:[r("mantras.recommendationHora",{planet:h.horaPlanet})," "]}),e.jsx("span",{style:{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"},children:h.horaMantraId?l.find(a=>a.id===h.horaMantraId)?.title??"–":"–"})]})]})]})]}),e.jsx("div",{style:{height:120}})]})]})};export{Gr as default};
