import{r as o,j as e,g as fr}from"./vendor-react--OR-uH7S.js";import{s as R,u as qe,l as Ve,I as Ne,J as P,K as xr,M as B,f as yr,a as vr,p as T,c as wr,N as kr,t as jr}from"./index-RRXEvQfm.js";import{u as Sr}from"./useAdminRole-CCeebBaS.js";import{u as _r}from"./useHoraWatch-CBikMgrh.js";import{g as Nr}from"./palmScanStore-STSHeMk5.js";import{L as $e,a as Ce,c as ue,P as Ee,t as Cr,p as Mr,bU as Dr,w as Ar,bl as zr,b6 as Pr,W as Fr,q as Tr,aN as Ir,bV as Er}from"./vendor-icons-CZmAPI07.js";import{m as Rr}from"./vendor-motion-Dm4zQNot.js";import{s as Br}from"./startPranaMonthlyCheckout-C9NYGHrG.js";import"./vendor-crypto-DfHPQj82.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-i18n-BS5B6gzd.js";import"./vendor-query-D1GokQmc.js";import"./vendor-supabase-DRj4EguU.js";import"./stripeCheckoutNavigation-AOhyaKuh.js";async function Or(s){try{const{data:a,error:i}=await R.from("mantras").select("*").eq("is_active",!0).order("created_at",{ascending:!1});return i?(console.error("[Mantras] Error fetching mantras:",i),[]):!a||a.length===0?[]:a.map(d=>{const l=d.duration_minutes,_=d.duration_seconds,g=l?Number(l):_?Math.max(1,Math.ceil(Number(_)/60)):3,M=Number(d.required_tier??(d.is_premium?1:0));return{...d,category:d.category||"general",planet_type:d.planet_type||null,is_premium:d.is_premium||!1,required_tier:Number.isFinite(M)?M:0,duration_minutes:g,repetitionsFixed:108}})}catch(a){return console.error("[Mantras] Unexpected error:",a),[]}}const Wr=108,Se="sh:bd:",Hr=15*60*1e3;function Re(s){try{const a=localStorage.getItem(Se+s);if(!a)return null;const{data:i,ts:m}=JSON.parse(a);return Date.now()-m>Hr?(localStorage.removeItem(Se+s),null):i}catch{return null}}function Lr(s,a){try{localStorage.setItem(Se+s,JSON.stringify({data:a,ts:Date.now()}))}catch{}}function qr(s,a){const{user:i}=qe(),[m,d]=o.useState(!1),[l,_]=o.useState(()=>i?Re(i.id):null),{reading:g,generateReading:M}=Ve(),j=a!==void 0?a:g;if(o.useEffect(()=>{if(!i){d(!1),_(null);return}const N=Re(i.id);if(N){_(N),d(!0);return}(async()=>{try{const{data:S}=await R.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",i.id).maybeSingle();if(S?.birth_name&&S?.birth_date&&S?.birth_time&&S?.birth_place){const ie={birth_name:S.birth_name,birth_date:S.birth_date,birth_time:S.birth_time,birth_place:S.birth_place};Lr(i.id,ie),_(ie),d(!0)}else d(!1),_(null)}catch(S){console.error("Error fetching birth details:",S),d(!1),_(null)}})()},[i]),o.useEffect(()=>{l&&d(!0)},[l]),o.useEffect(()=>{if(a===void 0&&m&&l&&!j){const N={name:l.birth_name,birthDate:l.birth_date,birthTime:l.birth_time,birthPlace:l.birth_place,plan:"compass"};M(N,0,"Europe/Stockholm",i?.id??void 0)}},[m,l,j,M,a]),!m||!j)return null;const w=Ne(),X=j.personalCompass?.currentDasha?.period||null,O=X?P(X.split(" ")[0]):null,$=xr();if(!(O||w))return null;const F={Sun:{message:"You are currently in a Sun influence. This mantra supports vitality and inner strength.",bestTime:"morning"},Moon:{message:"You are currently in a Moon influence. This mantra supports emotional balance and inner peace.",bestTime:"evening"},Mars:{message:"You are currently in a Mars influence. This mantra supports courage and balanced energy.",bestTime:"morning"},Mercury:{message:"You are currently in a Mercury influence. This mantra supports wisdom and clear communication.",bestTime:"morning"},Jupiter:{message:"You are currently in a Jupiter influence. This mantra supports wisdom and spiritual growth.",bestTime:"morning"},Venus:{message:"You are currently in a Venus influence. This mantra supports love and harmony.",bestTime:"evening"},Saturn:{message:"You are currently in a Saturn influence. This mantra supports balance and stability.",bestTime:"morning"},Rahu:{message:"You are currently in a Rahu influence. This mantra supports grounding and protection.",bestTime:"morning"},Ketu:{message:"You are currently in a Ketu influence. This mantra supports spiritual growth and liberation.",bestTime:"evening"}},I=s.find(N=>B(N,w)),E=O?s.find(N=>B(N,O)):null,ne=$?s.find(N=>B(N,$)):null,W=E||I||ne,G=O||w||$;if(!G||!F[G])return null;const Z=F[G];return{planet:G.toLowerCase(),dasha:X,message:Z.message,duration:"40 days",repetitions:108,bestTime:Z.bestTime,recommendedMantraId:W?.id||null,dayMantraId:I?.id||null,periodMantraId:E?.id||null,horaMantraId:ne?.id||null,dayPlanet:w,periodPlanet:O,horaPlanet:$}}function Vr(s){return o.useMemo(()=>{const a=s?.personalCompass?.currentDasha?.period;if(!a)return null;const i=a.split(" ")[0];return P(i)},[s?.personalCompass?.currentDasha?.period])}let v=null;const C={play(s,a,i){v&&(v.pause(),v.src="",v.load(),v=null);const m=new Audio(s);if(m.preload="auto",a){const d=!i?.endedEveryRepeat;m.addEventListener("ended",a,{once:d})}return m.play().catch(d=>{console.error(d),i?.onPlayError?.(d)}),v=m,m},stop(){v&&(v.pause(),v.currentTime=0,v.src="",v.load(),v=null)},pause(){v?.pause()},resume(){v?.play().catch(console.error)},isPlaying(){return!!(v&&!v.paused)},getCurrent(){return v}},we={Jupiter:"Om Gurave Namaha",Rahu:"Om Ram Rahave Namah",Venus:"Om Shum Shukraya Namah",Sun:"Om Hrim Suryaya Namah",Moon:"Om Shrim Chandramase Namah",Mars:"Om Krim Mangalaya Namah",Mercury:"Om Budhaya Namah",Saturn:"Om Sham Shanaye Namah",Ketu:"Om Kem Ketave Namah"};function $r(s,a,i,m){if(s&&a&&i){if(a==="Spiritual Mastery"&&i==="Jupiter")return{text:"Om Gurave Namaha",planet:"Jupiter"};if(a==="Karmic Debt"&&i==="Rahu")return{text:"Om Ram Rahave Namah",planet:"Rahu"}}if(i&&m)return{text:m,planet:i};if(i&&we[i])return{text:we[i],planet:i};if(s&&a){if(a==="Spiritual Mastery")return{text:"Om Gurave Namaha",planet:"Jupiter"};if(a==="Karmic Debt")return{text:"Om Ram Rahave Namah",planet:"Rahu"}}const d=Ne();return{text:we[d]||"Om Gurave Namaha",planet:d}}const Gr=({handAnalysisComplete:s,palmArchetype:a,activeDasha:i,prescribedText:m,onPlayRemedy:d,t:l,heartLineLeak:_,onPlayHeartHealing:g,heartHealingMantraTitle:M})=>{const j=$r(s,a,i,m);return e.jsxs("div",{style:{position:"relative",overflow:"hidden",borderRadius:28,border:"2px solid rgba(212,175,55,0.5)",background:"linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(139,92,246,0.04) 50%, rgba(0,0,0,0.6) 100%)",boxShadow:_?"0 0 0 1px rgba(212,175,55,0.3), 0 0 24px rgba(212,175,55,0.2), 0 0 40px rgba(244,63,94,0.15)":"0 0 0 1px rgba(212,175,55,0.3), 0 0 24px rgba(212,175,55,0.2), 0 0 40px rgba(212,175,55,0.1)",padding:"20px 22px"},children:[e.jsx("div",{style:{position:"absolute",top:14,right:14,color:"rgba(212,175,55,0.6)"},children:e.jsx($e,{size:20,strokeWidth:1.5})}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:14},children:[e.jsx(Ce,{size:18,style:{color:"#D4AF37"}}),e.jsx("span",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:"#D4AF37"},children:l("mantras.bhriguSamhita")})]}),_&&e.jsxs("div",{style:{marginBottom:16,padding:14,borderRadius:16,background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.25)"},children:[e.jsx("p",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(244,63,94,0.8)",marginBottom:4},children:l("mantras.bhriguFromPalmScan")}),e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,0.85)",marginBottom:10},children:l("mantras.bhriguHeartHealingLine")}),g&&e.jsxs("button",{onClick:g,style:{width:"100%",padding:"10px 16px",borderRadius:12,background:"transparent",border:"1px solid rgba(244,63,94,0.4)",color:"rgba(244,63,94,0.8)",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},children:[e.jsx(ue,{size:12}),M?l("mantras.bhriguPlayHeartHealingNamed",{title:M}):l("mantras.bhriguPlayHeartHealing")]})]}),s&&e.jsx("p",{style:{fontSize:11,color:"rgba(212,175,55,0.7)",fontStyle:"italic",marginBottom:8},children:l("mantras.bhriguSiddhaVerdict")}),e.jsx("h2",{style:{fontSize:20,fontWeight:800,color:"white",marginBottom:6},children:l("mantras.bhriguHolyRemedy")}),e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:8},children:l("mantras.bhriguPlanetRemedy",{planet:j.planet})}),e.jsx(Rr.p,{initial:{opacity:0},animate:{opacity:1},transition:{duration:.6},style:{fontFamily:"Cinzel, Georgia, serif",fontSize:22,fontWeight:600,color:"#D4AF37",letterSpacing:"0.03em",marginBottom:18,lineHeight:1.3},children:j.text},j.text),e.jsxs("button",{onClick:()=>d(j.planet),style:{width:"100%",padding:"13px 20px",borderRadius:14,background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.35)",color:"rgba(255,255,255,0.75)",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",fontFamily:"inherit"},onMouseEnter:w=>{w.currentTarget.style.borderColor="rgba(212,175,55,0.6)",w.currentTarget.style.background="rgba(212,175,55,0.12)",w.currentTarget.style.color="#D4AF37"},onMouseLeave:w=>{w.currentTarget.style.borderColor="rgba(212,175,55,0.35)",w.currentTarget.style.background="rgba(212,175,55,0.06)",w.currentTarget.style.color="rgba(255,255,255,0.75)"},children:[e.jsx(ue,{size:14}),l("mantras.bhriguPlayPlanetRemedy",{planet:j.planet})]})]})},Be=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');

  :root {
    --gold:    #D4AF37;
    --gold2:   #F5E17A;
    --gold-dim: rgba(212,175,55,0.12);
    --black:   #050505;
    --glass:   rgba(255,255,255,0.02);
    --border:  rgba(255,255,255,0.05);
    --muted:   rgba(255,255,255,0.6);
    --cyan:    #22D3EE;
    --r40:     40px;
    --page-pad: clamp(12px, 4.6vw, 22px);
  }

  @media (prefers-reduced-motion: reduce) {
    .sqi-mantras *, .sqi-mantras *::before, .sqi-mantras *::after {
      animation: none !important;
      transition: none !important;
    }
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
    margin: 0 var(--page-pad) 8px;
    display: flex; align-items: center;
    gap: 8px; flex-wrap: wrap;
    background: rgba(255,255,255,.02);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 100px;
    padding: 10px 16px;
    font-size: 12.5px;
  }
  .m-hora-strip-planet {
    font-size: 12px; font-weight: 900; color: var(--gold);
    letter-spacing: -.01em;
  }
  .m-hora-strip-time {
    color: rgba(255,255,255,.65);
    font-size: 12px;
  }
  .m-glossary-hint {
    margin: 6px var(--page-pad) 16px;
    padding: 0 4px;
    font-size: 12px; color: rgba(255,255,255,.48); line-height: 1.5; font-style: italic;
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
    font-size: 12.5px; color: rgba(255,255,255,0.48); margin-top: 2px;
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

  /* ── Player, now the hero focal point ── */
  .m-player-top {
    margin-top: 0;
    box-shadow: 0 0 60px rgba(212,175,55,.08), inset 0 1px 0 rgba(255,255,255,.04);
    border-color: rgba(212,175,55,.22);
  }
  .m-player-eyebrow {
    font-size: 8.5px; font-weight: 800; letter-spacing: .35em; text-transform: uppercase;
    color: rgba(212,175,55,.5); margin-bottom: 8px;
  }
  .m-resume-chip {
    margin-top: 12px; display: inline-flex; align-items: center; gap: 6px;
    background: rgba(212,175,55,.09); border: 1px solid rgba(212,175,55,.28);
    color: #D4AF37; font-size: 10px; font-weight: 800; letter-spacing: .04em;
    padding: 7px 14px; border-radius: 100px; cursor: pointer; font-family: inherit;
  }
  .m-scrub-track {
    margin: 0 var(--page-pad) 16px; height: 3px; border-radius: 3px;
    background: rgba(255,255,255,.06); overflow: hidden;
  }
  .m-scrub-fill {
    height: 100%; background: linear-gradient(90deg, #D4AF37, #F5E17A);
    box-shadow: 0 0 8px rgba(212,175,55,.5); transition: width .3s linear;
  }

  /* ── Tier-aware upgrade banner ── */
  .m-upgrade-banner {
    margin: 0 var(--page-pad) 18px;
    background: linear-gradient(135deg, rgba(212,175,55,.09), rgba(212,175,55,.02));
    border: 1px solid rgba(212,175,55,.25);
    border-radius: 28px; padding: 15px 17px;
    display: flex; align-items: center; gap: 13px; cursor: pointer;
  }
  .m-upgrade-icon {
    width: 38px; height: 38px; border-radius: 13px; flex-shrink: 0;
    background: rgba(212,175,55,.1); border: 1px solid rgba(212,175,55,.3);
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .m-upgrade-title { font-size: 12px; font-weight: 800; color: rgba(255,255,255,.92); margin-bottom: 2px; }
  .m-upgrade-sub { font-size: 10.5px; color: rgba(255,255,255,.42); line-height: 1.4; }
  .m-upgrade-cta {
    font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #050505;
    background: linear-gradient(135deg,#F5E17A,#D4AF37); padding: 9px 14px; border-radius: 100px;
    white-space: nowrap; flex-shrink: 0;
  }

  /* ── Filter chips ── */
  .m-filter-row { margin: 0 var(--page-pad) 16px; display: flex; gap: 8px; flex-wrap: wrap; }
  .m-filter-chip {
    font-size: 10.5px; font-weight: 700; letter-spacing: .02em;
    background: var(--glass); border: 1px solid var(--border); color: rgba(255,255,255,.5);
    padding: 7px 14px; border-radius: 100px; cursor: pointer; font-family: inherit;
    transition: all .2s;
  }
  .m-filter-chip.active {
    background: rgba(212,175,55,.12); border-color: rgba(212,175,55,.4); color: #D4AF37;
  }

  /* ── Category glow + count ── */
  .m-cat-glow { border-color: rgba(212,175,55,.35); box-shadow: 0 0 40px rgba(212,175,55,.07), inset 0 1px 0 rgba(255,255,255,.03); }
  .m-cat-count {
    font-size: 9.5px; font-weight: 800; color: rgba(212,175,55,.6);
    background: rgba(212,175,55,.08); border: 1px solid rgba(212,175,55,.2);
    padding: 4px 10px; border-radius: 100px; flex-shrink: 0; margin-left: 6px;
  }

  /* ── Playlist rows (replaces button grid) ── */
  .m-playlist { display: flex; flex-direction: column; gap: 4px; padding: 4px 8px 8px; }
  .m-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 10px; border-radius: 18px; border: 1px solid transparent;
    background: none; cursor: pointer; text-align: left; font-family: inherit;
    transition: background .2s, border-color .2s; width: 100%;
  }
  .m-row:hover { background: rgba(255,255,255,.02); }
  .m-row-active { background: linear-gradient(135deg, rgba(212,175,55,.1), rgba(212,175,55,.02)); border-color: rgba(212,175,55,.32); }
  .m-row-aura:not(.m-row-active) { border-color: rgba(212,175,55,.22); animation: goldPulse 2.6s ease-in-out infinite; }
  .m-row-locked { opacity: .6; }
  .m-row-play {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(212,175,55,.25); color: #D4AF37;
  }
  .m-row-active .m-row-play { background: linear-gradient(135deg,#F5E17A,#D4AF37); color: #050505; box-shadow: 0 0 16px rgba(212,175,55,.5); border-color: transparent; }
  .m-row-locked .m-row-play { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.08); color: rgba(255,255,255,.3); }
  .m-row-body { flex: 1; min-width: 0; }
  .m-row-title {
    font-size: 12.5px; font-weight: 700; letter-spacing: -.01em; color: rgba(255,255,255,.88);
    margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .m-row-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .m-row-dur { font-size: 9.5px; color: rgba(255,255,255,.3); flex-shrink: 0; }
  .m-row-lock-badge {
    font-size: 8px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #D4AF37;
    background: rgba(212,175,55,.08); border: 1px solid rgba(212,175,55,.25);
    padding: 5px 9px; border-radius: 100px; flex-shrink: 0; white-space: nowrap;
  }

  /* ── First-visit onboarding strip ── */
  .m-onboard {
    margin: 0 var(--page-pad) 18px;
    background: linear-gradient(135deg, rgba(34,211,238,.07), rgba(212,175,55,.04));
    border: 1px solid rgba(34,211,238,.25);
    border-radius: 24px; padding: 16px 18px;
    position: relative;
  }
  .m-onboard-close {
    position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.6);
    display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: pointer;
  }
  .m-onboard-eyebrow { font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: rgba(34,211,238,.85); margin-bottom: 8px; padding-right: 30px; }
  .m-onboard-body { font-size: 14px; color: rgba(255,255,255,.82); line-height: 1.6; padding-right: 20px; }

  /* ── Player plain-language explainer ── */
  .m-player-explainer { font-size: 12.5px; color: rgba(255,255,255,.55); line-height: 1.5; margin-bottom: 6px; }
`,ke={Sun:"☉",Moon:"☽",Mars:"♂",Mercury:"☿",Jupiter:"♃",Venus:"♀",Saturn:"♄",Rahu:"☊",Ketu:"☋"},Yr={Sun:82,Moon:78,Mars:70,Mercury:85,Jupiter:92,Venus:88,Saturn:65,Rahu:60,Ketu:55},_e={Jupiter:"Om Gurave Namaha",Rahu:"Om Ram Rahave Namah",Venus:"Om Shum Shukraya Namah",Sun:"Om Hrim Suryaya Namah",Moon:"Om Shrim Chandramase Namah",Mars:"Om Krim Mangalaya Namah",Mercury:"Om Budhaya Namah",Saturn:"Om Sham Shanaye Namah",Ketu:"Om Kem Ketave Namah"};function Jr(s){return s&&Yr[s]||75}function Oe(s){const a=s.match(/drive\.google\.com\/file\/d\/([^/]+)/);return a?`https://drive.google.com/uc?export=download&id=${a[1]}`:s}function Kr(s){if(!s)return null;const a=P(s.split(" ")[0]);return a?_e[a]||kr(s):null}function Ur(s){return s.find(a=>/heart|anahata|432.*heart/i.test(a.title)||a.description&&/heart|anahata/i.test(a.description))}const Qr=25;function Xr(s){return Number.isFinite(s)&&s>=Qr}const We=()=>e.jsxs("svg",{className:"sqi-yantra-bg",viewBox:"0 0 400 400",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("circle",{cx:"200",cy:"200",r:"195",stroke:"#D4AF37",strokeWidth:"1"}),e.jsx("circle",{cx:"200",cy:"200",r:"185",stroke:"#D4AF37",strokeWidth:"0.5"}),Array.from({length:16}).map((s,a)=>{const i=a*22.5*Math.PI/180,m=200+155*Math.cos(i),d=200+155*Math.sin(i);return e.jsx("ellipse",{cx:m,cy:d,rx:"16",ry:"28",fill:"none",stroke:"#D4AF37",strokeWidth:"0.6",transform:`rotate(${a*22.5}, ${m}, ${d})`},a)}),e.jsx("polygon",{points:"200,30 370,320 30,320",stroke:"#D4AF37",strokeWidth:"1",fill:"none"}),e.jsx("polygon",{points:"200,370 30,80 370,80",stroke:"#D4AF37",strokeWidth:"1",fill:"none"}),e.jsx("polygon",{points:"200,70 340,300 60,300",stroke:"#D4AF37",strokeWidth:"0.8",fill:"none"}),e.jsx("polygon",{points:"200,330 60,100 340,100",stroke:"#D4AF37",strokeWidth:"0.8",fill:"none"}),e.jsx("polygon",{points:"200,110 310,280 90,280",stroke:"#D4AF37",strokeWidth:"0.6",fill:"none"}),e.jsx("polygon",{points:"200,290 90,120 310,120",stroke:"#D4AF37",strokeWidth:"0.6",fill:"none"}),e.jsx("polygon",{points:"200,150 280,260 120,260",stroke:"#D4AF37",strokeWidth:"0.5",fill:"none"}),e.jsx("polygon",{points:"200,250 120,140 280,140",stroke:"#D4AF37",strokeWidth:"0.5",fill:"none"}),e.jsx("circle",{cx:"200",cy:"200",r:"8",stroke:"#D4AF37",strokeWidth:"1"}),e.jsx("circle",{cx:"200",cy:"200",r:"2",fill:"#D4AF37"})]}),Ge={planet:{label:"Planetary Mantras",color:"#D4AF37",pillBg:"rgba(212,175,55,.1)",pillColor:"#D4AF37",borderColor:"rgba(212,175,55,.25)"},deity:{label:"Deity & Ishta Devata",color:"#F5E17A",pillBg:"rgba(245,225,122,.1)",pillColor:"#F5E17A",borderColor:"rgba(245,225,122,.2)"},intention:{label:"Intention & Affirmation",color:"rgba(34,211,238,.9)",pillBg:"rgba(34,211,238,.08)",pillColor:"rgba(34,211,238,.85)",borderColor:"rgba(34,211,238,.2)"},karma:{label:"Karma & Deep Healing",color:"rgba(167,139,250,.9)",pillBg:"rgba(167,139,250,.08)",pillColor:"rgba(167,139,250,.85)",borderColor:"rgba(167,139,250,.2)"},wealth:{label:"Wealth & Abundance",color:"#F5E17A",pillBg:"rgba(245,225,122,.1)",pillColor:"#F5E17A",borderColor:"rgba(245,225,122,.22)"},health:{label:"Health & Vitality",color:"rgba(52,211,153,.9)",pillBg:"rgba(52,211,153,.08)",pillColor:"rgba(52,211,153,.85)",borderColor:"rgba(52,211,153,.2)"},peace:{label:"Peace & Calm",color:"rgba(147,197,253,.9)",pillBg:"rgba(147,197,253,.08)",pillColor:"rgba(147,197,253,.85)",borderColor:"rgba(147,197,253,.2)"},protection:{label:"Protection & Power",color:"rgba(251,146,60,.9)",pillBg:"rgba(251,146,60,.08)",pillColor:"rgba(251,146,60,.85)",borderColor:"rgba(251,146,60,.2)"},spiritual:{label:"Spiritual Growth",color:"#D4AF37",pillBg:"rgba(212,175,55,.1)",pillColor:"#D4AF37",borderColor:"rgba(212,175,55,.2)"},general:{label:"Sacred Mantras",color:"rgba(255,255,255,.6)",pillBg:"rgba(255,255,255,.04)",pillColor:"rgba(255,255,255,.6)",borderColor:"rgba(255,255,255,.08)"}},He={planet:Dr,deity:Ar,intention:Ce,karma:zr,wealth:Pr,health:$e,peace:Fr,protection:Tr,spiritual:Ir,general:Er},je=["planet","deity","wealth","health","karma","intention","protection","peace","spiritual","general"];function Le(s){const a=s.category?.toLowerCase()??"general";return a in Ge?a:"general"}const ua=()=>{const s=fr(),{t:a}=yr(),{user:i}=qe(),{tier:m}=vr(),{isAdmin:d}=Sr(),[l,_]=o.useState([]),[g,M]=o.useState(null),[j,w]=o.useState(new Set),[X,O]=o.useState(!0),[$]=o.useState("Europe/Stockholm"),[D,F]=o.useState(0),[I,E]=o.useState(!1),[ne,W]=o.useState(!1),[G,Z]=o.useState(new Set),[N,Me]=o.useState(!1),[S,ie]=o.useState(0),[Ye,Je]=o.useState(!1),[oe,Ke]=o.useState("all"),[De,se]=o.useState(0),[ee,Ae]=o.useState(null),[ge,ze]=o.useState(!1);o.useEffect(()=>{try{localStorage.getItem("sqi_mantras_onboarded")||ze(!0)}catch{}},[]);const Ue=()=>{ze(!1);try{localStorage.setItem("sqi_mantras_onboarded","1")}catch{}},Pe=o.useRef(null),Y=o.useRef(null),he=o.useRef(null),be=o.useRef(!1),J=()=>{he.current?.(),he.current=null},Qe=r=>{if(!Number.isFinite(r)||r<=0)return"";const t=Math.round(r);return t===1?a("mantras.durationMin"):a("mantras.durationMins",{count:t})};o.useEffect(()=>{new URLSearchParams(window.location.search).get("membership_success")==="true"&&(T.success("Welcome to Prana-Flow! All mantras unlocked. 🕉"),window.history.replaceState({},"","/mantras"))},[]),o.useEffect(()=>{if(!i)return;let r=!1;return(async()=>{const t=new Date(Date.now()-5184e6).toISOString(),{data:n}=await R.from("mantra_completions").select("completed_at").eq("user_id",i.id).gte("completed_at",t).order("completed_at",{ascending:!1});if(r||!n)return;const c=new Set(n.map(y=>new Date(y.completed_at).toDateString()));let k=0;const h=new Date;for(c.has(h.toDateString())||h.setDate(h.getDate()-1);c.has(h.toDateString());)k+=1,h.setDate(h.getDate()-1);ie(k)})(),()=>{r=!0}},[i,Ye]),o.useEffect(()=>{if(g){try{const r=localStorage.getItem(`sqi_mantra_progress_${g}`);if(r){const t=JSON.parse(r);if(t.count>0&&t.count<A&&Date.now()-t.ts<6*60*60*1e3){Ae({id:g,count:t.count});return}}}catch{}Ae(null)}},[g]),o.useEffect(()=>{g&&(D>0&&D<A?localStorage.setItem(`sqi_mantra_progress_${g}`,JSON.stringify({count:D,ts:Date.now()})):(D===0||D>=A)&&localStorage.removeItem(`sqi_mantra_progress_${g}`))},[D,g]);const A=Wr,K=g?l.find(r=>r.id===g):null,le=K?.planet_type?P(K.planet_type):null,{reading:U,generateReading:fe}=Ve(),f=qr(l,U),L=_r({timezone:$}),x=L.calculation?.currentHora?.planet?P(L.calculation.currentHora.planet):null,u=Vr(U),re=wr(m);o.useEffect(()=>{if(!i||U||!fe)return;(async()=>{const{data:t}=await R.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",i.id).maybeSingle();t?.birth_name&&t?.birth_date&&t?.birth_time&&t?.birth_place&&await fe({name:t.birth_name,birthDate:t.birth_date,birthTime:t.birth_time,birthPlace:t.birth_place,plan:"compass"},0,"Europe/Stockholm",i.id)})()},[i,U,fe]);const xe=Nr(),Xe=!!xe,Ze=xe?.palmArchetype??null,Fe=xe?.heartLineLeak??!1,de=Ur(l),er=de?.title??null,rr=null,ar=r=>{const t=r.planet_type?P(r.planet_type):null;return!!(u&&t===u||rr||x&&t===x&&u&&x===u)},tr=x&&u&&x===u;o.useEffect(()=>{let r=!1;return Or().then(t=>{if(r)return;const n=Ne(),c=[...t].sort((k,h)=>{const y=u&&B(k,u),p=u&&B(h,u),b=B(k,n),z=B(h,n);return y&&!p?-1:!y&&p?1:b&&!z?-1:!b&&z?1:0});if(_(c),c.length>0&&!g){const k=u?c.find(p=>B(p,u))?.id:null,h=c.find(p=>B(p,n))?.id,y=f?.recommendedMantraId;M(k??h??(y&&c.find(p=>p.id===y)?y:null)??c[0].id)}O(!1)}).catch(()=>{r||(T.error(a("mantras.errorFetch")),O(!1))}),()=>{r=!0}},[m,d,f?.recommendedMantraId,u]),o.useEffect(()=>{i&&R.from("mantra_purchases").select("mantra_id").eq("user_id",i.id).then(({data:r})=>{w(new Set((r||[]).map(t=>t.mantra_id)))})},[i]),o.useEffect(()=>{new URLSearchParams(window.location.search).get("mantra_unlocked")&&i&&(R.from("mantra_purchases").select("mantra_id").eq("user_id",i.id).then(({data:t})=>{w(new Set((t||[]).map(n=>n.mantra_id)))}),window.history.replaceState({},"","/mantras"))},[i]),o.useEffect(()=>{if(f?.recommendedMantraId&&l.length>0&&!g){const r=l.find(t=>t.id===f.recommendedMantraId);r&&M(r.id)}},[f?.recommendedMantraId,l,g]),o.useEffect(()=>()=>{J(),C.stop()},[]),o.useEffect(()=>{if(!u||l.length===0)return;const r=l.find(c=>c.planet_type&&P(c.planet_type)===u);if(!r?.audio_url)return;const t=Oe(r.audio_url),n=new Audio;return n.preload="auto",n.src=t,n.load(),()=>{n.src=""}},[u,l]);const Te=async r=>{if(i)try{const t=new Date(Date.now()-864e5).toISOString(),{data:n}=await R.from("mantra_completions").select("id").eq("user_id",i.id).eq("mantra_id",r.id).gte("completed_at",t).limit(1);if(n?.length)return;await R.from("mantra_completions").insert({user_id:i.id,mantra_id:r.id}),T.success(a("mantras.completionToast",{defaultValue:"108 recitations complete 🕉"})),Je(!0),"vibrate"in navigator&&navigator.vibrate([10,50,10])}catch(t){console.error(t)}},nr=r=>{if(!r.audio_url)return;J();const t=Oe(r.audio_url);Y.current=r.id;const n=C.play(t,void 0,{onPlayError:()=>T.error(a("mantras.errorAudioPlay"))});let c=!1,k=-1;const h={},y=()=>{if(c)return;const p=n.duration;if(!(!Number.isFinite(p)||p<=0))if(c=!0,n.removeEventListener("loadedmetadata",y),n.removeEventListener("durationchange",y),Xr(p)){const b=()=>{if(!Number.isFinite(n.duration)||n.duration<=0)return;const H=Math.min(A-1,Math.floor(n.currentTime/n.duration*A));H!==k&&(k=H,F(H)),se(Math.min(100,n.currentTime/n.duration*100))},z=()=>{J(),k=A,F(A),E(!1),W(!0),se(100),Y.current=null,C.stop(),i&&Te(r)};n.addEventListener("timeupdate",b),n.addEventListener("ended",z,{once:!0}),h.modeDetach=()=>{n.removeEventListener("timeupdate",b),n.removeEventListener("ended",z)},b()}else{const b=()=>{F(z=>{const H=z+1;if(H>=A)return E(!1),W(!0),Y.current=null,J(),C.stop(),i&&Te(r),A;const V=C.getCurrent();return V&&(V.currentTime=0,jr(V)),H})};n.addEventListener("ended",b),h.modeDetach=()=>{n.removeEventListener("ended",b)}}};he.current=()=>{h.modeDetach?.(),h.modeDetach=void 0,n.removeEventListener("loadedmetadata",y),n.removeEventListener("durationchange",y)},n.addEventListener("loadedmetadata",y),n.addEventListener("durationchange",y),n.readyState>=HTMLMediaElement.HAVE_METADATA&&queueMicrotask(y)},Q=()=>{if(!K?.audio_url){T.error(a("mantras.noAudio"));return}if(D>=A&&F(0),C.getCurrent()&&Y.current===K.id&&D<A){if(C.isPlaying())return;E(!0),C.resume();return}E(!0),W(!1),nr(K)},ir=()=>{C.pause(),E(!1)},or=()=>{J(),C.stop(),Y.current=null,F(0),E(!1),W(!1),se(0)},ye=o.useCallback(async()=>{if(!i){s("/auth");return}if(!be.current){be.current=!0;try{await Br({successPath:"/mantras?membership_success=true",sourcePage:"mantras-upgrade"})}catch(r){be.current=!1,T.error(r instanceof Error?r.message:"Checkout failed.")}}},[i,s]),sr=o.useCallback(async r=>{if(!i){s("/auth");return}try{const{data:t,error:n}=await R.functions.invoke("create-mantra-checkout",{body:{mantraId:r.id}});if(n)throw n;if(t?.alreadyPurchased){w(c=>new Set(c).add(r.id));return}if(t?.url)window.location.href=t.url;else throw new Error(t?.error||"No checkout URL returned")}catch(t){T.error(t instanceof Error?t.message:"Checkout failed.")}},[i,s]),ae=o.useCallback((r,t)=>{if(t){if(!i){s("/auth");return}r.price_usd&&r.price_usd>0?sr(r):ye();return}M(r.id),J(),(C.isPlaying()||C.getCurrent())&&C.stop(),E(!1),Y.current=null,F(0),W(!1),setTimeout(()=>Pe.current?.scrollIntoView({behavior:"smooth",block:"center"}),80),"vibrate"in navigator&&navigator.vibrate(10)},[i,s,ye]),ce=97,lr=ce-ce*(D/A)*.97,dr=le?ke[le]??"":"",cr=o.useCallback(()=>{if(!x)return;const r=l.find(t=>t.planet_type&&P(t.planet_type)===x);if(r)ae(r,!1),r.audio_url&&setTimeout(()=>Q(),300);else{const t=_e[x];t&&T.info(t)}},[x,l,ae]),te=o.useMemo(()=>{const r={planet:[],deity:[],intention:[],karma:[],wealth:[],health:[],peace:[],protection:[],spiritual:[],general:[]};return l.forEach(t=>{const n=Le(t);r[n].push(t)}),r},[l]),q=o.useMemo(()=>{const r=u??x;if(!r)return null;const t=l.find(n=>n.planet_type&&P(n.planet_type)===r);return t?Le(t):null},[l,u,x]),pr=o.useMemo(()=>q?[q,...je.filter(r=>r!==q)]:je,[q]);o.useEffect(()=>{if(N||l.length===0)return;const r=je.filter(n=>te[n].length>0),t=q??r[0]??null;Z(new Set(r.filter(n=>n!==t))),Me(!0)},[l,te,q,N]);const mr=o.useCallback(r=>{const t=te[r];if(oe==="all")return t;if(oe==="unlocked")return t.filter(c=>{const k=c.required_tier??(c.is_premium?1:0);return d||k<=re||j.has(c.id)});const n=u??x;return t.filter(c=>c.planet_type&&P(c.planet_type)===n)},[te,oe,d,re,u,x,j]),ur=["Atma-Seed","Prana-Flow","Siddha-Quantum","Akasha-Infinity"],ve=o.useMemo(()=>{if(d)return null;let r=Number.POSITIVE_INFINITY;return l.forEach(t=>{const n=t.required_tier??(t.is_premium?1:0);n>re&&n<r&&(r=n)}),Number.isFinite(r)?{targetTier:r,targetName:ur[r]??"higher tier"}:null},[l,re,d]);if(X)return e.jsxs("div",{className:"sqi-mantras",style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"},children:[e.jsx("style",{children:Be}),e.jsx(We,{}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{className:"nadi",style:{fontSize:28,marginBottom:12},children:"✦"}),e.jsx("div",{className:"m-micro",children:a("mantras.loading")})]})]});const Ie=L.calculation?`${L.calculation.currentHora.startTimeStr} – ${L.calculation.currentHora.endTimeStr}`:null;return e.jsxs("div",{className:"sqi-mantras",children:[e.jsx("style",{children:Be}),e.jsx(We,{}),e.jsxs("div",{className:"sqi-content",children:[e.jsxs("div",{className:"m-hero",children:[e.jsx("div",{className:"m-orb",style:{width:200,height:200,top:-70,right:-60,"--dur":"11s","--dl":"0s"}}),e.jsx("div",{className:"m-orb",style:{width:90,height:90,top:80,left:-30,"--dur":"8s","--dl":"-3s"}}),e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26},children:[e.jsx("button",{onClick:()=>s("/dashboard"),style:{background:"none",border:"1px solid rgba(255,255,255,.05)",borderRadius:12,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,.4)",fontSize:14},children:"←"}),e.jsx(Ce,{size:18,className:"nadi"})]}),e.jsx("div",{className:"m-micro",style:{marginBottom:8},children:a("mantras.heroMicro")}),e.jsx("h1",{className:"m-hero-title m-shimmer",children:a("mantras.title")}),e.jsx("p",{style:{fontSize:14.5,color:"rgba(255,255,255,.6)",lineHeight:1.6,marginBottom:S>0?12:0},children:a("mantras.subtitle")}),S>0&&e.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(212,175,55,.08)",border:"1px solid rgba(212,175,55,.22)",borderRadius:100,padding:"5px 12px"},children:[e.jsx("span",{style:{fontSize:12},children:"🔥"}),e.jsxs("span",{style:{fontSize:10.5,fontWeight:800,color:"#D4AF37",letterSpacing:".02em"},children:[S,"-",a("mantras.dayStreak",{defaultValue:"day streak"})]})]})]}),ge&&e.jsxs("div",{className:"m-onboard",children:[e.jsx("button",{type:"button",className:"m-onboard-close",onClick:Ue,"aria-label":a("mantras.onboardDismiss",{defaultValue:"Dismiss"}),children:"✕"}),e.jsx("div",{className:"m-onboard-eyebrow",children:a("mantras.onboardEyebrow",{defaultValue:"New here? Start in 30 seconds"})}),e.jsx("div",{className:"m-onboard-body",children:a("mantras.onboardBody",{defaultValue:"A mantra is a short sacred phrase you repeat while it plays. This page suggests one based on today's date and your birth chart — or you can pick any one below. Press play, and it counts your repetitions for you."})})]}),ge&&e.jsx("div",{style:{margin:"0 var(--page-pad) 8px",padding:"0 4px",fontSize:12.5,color:"rgba(255,255,255,.5)",lineHeight:1.5},children:a("mantras.bhriguPlain",{defaultValue:"We looked at your birth chart and today's planetary hour — here's the mantra suited to you right now."})}),e.jsx("div",{className:"m-bhrigu",children:e.jsx(Gr,{handAnalysisComplete:Xe,palmArchetype:Ze,activeDasha:u,prescribedText:U?.personalCompass?.currentDasha?.period?Kr(U.personalCompass.currentDasha.period):null,onPlayRemedy:r=>{const t=l.find(n=>n.planet_type&&P(n.planet_type)===r);if(t)ae(t,!1),t.audio_url?setTimeout(()=>Q(),300):T.error(a("mantras.errorMantraNoAudio"));else{const n=_e[r]??null;n&&T.info(`${n} — ${a("mantras.findMantraHint")}`)}},t:a,heartLineLeak:Fe,onPlayHeartHealing:Fe&&de?()=>{ae(de,!1),de.audio_url?setTimeout(()=>Q(),300):T.error(a("mantras.errorMantraNoAudio"))}:void 0,heartHealingMantraTitle:er})}),tr&&u&&e.jsx("div",{className:"m-glass",style:{margin:"0 var(--page-pad) 14px",padding:"14px 18px"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx("span",{style:{fontSize:18},children:"✨"}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12.5,fontWeight:800,color:"rgba(255,255,255,.9)",marginBottom:2},children:a("mantras.celestialMatchTitle")}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,.5)"},children:a("mantras.celestialMatchBody",{hora:x,dasha:u})})]})]})}),L.calculation&&Ie&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"m-hora-strip",children:[e.jsx("span",{style:{fontSize:13},children:ke[x??""]??"🌙"}),e.jsxs("span",{className:"m-hora-strip-planet",children:[x??"--"," Hora"]}),e.jsxs("span",{className:"m-hora-strip-time",children:["· ",Ie]}),e.jsx("span",{className:"m-hora-strip-timer",children:L.remainingTimeStr}),x&&e.jsxs("button",{className:"m-hora-remedy-btn",onClick:cr,children:["▶ ",x," Remedy"]})]}),ge&&e.jsx("div",{className:"m-glossary-hint",children:a("mantras.horaGlossary",{defaultValue:'A "Hora" is a planetary hour — Vedic tradition holds each hour of the day is ruled by a different planet, and certain mantras suit each one.'})})]}),e.jsxs("div",{ref:Pe,className:"m-player-wrap m-player-top",children:[e.jsxs("div",{className:"m-player-banner",children:[e.jsx("div",{className:"m-player-eyebrow",children:a("mantras.nowReciting",{defaultValue:"Now Reciting"})}),e.jsx("div",{className:"m-mantra-name m-shimmer",children:K?.title??a("mantras.selectPrompt")}),e.jsxs("div",{style:{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"},children:[le&&e.jsxs("span",{className:"m-tag",style:{background:"rgba(212,175,55,.07)",border:"1px solid rgba(212,175,55,.22)",color:"#D4AF37"},children:[dr," ",a("mantras.planetMantraTag",{planet:le})]}),e.jsxs("span",{className:"m-tag",style:{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",color:"rgba(255,255,255,.4)"},children:["✦ ",a("mantras.sacredReverb")]})]}),ee&&ee.id===g&&D===0&&!I&&e.jsxs("button",{type:"button",className:"m-resume-chip",onClick:()=>{F(ee.count),Q()},children:["↺ ",a("mantras.resumeFrom",{count:ee.count,defaultValue:`Resume from ${ee.count}/108`})]})]}),ne?e.jsxs("div",{style:{margin:16,background:"linear-gradient(135deg,rgba(212,175,55,.1),rgba(212,175,55,.04))",border:"1px solid rgba(212,175,55,.3)",borderRadius:20,padding:20,textAlign:"center"},children:[e.jsx("div",{style:{fontSize:32,marginBottom:8},children:"🕉"}),e.jsx("div",{style:{fontSize:15,fontWeight:900,letterSpacing:"-.02em",color:"#D4AF37",marginBottom:4},children:a("mantras.completed108Title")}),e.jsx("div",{style:{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:16},children:a("mantras.completed108Sub")}),e.jsx("button",{type:"button",className:"m-btn-start",style:{margin:"0 auto",width:"auto",padding:"10px 28px",display:"inline-flex"},onClick:()=>{F(0),W(!1),se(0),Q(),"vibrate"in navigator&&navigator.vibrate([15,50,15])},children:a("mantras.practiceAgain")})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"m-controls-row",children:[e.jsxs("div",{className:"m-ring-wrap",children:[I&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"m-scalar-ring"}),e.jsx("div",{className:"m-scalar-ring"}),e.jsx("div",{className:"m-scalar-ring"})]}),e.jsxs("svg",{className:"m-counter-ring",width:"100",height:"100",viewBox:"0 0 36 36",children:[e.jsx("defs",{children:e.jsxs("linearGradient",{id:"goldGradMantra",x1:"0%",y1:"0%",x2:"100%",y2:"100%",children:[e.jsx("stop",{offset:"0%",stopColor:"#D4AF37",stopOpacity:"0.9"}),e.jsx("stop",{offset:"50%",stopColor:"#F5D77A",stopOpacity:"1"}),e.jsx("stop",{offset:"100%",stopColor:"#D4AF37",stopOpacity:"0.7"})]})}),e.jsx("circle",{className:"m-counter-track",cx:"18",cy:"18",r:"15.5"}),e.jsx("circle",{className:"m-counter-fill",cx:"18",cy:"18",r:"15.5",strokeDasharray:`${ce} ${ce}`,strokeDashoffset:lr})]}),e.jsxs("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[e.jsx("div",{style:{fontSize:20,fontWeight:900,letterSpacing:"-.04em",color:"#D4AF37",lineHeight:1},children:D}),e.jsx("div",{style:{fontSize:8,fontWeight:800,letterSpacing:".3em",textTransform:"uppercase",color:"rgba(212,175,55,.4)",marginTop:2},children:a("mantras.slash108")})]})]}),e.jsxs("div",{style:{flex:1,display:"flex",gap:8,alignItems:"center"},children:[e.jsxs("button",{type:"button",className:`m-btn-start${I?" m-paused":""}`,onClick:()=>{I?ir():Q(),"vibrate"in navigator&&navigator.vibrate(15)},children:[I?e.jsx(Ee,{size:14}):e.jsx(ue,{size:14}),a(I?"mantras.pauseUpper":"mantras.startUpper")]}),e.jsx("button",{type:"button",className:"m-btn-reset",onClick:()=>{or(),"vibrate"in navigator&&navigator.vibrate([10,20,10])},title:a("mantras.resetAria"),children:e.jsx(Cr,{size:16})})]})]}),De>0&&e.jsx("div",{className:"m-scrub-track",children:e.jsx("div",{className:"m-scrub-fill",style:{width:`${De}%`}})})]}),e.jsx("div",{className:"m-player-explainer",style:{margin:"0 var(--page-pad) 4px",textAlign:"center"},children:a("mantras.playerExplainer",{defaultValue:"Press the gold button below. It repeats this chant 108 times and counts each one for you."})}),e.jsxs("div",{className:"m-instructions",children:[e.jsx("div",{style:{fontSize:10,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(212,175,55,.6)",marginBottom:8},children:a("mantras.instructions.title")}),[a("mantras.instructions.step1"),a("mantras.instructions.step2"),a("mantras.instructions.step3")].map((r,t)=>e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:10,fontSize:13.5,color:"rgba(255,255,255,.62)",lineHeight:1.55,marginBottom:t<2?7:0},children:[e.jsx("div",{style:{width:20,height:20,borderRadius:"50%",background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"rgba(212,175,55,.7)",flexShrink:0,marginTop:1},children:t+1}),r]},t))]})]}),ve&&e.jsxs("div",{className:"m-upgrade-banner",onClick:ye,children:[e.jsx("div",{className:"m-upgrade-icon",children:"🔓"}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"m-upgrade-title",children:a("mantras.upgradeTitle",{defaultValue:"Unlock the full mantra library"})}),e.jsx("div",{className:"m-upgrade-sub",children:a("mantras.upgradeSub",{tier:ve.targetName,defaultValue:`${ve.targetName} unlocks every remaining mantra`})})]}),e.jsx("div",{className:"m-upgrade-cta",children:a("mantras.upgradeCta",{defaultValue:"Upgrade"})})]}),e.jsx("div",{className:"m-filter-row",children:["all","unlocked","mine"].map(r=>e.jsx("button",{type:"button",className:`m-filter-chip${oe===r?" active":""}`,onClick:()=>Ke(r),children:r==="all"?a("mantras.filterAll",{defaultValue:"All"}):r==="unlocked"?a("mantras.filterUnlocked",{defaultValue:"Unlocked"}):a("mantras.filterMine",{defaultValue:"My Planet"})},r))}),pr.map(r=>{const t=te[r];if(t.length===0)return null;const n=mr(r),c=Ge[r],k=He[r],h=G.has(r),y=r===q;return e.jsxs("div",{className:`m-cat-card${y?" m-cat-glow":""}`,children:[e.jsxs("div",{className:"m-cat-header",onClick:()=>Z(p=>{const b=new Set(p);return b.has(r)?b.delete(r):b.add(r),b}),children:[e.jsxs("div",{className:"m-cat-header-left",children:[e.jsx("div",{className:"m-cat-siddha-icon",style:{borderColor:c.borderColor,color:c.color},"aria-hidden":!0,children:e.jsx(k,{size:24,strokeWidth:1.65})}),e.jsxs("div",{style:{minWidth:0},children:[e.jsx("div",{className:"m-cat-micro",children:a("meditations.sectionMicroLabel")}),e.jsx("div",{className:"m-cat-title",children:a(`mantras.categorySections.${r}.title`,{defaultValue:c.label})}),e.jsx("div",{className:"m-cat-sub",children:a(`mantras.categorySections.${r}.subtitle`)})]})]}),e.jsx("div",{className:"m-cat-count",children:t.length}),e.jsx("div",{className:`m-cat-chevron${h?"":" open"}`,"aria-hidden":!0,children:h?"▼":"▲"})]}),!h&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"m-cat-divider",style:{marginLeft:20,marginRight:20}}),e.jsxs("div",{className:"m-cat-grid-wrap",children:[n.length===0&&e.jsx("div",{style:{padding:"4px 8px 16px",fontSize:11.5,color:"rgba(255,255,255,.3)"},children:a("mantras.noMatchesFilter",{defaultValue:"No mantras match this filter in this category."})}),e.jsx("div",{className:"m-playlist",children:n.map(p=>{const b=p.planet_type?P(p.planet_type):null,z=g===p.id,H=ar(p),V=b?ke[b]??"":"",gr=He[r],hr=Jr(b),pe=p.required_tier??(p.is_premium?1:0),me=pe>re&&!d&&!j.has(p.id),br=p.price_usd&&p.price_usd>0?`$${p.price_usd.toFixed(2)}`:pe>=3?"Akasha-Infinity":pe===2?"Siddha-Quantum":pe===1?"Prana-Flow+":"";return e.jsxs("button",{type:"button",className:["m-row",z?"m-row-active":"",H&&!z?"m-row-aura":"",me?"m-row-locked":""].filter(Boolean).join(" "),onClick:()=>ae(p,me),children:[e.jsx("div",{className:"m-row-play",style:{background:z?void 0:`${c.borderColor}22`,borderColor:c.borderColor},children:me?e.jsx(Mr,{size:13}):z?I?e.jsx(Ee,{size:13}):e.jsx(ue,{size:13}):V?e.jsx("span",{style:{color:c.pillColor,fontSize:14,fontWeight:650},children:V}):e.jsx(gr,{size:15,strokeWidth:1.8,color:c.pillColor,"aria-hidden":!0})}),e.jsxs("div",{className:"m-row-body",children:[e.jsx("div",{className:"m-row-title",children:p.title}),e.jsxs("div",{className:"m-row-meta",children:[b&&e.jsxs("span",{className:"m-pill",style:{background:c.pillBg,border:`1px solid ${c.borderColor}`,color:c.pillColor},children:[V," ",b]}),e.jsxs("span",{className:"m-pill",style:{background:"rgba(212,175,55,.06)",border:"1px solid rgba(212,175,55,.15)",color:"rgba(212,175,55,.55)"},children:[hr,"% ✦"]})]})]}),me?e.jsx("div",{className:"m-row-lock-badge",children:br}):p.duration_minutes>0?e.jsx("div",{className:"m-row-dur",children:Qe(p.duration_minutes)}):null]},p.id)})})]})]})]},r)}),f&&e.jsxs("div",{className:"m-glass",style:{margin:"16px var(--page-pad) 0",padding:"18px 20px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:12},children:[e.jsx("span",{style:{fontSize:14},children:"🔭"}),e.jsx("div",{style:{fontSize:12.5,fontWeight:800,letterSpacing:"-.01em"},children:a("mantras.jyotishTitle")})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:9},children:[f.dayPlanet&&e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:11,color:"rgba(255,255,255,.4)"},children:a("mantras.recommendationDay",{planet:f.dayPlanet})}),e.jsx("span",{style:{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"},children:f.dayMantraId?l.find(r=>r.id===f.dayMantraId)?.title??"–":"–"})]}),f.periodPlanet&&e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)"}}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:11,color:"rgba(255,255,255,.4)"},children:a("mantras.recommendationPeriod",{planet:f.periodPlanet})}),e.jsx("span",{style:{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"},children:f.periodMantraId?l.find(r=>r.id===f.periodMantraId)?.title??"–":"–"})]})]}),f.horaPlanet&&e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)"}}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{style:{fontSize:11,color:"rgba(255,255,255,.4)"},children:[a("mantras.recommendationHora",{planet:f.horaPlanet})," "]}),e.jsx("span",{style:{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"},children:f.horaMantraId?l.find(r=>r.id===f.horaMantraId)?.title??"–":"–"})]})]})]})]}),e.jsx("div",{style:{height:120}})]})]})};export{ua as default};
